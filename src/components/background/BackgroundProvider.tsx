"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface BackgroundContextType {
  backgroundImage: string | null;
  setBackgroundImage: (image: string | null) => void;
  clearBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType>({
  backgroundImage: null,
  setBackgroundImage: () => {},
  clearBackground: () => {},
});

export function useBackground() {
  return useContext(BackgroundContext);
}

const STORAGE_KEY = "custom-background-image";

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBackgroundImageState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (backgroundImage) {
      document.body.setAttribute("data-custom-bg", "");
    } else {
      document.body.removeAttribute("data-custom-bg");
    }
  }, [backgroundImage]);

  const setBackgroundImage = useCallback((image: string | null) => {
    setBackgroundImageState(image);
    if (image) {
      try {
        localStorage.setItem(STORAGE_KEY, image);
      } catch {
        console.warn("Background image too large for localStorage, skipping persist");
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearBackground = useCallback(() => {
    setBackgroundImage(null);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <BackgroundContext.Provider value={{ backgroundImage, setBackgroundImage, clearBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}
