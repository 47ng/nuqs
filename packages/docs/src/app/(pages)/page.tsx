import type { Metadata } from 'next'
import { ContributorsSection } from './_landing/contributors'
import { DependentsSection } from './_landing/dependents'
import { FeaturesSection } from './_landing/features'
import { HeroSection } from './_landing/hero'
import { PageFooter } from './_landing/page-footer'
import { QuotesSection } from './_landing/quotes/quotes-section'
import { SponsorsSection } from './_landing/sponsors'

export const metadata: Metadata = {
  title: {
    absolute: 'nuqs | Type-safe search params state management for React'
  },
  alternates: {
    canonical: 'https://nuqs.dev'
  }
}

export default function HomePage() {
  return (
    <main>
      {/* Note: top-level banner goes here */}
      <HeroSection />
      <FeaturesSection />
      <SponsorsSection />
      <ContributorsSection />
      <DependentsSection />
      <QuotesSection />
      <PageFooter />
    </main>
  )
}
