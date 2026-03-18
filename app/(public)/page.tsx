import { Benefits } from "@/features/landing/components/benefits"
import { FAQ } from "@/features/landing/components/faq"
import { Features } from "@/features/landing/components/features"
import { Hero } from "@/features/landing/components/hero"
import { LandingAmbientBackground } from "@/features/landing/components/landing-ambient-background"
import { LogoCloud } from "@/features/landing/components/logo-cloud"
import { Pricing } from "@/features/landing/components/pricing"
import { Services } from "@/features/landing/components/services"
import { Testimonials } from "@/features/landing/components/testimonials"

export default function LandingPage() {
  return (
    <div className="landing-page-shell">
      <LandingAmbientBackground />
      <Hero />
      <LogoCloud />
      <Services />
      <Features />
      <Pricing />
      <Benefits />
      <Testimonials />
      <FAQ />
    </div>
  )
}
