export const users = [
  {
    id: 1,
    name: 'John Doe'
  },
  {
    id: 2,
    name: 'Jane Doe'
  },
  {
    id: 3,
    name: 'Ziad El-Sayed'
  },
  {
    id: 4,
    name: 'Alice Johnson'
  },
  {
    id: 5,
    name: 'Bob Brown'
  },
  {
    id: 6,
    name: 'Charlie Davis'
  },
  {
    id: 7,
    name: 'Diana Evans'
  },
  {
    id: 8,
    name: 'Ethan Harris'
  },
  {
    id: 9,
    name: 'Fiona Clark'
  },
  {
    id: 10,
    name: 'George Miller'
  },
  {
    id: 11,
    name: 'Hannah Wilson'
  },
  {
    id: 12,
    name: 'Ian Taylor'
  },
  {
    id: 13,
    name: 'Karen Anderson'
  },
  {
    id: 14,
    name: 'Liam Thomas'
  },
  {
    id: 15,
    name: 'Mia Rodriguez'
  },
  {
    id: 16,
    name: 'Noah Martinez'
  },
  {
    id: 17,
    name: 'Olivia Lee'
  },
  {
    id: 18,
    name: 'Peter Walker'
  },
  {
    id: 19,
    name: 'Quinn Young'
  },
  {
    id: 20,
    name: 'Riley King'
  }
]

export interface GetUsersOptions {
  page: number
  limit: number
  order: 'asc' | 'desc' | null
  search: string
}

export async function getUsers({
  page,
  limit,
  order,
  search
}: GetUsersOptions) {
  let records = users

  if (search.trim()) {
    const term = search.toLowerCase()
    records = records.filter(item => item.name.toLowerCase().includes(term))
  }

  if (order) {
    records = [...records].sort((a, b) => {
      const valueA = a.name
      const valueB = b.name
      if (valueA < valueB) return order === 'asc' ? -1 : 1
      if (valueA > valueB) return order === 'asc' ? 1 : -1
      return 0
    })
  }

  const total = records.length
  const start = (page - 1) * limit
  const paginated = records.slice(start, start + limit)

  return {
    total,
    data: paginated
  }
}
