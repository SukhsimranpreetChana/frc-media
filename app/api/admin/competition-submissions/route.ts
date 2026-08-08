import { NextResponse } from "next/server";
import { requireAdmin, requireAdminOrReadOnly } from "@/lib/adminAuth";
import {
  deleteCompetitionSubmissionForAdmin,
  getCompetitionSubmissionsForAdmin,
  updateCompetitionSubmissionScoresForAdmin,
} from "@/lib/supabase";

export const runtime = "nodejs";

function parseScore(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const score = Number(value);

  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return null;
  }

  return score;
}

export async function GET(request: Request) {
  const unauthorized = await requireAdminOrReadOnly(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    return NextResponse.json({
      submissions: await getCompetitionSubmissionsForAdmin(),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load competition submissions." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  const payload = (await request.json().catch(() => null)) as {
    id?: unknown;
    creativityScore?: unknown;
    effortScore?: unknown;
    executionScore?: unknown;
  } | null;
  const id = typeof payload?.id === "string" ? payload.id.trim() : "";
  const creativityScore = parseScore(payload?.creativityScore);
  const effortScore = parseScore(payload?.effortScore);
  const executionScore = parseScore(payload?.executionScore);

  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json(
      { error: "Missing competition submission id." },
      { status: 400 },
    );
  }

  if (
    creativityScore === null ||
    effortScore === null ||
    executionScore === null
  ) {
    return NextResponse.json(
      { error: "Scores must be whole numbers from 1 to 10." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      submission: await updateCompetitionSubmissionScoresForAdmin(id, {
        creativityScore,
        effortScore,
        executionScore,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to save competition scores." },
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

  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json(
      { error: "Missing competition submission id." },
      { status: 400 },
    );
  }

  try {
    await deleteCompetitionSubmissionForAdmin(id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove competition submission." },
      { status: 500 },
    );
  }
}
