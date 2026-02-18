"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname + searchParams.toString());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setProgress(100);
    timer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  }, []);

  useEffect(() => {
    const current = pathname + searchParams.toString();
    if (current !== prevPath.current) {
      finish();
      prevPath.current = current;
    }
  }, [pathname, searchParams, finish]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || anchor.target === "_blank") return;

      if (timer.current) clearTimeout(timer.current);
      setVisible(true);
      setProgress(30);
      timer.current = setTimeout(() => setProgress(60), 150);
      timer.current = setTimeout(() => setProgress(80), 500);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div
        className="h-full bg-blue-500 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
