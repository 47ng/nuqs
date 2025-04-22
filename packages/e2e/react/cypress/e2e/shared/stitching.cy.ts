/// <reference types="cypress" />

import { testStitching } from 'e2e-shared/specs/stitching.cy'

testStitching({
  path: '/stitching',
  enableShallowFalse: Cypress.env('fullPageNavOnShallowFalse') === false
})
