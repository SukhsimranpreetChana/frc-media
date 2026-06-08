import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  createCommissionForAdmin,
  deleteCommissionForAdmin,
  getCommissions,
  isSupabaseAdminConfigured,
} from "@/lib/supabase";

export const runtime = "nodejs";

const maxTitleLength = 140;
const maxLinkLength = 500;
const maxCostRangeLength = 80;

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
    return NextResponse.json({ commissions: await getCommissions() });
  } catch {
    return NextResponse.json(
      { error: "Unable to load commissions." },
      { status: 500 },
    );
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
    title?: unknown;
    link?: unknown;
    costRange?: unknown;
  } | null;
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const link = typeof payload?.link === "string" ? payload.link.trim() : "";
  const costRange =
    typeof payload?.costRange === "string" ? payload.costRange.trim() : "";

  if (!title || !link || !costRange) {
    return NextResponse.json(
      { error: "Please add a title, link, and cost range." },
      { status: 400 },
    );
  }

  if (
    title.length > maxTitleLength ||
    link.length > maxLinkLength ||
    costRange.length > maxCostRangeLength ||
    !isValidHttpUrl(link)
  ) {
    return NextResponse.json(
      { error: "Please check the commission details." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      commission: await createCommissionForAdmin({ title, link, costRange }),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to create commission." },
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
    return NextResponse.json({ error: "Missing commission id." }, { status: 400 });
  }

  try {
    await deleteCommissionForAdmin(id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove commission." },
      { status: 500 },
    );
  }
}
