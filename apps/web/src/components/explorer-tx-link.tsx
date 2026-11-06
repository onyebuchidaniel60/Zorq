import { Icon } from "@/components/ui-icon";
import { explorerTxUrl } from "@/lib/explorer";

export function ExplorerTxLink({
  txHash,
  confirmed = true,
  label = "View on explorer",
  description,
  compact = false,
}: {
  txHash?: string | null;
  confirmed?: boolean;
  label?: string;
  description?: string;
  compact?: boolean;
}) {
  const href = explorerTxUrl(txHash);
  if (!confirmed || !href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={description ?? label}
      title={description ?? label}
      className={`z-explorer-link ${compact ? "" : "z-explorer-link-labeled"}`}
    >
      <Icon name="external" className={compact ? "size-3.5" : "size-4"} />
      {compact ? null : <span>{label}</span>}
    </a>
  );
}
