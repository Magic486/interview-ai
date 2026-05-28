import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { BackgroundProvider } from "@/components/background/BackgroundProvider";
import { BackgroundLayer } from "@/components/background/BackgroundLayer";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview.ai - AI 模拟面试",
  description: "模拟大厂真实面试 × 反转视角训练 × 深度复盘报告",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <BackgroundProvider>
            <BackgroundLayer />
            <Navbar />
            <main className="flex-1 relative z-10">{children}</main>
          </BackgroundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
