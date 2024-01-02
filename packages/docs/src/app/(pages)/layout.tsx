import { Nav } from 'next-docs-ui/nav'
import { NuqsWordmark } from '../../components/logo'
import { navItems, navLinks } from '../../components/nav'

export default function PageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav
        title={<NuqsWordmark className="px-3" />}
        enableSidebar={false}
        items={navItems}
        links={navLinks}
      />
      {children}
    </>
  )
}
