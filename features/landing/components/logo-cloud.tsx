export function LogoCloud() {
  const networks = [
    { name: "Viettel", badge: "VT" },
    { name: "Vinaphone", badge: "VNP" },
    { name: "Mobifone", badge: "MBF" },
    { name: "Steam", badge: "STM" },
    { name: "Garena", badge: "GRN" },
    { name: "Riot Games", badge: "RIOT" },
  ]

  return (
    <section className="py-14 border-y border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Hỗ trợ các nhà mạng và nền tảng game hàng đầu
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {networks.map((n) => (
            <div
              key={n.name}
              className="flex items-center gap-2 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-foreground/60">
                {n.badge}
              </span>
              <span className="text-sm font-semibold">{n.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
