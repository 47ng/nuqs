import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { HomeLayout } from 'fumadocs-ui/home-layout'

export default function PageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <HomeLayout {...getSharedLayoutProps()}>{children}</HomeLayout>
}
