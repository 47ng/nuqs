/**
 * v0 by Vercel.
 * @see https://v0.dev/t/I8Btobzyd7p
 */
import { NuqsWordmark } from '@/src/components/logo'
import { GithubIcon, TwitterIcon, YoutubeIcon } from 'lucide-react'
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
                <Link href="/docs" className="hover:underline">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/playground" className="hover:underline">
                  Playground
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:underline">
                  Project Stats
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Social</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/47ng/nuqs"
                  className="hover:underline"
                >
                  <GithubIcon className="mr-2 inline-block h-5 w-5" /> GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.youtube.com/@47ng-dev"
                  className="hover:underline"
                >
                  <YoutubeIcon className="mr-2 inline-block h-5 w-5" /> YouTube
                </Link>
              </li>
              <li>
                <Link href="https://x.com/nuqs47ng" className="hover:underline">
                  <TwitterIcon className="mr-2 inline-block h-5 w-5" /> Twitter
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </footer>
  )
}
