"use client";

import { useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

type Props = {
  images: string[];
  alt: string;
  dimmed?: boolean;
  children?: React.ReactNode;
};

export function ImageCarousel({ images, alt, dimmed = false, children }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const multiple = images.length > 1;

  function goTo(next: number) {
    const el = track.current;
    if (!el) return;
    const clamped = (next + images.length) % images.length;
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  return (
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Imágenes de ${alt}`}
      className="relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-white/50"
    >
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={multiple ? `${alt} (${i + 1} de ${images.length})` : alt}
            className={`h-full w-full shrink-0 snap-center object-cover ${dimmed ? "opacity-60" : ""}`}
          />
        ))}
      </div>
      {children}
      {multiple && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() => goTo(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2.5 text-accent shadow hover:bg-white"
          >
            <FaChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={() => goTo(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2.5 text-accent shadow hover:bg-white"
          >
            <FaChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la imagen ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-2.5 w-2.5 rounded-full border border-white/80 shadow ${i === index ? "bg-accent" : "bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
