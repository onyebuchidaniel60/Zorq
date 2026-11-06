export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`z-spinner ${className}`} />;
}
