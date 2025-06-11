'use client'

import { useQueryStates } from 'nuqs'
import { searchParams } from '../searchParams'

export function Client() {
  const [{ name, count }, setSearchParams] = useQueryStates(searchParams, {
    shallow: false
  })
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Client-Side Search Params</h2>
      <p>Hello, {name || 'anonymous visitor'}!</p>
      <input
        className="border border-gray-300 rounded px-4 py-2"
        type="text"
        value={name}
        onChange={e => setSearchParams({ name: e.target.value })}
        placeholder="Enter your name"
      />
      <button
        className="rounded-full bg-blue-500 text-white px-4 py-2 hover:bg-blue-600"
        onClick={() => setSearchParams(prev => ({ count: prev.count + 1 }))}
      >
        {count}
      </button>
      <button onClick={() => setSearchParams(null)} className="text-red-500">
        Reset
      </button>
    </div>
  )
}
