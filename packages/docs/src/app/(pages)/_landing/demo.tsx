import { CodeBlock } from '@/src/components/code-block'
import fs from 'node:fs/promises'
import { Suspense } from 'react'
import { Demo } from './demo.client'

export async function LandingDemo() {
  const demoFilePath =
    process.cwd() + '/src/app/(pages)/_landing/demo.client.tsx'
  const demoFile = await fs.readFile(demoFilePath, 'utf8')
  const demoCode = demoFile
    .split('\n')
    .filter(
      line =>
        !line.includes('className="') && !line.includes('data-interacted=')
    )
    .join('\n')
  return (
    <>
      <Suspense
        fallback={
          <div className="mb-4 h-[136px] animate-pulse rounded bg-zinc-50 dark:bg-zinc-900 sm:h-10" />
        }
      >
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Demo />
          <LookAtTheURL />
        </div>
      </Suspense>
      <CodeBlock code={demoCode} />
    </>
  )
}

function LookAtTheURL() {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 270.7398884431316 71.55654506560859"
      className="pointer-events-none absolute -top-20 left-0 right-0 mx-auto w-64 select-none opacity-0 transition-opacity peer-data-[interacted=true]:opacity-100 sm:left-16 sm:right-auto sm:mx-0 xl:-left-72 xl:-top-6 xl:mx-0"
      // width="541.4797768862632"
      // height="143.11309013121718"
    >
      <text
        x="84.43988539137376"
        y="33.319640699669435"
        className="font-medium italic"
        fontSize="20px"
        fill="currentColor"
        direction="ltr"
        dominantBaseline="text-before-edge"
      >
        Look at the URL!
      </text>
      <g strokeLinecap="round" className="opacity-50">
        <path
          d="M72 50c-3 2-11 10-18 11s-17 1-23-3c-6-3-10-8-14-16-3-8-6-27-7-32m62 40c-3 2-11 10-18 11s-17 1-23-3c-6-3-10-8-14-16-3-8-6-27-7-32"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          strokeDasharray="3 4"
        />
        <path
          d="m18 24-8-14m8 14-8-14"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="m7 26 3-16M7 26l3-16"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </g>
    </svg>
  )
}
