import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | FIRST Media Community",
  description:
    "What information FIRST Media Community collects, how it is used, and how to ask for it to be removed.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      intro={
        <p>
          This policy explains what information the FIRST Media Community (FMC)
          website collects, why, and what you can do about it. The short
          version: we only collect what you choose to send us, we do not run
          ads or tracking, and we never sell your information.
        </p>
      }
      title="Privacy Policy"
    >
      <LegalSection title="Information you give us">
        <ul>
          <li>
            <strong>Media uploads:</strong> the files you upload, plus the team
            number, year, title, and the name or handle you enter in
            &quot;Uploaded By&quot;. If you choose to upload anonymously, that
            name is hidden from the public but is still visible to FMC admins.
          </li>
          <li>
            <strong>Contact form:</strong> your name, email address, subject,
            and message. These are emailed to the FMC inbox so we can reply.
          </li>
          <li>
            <strong>Commission requests:</strong> the title, link, and cost
            range you submit.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Information collected automatically">
        <ul>
          <li>
            <strong>IP address:</strong> held briefly in server memory to limit
            how many uploads, messages, and login attempts can come from one
            place, which helps stop spam and abuse. It is not saved to our
            database.
          </li>
          <li>
            <strong>Cookies and browser storage:</strong> only what the site
            needs to work, such as remembering your light/dark mode choice and
            keeping admins logged in. See the{" "}
            <Link href="/cookies">Cookie Policy</Link> for the full list.
          </li>
        </ul>
        <p>
          We do not use analytics, advertising, or tracking tools, and we do
          not build profiles of visitors.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <ul>
          <li>To review, organize, and publish approved media</li>
          <li>To show the uploader&apos;s name or handle as credit</li>
          <li>To reply to messages sent through the contact form</li>
          <li>To list commission opportunities</li>
          <li>To keep the site secure and prevent spam</li>
        </ul>
      </LegalSection>

      <LegalSection title="What is public">
        <p>
          Approved uploads are public. That includes the media itself, the team
          number, the year, the title, and the uploader&apos;s name or handle
          (unless the upload is anonymous). Approved commission listings are
          also public. Anything public may be seen, downloaded, or shared by
          anyone, so please think before you upload, especially if it shows
          people&apos;s faces or names.
        </p>
      </LegalSection>

      <LegalSection title="Services we use">
        <p>
          We do not sell or rent your information. We share it only with the
          services that run the site:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> stores upload details, commission
            listings, and site settings.
          </li>
          <li>
            <strong>Google Drive</strong> stores uploaded media files.
          </li>
          <li>
            <strong>Resend</strong> delivers contact form messages to our email
            inbox.
          </li>
          <li>
            <strong>YouTube and The Blue Alliance</strong> provide team videos
            and match media. Some images, such as YouTube thumbnails and
            community profile pictures, load straight from other websites,
            which can see your IP address when they do.
          </li>
          <li>
            Our <strong>hosting provider</strong> runs the website and may keep
            standard server logs.
          </li>
        </ul>
        <p>
          We may also share information if the law requires it or to protect
          the safety of our community.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Uploads and listings stay until they are removed by an admin or at
          your request. Contact form emails stay in our inbox until we delete
          them. Rate-limit records disappear on their own within minutes, and
          admin login sessions expire after 8 hours.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can ask us to see, correct, or delete information you have sent
          us, including removing an upload or changing how you are credited.{" "}
          <Link href="/contact">Contact us</Link> or email{" "}
          <a href="mailto:firstmediacommunity@gmail.com">
            firstmediacommunity@gmail.com
          </a>{" "}
          and tell us which upload or message it is about. We may need to
          confirm it is yours before making changes.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Many FIRST members are students. The site is not meant for children
          under 13 to submit information. If you are under 13, please ask a
          parent, guardian, or mentor to upload or contact us for you. If you
          believe a child under 13 has sent us personal information, contact us
          and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this policy from time to time. When we do, we will
          change the date at the top of this page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
