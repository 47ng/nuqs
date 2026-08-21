'use client'

import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch'
import { KeyboardIcon, KeyboardOffIcon, RotateCcwIcon } from 'lucide-react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/src/components/ui/context-menu'
import {
  DEFAULT_THEME_SWITCHER_KEY,
  activeThemeSwitcherKey,
  formatThemeSwitcherKey,
  isAssignableThemeSwitcherKey,
  readThemeSwitcherSettings,
  resolveThemeSwitcherSettings,
  writeThemeSwitcherEnabled,
  writeThemeSwitcherKey,
  type ThemeSwitcherSettings
} from '@/src/lib/theme-switcher-key'

const CHANGE_EVENT = 'theme-switcher-key-change'
const serverSettings = resolveThemeSwitcherSettings(null, null)

function subscribeThemeSwitcherSettings(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

let cachedSettings = serverSettings

function readCachedSettings() {
  const next = readThemeSwitcherSettings(() => localStorage)
  if (
    next.key !== cachedSettings.key ||
    next.enabled !== cachedSettings.enabled
  ) {
    cachedSettings = next
  }
  return cachedSettings
}

function useThemeSwitcherSettings() {
  const settings = useSyncExternalStore(
    subscribeThemeSwitcherSettings,
    readCachedSettings,
    () => serverSettings
  )
  const update = useCallback((write: () => void) => {
    write()
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])
  const setKey = useCallback(
    (key: string) =>
      update(() => writeThemeSwitcherKey(() => localStorage, key)),
    [update]
  )
  const setEnabled = useCallback(
    (enabled: boolean) =>
      update(() => writeThemeSwitcherEnabled(() => localStorage, enabled)),
    [update]
  )
  return { settings, setKey, setEnabled }
}

function useNextKeyCapture(enabled: boolean, onKey: (key: string) => void) {
  useEffect(() => {
    if (!enabled) {
      return
    }
    const controller = new AbortController()
    window.addEventListener(
      'keydown',
      event => {
        if (!isAssignableThemeSwitcherKey(event.key)) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        controller.abort()
        onKey(event.key)
      },
      { capture: true, signal: controller.signal }
    )
    return () => controller.abort()
  }, [enabled, onKey])
}

function HotkeyStatus({ settings }: { settings: ThemeSwitcherSettings }) {
  if (!settings.enabled) {
    return 'Theme hotkey disabled'
  }
  return (
    <>
      Press <kbd>{formatThemeSwitcherKey(settings.key)}</kbd> to change themes
    </>
  )
}

export function ThemeToggleMenu() {
  const { settings, setKey, setEnabled } = useThemeSwitcherSettings()
  const [listening, setListening] = useState(false)
  const [open, setOpen] = useState(false)

  const assignKey = useCallback(
    (next: string) => {
      setKey(next)
      setListening(false)
      setOpen(false)
    },
    [setKey]
  )
  useNextKeyCapture(listening, assignKey)

  return (
    <ContextMenu
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) {
          setListening(false)
        }
      }}
    >
      <ContextMenuTrigger
        className="inline-flex"
        aria-keyshortcuts={activeThemeSwitcherKey(settings) ?? undefined}
      >
        <ThemeSwitch mode="light-dark" />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-fit">
        <ContextMenuLabel className="text-muted-foreground text-xs font-normal">
          <HotkeyStatus settings={settings} />
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={event => {
            event.preventDefault()
            setListening(true)
          }}
        >
          <KeyboardIcon />
          {listening ? 'Press a key…' : 'Change hotkey'}
        </ContextMenuItem>
        {settings.enabled ? (
          <ContextMenuItem onSelect={() => setEnabled(false)}>
            <KeyboardOffIcon />
            Disable hotkey
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={() => setEnabled(true)}>
            <KeyboardIcon />
            Enable hotkey
          </ContextMenuItem>
        )}
        {settings.key !== DEFAULT_THEME_SWITCHER_KEY && (
          <ContextMenuItem onSelect={() => setKey(DEFAULT_THEME_SWITCHER_KEY)}>
            <RotateCcwIcon />
            Reset hotkey ({formatThemeSwitcherKey(DEFAULT_THEME_SWITCHER_KEY)})
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
