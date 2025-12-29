import { source, type Page } from '@/src/app/source'
import { createSearchAPI } from 'fumadocs-core/search/server'

export const { GET } = createSearchAPI('advanced', {
  indexes: source
    .getPages()
    .filter((page): page is Page => page.data.exposeTo.includes('user'))
    .map(page => ({
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      structuredData: page.data.structuredData
    }))
})
