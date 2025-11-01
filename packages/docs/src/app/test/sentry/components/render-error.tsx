'use client'

import { useState } from 'react'

export function RenderError() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    // This will throw an error during render
    throw new Error('Test render error for Sentry integration')
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">Test: Render Error</h3>
      <p className="mb-4 text-sm text-gray-600">
        This component throws an error during render when the button is clicked.
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Trigger Render Error
      </button>
    </div>
  )
}
