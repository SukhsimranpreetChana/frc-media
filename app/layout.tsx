import type { Metadata } from "next";
import { Dela_Gothic_One, Nunito } from "next/font/google";
import Footer from "@/components/Footer";
import DarkModeToggle from "@/components/DarkModeToggle";
import HalftoneScroll from "@/components/HalftoneScroll";
import Navbar from "@/components/Navbar";
import SplashIntro from "@/components/SplashIntro";
import TermsPrompt from "@/components/TermsPrompt";
import "./globals.css";

const delaGothicOne = Dela_Gothic_One({
  variable: "--font-dela-gothic-one",
  subsets: ["latin"],
  weight: "400",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: "500",
});

export const metadata: Metadata = {
  title: "FIRST Media Community",
  description:
    "A community for FIRST creatives to share media, collaborate, and grow their skills.",
  keywords: [
    "FIRST Media Community",
    "FRC media",
    "FIRST Robotics media",
    "FIRST Robotics Competition",
    "FRC photography",
    "FRC videography",
    "FRC photos",
    "FRC videos",
    "robotics media",
    "robotics photography",
    "robotics videography",
    "FIRST creatives",
    "student media team",
    "robotics content creators",
    "FRC content creators",
    "FIRST event coverage",
    "robotics event coverage",
    "FRC social media",
    "team branding",
    "graphic design for robotics",
    "robotics reels",
    "FRC clips",
    "team media library",
    "FIRST community",
    "FRC community",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${delaGothicOne.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <SplashIntro />
        <HalftoneScroll />
        <DarkModeToggle />
        <Navbar />
        {children}
        <Footer />
        <TermsPrompt />
      </body>
    </html>
  );
}
