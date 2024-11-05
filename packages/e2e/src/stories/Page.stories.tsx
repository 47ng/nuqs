import { NuqsAdapter } from 'nuqs/adapters/next'
import { Page as PageComponent } from './Page'

export default {
  title: 'Pages/Cache',
  component: PageComponent,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true
    }
  },
  features: {
    experimentalRSC: true
  }
}

export const Page = async () => {
  return (
    <NuqsAdapter>
      <PageComponent searchParams={Promise.resolve({ query: 'search term' })} />
    </NuqsAdapter>
  )
}
