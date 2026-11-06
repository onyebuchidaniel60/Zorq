import { WalletPanel } from "@/components/wallet/wallet-panel";

export function SignedOutCard({ feature }: { feature: string }) {
  return (
    <section className="rounded-[1.75rem] bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Connect a wallet to continue</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f6f74]">
            {feature} uses your H160 identity derived from a Substrate account.
            Signing in proves control of that wallet; it does not send a transaction.
          </p>
        </div>
        <WalletPanel />
      </div>
    </section>
  );
}
