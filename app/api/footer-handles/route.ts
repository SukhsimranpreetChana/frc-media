import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { uploadFooterProfilePictureToGoogleDrive } from "@/lib/googleDrive";
import {
  createFooterHandleForAdmin,
  deleteFooterHandleForAdmin,
  getFooterHandles,
  isSupabaseAdminConfigured,
  updateFooterHandleForAdmin,
} from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxHandleLength = 80;
const maxLinkLength = 500;
const maxProfileImageUrlLength = 500;
const maxProfileImageSizeBytes = 10 * 1024 * 1024;

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

  const formData = await request.formData().catch(() => null);
  const profileImage = formData?.get("profileImage");
  const handle = String(formData?.get("handle") || "").trim();
  const link = String(formData?.get("link") || "").trim();

  if (!handle || !link) {
    return NextResponse.json(
      { error: "Please add a handle and link." },
      { status: 400 },
    );
  }

  if (!(profileImage instanceof File)) {
    return NextResponse.json(
      { error: "Please upload a profile picture." },
      { status: 400 },
    );
  }

  if (
    handle.length > maxHandleLength ||
    link.length > maxLinkLength ||
    !isValidHttpUrl(link)
  ) {
    return NextResponse.json(
      { error: "Please check the footer profile details." },
      { status: 400 },
    );
  }

  if (
    profileImage.size <= 0 ||
    profileImage.size > maxProfileImageSizeBytes ||
    !profileImage.type.startsWith("image/")
  ) {
    return NextResponse.json(
      { error: "Please upload an image file under 10 MB." },
      { status: 400 },
    );
  }

  try {
    const uploadedProfileImage = await uploadFooterProfilePictureToGoogleDrive({
      file: profileImage,
      handle,
    });

    return NextResponse.json({
      handle: await createFooterHandleForAdmin({
        handle,
        link,
        profileImageUrl: uploadedProfileImage.thumbnailUrl,
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

  const formData = await request.formData().catch(() => null);
  const profileImage = formData?.get("profileImage");
  const id = String(formData?.get("id") || "").trim();
  const handle = String(formData?.get("handle") || "").trim();
  const link = String(formData?.get("link") || "").trim();
  const existingProfileImageUrl = String(
    formData?.get("existingProfileImageUrl") || "",
  ).trim();

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Missing footer handle id." }, { status: 400 });
  }

  if (!handle || !link) {
    return NextResponse.json(
      { error: "Please add a handle and link." },
      { status: 400 },
    );
  }

  if (
    handle.length > maxHandleLength ||
    link.length > maxLinkLength ||
    existingProfileImageUrl.length > maxProfileImageUrlLength ||
    !isValidHttpUrl(link) ||
    (existingProfileImageUrl && !isValidHttpUrl(existingProfileImageUrl))
  ) {
    return NextResponse.json(
      { error: "Please check the footer profile details." },
      { status: 400 },
    );
  }

  if (!existingProfileImageUrl && !(profileImage instanceof File)) {
    return NextResponse.json(
      { error: "Please upload a profile picture." },
      { status: 400 },
    );
  }

  if (
    profileImage instanceof File &&
    (profileImage.size <= 0 ||
      profileImage.size > maxProfileImageSizeBytes ||
      !profileImage.type.startsWith("image/"))
  ) {
    return NextResponse.json(
      { error: "Please upload an image file under 10 MB." },
      { status: 400 },
    );
  }

  try {
    const profileImageUrl =
      profileImage instanceof File
        ? (
            await uploadFooterProfilePictureToGoogleDrive({
              file: profileImage,
              handle,
            })
          ).thumbnailUrl
        : existingProfileImageUrl;

    return NextResponse.json({
      handle: await updateFooterHandleForAdmin(id, {
        handle,
        link,
        profileImageUrl,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to update footer profile." },
      { status: 500 },
    );
  }
}
