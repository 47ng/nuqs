import { createTest } from '../create-test'
import { expectPathname } from '../lib/assertions'
import { getUrl } from './flush-after-navigate.defs'

export const testFlushAfterNavigate = createTest(
  'Flush after navigate',
  ({ path }) => {
    const timeMs = 200
    it('should not apply pending search params after navigation', () => {
      cy.visit(getUrl(path + '/start', { debounce: timeMs }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      function runTest() {
        cy.get('#test').click()
        cy.get('a').click()
        expectPathname(path + '/end')
        cy.get('#client-state').should('be.empty')
        cy.location('search').should('be.empty')
        cy.wait(timeMs)
        cy.get('#client-state').should('be.empty')
        cy.location('search').should('be.empty')
      }
      runTest()
      cy.go('back')
      runTest()
    })
    it('should not apply pending search params on top of existing link state when navigating to another page', () => {
      cy.visit(getUrl(path + '/start', { debounce: timeMs, linkState: 'nav' }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      function runTest() {
        cy.get('#test').click()
        cy.get('a').click()
        expectPathname(path + '/end')
        cy.get('#client-state').should('have.text', 'nav')
        cy.location('search').should('eq', '?test=nav')
        cy.wait(timeMs)
        cy.get('#client-state').should('have.text', 'nav')
        cy.location('search').should('eq', '?test=nav')
      }
      runTest()
      cy.go('back')
      runTest()
    })
    it('should not apply pending search params on top of existing link state when navigating to the same page', () => {
      cy.visit(
        getUrl(path + '/start', {
          debounce: timeMs,
          linkPath: '/start',
          linkState: 'nav'
        })
      )
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      function runTest() {
        cy.get('#test').click()
        cy.get('a').click()
        expectPathname(path + '/start')
        cy.location('search').should('eq', '?test=nav')
        cy.get('#client-state').should('have.text', 'nav')
        cy.wait(timeMs)
        cy.get('#client-state').should('have.text', 'nav')
        cy.location('search').should('eq', '?test=nav')
      }
      runTest()
      cy.go('back')
      runTest()
    })
    it('should not apply pending search params queued while throttled after navigation', () => {
      cy.visit(getUrl(path + '/start', { throttle: timeMs }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      function runTest() {
        cy.get('#preflush').click() // Trigger an immediate flush to enable the throttling queue
        cy.get('#test').click() // Queue the change
        cy.get('a').click() // Navigate
        expectPathname(path + '/end')
        cy.get('#client-state').should('be.empty')
        cy.location('search').should('be.empty')
        cy.wait(timeMs)
        cy.get('#client-state').should('be.empty')
        cy.location('search').should('be.empty')
      }
      runTest()
      cy.go('back')
      runTest()
    })
    it('should not apply pending search params queued while throttled after navigation with link state', () => {
      cy.visit(getUrl(path + '/start', { throttle: timeMs, linkState: 'nav' }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      function runTest() {
        cy.get('#preflush').click() // Trigger an immediate flush to enable the throttling queue
        cy.get('#test').click() // Queue the change
        cy.get('a').click() // Navigate
        cy.get('#client-state').should('have.text', 'nav')
        cy.location('search').should('eq', '?test=nav')
        cy.wait(timeMs)
        cy.get('#client-state').should('have.text', 'nav')
        cy.location('search').should('eq', '?test=nav')
      }
      runTest()
      cy.go('back')
      runTest()
    })
  }
)
