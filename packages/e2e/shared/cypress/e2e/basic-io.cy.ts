type Args = {
  hook: 'useQueryState' | 'useQueryStates'
  path: string
  description?: string
}

export function basicIO({ hook, path, description }: Args) {
  describe(`${hook} - basic I/O${description ? ` (${description})` : ''}`, () => {
    it('reads the value from the URL on mount', () => {
      cy.visit(path + '?test=init')
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#value').should('have.text', 'init')
    })

    it('writes the value to the URL', () => {
      cy.visit(path)
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#value').should('be.empty')
      cy.get('button#set-pass').click()
      cy.get('#value').should('have.text', 'pass')
      cy.location('search').should('eq', '?test=pass')
    })

    it('updates the value in the URL', () => {
      cy.visit(path + '?test=init')
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#value').should('have.text', 'init')
      cy.get('button#set-pass').click()
      cy.get('#value').should('have.text', 'pass')
      cy.location('search').should('eq', '?test=pass')
    })

    it('removes the value from the URL', () => {
      cy.visit(path + '?test=init')
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('button#clear').click()
      cy.get('#value').should('be.empty')
      cy.location('search').should('eq', '')
    })

    it('removes a set value from the URL', () => {
      cy.visit(path)
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('button#set-pass').click()
      cy.get('button#clear').click()
      cy.get('#value').should('be.empty')
      cy.location('search').should('eq', '')
    })
  })
}
