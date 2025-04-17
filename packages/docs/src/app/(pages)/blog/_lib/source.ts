import { blog } from '@/src/app/source'

export type BlogPost = ReturnType<typeof blog.getPages>[number]

export function getBlogPosts() {
  return blog.getPages().sort((a, b) => {
    return (
      new Date(b.data.date ?? 0).getTime() -
      new Date(a.data.date ?? 0).getTime()
    )
  })
}
