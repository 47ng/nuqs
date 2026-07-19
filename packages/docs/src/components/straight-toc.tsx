'use client'

import { cn } from '@/src/lib/utils'
import * as Primitive from 'fumadocs-core/toc'
import { TOCScrollArea, useTOCItems } from 'fumadocs-ui/components/toc'
import type { TOCProps } from 'fumadocs-ui/layouts/notebook/page/slots/toc'
import { Text } from 'lucide-react'

/*
  Straight-rail table of contents. fumadocs-ui 16.11 draws the TOC
  thumb as an SVG path that bends around indentation levels (in both
  its `normal` and `clerk` styles); this replaces the list with the
  classic straight left border while keeping the upstream container
  (sticky positioning, scroll area, header and footer slots).
*/
export function StraightTOC({ container, header, footer }: TOCProps) {
  const items = useTOCItems()
  if (items.length === 0 && !footer && !header) {
    return (
      <div
        id="nd-toc-placeholder"
        className="hidden xl:layout:[--fd-toc-width:268px]"
      />
    )
  }
  return (
    <div
      id="nd-toc"
      {...container}
      className={cn(
        'sticky top-(--fd-docs-row-3) [grid-area:toc] h-[calc(var(--fd-docs-height)-var(--fd-docs-row-3))] flex flex-col w-(--fd-toc-width) pt-12 pe-4 pb-2 xl:layout:[--fd-toc-width:268px] max-xl:hidden',
        container?.className
      )}
    >
      {header}
      <h3
        id="toc-title"
        className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground"
      >
        <Text className="size-4" />
        On this page
      </h3>
      <TOCScrollArea>
        <div className="flex flex-col border-s border-fd-foreground/10">
          {items.map(item => (
            <Primitive.TOCItem
              key={item.url}
              href={item.url}
              className="py-1.5 text-sm text-fd-muted-foreground transition-colors [overflow-wrap:anywhere] first:pt-0 last:pb-0 data-[active=true]:text-fd-primary"
              style={{
                paddingInlineStart: 12 * Math.max(item.depth - 1, 1)
              }}
            >
              {item.title}
            </Primitive.TOCItem>
          ))}
        </div>
      </TOCScrollArea>
      {footer}
    </div>
  )
}
