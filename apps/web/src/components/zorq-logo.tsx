export function ZorqMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="10.5"
        fill="#0A0B09"
        stroke="rgba(217,255,99,0.22)"
      />
      <path
        d="M20 4.8 33.2 12.2v15.6L20 35.2 6.8 27.8V12.2L20 4.8Z"
        stroke="#D9FF63"
        strokeOpacity="0.24"
        strokeWidth="1"
      />
      <path
        d="M12.2 13.4h15.4L18.2 26.6h9.6"
        stroke="#D9FF63"
        strokeWidth="3.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27.6" cy="13.4" r="1.7" fill="#F3F5ED" />
    </svg>
  );
}
