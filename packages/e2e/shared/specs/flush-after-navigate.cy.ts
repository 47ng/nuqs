import { createTest } from '../create-test'
import { expectPathname } from '../lib/assertions'
import { getUrl } from './flush-after-navigate.defs'

export const testFlushAfterNavigate = createTest(
  'Flush after navigate',
  ({ path }) => {
    it('should apply pending search params after navigation', () => {
      cy.visit(getUrl(path + '/start', { debounce: 200 }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#test').click()
      cy.get('a').click()
      expectPathname(path + '/end')
      cy.get('#client-state').should('have.text', 'pass')
      cy.location('search').should('be.empty')
      cy.location('search').should('eq', '?test=pass') // Then it flushes
    })
    it('should apply pending search params on top of existing link state in navigation', () => {
      cy.visit(getUrl(path + '/start', { debounce: 200, linkState: 'nav' }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#test').click()
      cy.get('a').click()
      expectPathname(path + '/end')
      cy.get('#client-state').should('have.text', 'pass')
      cy.location('search').should('eq', '?test=nav')
      cy.location('search').should('eq', '?test=pass') // Then it flushes
    })
    it('should apply pending search params queued while throttled after navigation', () => {
      cy.visit(getUrl(path + '/start', { throttle: 200 }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#preflush').click() // Trigger an immediate flush to enable the throttling queue
      cy.get('#test').click() // Queue the change
      cy.get('a').click() // Navigate
      expectPathname(path + '/end')
      cy.get('#client-state').should('have.text', 'pass')
      cy.location('search').should('be.empty')
      cy.location('search').should('eq', '?test=pass') // Then it flushes again
    })
    it('should apply pending search params queued while throttled after navigation with link state', () => {
      cy.visit(getUrl(path + '/start', { throttle: 200, linkState: 'nav' }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#preflush').click() // Trigger an immediate flush to enable the throttling queue
      cy.get('#test').click() // Queue the change
      cy.get('a').click() // Navigate
      expectPathname(path + '/end')
      cy.get('#client-state').should('have.text', 'pass')
      cy.location('search').should('eq', '?test=nav')
      cy.location('search').should('eq', '?test=pass') // Then it flushes again
    })
  }
)
