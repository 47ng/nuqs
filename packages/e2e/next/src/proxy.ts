import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/app/multitenant', '/pages/multitenant']
}

export default async function proxy(req: NextRequest) {
  // https://media1.tenor.com/m/YrcMb6KRczsAAAAC/doctor-who-dr-who.gif
  const tenant = 'david'
  const pathname = req.nextUrl.pathname
  if (pathname === '/app/multitenant') {
    const url = new URL(
      `${req.nextUrl.basePath}/app/multitenant/${tenant}`,
      req.url
    )
    url.search = req.nextUrl.search
    return NextResponse.rewrite(url)
  }
  if (pathname === '/pages/multitenant') {
    const url = new URL(
      `${req.nextUrl.basePath}/pages/multitenant/${tenant}`,
      req.url
    )
    url.search = req.nextUrl.search
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}
