import { GithubIcon, PackageIcon } from 'lucide-react'
import { Nav } from 'next-docs-ui/nav'
import { RootProvider } from 'next-docs-ui/provider'
import { NuqsWordmark } from '../components/logo'
import './globals.css'

export default function HomePage() {
  return (
    <RootProvider>
      <Nav
        title={<NuqsWordmark />}
        enableSidebar={false}
        links={[
          {
            label: 'GitHub',
            icon: <GithubIcon className="h-5 w-5" />,
            href: 'https://github.com/47ng/next-usequerystate',
            external: true
          },
          {
            label: 'NPM',
            icon: <PackageIcon className="h-5 w-5" />,
            href: 'https://npmjs.com/package/next-usequerystate',
            external: true
          }
        ]}
      />
      <main
        style={{
          height: 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          justifyContent: 'center'
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}
        >
          <NuqsWordmark />
        </h1>
        <p>Type-safe search params state manager for Next.js</p>
      </main>
    </RootProvider>
  )
}
