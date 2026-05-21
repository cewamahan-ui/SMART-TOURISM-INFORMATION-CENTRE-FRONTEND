import { useEffect, useState } from "react";
import { BACKGROUND_IMAGES } from "@/lib/media-assets";

const ROTATING_BACKGROUNDS = BACKGROUND_IMAGES;

export function BackgroundRotator({ interval = 10000 }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % ROTATING_BACKGROUNDS.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className="fixed inset-0 -z-10" style={{ pointerEvents: "none" }}>
      {ROTATING_BACKGROUNDS.map((src, imageIdx) => (
        <img
          key={src}
          src={src}
          alt="Background"
          className={
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] " +
            (imageIdx === idx ? "opacity-100" : "opacity-0")
          }
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/40" />
    </div>
  );
}
