/// <reference types="cypress" />

it('Reproduction for issue #599', () => {
  // Start without encoding for most characters
  cy.visit(
    '/app/repro-599?a %26b%3Fc%3Dd%23e%f%2Bg"h\'i`j<k>l(m)n*o,p.q:r;s/t=init'
  )
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('input').should('have.value', 'init')
  cy.get('p').should('have.text', 'init')
  cy.get('button').click()
  cy.get('input').should('have.value', 'works')
  cy.get('p').should('have.text', 'works')
  cy.location('search').should(
    'eq',
    '?a%20%26b%3Fc%3Dd%23e%f%2Bg%22h%27i`j%3Ck%3El(m)n*o,p.q:r;s/t=works'
  )
})
