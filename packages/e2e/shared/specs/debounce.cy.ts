import { createTest } from '../create-test'
import { getUrl } from './debounce.defs'

export const testDebounce = createTest('Debounce', ({ path }) => {
  it('should debounce the input', () => {
    const DEBOUNCE_TIME = 200
    cy.visit(getUrl(path, { debounceTime: DEBOUNCE_TIME }))
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('input[type="text"]').type('pass')
    cy.get('#client-state').should(
      'have.text',
      '{"search":"pass","pageIndex":0}'
    )
    cy.get('#server-state').should('have.text', '{"search":"","pageIndex":0}')
    cy.location('search').should('eq', `?debounceTime=${DEBOUNCE_TIME}`)
    cy.wait(DEBOUNCE_TIME)
    cy.location('search').should('eq', `?debounceTime=${DEBOUNCE_TIME}&q=pass`)
    cy.get('#server-state').should(
      'have.text',
      '{"search":"pass","pageIndex":0}'
    )
    cy.get('#client-state').should(
      'have.text',
      '{"search":"pass","pageIndex":0}'
    )
  })
  it('should debounce the input while allowing the page index to increment', () => {
    const DEBOUNCE_TIME = 400
    cy.visit(getUrl(path, { debounceTime: DEBOUNCE_TIME }))
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('input[type="text"]').type('pass')
    cy.get('button#increment-page-index').click().click().click()
    cy.get('#client-state').should(
      'have.text',
      '{"search":"pass","pageIndex":3}'
    )
    cy.location('search').should('eq', `?debounceTime=${DEBOUNCE_TIME}&page=3`)
    cy.get('#server-state').should('have.text', '{"search":"","pageIndex":3}')
    cy.wait(DEBOUNCE_TIME)
    cy.location('search').should(
      'eq',
      `?debounceTime=${DEBOUNCE_TIME}&page=3&q=pass`
    )
    cy.get('#server-state').should(
      'have.text',
      '{"search":"pass","pageIndex":3}'
    )
    cy.get('#client-state').should(
      'have.text',
      '{"search":"pass","pageIndex":3}'
    )
  })
})
