'use client'

export function EventHandlerError() {
  const handleClick = () => {
    // This will throw an error in the event handler
    throw new Error('Test event handler error for Sentry integration')
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">Test: Event Handler Error</h3>
      <p className="mb-4 text-sm text-gray-600">
        This component throws an error in the onClick event handler.
      </p>
      <button
        onClick={handleClick}
        className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
      >
        Trigger Event Handler Error
      </button>
    </div>
  )
}
