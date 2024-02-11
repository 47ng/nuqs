import { Download } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { fetchNpmPackage } from '../lib/npm'
import { SvgCurveGraph } from './svg-curve-graph'

type DownloadsGraphProps = React.ComponentProps<'section'> & {}

const formatter = new Intl.NumberFormat('en-GB', {
  compactDisplay: 'short',
  notation: 'compact'
})

export async function DownloadsGraph({
  className,
  ...props
}: DownloadsGraphProps) {
  const [nuqs, nextUseQueryState] = await Promise.all([
    fetchNpmPackage('nuqs'),
    fetchNpmPackage('next-usequerystate')
  ])
  const last30Days = nuqs.last30Days.reduce((acc, x, i) => {
    acc[i] = x + nextUseQueryState.last30Days[i]
    return acc
  }, [] as number[])
  const totalDownloads = nuqs.allTime + nextUseQueryState.allTime
  return (
    <section className={twMerge('relative', className)} {...props}>
      <SvgCurveGraph
        data={last30Days}
        lastDate={nuqs.lastDate}
        height={200}
        summaryValue={last30Days.reduce((sum, x) => sum + x)}
        className="text-red-500"
      />
      <p className="absolute left-2 top-2 flex items-center gap-2 text-2xl font-semibold tabular-nums md:text-6xl">
        <Download
          aria-label="NPM package downloads"
          className="inline-block md:h-12 md:w-12"
        />{' '}
        {formatter.format(totalDownloads)}
      </p>
    </section>
  )
}
