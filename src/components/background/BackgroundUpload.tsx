"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Shirt, X } from "lucide-react";
import { useBackground } from "./BackgroundProvider";

const MAX_WIDTH = 1920;
const JPEG_QUALITY = 0.5;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth, naturalHeight } = img;
      let w = naturalWidth;
      let h = naturalHeight;
      if (w > MAX_WIDTH) {
        h = Math.round(h * (MAX_WIDTH / w));
        w = MAX_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function BackgroundUpload() {
  const { backgroundImage, setBackgroundImage, clearBackground } = useBackground();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setBackgroundImage(compressed);
    } catch (err) {
      console.error("Failed to process image:", err);
    }

    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="上传自定义背景图片"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        className="text-muted-foreground hover:text-foreground"
        title="自定义背景"
      >
        <Shirt className="h-4 w-4" />
      </Button>
      {backgroundImage && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearBackground}
          className="text-muted-foreground hover:text-foreground -ml-1"
          title="清除背景"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </>
  );
}
