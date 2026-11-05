export function PrototypeNotice() {
  return (
    <aside
      aria-label="Prototype status"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
    >
      <span className="font-semibold">Early prototype.</span> Wallet sign-in and
      sessions are live. Pages and controls labelled “Planned” are not functional
      yet and never imply a successful transaction, license or training run.
    </aside>
  );
}
