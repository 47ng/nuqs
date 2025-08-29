'use client'

import { CodeBlock } from '@/src/components/code-block.client'
import { QuerySpy } from '@/src/components/query-spy'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Dices } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { userJsonBase64Parser } from './zod-codecs.lib'
import { ZodCodecsDemoSkeleton } from './zod-codecs.skeleton'

export function ZodCodecsDemo() {
  const [user, setUser] = useQueryState(
    'user',
    userJsonBase64Parser.withDefault({
      name: 'John Doe',
      age: 42
    })
  )

  const handleReset = () => {
    setUser({
      name: 'John Doe',
      age: 42
    })
  }

  const handleRandomize = () => {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank']
    const randomName = names[Math.floor(Math.random() * names.length)]
    const randomAge = Math.floor(Math.random() * 50) + 18
    setUser({
      name: randomName,
      age: randomAge
    })
  }

  return (
    <ZodCodecsDemoSkeleton>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="user-name">Name</Label>
          <Input
            id="user-name"
            value={user.name}
            placeholder="Enter your name..."
            onChange={e => setUser(old => ({ ...old, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-age">Age</Label>
          <Input
            id="user-age"
            type="number"
            min="1"
            max="120"
            value={user.age}
            onChange={e =>
              setUser(old => ({
                ...old,
                age: Number(e.target.valueAsNumber) || 0
              }))
            }
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleRandomize}>
          <Dices size={18} className="mr-2 inline-block" role="presentation" />
          Randomize
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Current Data:</Label>
          <CodeBlock
            code={JSON.stringify(user, null, 2)}
            lang="json"
            className="mt-2"
            allowCopy={false}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Label className="text-sm font-medium">Encoded in URL:</Label>
          </div>
          <QuerySpy keepKeys={['user']} />
        </div>

        <div className="text-muted-foreground space-y-1 text-xs">
          <p>
            <strong>How it works:</strong>
          </p>
          <ol className="ml-2 list-inside list-decimal space-y-1">
            <li>User object is JSON stringified</li>
            <li>JSON string is encoded as UTF-8 bytes</li>
            <li>Bytes are encoded as base64url string</li>
            <li>Result is stored in the URL query parameter</li>
          </ol>
        </div>
      </div>
    </ZodCodecsDemoSkeleton>
  )
}
