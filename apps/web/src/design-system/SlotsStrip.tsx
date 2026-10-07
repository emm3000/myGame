import { Link, type LinkProps } from '@tanstack/react-router'
import { Fragment, type ReactElement, useId } from 'react'
import { MarchIcon } from './icons/MarchIcon'
import { SlotIcon } from './icons/SlotIcon'
import { NoticeToggle, type NoticeToggleProps } from './NoticeToggle'
import { Track } from './Track'

export type StripIcon = 'slot' | 'march'

export interface StripLine {
  readonly heading: string
  readonly value: string
  readonly timePieces: ReadonlyArray<string>
}

export interface StripProgress {
  readonly value: number
  readonly total: number
}

export type StripCell =
  | {
      readonly kind: 'idle'
      readonly id: string
      readonly icon: StripIcon
      readonly section: string
      readonly label: string
    }
  | {
      readonly kind: 'busy'
      readonly id: string
      readonly icon: StripIcon
      readonly section: string
      readonly lines: ReadonlyArray<StripLine>
      readonly progress: StripProgress
    }

export interface SlotsStripProps {
  readonly label: string
  readonly link: Pick<LinkProps, 'to' | 'params'>
  readonly cells: ReadonlyArray<StripCell>
  readonly notices: NoticeToggleProps
}

const cellClass =
  'flex h-full flex-col gap-2 rounded-md border p-3 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong'

function CellIcon({ icon }: { readonly icon: StripIcon }): ReactElement {
  return icon === 'march' ? <MarchIcon sizeClass="size-icon" /> : <SlotIcon sizeClass="size-icon" />
}

function BusyLine({ line }: { readonly line: StripLine }): ReactElement {
  return (
    <span className="font-body text-body text-ink">
      <b className="font-bold underline underline-offset-2">{line.heading}</b> {line.value}
      {line.timePieces.map((piece) => (
        <Fragment key={piece}>
          {' '}
          <span className="inline-block font-utility text-numeral text-ink-muted tabular-nums">
            {`· ${piece}`}
          </span>
        </Fragment>
      ))}
    </span>
  )
}

function CellContent({ cell }: { readonly cell: StripCell }): ReactElement {
  if (cell.kind === 'idle') {
    return (
      <span className="flex items-center gap-2 text-ink-muted">
        <CellIcon icon={cell.icon} />
        <span className="font-body text-body font-bold text-umber underline underline-offset-2">
          {cell.label}
        </span>
      </span>
    )
  }
  return (
    <>
      <span className="flex items-start gap-2 text-ink-muted">
        <CellIcon icon={cell.icon} />
        <span className="flex min-w-0 flex-col gap-1">
          {cell.lines.map((line) => (
            <BusyLine key={line.heading} line={line} />
          ))}
        </span>
      </span>
      <span className="mt-auto">
        <Track value={cell.progress.value} total={cell.progress.total} fillClass="fill-slate" />
      </span>
    </>
  )
}

export function SlotsStrip({ label, link, cells, notices }: SlotsStripProps): ReactElement {
  const labelId = useId()
  return (
    <section
      aria-labelledby={labelId}
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2"
    >
      <span id={labelId} className="order-1 font-utility text-label text-ink-muted uppercase">
        {label}
      </span>
      <NoticeToggle {...notices} />
      <ul className="order-2 m-0 grid basis-full list-none gap-2 p-0 md:order-4 md:auto-cols-fr md:grid-flow-col">
        {cells.map((cell) => (
          <li key={cell.id} className="flex min-w-0 flex-col">
            <Link
              {...link}
              hash={cell.section}
              className={`${cellClass} ${cell.kind === 'idle' ? 'border-dashed border-line bg-surface' : 'border-line-strong bg-surface-raised'}`}
            >
              <CellContent cell={cell} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
