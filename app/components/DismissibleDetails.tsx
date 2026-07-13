"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function DismissibleDetails({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      const details = ref.current;
      const target = event.target as Node;
      if (!details) return;
      const summary = details.querySelector(":scope > summary");
      const card = details.querySelector(":scope > .profile-popover, :scope > .mobile-links");
      if (!summary?.contains(target) && !card?.contains(target)) details.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return <details className={className} ref={ref}>{children}</details>;
}
