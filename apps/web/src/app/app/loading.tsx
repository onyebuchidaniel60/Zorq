export default function AppLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-64 animate-pulse rounded-[10px] bg-white/10" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded-[8px] bg-white/[0.06]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-[22px] bg-white/[0.05]" />
        ))}
      </div>
      <span className="sr-only">Loading application content</span>
    </div>
  );
}
