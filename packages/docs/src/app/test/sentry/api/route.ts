import { NextResponse } from 'next/server'

export async function GET() {
  // This endpoint intentionally throws an error to test Sentry integration
  throw new Error('Test API error for Sentry integration')

  // This line is unreachable but included to satisfy type checking
  return NextResponse.json({ status: 'ok' })
}
