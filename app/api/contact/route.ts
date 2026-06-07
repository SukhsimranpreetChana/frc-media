import { NextResponse } from "next/server";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

const contactInbox = "firstmediacommunity@gmail.com";
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "FIRST Media Community <onboarding@resend.dev>";
const maxNameLength = 120;
const maxEmailLength = 254;
const maxSubjectLength = 160;
const maxMessageLength = 5000;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid contact form submission." },
      { status: 400 },
    );
  }

  const name = payload.name?.trim() || "";
  const email = payload.email?.trim() || "";
  const subject = payload.subject?.trim() || "New FMC contact form message";
  const message = payload.message?.trim() || "";

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Please add your name, email, and message." },
      { status: 400 },
    );
  }

  if (
    name.length > maxNameLength ||
    email.length > maxEmailLength ||
    subject.length > maxSubjectLength ||
    message.length > maxMessageLength
  ) {
    return NextResponse.json(
      { error: "Please shorten your contact form message." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please add a valid email address." },
      { status: 400 },
    );
  }

  if (!resendApiKey) {
    return NextResponse.json(
      {
        error:
          "Email is not configured yet. Add RESEND_API_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [contactInbox],
      reply_to: email,
      subject: `FMC Contact: ${subject}`,
      html: `
        <h1>New FIRST Media Community contact form message</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
      text: [
        "New FIRST Media Community contact form message",
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        "",
        message,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Email could not be sent. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
