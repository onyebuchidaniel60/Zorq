import { Icon } from "@/components/ui-icon";

export function PrototypeNotice() {
  return (
    <aside
      aria-label="Deployment status"
      className="flex flex-wrap items-center gap-2.5 rounded-[12px] border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] leading-5 text-[#9aa08f]"
    >
      <span className="inline-flex items-center gap-1.5 font-semibold text-[#d9ff63]">
        <Icon name="shield" className="size-3.5" />
        Testnet deployment
      </span>
      <span className="h-3 w-px bg-white/10" aria-hidden="true" />
      <span>Evaluation environment.</span>
      <span className="hidden sm:inline">Wallet-signed actions use Portaldot V3.</span>
      <span className="hidden md:inline">Incomplete features stay labelled.</span>
    </aside>
  );
}
