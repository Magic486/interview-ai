"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, UserRound, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { BackgroundUpload } from "@/components/background/BackgroundUpload";
import { useBackground } from "@/components/background/BackgroundProvider";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { backgroundImage } = useBackground();

  return (
    <header className={`border-b border-white/20 dark:border-white/5 backdrop-blur-xl sticky top-0 z-50 transition-colors ${backgroundImage ? "bg-white/60 dark:bg-slate-900/60" : "bg-white/70 dark:bg-slate-900/70"}`} suppressHydrationWarning>
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg group">
          <GraduationCap className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
          <span className="gradient-text">Interview.ai</span>
        </Link>
        <nav className="flex items-center gap-1">
          <BackgroundUpload />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>
          <Link href="/profile" aria-label="个人信息">
            <Avatar className="h-8 w-8 transition-transform hover:scale-110 ml-1">
              <AvatarFallback className="bg-primary/10">
                <UserRound className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </nav>
      </div>
    </header>
  );
}
