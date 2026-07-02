// components/TrustScore.tsx
"use client";

interface TrustScoreProps {
  score: number;
}

function getTier(score: number): {
  label: string;
  bar: string;
  text: string;
  bg: string;
} {
  if (score >= 80) {
    return {
      label: "High trust",
      bar: "bg-green-500",
      text: "text-green-700",
      bg: "bg-green-50",
    };
  }
  if (score >= 60) {
    return {
      label: "Moderate trust",
      bar: "bg-yellow-500",
      text: "text-yellow-700",
      bg: "bg-yellow-50",
    };
  }
  return {
    label: "Low trust",
    bar: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
  };
}

export default function TrustScore({ score }: TrustScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const tier = getTier(clamped);

  return (
    <div className={`w-full max-w-xs rounded-lg ${tier.bg} p-3`}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`text-xs font-medium ${tier.text}`}>
          {tier.label}
        </span>
        <span className={`text-xs font-semibold ${tier.text}`}>
          {clamped}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
        <div
          className={`h-full rounded-full ${tier.bar} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
