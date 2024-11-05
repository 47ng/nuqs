/// <reference types="cypress" />

describe('Reproduction for issue #630', () => {
  it('works with useQueryState', () => {
    runTest('1')
  })
  it('works with useQueryStates', () => {
    runTest('3')
  })
})

function runTest(sectionToTry) {
  cy.visit('/app/repro-630')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#1-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#2-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#3-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#4-pre').should('have.text', '{"a":null,"b":null}')
  cy.get(`#${sectionToTry}-set`).click()
  cy.get('#1-pre').should('have.text', '{"a":"1","b":"2"}')
  cy.get('#2-pre').should('have.text', '{"a":"1","b":"2"}')
  cy.get('#3-pre').should('have.text', '{"a":"1","b":"2"}')
  cy.get('#4-pre').should('have.text', '{"a":"1","b":"2"}')
  cy.get(`#${sectionToTry}-clear`).click()
  cy.get('#1-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#2-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#3-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#4-pre').should('have.text', '{"a":null,"b":null}')
  cy.go('back')
  cy.get('#1-pre').should('have.text', '{"a":"1","b":"2"}')
  cy.get('#2-pre').should('have.text', '{"a":"1","b":"2"}')
  cy.get('#3-pre').should('have.text', '{"a":"1","b":"2"}')
  cy.get('#4-pre').should('have.text', '{"a":"1","b":"2"}')
  cy.go('back')
  cy.get('#1-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#2-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#3-pre').should('have.text', '{"a":null,"b":null}')
  cy.get('#4-pre').should('have.text', '{"a":null,"b":null}')
}
