import { QuerySpy } from '../../../components/query-spy'

export default function E2EPageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <QuerySpy />
      {children}
    </>
  )
}
