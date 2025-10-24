'use client'

import * as Sentry from '@sentry/nextjs'
import { Component, useState, type ReactNode } from 'react'
import { EventHandlerError } from './components/event-handler-error'
import { PromiseRejectionError } from './components/promise-rejection-error'
import { RenderError } from './components/render-error'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4">
          <h3 className="mb-2 font-semibold text-red-800">
            Error Caught by Error Boundary
          </h3>
          <p className="mb-2 text-sm text-red-700">
            <strong>Message:</strong> {this.state.error.message}
          </p>
          <button
            onClick={this.resetError}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function SentryTestPage() {
  const [apiResult, setApiResult] = useState<string>('')

  const testApiError = async () => {
    setApiResult('Loading...')
    try {
      const response = await fetch('/test/sentry/api')
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      setApiResult('API call succeeded (unexpected)')
    } catch (error) {
      setApiResult(
        `API Error: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Sentry Integration Tests</h1>
      <p className="mb-8 text-gray-600">
        This page contains various components and API routes to test Sentry
        error tracking. Each test case represents a different error scenario.
      </p>

      <div className="space-y-6">
        {/* API Route Error Test */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">Test: API Route Error</h3>
          <p className="mb-4 text-sm text-gray-600">
            This calls a GET endpoint that throws an error on the server.
          </p>
          <button
            onClick={testApiError}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Call API Endpoint
          </button>
          {apiResult && (
            <p className="mt-2 text-sm text-gray-700">
              <strong>Result:</strong> {apiResult}
            </p>
          )}
        </div>

        {/* Render Error Test (wrapped in ErrorBoundary) */}
        <ErrorBoundary>
          <RenderError />
        </ErrorBoundary>

        {/* Event Handler Error Test */}
        <EventHandlerError />

        {/* Promise Rejection Test */}
        <PromiseRejectionError />
      </div>

      <div className="mt-8 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-2 font-semibold">Instructions</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>Click each button to trigger different types of errors</li>
          <li>
            Check your Sentry dashboard to verify the errors are being captured
          </li>
          <li>
            Each error should appear with appropriate context and stack traces
          </li>
          <li>The render error will be caught by an Error Boundary</li>
          <li>
            Event handler and promise errors will propagate to Sentry's global
            handlers
          </li>
        </ul>
      </div>
    </div>
  )
}
