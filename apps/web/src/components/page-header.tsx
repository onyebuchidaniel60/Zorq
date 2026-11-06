import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  variant = "app",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  variant?: "app" | "public";
}) {
  const isPublic = variant === "public";
  return (
    <div className="z-page-head">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className={`z-eyebrow ${isPublic ? "z-eyebrow-public" : ""}`}>{eyebrow}</p>
        ) : null}
        <h1 className={`z-title-lg mt-2 ${isPublic ? "z-title-on-light" : ""}`}>{title}</h1>
        <p className={`z-copy mt-2 max-w-2xl ${isPublic ? "z-copy-on-light" : ""}`}>
          {description}
        </p>
      </div>
      {actions ? <div className="z-page-head-actions">{actions}</div> : null}
    </div>
  );
}
