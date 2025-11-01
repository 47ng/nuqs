import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // This endpoint intentionally throws an error to test Sentry integration
  throw new Error('Test API error for Sentry integration', {
    // Consuming the request object to make this route dynamic
    cause: request.headers
  })

  // This line is unreachable but included to satisfy type checking
  return NextResponse.json({ status: 'ok' })
}
