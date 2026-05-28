"use client";

import { useBackground } from "./BackgroundProvider";

export function BackgroundLayer() {
  const { backgroundImage } = useBackground();

  if (!backgroundImage) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <img
        src={backgroundImage}
        alt=""
        className="w-full h-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-white/20 dark:bg-black/60" />
    </div>
  );
}
