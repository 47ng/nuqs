import type { SandpackFiles } from '@codesandbox/sandpack-react'
import {
  APP_COMPONENT,
  INDEX_COMPONENT,
  QUERY_SPY_COMPONENT,
  QUERYSTRING_COMPONENT,
} from './components'

// Main exports - these are the primary public API
export const SANDPACK_FILES: SandpackFiles = {
  '/App.tsx': {
    code: APP_COMPONENT,
    hidden: true,
  },
  '/QuerySpy.tsx': {
    code: QUERY_SPY_COMPONENT,
    hidden: true,
  },
  '/querystring.tsx': {
    code: QUERYSTRING_COMPONENT,
    hidden: true,
  },
  '/index.tsx': {
    code: INDEX_COMPONENT,
    hidden: true,
  },
}

// Component exports - available if needed for customization
export {
  INITIAL_CODE,
  APP_COMPONENT,
  INDEX_COMPONENT,
  QUERY_SPY_COMPONENT,
  QUERYSTRING_COMPONENT,
} from './components'
