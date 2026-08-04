export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas transition-colors duration-300">
      <div
        className="animate-drift1 absolute -left-[5%] top-[-10%] h-[62vw] w-[62vw] rounded-full blur-[85px]"
        style={{ background: "var(--blob-a)" }}
      />
      <div
        className="animate-drift2 absolute -right-[10%] top-[0%] h-[54vw] w-[54vw] rounded-full blur-[95px]"
        style={{ background: "var(--blob-b)" }}
      />
      <div
        className="animate-drift3 absolute bottom-[-15%] left-[15%] h-[58vw] w-[58vw] rounded-full blur-[100px]"
        style={{ background: "var(--blob-c)" }}
      />
      <div
        className="animate-drift4 absolute bottom-[-10%] right-[5%] h-[46vw] w-[46vw] rounded-full blur-[90px]"
        style={{ background: "var(--blob-d)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
        }}
      />
    </div>
  );
}
