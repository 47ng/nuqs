'use client'

import { Label } from '@/src/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group'
import { useQueryStates } from 'nuqs'
import {
  RenderingOptions,
  renderingOptions,
  usePaginationControls
} from './search-params'

export function RenderingControls() {
  const [{ renderOn, delay }, setControls] = usePaginationControls()
  return (
    <nav className="not-prose">
      <ul className="space-y-2">
        <li className="flex items-center justify-between sm:justify-start">
          <Label className="w-48">Pagination controls</Label>
          <ToggleGroup
            type="single"
            className="justify-start"
            value={renderOn}
            onValueChange={value =>
              setControls({
                renderOn: renderingOptions.includes(value as RenderingOptions)
                  ? (value as RenderingOptions)
                  : null
              })
            }
          >
            <ToggleGroupItem size="sm" value="server">
              Server
            </ToggleGroupItem>
            <ToggleGroupItem size="sm" value="client">
              Client
            </ToggleGroupItem>
          </ToggleGroup>
        </li>
        <li className="flex items-center justify-between sm:justify-start">
          <Label className="w-48">Fake fetch delay</Label>
          <ToggleGroup
            type="single"
            className="justify-start"
            value={delay.toFixed()}
            onValueChange={value =>
              setControls({
                delay: value && value !== '0' ? parseInt(value) : null
              })
            }
          >
            <ToggleGroupItem size="sm" value="0">
              None
            </ToggleGroupItem>
            <ToggleGroupItem size="sm" value="100">
              100ms
            </ToggleGroupItem>
            <ToggleGroupItem size="sm" value="500">
              500ms
            </ToggleGroupItem>
            <ToggleGroupItem size="sm" value="1000">
              1s
            </ToggleGroupItem>
          </ToggleGroup>
        </li>
      </ul>
    </nav>
  )
}
