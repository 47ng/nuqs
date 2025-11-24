import type { SandpackFiles } from '@codesandbox/sandpack-react'
import {
  APP_COMPONENT,
  INDEX_COMPONENT,
  QUERY_SPY_COMPONENT,
  QUERYSTRING_COMPONENT,
} from './components'

/**
 * Base Sandpack files required for all demos
 * These files provide the runtime environment and URL sync functionality
 */
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
