import { Star } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { getStarHistory } from '../lib/github'
import { SvgCurveGraph } from './svg-curve-graph'

type StarHistoryGraphProps = React.ComponentProps<'section'> & {}

export async function StarHistoryGraph({
  className,
  ...props
}: StarHistoryGraphProps) {
  const stars = await getStarHistory()
  return (
    <section className={twMerge('relative', className)} {...props}>
      <SvgCurveGraph
        data={stars.bins.map(bin => bin.stars).toReversed()}
        lastDate={stars.bins[0].date}
        height={200}
        summaryValue={stars.count}
        className="text-yellow-500"
      />
      <p className="absolute left-2 top-2 flex items-center gap-2 text-2xl font-semibold tabular-nums md:text-6xl">
        <Star
          aria-label="Star count"
          className="inline-block md:h-12 md:w-12"
        />{' '}
        {stars.count}
      </p>
    </section>
  )
}
