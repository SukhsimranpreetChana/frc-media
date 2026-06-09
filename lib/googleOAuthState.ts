import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const maxStateAgeMs = 10 * 60 * 1000;

function getStateSecret() {
  return (
    process.env.GOOGLE_OAUTH_STATE_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.FMC_ADMIN_PASSWORD ||
    process.env.GOOGLE_CLIENT_SECRET
  );
}

function signState(nonce: string, createdAt: number) {
  const secret = getStateSecret();

  if (!secret) {
    throw new Error("Missing OAuth state secret.");
  }

  return createHmac("sha256", secret)
    .update(`${nonce}.${createdAt}`)
    .digest("base64url");
}

export function createGoogleOAuthState() {
  const nonce = randomUUID();
  const createdAt = Date.now();
  const signature = signState(nonce, createdAt);

  return `${nonce}.${createdAt}.${signature}`;
}

export async function saveGoogleOAuthState(_state: string) {
  // OAuth state is signed and self-contained so it works on read-only hosts.
}

export async function consumeGoogleOAuthState(state: string) {
  const [nonce, createdAtValue, signature] = state.split(".");
  const createdAt = Number(createdAtValue);

  if (!nonce || !createdAt || !signature) {
    return false;
  }

  if (Date.now() - createdAt > maxStateAgeMs) {
    return false;
  }

  let expectedSignature: string;

  try {
    expectedSignature = signState(nonce, createdAt);
  } catch {
    return false;
  }

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  return (
    provided.byteLength === expected.byteLength &&
    timingSafeEqual(provided, expected)
  );
}
