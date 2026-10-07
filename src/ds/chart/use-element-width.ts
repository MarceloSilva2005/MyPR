"use client";

import { useEffect, useRef, useState } from "react";

/** Tracks the rendered width of an element, so SVG charts can match their container. */
export function useElementWidth<T extends HTMLElement>(): readonly [
  React.RefObject<T | null>,
  number,
] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, width] as const;
}
