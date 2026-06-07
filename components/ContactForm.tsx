"use client";

import { FormEvent, useState } from "react";

type ContactResponse = {
  ok?: boolean;
  error?: string;
};

export default function ContactForm() {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });
      const data = (await response.json()) as ContactResponse;

      if (!response.ok) {
        setMessage(data.error || "Could not send your message.");
        return;
      }

      form.reset();
      setMessage("Message sent. We'll get back to you soon.");
    } catch {
      setMessage("Could not send your message. Please try again later.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="scrap-card mt-8 p-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-[#17001C]/75">
          Name
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            name="name"
            required
          />
        </label>
        <label className="block text-sm text-[#17001C]/75">
          Email
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block text-sm text-[#17001C]/75 md:col-span-2">
          Subject
          <input
            className="mt-2 h-11 w-full rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            name="subject"
            placeholder=""          />
        </label>
        <label className="block text-sm text-[#17001C]/75 md:col-span-2">
          Message
          <textarea
            className="mt-2 min-h-40 w-full resize-y rounded-md border-2 border-[#17001C] bg-[#F4E7E7] px-4 py-3 text-sm text-[#17001C] outline-none ring-[#A335E6]/20 focus:border-[#7137E3] focus:ring-4"
            name="message"
            required
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          className="font-primary fmc-button h-11 bg-[#F85259] px-5 text-sm text-white hover:bg-[#A335E6] disabled:opacity-60"
          disabled={isSending}
          type="submit"
        >
          {isSending ? "Sending..." : "Submit"}
        </button>
        {message ? (
          <p className="text-sm text-[#17001C]/75" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
