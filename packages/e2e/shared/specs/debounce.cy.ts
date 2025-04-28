import { createTest, type TestConfig } from '../create-test'
import { getUrl } from './debounce.defs'

type TestDebounceConfig = TestConfig & {
  otherPath?: string
}

export function testDebounce(config: TestDebounceConfig) {
  const test = createTest('Debounce', ({ path }) => {
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
      cy.location('search').should(
        'eq',
        `?debounceTime=${DEBOUNCE_TIME}&q=pass`
      )
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
      cy.location('search').should(
        'eq',
        `?debounceTime=${DEBOUNCE_TIME}&page=3`
      )
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
    it('should cancel a debounce when the back button is clicked', () => {
      cy.visit(config.otherPath ?? path + '/other')
      cy.visit(getUrl(path, { debounceTime: 200 }))
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('input[type="text"]').type('fail')
      cy.go('back')
      cy.wait(300)
      cy.location('search').should('be.empty')
    })
  })
  test(config)
}
