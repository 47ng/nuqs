'use client'

import { Button } from '@/src/components/ui/button'
import { revalidateBlogOpenGraphImages } from './actions'

export function RevalidateBlogOpenGraphImages() {
  // This component is used to trigger revalidation of the blog Open Graph images.
  // It can be used in client components to ensure that the images are up-to-date.
  // The revalidation is handled by the server action defined in `actions.ts`.
  return (
    <form action={revalidateBlogOpenGraphImages}>
      <Button type="submit" variant="destructive">
        Revalidate Blog Open Graph Images
      </Button>
    </form>
  )
}
