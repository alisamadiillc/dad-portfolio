import { useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Drag-slider before/after comparison. The after image is the base layer; the
 * before image sits on top, clipped to the left of a draggable divider. Both
 * layers use identical object-cover sizing so they stay pixel-aligned.
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt,
  className,
}: {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  className?: string;
}) {
  // Divider position as a percentage of container width.
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const posFromClientX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPos(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        setPos((p) => clamp(p - 5));
        break;
      case "ArrowRight":
      case "ArrowUp":
        setPos((p) => clamp(p + 5));
        break;
      case "Home":
        setPos(0);
        break;
      case "End":
        setPos(100);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative size-full overflow-hidden select-none",
        className
      )}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = true;
        posFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) posFromClientX(e.clientX);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <img
        src={afterSrc}
        alt={alt}
        loading="lazy"
        draggable={false}
        className="size-full object-cover"
      />
      <img
        src={beforeSrc}
        alt=""
        aria-hidden
        loading="lazy"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_4px_rgba(0,0,0,0.4)]"
        style={{ left: `${pos}%` }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Before and after comparison"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKeyDown}
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border border-white bg-black/60 p-1.5 text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ left: `${pos}%` }}
      >
        <ChevronsLeftRight className="size-4" />
      </div>

      <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
        Before
      </span>
      <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
        After
      </span>
    </div>
  );
}
