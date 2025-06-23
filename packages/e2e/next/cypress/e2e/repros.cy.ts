it('Reproduction for issue #388', { retries: 0 }, () => {
  cy.visit('/app/repro-388')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')

  cy.get('#start').click()
  // The URL should have a ?counter=1 query string
  cy.location('search').should('eq', '?counter=1')
  // The counter should be rendered as 1 on the page
  cy.get('#counter').should('have.text', 'Counter: 1')
  // Hover the "Hover me" link
  cy.get('#hover-me').trigger('mouseover')
  cy.wait(100)
  // The URL should have a ?counter=1 query string
  cy.location('search').should('eq', '?counter=1')
  // The counter should be rendered as 1 on the page
  cy.get('#counter').should('have.text', 'Counter: 1')

  // Reset the page
  cy.visit('/app/repro-388')
  cy.get('#start').click()
  // The URL should have a ?counter=1 query string
  cy.location('search').should('eq', '?counter=1')
  // The counter should be rendered as 1 on the page
  cy.get('#counter').should('have.text', 'Counter: 1')
  // Mount the other link
  cy.get('#toggle').click()
  cy.wait(100)
  // The URL should have a ?counter=1 query string
  cy.location('search').should('eq', '?counter=1')
  // The counter should be rendered as 1 on the page
  cy.get('#counter').should('have.text', 'Counter: 1')
})

// --

it('Reproduction for issue #498', { retries: 0 }, () => {
  cy.visit('/app/repro-498')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#start').click()
  cy.location('hash').should('eq', '#section')
  cy.get('button').click()
  cy.location('search').should('eq', '?q=test')
  cy.location('hash').should('eq', '#section')
})

// --

it('Reproduction for issue #542', () => {
  cy.visit('/app/repro-542/a?q=foo&r=bar')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#q').should('have.text', 'foo')
  cy.get('#r').should('have.text', 'bar')
  cy.get('#initial').should('have.text', '{"q":"foo","r":"bar"}')
  cy.get('a').click()
  cy.location('search').should('eq', '')
  cy.get('#q').should('have.text', '')
  cy.get('#r').should('have.text', '')
  cy.get('#initial').should('have.text', '{"q":null,"r":null}')
})

// --

describe('Reproduction for issue #630', () => {
  it('works with useQueryState', () => {
    runTest('1')
  })
  it('works with useQueryStates', () => {
    runTest('3')
  })

  function runTest(sectionToTry: string) {
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
})

// --

describe('repro-758', () => {
  it('honors urlKeys when navigating back after a push', () => {
    cy.visit('/app/repro-758')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('button').click()
    cy.get('#state').should('have.text', 'test')
    cy.go('back')
    cy.get('#state').should('be.empty')
  })
})

// --

describe('repro-760', () => {
  it('supports dynamic default values', () => {
    cy.visit('/app/repro-760')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#value-a').should('have.text', 'a')
    cy.get('#value-b').should('have.text', 'b')
    cy.get('#trigger-a').click()
    cy.get('#trigger-b').click()
    cy.get('#value-a').should('have.text', 'pass')
    cy.get('#value-b').should('have.text', 'pass')
  })
})

// --

describe('repro-774', () => {
  it('updates internal state on navigation', () => {
    cy.visit('/app/repro-774')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#trigger-a').click()
    cy.get('#value-a').should('have.text', 'a')
    cy.get('#value-b').should('be.empty')
    cy.get('#link').click()
    cy.get('#value-a').should('be.empty')
    cy.get('#value-b').should('be.empty')
    cy.get('#trigger-b').click()
    cy.get('#value-a').should('be.empty')
    cy.get('#value-b').should('have.text', 'b')
  })
})
