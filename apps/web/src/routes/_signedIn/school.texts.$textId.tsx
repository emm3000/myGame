import { townLoading } from '@mygame/catalog'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import type { TextRead } from '../../api/apiClient'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import { lineLabelOf } from '../../design-system/lineLabelOf'
import { NothingToRead } from '../../school/NothingToRead'
import { SchoolTextScreen } from '../../school/SchoolTextScreen'
import { SchoolTitled } from '../../school/SchoolTitled'
import { type OpenTextHandle, useOpenText } from '../../school/useOpenText'
import { TownReadFailed } from '../../town/TownReadFailed'

function TextPage({ read }: { readonly read: TextRead }): ReactElement {
  switch (read.kind) {
    case 'notOpen':
      return <NothingToRead />
    case 'open':
      return <SchoolTextScreen key={read.text.id} text={read.text} />
    default: {
      const unreachable: never = read
      return unreachable
    }
  }
}

const textSkeletonGroups: LoadingSkeletonProps['groups'] = [['control', 'place-card', 'action']]

function TextSkeletonFrame({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="mx-auto w-full max-w-form">
      <SchoolTitled>{children}</SchoolTitled>
    </div>
  )
}

function TextAnswer({ text }: { readonly text: OpenTextHandle }): ReactElement | null {
  const { state, reread } = text
  switch (state.kind) {
    case 'loading':
      return null
    case 'refused':
      return state.refusal === 'TownNotFound' ? (
        <Navigate to="/" />
      ) : (
        <SchoolTitled>
          <TownReadFailed refusal={state.refusal} onRetry={reread} />
        </SchoolTitled>
      )
    case 'read':
      return <TextPage read={state.read} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

function TextRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { textId } = Route.useParams()
  const text = useOpenText(apiClient, textId)
  return (
    <LoadingSkeleton
      isLoading={text.state.kind === 'loading'}
      line={lineLabelOf(townLoading(), 'es')}
      groups={textSkeletonGroups}
      Frame={TextSkeletonFrame}
    >
      <TextAnswer text={text} />
    </LoadingSkeleton>
  )
}

export const Route = createFileRoute('/_signedIn/school/texts/$textId')({
  component: TextRoute,
})
