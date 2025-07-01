import { createFileRoute } from '@tanstack/react-router'
import { PrettyUrls } from 'e2e-shared/specs/pretty-urls'

export const Route = createFileRoute('/pretty-urls')({
  component: PrettyUrls
})
