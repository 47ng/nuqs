import React from 'react'

export function FeatureGrid(props: React.ComponentProps<'section'>) {
  return (
    <section
      className="container relative grid grid-cols-1 gap-x-12 gap-y-24 px-4 py-24 md:grid-cols-2 xl:grid-cols-3"
      {...props}
    />
  )
}

// --

type FeatureProps = {
  title: React.ReactNode
  description: React.ReactNode
  icon: React.ReactNode
  isNew?: boolean
}

export function Feature({ title, description, icon, isNew }: FeatureProps) {
  // https://v0.dev/t/xXdcvuFkW1d
  return (
    <>
      <div className="space-y-4 xl:space-y-8">
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden role="presentation">
            {icon}
          </span>
          <h3 className="text-2xl font-bold tracking-tighter dark:text-white md:text-3xl xl:text-4xl">
            {title}
            {isNew && (
              <sup className="ml-2" aria-label="New feature">
                ✨
              </sup>
            )}
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-300 md:text-lg/relaxed xl:text-xl/relaxed">
          {description}
        </p>
      </div>
    </>
  )
}
