import type { Metadata } from 'next'
import { FeaturesSection } from './_landing/features'
import { HeroSection } from './_landing/hero'

export const metadata: Metadata = {
  title: {
    absolute: 'nuqs | Type-safe search params state management for Next.js'
  },
  alternates: {
    canonical: 'https://nuqs.47ng.com'
  }
}

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
    </main>
  )
}
