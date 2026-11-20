import { townLoading } from '@mygame/catalog'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import { NothingToRead } from '../../school/NothingToRead'
import { SchoolTextScreen } from '../../school/SchoolTextScreen'
import { SchoolTitled } from '../../school/SchoolTitled'
import type { LiveTown } from '../../town/liveTown'
import { TownReadFailed } from '../../town/TownReadFailed'
import { useLayoutTown } from '../../town/useLayoutTown'
import type { TownHandle } from '../../town/useTown'

function TextPage({
  town,
  textId,
}: {
  readonly town: LiveTown
  readonly textId: string
}): ReactElement {
  const text = town.overview.texts.find(({ id }) => id === textId)
  return text === undefined ? <NothingToRead /> : <SchoolTextScreen key={text.id} text={text} />
}

const textSkeletonGroups: LoadingSkeletonProps['groups'] = [['control', 'place-card', 'action']]

function TextSkeletonFrame({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="mx-auto w-full max-w-form">
      <SchoolTitled>{children}</SchoolTitled>
    </div>
  )
}

function TextAnswer({
  town,
  textId,
}: {
  readonly town: TownHandle
  readonly textId: string
}): ReactElement | null {
  switch (town.state.kind) {
    case 'loading':
      return null
    case 'noTown':
      return <Navigate to="/" />
    case 'refused':
      return (
        <SchoolTitled>
          <TownReadFailed refusal={town.state.refusal} onRetry={town.reread} />
        </SchoolTitled>
      )
    case 'live':
      return <TextPage town={town.state.town} textId={textId} />
    default: {
      const unreachable: never = town.state
      return unreachable
    }
  }
}

function TextRoute(): ReactElement {
  const { textId } = Route.useParams()
  const town = useLayoutTown()
  return (
    <LoadingSkeleton
      isLoading={town.state.kind === 'loading'}
      line={townLoading()}
      groups={textSkeletonGroups}
      Frame={TextSkeletonFrame}
    >
      <TextAnswer town={town} textId={textId} />
    </LoadingSkeleton>
  )
}

export const Route = createFileRoute('/_signedIn/school/texts/$textId')({
  component: TextRoute,
})
