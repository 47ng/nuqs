import { faker } from '@faker-js/faker'

// Ensure consistent results
faker.seed(47)

export const pageSize = 5
export const pageCount = 5

// Fake an in-memory product API
const productDatabase = Array.from(
  { length: pageSize * pageCount },
  (_, i) => ({
    id: i,
    name: faker.commerce.productName(),
    price: faker.commerce.price({ symbol: '€' }),
    description: faker.commerce.productDescription()
  })
)

export type Product = (typeof productDatabase)[number]

export async function fetchProducts(
  page: number,
  delay: number
): Promise<Product[]> {
  await new Promise(resolve => setTimeout(resolve, delay))
  return productDatabase.slice((page - 1) * pageSize, page * pageSize)
}
