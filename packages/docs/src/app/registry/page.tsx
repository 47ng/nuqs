import { H2 } from '@/src/components/typography'
import { Card, Cards } from 'fumadocs-ui/components/card'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import { RssIcon } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata = {
  title: 'Shadcn Registry',
  description:
    'Use the shadcn CLI to install custom parsers, adapters and utilities from the community.'
} satisfies Metadata

export default function Page() {
  return (
    <DocsPage>
      <nav className="mb-4 flex items-center justify-between">
        <DocsTitle>Shadcn Registry</DocsTitle>
        <RssFeedLink />
      </nav>
      <DocsDescription>
        Use the{' '}
        <a href="https://ui.shadcn.com/docs/cli" className="underline">
          shadcn CLI
        </a>{' '}
        to install custom parsers, adapters, and utilities from the community.
      </DocsDescription>

      <DocsBody>
        <H2 id="using-the-registry">Using the registry</H2>
        <p>
          Follow the CLI instructions for each item to add it to your project,
          or copy-paste the code snippets directly.
        </p>
        <H2 id="community-adapters">Community Adapters</H2>
        <Cards>
          <InertiaCard />
          <OneJsCard />
          <WakuCard />
          <Card
            href="https://github.com/47ng/nuqs/issues/837"
            title="Expo Router"
            className="border-dashed"
            icon={
              <svg
                viewBox="0 0 24 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.39 8.269c.19-.277.397-.312.565-.312.168 0 .447.035.637.312 1.49 2.03 3.95 6.075 5.765 9.06 1.184 1.945 2.093 3.44 2.28 3.63.7.714 1.66.269 2.218-.541.549-.797.701-1.357.701-1.954 0-.407-7.958-15.087-8.759-16.309C14.027.98 13.775.683 12.457.683h-.988c-1.315 0-1.505.297-2.276 1.472C8.392 3.377.433 18.057.433 18.463c0 .598.153 1.158.703 1.955.558.81 1.518 1.255 2.218.54.186-.19 1.095-1.684 2.279-3.63 1.815-2.984 4.267-7.029 5.758-9.06z"
                  fill="currentColor"
                />
              </svg>
            }
          >
            🚧 Coming soon to the registry, discussion on GitHub.
          </Card>
        </Cards>
        {/* <H2 id="mcp-server">MCP Server</H2>
        <p>
          Shadcn registries come with an{' '}
          <a href="https://ui.shadcn.com/docs/mcp">MCP server</a> that you can
          use
        </p> */}
        <H2 id="rss-feed">Staying up to date</H2>
        <p>
          Subscribe to the registry's <a href="/registry/rss.xml">RSS feed</a>{' '}
          to stay updated on the latest changes and additions to the registry.
        </p>
      </DocsBody>
    </DocsPage>
  )
}

function RssFeedLink() {
  return (
    <a
      href="/registry/rss.xml"
      className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
    >
      <RssIcon
        className="size-4 text-orange-600 dark:text-orange-400"
        role="presentation"
      />
      RSS
    </a>
  )
}

// --

const InertiaCard = () => (
  <Card
    href="/registry/adapter-inertia"
    title="Inertia.js"
    icon={
      <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="500" rx="250" fill="url(#paint0_linear)" />
        <path
          d="M184 165H95L181 251L95 337H184L270 251L184 165Z"
          fill="white"
        />
        <path
          d="M318.5 165H229.5L315.5 251L229.5 337H318.5L404.5 251L318.5 165Z"
          fill="white"
        />
        <defs>
          <linearGradient
            id="paint0_linear"
            x1="35"
            y1="377.5"
            x2="632.5"
            y2="65"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#934EE7" />
            <stop offset="1" stopColor="#7270EC" />
          </linearGradient>
        </defs>
      </svg>
    }
  >
    The modern monolith. Usually paired with non-JS backends (Laravel, Phoenix,
    Django, Rails).
  </Card>
)

const OneJsCard = () => (
  <Card
    href="/registry/adapter-onejs"
    title="One.js"
    icon={
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="250 250 632 632">
        <title>One.js</title>
        <defs>
          <filter
            id="a"
            width="252.7%"
            height="232.9%"
            x="-76.4%"
            y="-66.4%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
          </filter>
          <filter
            id="b"
            width="117.5%"
            height="160.9%"
            x="-8.7%"
            y="-30.5%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
          </filter>
          <filter
            id="c"
            width="137.3%"
            height="135.2%"
            x="-18.6%"
            y="-17.6%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="45" />
          </filter>
        </defs>
        <g fill="none" fillRule="evenodd" transform="translate(271 271)">
          <circle cx="295" cy="295" r="295" fill="#f5ca05" />
          <g transform="translate(202 97)">
            <circle cx="108.5" cy="113.5" r="94.5" fill="#000" />
            <path
              fill="#fff"
              d="M108.5 0c57.47 0 106.01 50.592 108.414 113 2.406 62.408-46.133 113-108.414 113S-2.32 175.408.086 113 51.03 0 108.5 0m1.919 53.418c-5.071 0-7.102 1.627-8.628 3.253-1.528 1.627-1.546 7.59-2.058 8.675-.513 1.084-10.22 4.88-13.803 6.506-3.589 1.627-3.686 11.928-.115 14.096 1.496.908 3.54.771 5.636.503l.7-.092c2.682-.365 5.358-.776 7 .674l5.56 64.518q-11.8 2.07-13.677 3.795c-1.878 1.725-2.652 3.253-2.163 8.675q.49 5.422 7.885 6.506l40.655-4.88q4.185-3.253 4.122-8.674-.064-5.421-5.33-7.048h-9.447l-8.2-90c-1.035-5.422-3.067-6.507-8.137-6.507"
            />
          </g>
          <ellipse
            cx="200.009"
            cy="137.737"
            fill="#fff"
            filter="url(#a)"
            opacity=".453"
            rx="35.358"
            ry="40.635"
            transform="rotate(46 200.009 137.737)"
          />
          <path
            fill="#fff"
            d="M521 138q-57.745-59.67-101.34-81.12c-43.594-21.448-72.116-28.396-124.563-30.024s-69.499 11.086-111.368 30.025Q141.859 75.82 75 126.41q41.697-55.308 91.84-79.538C216.98 22.643 259.733 10 295.096 10s78.644 10.009 133.536 36.873Q483.525 73.737 521 138"
            filter="url(#b)"
            opacity=".773"
          />
          <path
            fill="#000"
            d="M361.057 44Q467.012 163.91 469.78 197.133c2.767 33.224 12.874 57.686-10.028 124.091s-44.333 86.6-76.528 119.339Q351.03 473.302 75 488.087 274.326 590 309.862 590q35.538 0 105.557-24.818 98.666-45.24 134.056-105.081c35.39-59.842 42.48-119.234 40.111-167.92s-7.22-95.866-34.305-119.866q-27.086-24-194.224-128.315"
            filter="url(#c)"
            opacity=".096"
          />
        </g>
        <script />
      </svg>
    }
  >
    One aims to make web + native with React and React Native much simpler, and
    faster.
  </Card>
)

const WakuCard = () => (
  <Card
    href="/registry/adapter-waku"
    title="Waku"
    icon={
      <div
        role="presentation"
        className="flex size-4 items-center justify-center"
      >
        ⛩️
      </div>
    }
  >
    The minimal React framework.
  </Card>
)
