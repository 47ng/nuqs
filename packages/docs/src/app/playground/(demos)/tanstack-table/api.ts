import { faker } from '@faker-js/faker'

// Ensure consistent results between server and client renders.
faker.seed(42)

export type Person = {
  id: number
  name: string
  age: number
  country: string
  city: string
  email: string
}

// Fake an in-memory dataset to drive the table.
export const people: Person[] = Array.from({ length: 50 }, (_, id) => ({
  id,
  name: faker.person.fullName(),
  age: faker.number.int({ min: 18, max: 80 }),
  country: faker.location.country(),
  city: faker.location.city(),
  email: faker.internet.email().toLowerCase()
}))
