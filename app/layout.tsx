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
      <body className="min-h-full flex flex-col">
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
