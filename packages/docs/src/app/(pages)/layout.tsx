import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { HomeLayout } from 'fumadocs-ui/layouts/home'

export default function PageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <HomeLayout {...getSharedLayoutProps()}>{children}</HomeLayout>
}
