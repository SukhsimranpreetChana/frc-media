import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  createFooterHandleForAdmin,
  deleteFooterHandleForAdmin,
  getFooterHandles,
  isSupabaseAdminConfigured,
} from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxHandleLength = 80;
const maxLinkLength = 500;
const maxProfileImageUrlLength = 500;

function isValidUuid(value: string) {
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    return NextResponse.json(
      { handles: await getFooterHandles() },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json({
      configured: false,
      handles: [],
    });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY on the server." },
      { status: 503 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    handle?: unknown;
    link?: unknown;
    profileImageUrl?: unknown;
  } | null;
  const handle =
    typeof payload?.handle === "string" ? payload.handle.trim() : "";
  const link = typeof payload?.link === "string" ? payload.link.trim() : "";
  const profileImageUrl =
    typeof payload?.profileImageUrl === "string"
      ? payload.profileImageUrl.trim()
      : "";

  if (!handle || !link) {
    return NextResponse.json(
      { error: "Please add a handle and link." },
      { status: 400 },
    );
  }

  if (
    handle.length > maxHandleLength ||
    link.length > maxLinkLength ||
    profileImageUrl.length > maxProfileImageUrlLength ||
    !isValidHttpUrl(link) ||
    (profileImageUrl && !isValidHttpUrl(profileImageUrl))
  ) {
    return NextResponse.json(
      { error: "Please check the footer profile details." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      handle: await createFooterHandleForAdmin({
        handle,
        link,
        profileImageUrl: profileImageUrl || undefined,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to create footer handle." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY on the server." },
      { status: 503 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    id?: unknown;
  } | null;
  const id = typeof payload?.id === "string" ? payload.id.trim() : "";

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Missing footer handle id." }, { status: 400 });
  }

  try {
    await deleteFooterHandleForAdmin(id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove footer handle." },
      { status: 500 },
    );
  }
}
