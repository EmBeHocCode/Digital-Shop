export function LandingAmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="landing-ambient-blob landing-ambient-blob-primary left-[-8rem] top-20 size-[24rem]" />
      <div className="landing-ambient-blob landing-ambient-blob-secondary right-[-6rem] top-[28rem] size-[20rem]" />
      <div className="landing-ambient-blob landing-ambient-blob-tertiary bottom-[18rem] left-1/3 size-[18rem]" />
      <div className="landing-ambient-grid" />
    </div>
  )
}
