import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={`skeleton-shimmer rounded-xl ${className || ""}`} 
      aria-hidden="true"
    />
  );
}
