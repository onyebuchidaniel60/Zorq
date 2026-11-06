import { Icon } from "@/components/ui-icon";
import { WalletPanel } from "@/components/wallet/wallet-panel";

export function SignedOutCard({ feature }: { feature: string }) {
  return (
    <section className="z-card z-side-card">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="z-icon-tile">
            <Icon name="lock" className="size-4" />
          </div>
          <h2 className="z-title-md">Connect a wallet to continue</h2>
          <p className="z-copy mt-2">
            {feature} uses your H160 identity derived from a Substrate account.
            Signing in proves control of that wallet; it does not send a transaction.
          </p>
        </div>
        <WalletPanel />
      </div>
    </section>
  );
}
