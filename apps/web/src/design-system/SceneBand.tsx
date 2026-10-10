import type { SeasonKind, Terrain } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { type ColorToken, color } from '../design/tokens'

export interface SceneBandProps {
  readonly terrain: Terrain
  readonly season: SeasonKind | null
  readonly artSrc: string | undefined
  readonly isFullBleed?: boolean
}

type Pine = readonly [x: number, top: number, base: number, halfWidth: number]

type Oval = readonly [cx: number, cy: number, rx: number, ry: number]

type Rock = readonly [x: number, base: number, width: number, height: number]

interface Tint {
  readonly token: ColorToken
  readonly opacity: number
}

const seasonTints: Readonly<Record<SeasonKind, Tint>> = {
  spring: { token: 'river', opacity: 0.18 },
  summer: { token: 'gold', opacity: 0.22 },
  autumn: { token: 'ochre', opacity: 0.3 },
  winter: { token: 'slate', opacity: 0.34 },
}

const width = 1200

const height = 400

function Area({
  d,
  token,
  opacity = 1,
}: {
  readonly d: string
  readonly token: ColorToken
  readonly opacity?: number
}): ReactElement {
  return <path d={d} fill={color(token)} fillOpacity={opacity} />
}

function Line({
  d,
  token,
  opacity,
  strokeWidth,
}: {
  readonly d: string
  readonly token: ColorToken
  readonly opacity: number
  readonly strokeWidth: number
}): ReactElement {
  return (
    <path
      d={d}
      stroke={color(token)}
      strokeOpacity={opacity}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
    />
  )
}

const pinePathOf = ([x, top, base, halfWidth]: Pine): string => {
  const shoulder = top + (base - top) * 0.55
  const notch = halfWidth * 0.6
  const foot = halfWidth * 1.24
  return `M${x} ${top} L${x + halfWidth} ${shoulder} L${x + notch} ${shoulder} L${x + foot} ${base} L${x - foot} ${base} L${x - notch} ${shoulder} L${x - halfWidth} ${shoulder} Z`
}

function Pines({
  pines,
  opacity,
}: {
  readonly pines: ReadonlyArray<Pine>
  readonly opacity: number
}): ReactElement {
  return (
    <>
      {pines.map((pine) => (
        <Area key={pine.join()} d={pinePathOf(pine)} token="moss" opacity={opacity} />
      ))}
    </>
  )
}

function Shrubs({ shrubs }: { readonly shrubs: ReadonlyArray<Oval> }): ReactElement {
  return (
    <>
      {shrubs.map(([cx, cy, rx, ry]) => (
        <g key={`${cx} ${cy}`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color('moss')} fillOpacity={0.62} />
          <rect
            x={cx - 1.5}
            y={cy}
            width={3}
            height={ry * 1.8}
            fill={color('umber')}
            fillOpacity={0.7}
          />
        </g>
      ))}
    </>
  )
}

function Ovals({
  ovals,
  token,
  opacity,
}: {
  readonly ovals: ReadonlyArray<Oval>
  readonly token: ColorToken
  readonly opacity: number
}): ReactElement {
  return (
    <>
      {ovals.map(([cx, cy, rx, ry]) => (
        <ellipse
          key={`${cx} ${cy}`}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={color(token)}
          fillOpacity={opacity}
        />
      ))}
    </>
  )
}

const rockPathOf = ([x, base, rockWidth, rockHeight]: Rock): string =>
  `M${x} ${base} L${x + rockWidth * 0.25} ${base - rockHeight} L${x + (rockWidth * 5) / 6} ${base - (rockHeight * 11) / 12} L${x + rockWidth} ${base} Z`

function Rocks({ rocks }: { readonly rocks: ReadonlyArray<Rock> }): ReactElement {
  return (
    <>
      {rocks.map((rock) => (
        <Area key={rock.join()} d={rockPathOf(rock)} token="stone" opacity={0.62} />
      ))}
    </>
  )
}

function Sky({ season }: { readonly season: SeasonKind | null }): ReactElement {
  const glowId = useId()
  const tint = season === null ? undefined : seasonTints[season]
  return (
    <>
      <defs>
        <radialGradient id={glowId} cx={0.82} cy={0.48} r={0.46}>
          <stop offset={0} stopColor={color('ochre')} stopOpacity={0.4} />
          <stop offset={1} stopColor={color('ochre')} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill={color('surface-raised')} />
      {tint !== undefined && (
        <rect width={width} height={height} fill={color(tint.token)} fillOpacity={tint.opacity} />
      )}
      <rect width={width} height={height} fill={`url(#${glowId})`} />
      <circle cx={984} cy={184} r={24} fill={color('ochre')} fillOpacity={0.55} />
    </>
  )
}

const lowlandsFarPines: ReadonlyArray<Pine> = [
  [60, 206, 232, 8],
  [92, 214, 234, 6.5],
  [330, 206, 230, 7.5],
  [356, 214, 232, 6],
  [870, 202, 226, 7.5],
  [900, 208, 228, 6.5],
  [1120, 212, 234, 7],
]

const lowlandsNearPines: ReadonlyArray<Pine> = [
  [130, 276, 330, 15],
  [168, 298, 338, 12],
  [1060, 268, 320, 15],
  [1100, 288, 330, 13],
  [1032, 298, 334, 11],
  [880, 328, 372, 13],
]

const fordStones: ReadonlyArray<Oval> = [
  [598, 305, 7, 3.5],
  [620, 302, 7, 3.5],
  [644, 299, 7, 3.5],
  [668, 296, 7, 3.5],
  [690, 293, 7, 3.5],
]

function LowlandsFar(): ReactElement {
  return (
    <>
      <Area
        d="M0 222 C120 200 190 150 300 158 C380 164 420 196 520 190 C640 183 700 150 820 146 C920 143 980 185 1200 206 L1200 236 L0 236 Z"
        token="slate"
        opacity={0.32}
      />
      <Area
        d="M0 234 C150 214 260 200 420 206 C560 211 640 192 780 196 C900 199 1020 214 1200 216 L1200 250 L0 250 Z"
        token="moss"
        opacity={0.42}
      />
      <Pines pines={lowlandsFarPines} opacity={0.55} />
      <rect y={236} width={width} height={164} fill={color('moss-soft')} />
      <Area d="M0 286 C120 280 220 292 360 284 L0 400 Z" token="food" opacity={0.22} />
      <Area d="M0 340 C110 330 200 342 300 334 L60 400 L0 400 Z" token="ochre" opacity={0.2} />
      <Area d="M1200 278 C1080 272 980 288 860 282 L1200 400 Z" token="food" opacity={0.22} />
      <Area
        d="M1200 340 C1100 332 1020 344 940 338 L1120 400 L1200 400 Z"
        token="ochre"
        opacity={0.2}
      />
    </>
  )
}

function LowlandsRiver(): ReactElement {
  return (
    <>
      <Area
        d="M700 238 C720 258 690 276 640 290 C580 306 540 322 560 346 C580 370 520 390 470 400 L700 400 C690 384 720 366 760 350 C810 330 820 304 770 284 C730 268 730 250 736 238 Z"
        token="river"
        opacity={0.72}
      />
      <Area
        d="M714 240 C726 256 700 272 656 286 C606 302 574 324 592 346 C606 364 572 382 544 400 L580 400 C606 380 640 360 622 340 C608 322 640 306 690 290 C738 274 752 258 748 240 Z"
        token="surface-raised"
        opacity={0.24}
      />
      <Ovals ovals={fordStones} token="stone" opacity={0.85} />
      <Line
        d="M0 262 C120 256 220 266 360 258 C440 254 500 262 560 258 M780 256 C860 252 960 262 1200 254"
        token="moss"
        opacity={0.3}
        strokeWidth={2}
      />
    </>
  )
}

function LowlandsScene(): ReactElement {
  return (
    <>
      <LowlandsFar />
      <LowlandsRiver />
      <Pines pines={lowlandsNearPines} opacity={0.78} />
      <Shrubs
        shrubs={[
          [400, 332, 15, 9],
          [432, 340, 11, 7],
          [980, 300, 13, 8],
        ]}
      />
      <Ovals
        ovals={[
          [240, 386, 90, 12],
          [1000, 390, 80, 10],
        ]}
        token="moss"
        opacity={0.22}
      />
    </>
  )
}

const uplandsPines: ReadonlyArray<Pine> = [
  [250, 180, 196, 5],
  [268, 185, 198, 4.5],
  [780, 166, 182, 5],
  [800, 171, 184, 4.5],
  [820, 175, 186, 4],
]

const uplandsShrubs: ReadonlyArray<Oval> = [
  [200, 348, 15, 9],
  [242, 354, 11, 7],
  [300, 340, 17, 10],
  [342, 350, 10, 6.5],
  [380, 358, 13, 8],
  [440, 352, 15, 9],
  [490, 362, 12, 7.5],
  [1020, 366, 11, 7],
  [1070, 356, 14, 8.5],
  [1130, 374, 12, 7.5],
  [640, 350, 13, 8],
  [676, 358, 10, 6.5],
]

const uplandsStones: ReadonlyArray<Oval> = [
  [80, 372, 11, 4.5],
  [120, 388, 7, 3],
  [600, 376, 13, 5],
  [650, 390, 8, 3],
  [720, 368, 9, 4],
  [940, 380, 12, 4.5],
  [1140, 392, 9, 3.5],
  [820, 392, 10, 4],
  [40, 320, 8, 3],
  [560, 318, 7, 3],
]

const plateauEdge =
  'M0 250 C60 232 120 222 200 222 L560 220 C640 220 700 212 760 212 L1200 214 L1200 260 L0 260 Z'

const plateau =
  'M0 270 C40 246 90 232 160 230 L1040 226 C1110 228 1160 240 1200 262 L1200 400 L0 400 Z'

function UplandsFar(): ReactElement {
  return (
    <>
      <Area
        d="M0 214 C90 196 160 170 260 176 C360 182 420 200 520 194 C620 188 700 162 800 160 C900 158 960 182 1200 198 L1200 232 L0 232 Z"
        token="slate"
        opacity={0.3}
      />
      <Pines pines={uplandsPines} opacity={0.4} />
      <Area d={plateauEdge} token="ochre" opacity={0.26} />
      <Area d={plateauEdge} token="stone" opacity={0.18} />
      <Area d={plateau} token="surface-sunken" />
      <Area d={plateau} token="ochre" opacity={0.2} />
    </>
  )
}

function UplandsQuarry(): ReactElement {
  return (
    <>
      <Area
        d="M800 230 L1060 228 L1070 244 L1010 246 L1016 262 L940 264 L944 280 L860 282 L850 262 L810 254 Z"
        token="stone"
        opacity={0.58}
      />
      <Line
        d="M808 244 L1060 242 M852 262 L1010 260 M864 280 L942 279"
        token="line-strong"
        opacity={0.5}
        strokeWidth={2}
      />
      <path
        d="M850 282 C820 300 790 320 760 346 C740 362 720 380 700 400"
        stroke={color('umber')}
        strokeOpacity={0.35}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="14 10"
        fill="none"
      />
    </>
  )
}

function UplandsScene(): ReactElement {
  return (
    <>
      <UplandsFar />
      <UplandsQuarry />
      <Area
        d="M0 300 C140 290 260 300 400 288 C520 278 600 296 720 290 C860 284 980 300 1200 292 L1200 400 L0 400 Z"
        token="ochre"
        opacity={0.12}
      />
      <Line
        d="M0 330 C160 322 300 336 480 326 C640 318 760 332 900 324 C1020 318 1120 328 1200 322 M0 372 C140 364 260 378 420 368 C560 360 680 374 820 366"
        token="umber"
        opacity={0.12}
        strokeWidth={2}
      />
      <Area
        d="M160 346 C240 318 300 322 370 332 C430 340 470 356 530 350 L580 400 L120 400 Z"
        token="moss"
        opacity={0.18}
      />
      <Shrubs shrubs={uplandsShrubs} />
      <Ovals ovals={uplandsStones} token="stone" opacity={0.7} />
    </>
  )
}

const ridgesPines: ReadonlyArray<Pine> = [
  [140, 264, 304, 11],
  [168, 280, 310, 9],
  [196, 272, 306, 10],
  [470, 264, 300, 10],
  [498, 278, 306, 8.5],
  [910, 264, 302, 10.5],
  [940, 278, 308, 9],
  [1120, 270, 306, 10],
]

const ridgesRocks: ReadonlyArray<Rock> = [
  [38, 361, 44, 22],
  [95, 378, 30, 16],
  [355, 372, 50, 24],
  [416, 385, 28, 14],
  [677, 357, 46, 22],
  [743, 377, 34, 18],
  [980, 366, 40, 20],
  [1047, 387, 26, 14],
  [232, 396, 36, 16],
  [565, 399, 30, 14],
  [843, 401, 34, 14],
]

function RidgesCrags(): ReactElement {
  return (
    <>
      <Area
        d="M0 230 L110 160 L190 190 L300 110 L380 150 L460 128 L560 196 L640 140 L720 174 L820 98 L900 150 L980 126 L1080 186 L1140 160 L1200 190 L1200 240 L0 240 Z"
        token="slate"
        opacity={0.38}
      />
      <Area
        d="M0 262 L80 214 L150 236 L230 180 L310 216 L380 198 L470 250 L560 206 L640 230 L760 178 L850 222 L930 204 L1030 246 L1100 224 L1200 254 L1200 300 L0 300 Z"
        token="iron"
        opacity={0.5}
      />
      <Area
        d="M230 182 L246 200 L300 232 L330 300 L286 300 L250 236 L212 204 Z"
        token="rust"
        opacity={0.22}
      />
      <Area
        d="M760 180 L780 204 L840 250 L870 300 L828 300 L790 246 L742 200 Z"
        token="rust"
        opacity={0.22}
      />
      <Line
        d="M238 190 L276 226 M250 214 L292 250 M768 190 L810 230 M782 216 L824 254 M1040 246 L1076 270"
        token="rust"
        opacity={0.5}
        strokeWidth={3}
      />
      <path
        d="M300 220 L360 300 M560 210 L600 300 M850 226 L880 300 M1030 248 L1012 300"
        stroke={color('ink')}
        strokeOpacity={0.12}
        strokeWidth={3}
        fill="none"
      />
    </>
  )
}

function RidgesScene(): ReactElement {
  return (
    <>
      <RidgesCrags />
      <Area d="M0 300 L1200 300 L1200 400 L0 400 Z" token="surface-sunken" />
      <Area
        d="M0 300 C120 292 200 304 320 298 C440 292 520 306 640 300 C760 294 860 306 1000 300 C1080 296 1140 300 1200 298 L1200 400 L0 400 Z"
        token="stone"
        opacity={0.26}
      />
      <Pines pines={ridgesPines} opacity={0.66} />
      <Rocks rocks={ridgesRocks} />
      <Area
        d="M560 330 C600 322 640 324 680 330 L700 400 L540 400 Z"
        token="ochre"
        opacity={0.16}
      />
    </>
  )
}

const scenes: Readonly<Record<Terrain, () => ReactElement>> = {
  lowlands: LowlandsScene,
  uplands: UplandsScene,
  ridges: RidgesScene,
}

export function SceneBand({
  terrain,
  season,
  artSrc,
  isFullBleed = false,
}: SceneBandProps): ReactElement {
  const Scene = scenes[terrain]
  return (
    <div
      aria-hidden="true"
      data-terrain={terrain}
      data-season={season ?? 'none'}
      className={`relative aspect-3/1 max-h-band w-full overflow-hidden${isFullBleed ? '' : ' rounded-md'}`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
        className="block h-full w-full"
      >
        <Sky season={season} />
        <Scene />
      </svg>
      {artSrc !== undefined && (
        <img
          src={artSrc}
          alt=""
          width={1024}
          height={1024}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}
