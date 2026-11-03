import React from "react";

interface ProgressBarProps {
  percent: number;
  status?: string;
  showText?: boolean;
  className?: string;
}

export function ProgressBar({ percent, status, showText = true, className = "" }: ProgressBarProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));

  let barColor = "bg-primary";
  if (status === "COMPLETED") barColor = "bg-success";
  if (status === "FAILED") barColor = "bg-danger";
  if (status === "PAUSED") barColor = "bg-warning";

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs mb-1">
        {showText && <span className="text-muted-foreground font-mono">{safePercent}%</span>}
      </div>
      <div className="w-full bg-[#111620] h-2 rounded-full overflow-hidden border border-border">
        <div
          className={`h-full transition-all duration-300 rounded-full ${barColor}`}
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

