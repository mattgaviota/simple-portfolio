"use client";

import { useState } from "react";
import { FaImage } from "react-icons/fa6";

type Props = {
  onChange: (file: File | null) => void;
  hasImage?: boolean;
};

export function ImagePicker({ onChange, hasImage = false }: Props) {
  const [fileName, setFileName] = useState("");

  return (
    <div className="flex items-center gap-3">
      <label className="relative inline-flex cursor-pointer items-center gap-2 rounded-lg border border-accent bg-white/80 px-4 py-2 text-sm font-medium text-accent shadow-sm transition-colors hover:bg-accent hover:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
        <FaImage className="h-4 w-4" aria-hidden />
        {hasImage || fileName ? "Cambiar imagen" : "Subir imagen"}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            if (file) setFileName(file.name);
            onChange(file);
          }}
        />
      </label>
      <span className="min-w-0 truncate text-sm font-normal text-neutral-500">
        {fileName || "Ningún archivo seleccionado"}
      </span>
    </div>
  );
}
