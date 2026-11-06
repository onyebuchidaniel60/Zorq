export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[#f4f4f5] text-[#6f6f74]",
    success: "bg-[#dff3e6] text-[#2d6a4a]",
    warning: "bg-[#f7f1df] text-[#7a5a1f]",
    danger: "bg-[#f8ecec] text-[#7a2626]",
    info: "bg-[#e8eef8] text-[#2d4b7a]",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
