import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | FIRST Media Community",
  description:
    "Contact FIRST Media Community about business inquiries, partnerships, and media questions.",
  keywords: [
    "contact FIRST Media Community",
    "FIRST Media Community business inquiries",
    "FRC media partnership",
    "FIRST media partnership",
    "robotics media contact",
    "FRC creative community contact",
    "FIRST Robotics media questions",
    "FRC media collaboration",
    "robotics media collaboration",
  ],
};

export default function ContactPage() {
  return (
    <main className="fmc-surface flex-1">
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="max-w-2xl border-l-8 border-[#F85259] bg-white/75 px-5 py-4">
          <p className="text-sm text-[#72007E]">Contact</p>
          <h1 className="mt-2 text-3xl text-[#17001C]">
            Send FIRST Media Community a message
          </h1>
          <p className="mt-4 text-[#17001C]/75">
            Fill out the form to email us about business inquiries.
          </p>
        </div>

        <ContactForm />
      </section>
    </main>
  );
}
