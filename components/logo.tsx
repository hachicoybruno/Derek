export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xl font-black tracking-tight ${claro ? "text-white" : "text-slate-900"}`}>
      <svg aria-hidden viewBox="0 0 32 32" className="size-8">
        <rect width="32" height="32" rx="8" fill="#1c41b8" />
        <path d="M9 21.5h14M10.5 21.5l1.6-5.2a2 2 0 0 1 1.9-1.4h4a2 2 0 0 1 1.9 1.4l1.6 5.2M11 24.5v-3M21 24.5v-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M18 7.5h5v5M23 7.5l-6 6" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      FLIPDESK
    </span>
  );
}
