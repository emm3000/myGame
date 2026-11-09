import { type ComponentType, type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { numberBefore } from '../design/android/numberBefore'
import { durations } from '../design/tokens'

export type SkeletonBlock = 'control' | 'secondary' | 'action' | 'thumbnail' | 'place-card'

export interface LoadingSkeletonProps {
  readonly isLoading: boolean
  readonly line: string
  readonly groups: ReadonlyArray<ReadonlyArray<SkeletonBlock>>
  readonly Frame: ComponentType<{ readonly children: ReactNode }>
  readonly children: ReactNode
}

type Phase = 'waiting' | 'holding' | 'held'

const revealMs = numberBefore('ms', durations.reveal)
const holdMs = numberBefore('ms', durations.hold)

const blockHeightClasses: Readonly<Record<SkeletonBlock, string>> = {
  control: 'min-h-control',
  secondary: 'min-h-secondary',
  action: 'min-h-action',
  thumbnail: 'size-thumbnail',
  'place-card': 'size-place-card',
}

function usePhase(isLoading: boolean): Phase {
  const [phase, setPhase] = useState<Phase>('waiting')

  useEffect(() => {
    if (!isLoading || phase !== 'waiting') {
      return
    }
    const reveal = setTimeout(() => setPhase('holding'), revealMs)
    return () => clearTimeout(reveal)
  }, [isLoading, phase])

  useEffect(() => {
    if (phase !== 'holding') {
      return
    }
    const hold = setTimeout(() => setPhase('held'), holdMs)
    return () => clearTimeout(hold)
  }, [phase])

  useEffect(() => {
    if (!isLoading && phase === 'held') {
      setPhase('waiting')
    }
  }, [isLoading, phase])

  return phase
}

function SkeletonBlocks({
  groups,
}: {
  readonly groups: LoadingSkeletonProps['groups']
}): ReactElement {
  const columnsClass = groups.length > 1 ? 'lg:grid-cols-2' : ''
  return (
    <div aria-hidden="true" className={`grid items-start gap-6 ${columnsClass}`}>
      {groups.map((blocks, groupIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed shape that never reorders
        <div key={groupIndex} className="flex min-w-0 flex-col gap-6">
          {blocks.map((block, blockIndex) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed shape that never reorders
              key={blockIndex}
              data-skeleton-block=""
              className={`w-full rounded-lg bg-surface-sunken motion-safe:animate-skeleton-pulse ${blockHeightClasses[block]}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function LoadingSkeleton({
  isLoading,
  line,
  groups,
  Frame,
  children,
}: LoadingSkeletonProps): ReactNode {
  const phase = usePhase(isLoading)
  const isDrawn = phase === 'holding' || (phase === 'held' && isLoading)
  if (!isLoading && !isDrawn) {
    return children
  }
  return (
    <Frame>
      <section aria-busy="true" className="flex flex-col">
        <p role="status" className="sr-only">
          {line}
        </p>
        {isDrawn && <SkeletonBlocks groups={groups} />}
      </section>
    </Frame>
  )
}
