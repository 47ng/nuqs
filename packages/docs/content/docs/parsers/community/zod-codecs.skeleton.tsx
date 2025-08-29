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
    <Card className={cn('border-dashed', className)} {...props}>
      <CardHeader>
        <CardTitle>Zod Codecs Demo</CardTitle>
        <CardDescription>
          This demo shows how Zod codecs can transform complex data structures
          into URL-safe strings using base64url encoding and JSON serialization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}
