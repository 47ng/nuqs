import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'

expect.extend(matchers)

// https://testing-library.com/docs/react-testing-library/api/#cleanup
afterEach(cleanup)
