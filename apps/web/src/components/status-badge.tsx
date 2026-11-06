export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "z-badge-neutral",
    success: "z-badge-success",
    warning: "z-badge-warning",
    danger: "z-badge-danger",
    info: "z-badge-info",
  };

  return <span className={`z-badge ${tones[tone]}`}>{children}</span>;
}
