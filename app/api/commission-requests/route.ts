import { NextResponse } from "next/server";
import { requireAdmin, requireSameOrigin } from "@/lib/adminAuth";
import {
  createCommissionForAdmin,
  createCommissionRequest,
  deleteCommissionRequestForAdmin,
  getCommissionRequestsForAdmin,
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

function parseCommissionPayload(payload: {
  title?: unknown;
  link?: unknown;
  costRange?: unknown;
} | null) {
  return {
    title: typeof payload?.title === "string" ? payload.title.trim() : "",
    link: typeof payload?.link === "string" ? payload.link.trim() : "",
    costRange:
      typeof payload?.costRange === "string" ? payload.costRange.trim() : "",
  };
}

function validateCommissionInput(input: {
  title: string;
  link: string;
  costRange: string;
}) {
  if (!input.title || !input.link || !input.costRange) {
    return "Please add a title, link, and cost range.";
  }

  if (
    input.title.length > maxTitleLength ||
    input.link.length > maxLinkLength ||
    input.costRange.length > maxCostRangeLength ||
    !isValidHttpUrl(input.link)
  ) {
    return "Please check the commission request details.";
  }

  return "";
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    return NextResponse.json({
      requests: await getCommissionRequestsForAdmin(),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load commission requests." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const forbidden = requireSameOrigin(request);

  if (forbidden) {
    return forbidden;
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Commission requests are not configured yet." },
      { status: 503 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    title?: unknown;
    link?: unknown;
    costRange?: unknown;
  } | null;
  const input = parseCommissionPayload(payload);
  const validationError = validateCommissionInput(input);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    return NextResponse.json({
      request: await createCommissionRequest(input),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to submit commission request." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
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
    title?: unknown;
    link?: unknown;
    costRange?: unknown;
  } | null;
  const id = typeof payload?.id === "string" ? payload.id.trim() : "";
  const input = parseCommissionPayload(payload);
  const validationError = validateCommissionInput(input);

  if (!isValidUuid(id)) {
    return NextResponse.json(
      { error: "Missing commission request id." },
      { status: 400 },
    );
  }

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const commission = await createCommissionForAdmin(input);
    await deleteCommissionRequestForAdmin(id);

    return NextResponse.json({ commission });
  } catch {
    return NextResponse.json(
      { error: "Unable to approve commission request." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  const payload = (await request.json().catch(() => null)) as {
    id?: unknown;
  } | null;
  const id = typeof payload?.id === "string" ? payload.id.trim() : "";

  if (!isValidUuid(id)) {
    return NextResponse.json(
      { error: "Missing commission request id." },
      { status: 400 },
    );
  }

  try {
    await deleteCommissionRequestForAdmin(id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to deny commission request." },
      { status: 500 },
    );
  }
}
