import { getUsers } from '@/data'
import { searchParamsCache } from '../searchParams'
import { Pagination } from './pagination'

export async function UsersList() {
  const params = searchParamsCache.all()
  const users = await getUsers(params)

  return (
    <div className="w-full flex flex-col gap-4">
      <ul className="w-full max-w-sm divide-y divide-gray-200 dark:divide-gray-700 text-center sm:text-left">
        {users.data.map(user => (
          <li key={user.id} className="py-2">
            {user.name}
          </li>
        ))}
      </ul>
      <Pagination total={users.total} />
    </div>
  )
}
