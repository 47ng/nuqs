import { NextResponse } from 'next/server'
import { crawlDependents } from '../../(pages)/_landing/dependents/crawler'

export const revalidate = 86_400 // 24 hours

export async function GET() {
  const dependents = await crawlDependents()
  return NextResponse.json(dependents)
}
