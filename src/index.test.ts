import hello from './index'

test('testing works', () => {
  expect(hello('World')).toEqual('Hello, World !')
})
