import { createFileRoute, Navigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../../copy/usePlayerCopy'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import { NewsScreen, NewsTitled } from '../../news/NewsScreen'
import { newsRowOf } from '../../news/newsRowOf'
import { type TownNewsHandle, useTownNews } from '../../news/useTownNews'
import { TownReadFailed } from '../../town/TownReadFailed'

const newsSkeletonGroups: LoadingSkeletonProps['groups'] = [['control', 'control', 'control']]

function NewsAnswer({ news }: { readonly news: TownNewsHandle }): ReactElement | null {
  const { state, reread } = news
  const copy = usePlayerCopy()
  switch (state.kind) {
    case 'loading':
      return null
    case 'refused':
      return state.refusal === 'TownNotFound' ? (
        <Navigate to="/" />
      ) : (
        <NewsTitled>
          <TownReadFailed refusal={state.refusal} onRetry={reread} />
        </NewsTitled>
      )
    case 'read':
      return (
        <NewsScreen
          rows={state.feed.items.map((item) => newsRowOf(copy, item, state.receivedAt))}
        />
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

function NewsRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const news = useTownNews(apiClient)
  const copy = usePlayerCopy()
  return (
    <LoadingSkeleton
      isLoading={news.state.kind === 'loading'}
      line={copy.chrome((catalog) => catalog.newsLoading())}
      groups={newsSkeletonGroups}
      Frame={NewsTitled}
    >
      <NewsAnswer news={news} />
    </LoadingSkeleton>
  )
}

export const Route = createFileRoute('/_signedIn/news')({
  component: NewsRoute,
})
