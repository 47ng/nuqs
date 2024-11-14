import { NuqsWordmark } from '@/src/components/logo'
import { SiBluesky, SiGithub, SiYoutube } from '@icons-pack/react-simple-icons'
import Link from 'next/link'

export default function Component() {
  return (
    <footer className="w-full border-t bg-zinc-50/50 py-12 dark:bg-zinc-900/50">
      <nav className="container px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-4">
            <NuqsWordmark className="text-4xl" />
            <p className="text-sm text-zinc-500">
              Made by{' '}
              <a
                href="https://francoisbest.com"
                className="font-semibold hover:underline"
              >
                François Best
              </a>{' '}
              and{' '}
              <a
                href="https://github.com/47ng/nuqs/graphs/contributors"
                className="font-semibold hover:underline"
              >
                contributors
              </a>
              <br />
              <a
                href="https://github.com/47ng/nuqs/blob/next/LICENSE"
                className="hover:underline"
              >
                MIT License
              </a>{' '}
              © 2020
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="hover:underline" prefetch={false}>
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/playground"
                  className="hover:underline"
                  prefetch={false}
                >
                  Playground
                </Link>
              </li>
              <li>
                <Link
                  href="/stats"
                  className="hover:underline"
                  prefetch={false}
                >
                  Project Stats
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Social</h3>
            <ul className="space-y-1">
              <li>
                <a
                  href="https://github.com/47ng/nuqs"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <SiGithub role="presentation" className="mr-2 size-5" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@47ng-dev"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <SiYoutube role="presentation" className="mr-2 size-5" />
                  <span>YouTube</span>
                </a>
              </li>
              <li>
                <a
                  href="https://bsky.app/profile/nuqs.47ng.com"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <SiBluesky role="presentation" className="mr-2 size-5" />
                  <span>Bluesky</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </footer>
  )
}
