"use client";

import { Spinner } from "./spinner";
import { cn } from "@/pkg/theme/utils";

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  className?: string;
}

export function LoadingOverlay({ visible, text, className }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/70 backdrop-blur-sm",
        className
      )}
    >
      <Spinner size="lg" />
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
