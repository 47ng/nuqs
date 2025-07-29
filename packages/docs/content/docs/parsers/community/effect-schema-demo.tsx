'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { QuerySpy } from '@/src/components/query-spy'
import { ContainerQueryHelper } from '@/src/components/responsive-helpers'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { cn } from '@/src/lib/utils'
import { createParser, useQueryState } from 'nuqs'
import React from 'react'
import { Schema, Either, Equal } from 'effect'

function createSchemaParser<T, E extends string>(schema: Schema.Schema<T, E>) {
  const encoder = Schema.encodeUnknownEither(schema)
  const decoder = Schema.decodeUnknownEither(schema)
  return createParser({
    parse: queryValue => {
      const result = decoder(queryValue)
      return Either.getOrNull(result)
    },
    serialize: value => {
      const result = encoder(value)
      return Either.getOrThrowWith(
        result,
        cause =>
          new Error(`Failed to encode value: ${value}`, {
            cause
          })
      )
    },
    eq: (a, b) => Equal.equals(a, b)
  })
}

class User extends Schema.Class<User>('User')({
  name: Schema.String,
  age: Schema.Positive
}) {}

const ToBase64UrlEncodedJson = Schema.compose(
  Schema.StringFromBase64Url,
  Schema.parseJson()
)
const schema = Schema.compose(ToBase64UrlEncodedJson, User)
const parser = createSchemaParser(schema).withDefault(
  new User({ name: 'John Vim', age: 25 })
)

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

export function EffectSchemaDemo() {
  const [user, setUser] = useQueryState('effectUser', parser)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    if (!name) {
      setUser(null)
      return
    }

    const currentAge = user?.age ?? 25
    setUser(new User({ name, age: currentAge }))
  }

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const age = parseInt(e.target.value)
    if (!age || age <= 0) {
      return // Positive constraint from schema
    }

    const currentName = user?.name ?? ''
    if (!currentName) {
      return // Need name to create valid User
    }

    setUser(new User({ name: currentName, age }))
  }

  return (
    <DemoContainer
      className="flex-col items-stretch gap-4"
      demoKey="effectUser"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-2">
          <Label htmlFor="user-name">Name</Label>
          <input
            id="user-name"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={user?.name ?? ''}
            placeholder="Enter your name..."
            onChange={handleNameChange}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="user-age">Age (positive integer)</Label>
          <input
            id="user-age"
            type="number"
            min="1"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={user?.age ?? ''}
            placeholder="Enter your age..."
            onChange={handleAgeChange}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 lg:flex-row">
        <CodeBlock
          title="Parsed User Object"
          code={user ? JSON.stringify(user, null, 2) : 'null'}
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
