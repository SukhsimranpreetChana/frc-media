import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | FIRST Media Community",
  description:
    "The rules for using FIRST Media Community, uploading media, and posting commission listings.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      intro={
        <p>
          These terms explain the rules for using the FIRST Media Community
          (FMC) website. By using the site, you agree to them. If you do not
          agree, please do not use the site.
        </p>
      }
      title="Terms of Service"
    >
      <LegalSection title="Who we are">
        <p>
          FIRST Media Community is a community of students, alumni, and mentors
          who create media for FIRST robotics teams. FMC is not affiliated with
          FIRST HQ, and FIRST® is not overseeing, involved with, or responsible
          for this website.
        </p>
      </LegalSection>

      <LegalSection title="Who can use the site">
        <p>
          Anyone can browse the site. If you are under 13, please do not upload
          media or submit forms; ask a parent, guardian, or team mentor to do it
          for you. If you are under 18, please make sure a parent, guardian, or
          mentor is okay with what you share.
        </p>
      </LegalSection>

      <LegalSection title="Uploading media">
        <ul>
          <li>
            Only upload photos or videos that you created, own, or have clear
            permission to share.
          </li>
          <li>
            You keep ownership of everything you upload. By uploading, you give
            FMC permission to store, display, organize, and share your media on
            this site and in the FMC Google Drive so teams and the community
            can find and use it.
          </li>
          <li>
            Uploads are reviewed by FMC admins before they appear publicly.
            Approved uploads may show up in team searches and in the
            &quot;Recently uploaded&quot; section.
          </li>
          <li>
            If you upload anonymously, your name or handle is hidden from the
            public listing and Drive folder, but FMC admins can still see it.
          </li>
          <li>
            If you mark an upload as &quot;Credit required&quot;, it shows a
            badge asking viewers to credit you. FMC displays this badge but
            cannot enforce credit on other people&apos;s behalf.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Using media from the site">
        <p>
          Media on FMC is shared to help FIRST teams and creatives. If an upload
          has a &quot;Credit required&quot; badge, you must credit the creator
          when you use it. Do not use media from the site in a way that is
          misleading, harmful, or disrespectful to the people in it or the
          people who made it.
        </p>
      </LegalSection>

      <LegalSection title="Commission listings">
        <p>
          Only submit commission listings that you own, manage, or have
          permission to post. Keep links safe, accurate, and relevant to FIRST
          or FRC media work. Any deal you make through a commission listing is
          between you and the other person; FMC is not part of it and is not
          responsible for payments or delivered work.
        </p>
      </LegalSection>

      <LegalSection title="Content that is not allowed">
        <p>Do not upload, link to, or submit anything that is:</p>
        <ul>
          <li>Private, unsafe, hateful, harassing, or sexual</li>
          <li>Copyrighted material you do not have the rights to share</li>
          <li>Misleading, spam, or malicious (including harmful links)</li>
          <li>
            Personal information about someone else without their permission
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Moderation and removal">
        <p>
          FMC admins may review, approve, edit, organize, or remove any upload
          or listing, and may limit access to site features when needed to
          protect the community. If you see media of yourself or your work that
          you want removed, <Link href="/contact">contact us</Link> and we will
          review it.
        </p>
      </LegalSection>

      <LegalSection title="Other websites and services">
        <p>
          The site links to and shows content from other services, such as
          Google Drive, YouTube, The Blue Alliance, and Discord. Those services
          have their own terms, and FMC is not responsible for them.
        </p>
      </LegalSection>

      <LegalSection title="No guarantees">
        <p>
          FMC is a volunteer community project. The site is provided &quot;as
          is&quot;, without guarantees that it will always be available or
          error-free. To the extent allowed by law, FMC is not responsible for
          losses that come from using the site or media found on it.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          We may update these terms from time to time. When we do, we will
          change the date at the top of this page. Continuing to use the site
          after an update means you accept the new terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms? Use the{" "}
          <Link href="/contact">contact form</Link> or email{" "}
          <a href="mailto:firstmediacommunity@gmail.com">
            firstmediacommunity@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
