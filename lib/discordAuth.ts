import { randomBytes } from "crypto";

const discordApiUrl = "https://discord.com/api/v10";
export const discordStateCookieName = "fmc_discord_oauth_state";

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
};

type DiscordGuildMember = {
  roles: string[];
};

function splitList(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAllowedUserIds() {
  return splitList(process.env.ADMIN_DISCORD_USER_IDS);
}

function getAdminRoleIds() {
  return splitList(process.env.ADMIN_DISCORD_ROLE_IDS);
}

function getGuildId() {
  return process.env.DISCORD_GUILD_ID?.trim() || "";
}

function usesGuildRoles() {
  return Boolean(getGuildId() && getAdminRoleIds().length > 0);
}

export function isDiscordAuthConfigured() {
  return Boolean(
    process.env.DISCORD_CLIENT_ID &&
      process.env.DISCORD_CLIENT_SECRET &&
      (getAllowedUserIds().length > 0 || usesGuildRoles()),
  );
}

export function getDiscordRedirectUri(request: Request) {
  return (
    process.env.DISCORD_REDIRECT_URI ||
    `${new URL(request.url).origin}/api/admin/discord/callback`
  );
}

export function createDiscordOAuthState() {
  return randomBytes(24).toString("base64url");
}

export function getDiscordAuthorizeUrl(state: string, redirectUri: string) {
  const url = new URL("https://discord.com/oauth2/authorize");

  // Role checks need guilds.members.read; an ID-only allowlist only needs identify.
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID || "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set(
    "scope",
    usesGuildRoles() ? "identify guilds.members.read" : "identify",
  );
  url.searchParams.set("state", state);

  return url.toString();
}

async function exchangeDiscordCode(code: string, redirectUri: string) {
  const response = await fetch(`${discordApiUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID || "",
      client_secret: process.env.DISCORD_CLIENT_SECRET || "",
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed (${response.status}).`);
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new Error("Discord did not return an access token.");
  }

  return data.access_token;
}

async function fetchDiscord<T>(path: string, accessToken: string) {
  return fetch(`${discordApiUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).then(async (response) => ({
    ok: response.ok,
    status: response.status,
    data: response.ok ? ((await response.json()) as T) : null,
  }));
}

export async function authenticateDiscordAdmin(
  code: string,
  redirectUri: string,
) {
  const accessToken = await exchangeDiscordCode(code, redirectUri);
  const userResult = await fetchDiscord<DiscordUser>("/users/@me", accessToken);

  if (!userResult.data) {
    throw new Error(`Unable to load Discord profile (${userResult.status}).`);
  }

  const user = userResult.data;

  if (getAllowedUserIds().includes(user.id)) {
    return { allowed: true, user };
  }

  if (usesGuildRoles()) {
    // 404 means the user is not in the FMC server at all.
    const memberResult = await fetchDiscord<DiscordGuildMember>(
      `/users/@me/guilds/${getGuildId()}/member`,
      accessToken,
    );
    const adminRoleIds = getAdminRoleIds();

    if (memberResult.data?.roles.some((role) => adminRoleIds.includes(role))) {
      return { allowed: true, user };
    }
  }

  return { allowed: false, user };
}
