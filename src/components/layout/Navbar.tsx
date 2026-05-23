"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, UserRound } from "lucide-react";

export function Navbar() {
  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <GraduationCap className="h-6 w-6" />
          Interview.ai
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              历史记录
            </Button>
          </Link>
          <Link href="/career">
            <Button variant="ghost" size="sm">
              职业规划
            </Button>
          </Link>
          <Link href="/profile" aria-label="个人信息">
            <Avatar className="transition-colors hover:bg-muted">
              <AvatarFallback>
                <UserRound className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </nav>
      </div>
    </header>
  );
}
