'use client'

import { cn } from '@/src/lib/utils'
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import { ComponentProps, ReactNode, useEffect, useState } from 'react'

type CountdownProps = ComponentProps<'div'> & {
  targetDate: Date
  expiredMessage?: ReactNode
}

export function Countdown({
  targetDate,
  expiredMessage = null,
  className,
  ...props
}: CountdownProps) {
  const remaining = targetDate.getTime() - Date.now()
  const [days, setDays] = useState(() =>
    Math.floor(remaining / 1000 / 60 / 60 / 24)
  )
  const [hours, setHours] = useState(
    () => Math.floor(remaining / 1000 / 60 / 60) % 24
  )
  const [minutes, setMinutes] = useState(
    () => Math.floor(remaining / 1000 / 60) % 60
  )
  const [seconds, setSeconds] = useState(() =>
    Math.floor((remaining / 1000) % 60)
  )

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = targetDate.getTime() - Date.now()
      setDays(Math.floor(remaining / 1000 / 60 / 60 / 24))
      setHours(Math.floor(remaining / 1000 / 60 / 60) % 24)
      setMinutes(Math.floor(remaining / 1000 / 60) % 60)
      setSeconds(Math.floor((remaining / 1000) % 60))
      if (remaining <= 0) {
        clearInterval(timer)
      }
    }, 500)

    return () => clearInterval(timer)
  }, [targetDate])

  if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0) {
    return expiredMessage
  }

  return (
    <div
      className={cn(
        'flex items-baseline justify-center font-bold',
        days > 0 ? 'gap-1 text-xl' : 'text-3xl',
        className
      )}
      title={targetDate.toISOString()}
      {...props}
    >
      <NumberFlowGroup>
        {days > 0 && (
          <NumberFlow
            trend={-1}
            value={days}
            className="&::part(suffix):text-gray-400 tabular-nums"
            suffix="d"
          />
        )}
        <NumberFlow
          trend={-1}
          value={hours}
          className={'tabular-nums'}
          suffix={days > 0 ? 'h' : undefined}
          digits={{ 1: { max: 2 } }}
          format={{ minimumIntegerDigits: 2 }}
        />
        <NumberFlow
          trend={-1}
          value={minutes}
          className="tabular-nums"
          prefix={days > 0 ? undefined : ':'}
          suffix={days > 0 ? 'm' : undefined}
          digits={{ 1: { max: 5 } }}
          format={{ minimumIntegerDigits: 2 }}
        />
        <NumberFlow
          trend={-1}
          value={seconds}
          className="tabular-nums"
          prefix={days > 0 ? undefined : ':'}
          suffix={days > 0 ? 's' : undefined}
          digits={{ 1: { max: 5 } }}
          format={{ minimumIntegerDigits: 2 }}
        />
      </NumberFlowGroup>
    </div>
  )
}
