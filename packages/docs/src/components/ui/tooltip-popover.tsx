// Tooltip on desktop, Popover on touch devices
// Source: https://github.com/shadcn-ui/ui/issues/2402#issuecomment-1930895113

'use client'

import {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps
} from '@radix-ui/react-popover'
import {
  TooltipContentProps,
  TooltipProps,
  TooltipTriggerProps
} from '@radix-ui/react-tooltip'
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

const TouchContext = createContext<boolean>(false)
const useTouch = () => useContext(TouchContext)

export const TouchProvider = (props: PropsWithChildren) => {
  const [isTouch, setTouch] = useState(false)
  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])
  return <TouchContext.Provider value={isTouch} {...props} />
}

export const TooltipPopover = (props: TooltipProps & PopoverProps) => {
  return (
    <TouchProvider>
      <TooltipPopoverRoot {...props} />
    </TouchProvider>
  )
}

export const TooltipPopoverRoot = (props: TooltipProps & PopoverProps) => {
  const isTouch = useTouch()
  return isTouch ? <Popover {...props} /> : <Tooltip {...props} />
}

export const TooltipPopoverTrigger = (
  props: TooltipTriggerProps & PopoverTriggerProps
) => {
  const isTouch = useTouch()
  return isTouch ? <PopoverTrigger {...props} /> : <TooltipTrigger {...props} />
}

export const TooltipPopoverContent = (
  props: TooltipContentProps & PopoverContentProps
) => {
  const isTouch = useTouch()
  return isTouch ? <PopoverContent {...props} /> : <TooltipContent {...props} />
}
