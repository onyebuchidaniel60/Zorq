import Link from "next/link";

export function BackLink({
  href,
  label = "Back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href} className="z-back-link" aria-label={label}>
      <span aria-hidden="true" className="z-back-arrow">
        ←
      </span>
      <span>{label}</span>
    </Link>
  );
}
