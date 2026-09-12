'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { QuerySpy } from '@/src/components/query-spy'
import { ContainerQueryHelper } from '@/src/components/responsive-helpers'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { cn } from '@/src/lib/utils'
import { createParser, useQueryState } from 'nuqs'
import React from 'react'
import * as S from 'sury'

function createSuryParser<Output>(schema: S.Schema<string, Output>) {
  return createParser<Output>({
    parse: S.parseOrThrow(schema),
    serialize: S.encodeOrThrow(schema),
    eq: S.isEqualOutput(schema)
  })
}

const userSchema = S.schema({
  name: S.string.with(S.nonEmpty),
  age: S.int32.with(S.gte, 1)
})

const schema = S.base64url.with(S.to, S.jsonString).with(S.to, userSchema)
const parser = createSuryParser(schema).withDefault({
  name: 'John Vim',
  age: 25
})

type DemoContainerProps = React.ComponentProps<'section'> & {
  demoKey: string
}

function DemoContainer({
  children,
  className,
  demoKey,
  ...props
}: DemoContainerProps) {
  return (
    <section
      className={cn(
        'not-prose flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-2',
        className
      )}
      {...props}
    >
      <QuerySpy className="rounded-md" keepKeys={[demoKey]} />
      {children}
      <ContainerQueryHelper />
    </section>
  )
}

export function SuryDemo() {
  const [user, setUser] = useQueryState('suryUser', parser)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    if (!name) {
      setUser(null) // S.nonEmpty would reject an empty name
      return
    }
    setUser({ name, age: user.age })
  }

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const age = parseInt(e.target.value)
    if (!age || age < 1) {
      return // S.gte(1) would reject it
    }
    setUser({ name: user.name, age })
  }

  return (
    <DemoContainer className="flex-col items-stretch gap-4" demoKey="suryUser">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-2">
          <Label htmlFor="sury-user-name">Name</Label>
          <input
            id="sury-user-name"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            value={user.name}
            onChange={handleNameChange}
            placeholder="Enter your name..."
            autoComplete="off"
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="sury-user-age">Age (positive integer)</Label>
          <input
            id="sury-user-age"
            type="number"
            min="1"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            value={user.age}
            onChange={handleAgeChange}
            placeholder="Enter your age..."
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 lg:flex-row">
        <CodeBlock
          title="Parsed User Object"
          code={JSON.stringify(user, null, 2)}
          className="flex-1"
          allowCopy={false}
        />
        <Button variant="secondary" onClick={() => setUser(null)}>
          Clear
        </Button>
      </div>
    </DemoContainer>
  )
}
