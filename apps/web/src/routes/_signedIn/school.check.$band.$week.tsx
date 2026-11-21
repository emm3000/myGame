import { HoldoutCheckRequestSchema } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../../copy/usePlayerCopy'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import { HoldoutCheckScreen, HoldoutCheckTitled } from '../../school/HoldoutCheckScreen'
import { useHoldoutCheck } from '../../school/useHoldoutCheck'

const checkSkeletonGroups: LoadingSkeletonProps['groups'] = [
  ['place-card', 'secondary', 'secondary', 'action'],
]

function HoldoutCheckRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const parsed = HoldoutCheckRequestSchema.safeParse(Route.useParams())
  const handle = useHoldoutCheck(apiClient, parsed.success ? parsed.data : undefined)
  const copy = usePlayerCopy()
  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6">
      <LoadingSkeleton
        isLoading={handle.view.kind === 'loading'}
        line={copy.fixedCopy((catalog) => catalog.holdoutCheckLoading())}
        groups={checkSkeletonGroups}
        Frame={HoldoutCheckTitled}
      >
        <HoldoutCheckScreen handle={handle} />
      </LoadingSkeleton>
    </div>
  )
}

export const Route = createFileRoute('/_signedIn/school/check/$band/$week')({
  component: HoldoutCheckRoute,
})
