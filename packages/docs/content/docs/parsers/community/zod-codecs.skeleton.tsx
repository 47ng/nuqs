import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/src/components/ui/card'
import { cn } from '@/src/lib/utils'
import type { ComponentProps } from 'react'

export function ZodCodecsDemoSkeleton({
  children,
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <Card className={cn('border-dashed py-4', className)} {...props}>
      <CardHeader className="px-4">
        <CardTitle className="text-xl">Zod Codecs Demo</CardTitle>
        <CardDescription>
          This demo shows how Zod codecs can transform complex data structures
          into URL-safe strings using base64url encoding and JSON serialization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-4">{children}</CardContent>
    </Card>
  )
}
