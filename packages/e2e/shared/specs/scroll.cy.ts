import { createTest } from '../create-test'

export const testScroll = createTest('scroll', ({ path }) => {
  it('does not scroll to the top of the page by default (scroll: false)', () => {
    cy.visit(path + '?scroll=false')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#not-at-the-top').should('be.visible')
    cy.get('button').click()
    cy.get('#not-at-the-top').should('be.visible')
  })
  it('scrolls to the top of the page when setting scroll: true', () => {
    cy.visit(path + '?scroll=true')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#not-at-the-top').should('be.visible')
    cy.get('button').click()
    cy.get('#at-the-top').should('be.visible')
  })
})
