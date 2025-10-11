'use client'

import * as Sentry from '@sentry/nextjs'

export function PromiseRejectionError() {
  const handleAsyncError = async () => {
    // This will create an unhandled promise rejection
    // We need to capture it explicitly with Sentry since unhandled rejections
    // might not be caught by error boundaries
    try {
      await Promise.reject(
        new Error('Test promise rejection for Sentry integration')
      )
    } catch (error) {
      // Explicitly capture the error with Sentry
      Sentry.captureException(error)
      throw error
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">Test: Promise Rejection</h3>
      <p className="mb-4 text-sm text-gray-600">
        This component rejects a Promise when the button is clicked.
      </p>
      <button
        onClick={handleAsyncError}
        className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
      >
        Trigger Promise Rejection
      </button>
    </div>
  )
}
