import {
  chronicleBattle,
  chronicleBattleLost,
  chronicleFiefAtPlot,
  chronicleHeadingsArtLearned,
  chronicleHeadingsBattleFought,
  chronicleHeadingsFiefFounded,
  chronicleHeadingsFoundingSent,
  chronicleHeadingsLessonCancelled,
  chronicleHeadingsLessonLearned,
  chronicleHeadingsMarchReturned,
  chronicleHeadingsRecruitsCancelled,
  chronicleHeadingsRecruitsDelivered,
  chronicleHeadingsStudyCancelled,
  chronicleHeadingsTransportArrived,
  chronicleHeadingsTransportSent,
  chronicleHeadingsUpgradeCancelled,
  chronicleHeadingsUpgradeFinished,
  chronicleLesson,
  chronicleLosses,
  chronicleMarch,
  chronicleMarchRecalled,
  chronicleReceived,
  chronicleReceivedAmounts,
  chronicleRecovered,
  chronicleRecruits,
  chronicleRecruitsCancelled,
  chronicleRefunded,
  chronicleSent,
  chronicleSentAmounts,
  chronicleSubject,
  fiefCostName,
} from '@mygame/catalog'
import { type FiefEvent, type ResourceAmounts, UnitKindSchema } from '@mygame/contracts'
import type { CardCost } from '../design-system/CostList'
import { artNameOf } from '../fief/artNameOf'
import { buildingNameOf } from '../fief/buildingNameOf'
import { quantitiesOf } from '../resources/quantitiesOf'
import { quantitiesPhraseOf } from '../resources/quantitiesPhraseOf'
import type { ResourceQuantity } from '../resources/ResourceQuantity'
import { resourceNameOf } from '../resources/resourceNameOf'
import { formatInstant } from '../time/formatInstant'
import { countedUnitsOf } from '../units/countedUnitsOf'
import { listedUnitsOf } from '../units/listedUnitsOf'
import { partyPhraseOf } from '../units/partyPhraseOf'
import type { UnitCounts } from '../units/UnitCounts'

export interface ChronicleAmounts {
  readonly label: string
  readonly sentence: string
  readonly costs: ReadonlyArray<CardCost>
}

export interface ChronicleRow {
  readonly key: string
  readonly occurredAt: string
  readonly instant: string
  readonly heading: string
  readonly subject: string
  readonly amounts: ChronicleAmounts | undefined
}

interface ChronicleSubject {
  readonly identity: string
  readonly text: string
}

const unitCountsIdentityOf = (counts: UnitCounts): string =>
  UnitKindSchema.options.map((unit) => counts[unit]).join('-')

const lossesClauseOf = (unitsLost: UnitCounts): string =>
  chronicleLosses({ kinds: listedUnitsOf(unitsLost).length, party: partyPhraseOf(unitsLost) })

const subjectOf = (event: FiefEvent): ChronicleSubject => {
  switch (event.kind) {
    case 'upgradeFinished':
    case 'upgradeCancelled':
      return {
        identity: `${event.building}-${event.level}`,
        text: chronicleSubject({ label: buildingNameOf(event.building), level: event.level }),
      }
    case 'artLearned':
    case 'studyCancelled':
      return {
        identity: `${event.art}-${event.level}`,
        text: chronicleSubject({ label: artNameOf(event.art), level: event.level }),
      }
    case 'recruitsDelivered':
      return {
        identity: `${event.unit}-${event.count}`,
        text: chronicleRecruits({ units: countedUnitsOf(event.unit, event.count) }),
      }
    case 'recruitsCancelled':
      return {
        identity: `${event.unit}-${event.delivered}-${event.cancelled}`,
        text: chronicleRecruitsCancelled({
          delivered: countedUnitsOf(event.unit, event.delivered),
          cancelled: countedUnitsOf(event.unit, event.cancelled),
        }),
      }
    case 'marchReturned':
      return {
        identity: `${event.province}-${event.plot}-${unitCountsIdentityOf(event.units)}`,
        text: chronicleMarch({
          province: event.province,
          plot: event.plot,
          party: partyPhraseOf(event.units),
        }),
      }
    case 'battleFought':
      return {
        identity: `${event.province}-${event.plot}-${event.tier}-${event.won}-${unitCountsIdentityOf(event.unitsLost)}-${event.campLost}`,
        text: chronicleBattle({
          province: event.province,
          plot: event.plot,
          tier: event.tier,
          losses: lossesClauseOf(event.unitsLost),
          campLost: event.campLost,
        }),
      }
    case 'foundingSent':
    case 'fiefFounded':
    case 'transportSent':
    case 'transportArrived':
      return {
        identity: `${event.province}-${event.plot}-${event.name}`,
        text: chronicleFiefAtPlot({ name: event.name, province: event.province, plot: event.plot }),
      }
    case 'lessonLearned':
    case 'lessonCancelled':
      return { identity: event.lessonId, text: chronicleLesson() }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}

const listedAmounts = (
  amounts: ResourceAmounts,
  label: string,
  sentenceOf: (listed: ReadonlyArray<ResourceQuantity>) => string,
): ChronicleAmounts | undefined => {
  const listed = quantitiesOf(amounts)
  if (listed.length === 0) {
    return undefined
  }
  return {
    label,
    sentence: sentenceOf(listed),
    costs: listed.map(({ resource, amount }) => ({
      kind: resource,
      amount,
      spokenName: fiefCostName({ resource: resourceNameOf(resource) }),
      shortMark: undefined,
    })),
  }
}

const receivedSentenceOf = (listed: ReadonlyArray<ResourceQuantity>): string =>
  chronicleReceivedAmounts({ quantities: quantitiesPhraseOf(listed) })

const amountsOf = (event: FiefEvent): ChronicleAmounts | undefined => {
  if ('refund' in event) {
    return listedAmounts(event.refund, chronicleRecovered(), (listed) =>
      chronicleRefunded({ quantities: quantitiesPhraseOf(listed) }),
    )
  }
  if ('loot' in event) {
    return listedAmounts(event.loot, chronicleReceived(), receivedSentenceOf)
  }
  if (event.kind === 'transportSent') {
    return listedAmounts(event.cargo, chronicleSent(), (listed) =>
      chronicleSentAmounts({ quantities: quantitiesPhraseOf(listed) }),
    )
  }
  if (event.kind === 'transportArrived') {
    return listedAmounts(event.cargo, chronicleReceived(), receivedSentenceOf)
  }
  return undefined
}

const headings: Readonly<Record<FiefEvent['kind'], () => string>> = {
  upgradeFinished: chronicleHeadingsUpgradeFinished,
  artLearned: chronicleHeadingsArtLearned,
  upgradeCancelled: chronicleHeadingsUpgradeCancelled,
  studyCancelled: chronicleHeadingsStudyCancelled,
  recruitsDelivered: chronicleHeadingsRecruitsDelivered,
  recruitsCancelled: chronicleHeadingsRecruitsCancelled,
  marchReturned: chronicleHeadingsMarchReturned,
  battleFought: chronicleHeadingsBattleFought,
  foundingSent: chronicleHeadingsFoundingSent,
  fiefFounded: chronicleHeadingsFiefFounded,
  transportSent: chronicleHeadingsTransportSent,
  transportArrived: chronicleHeadingsTransportArrived,
  lessonLearned: chronicleHeadingsLessonLearned,
  lessonCancelled: chronicleHeadingsLessonCancelled,
}

const headingOf = (event: FiefEvent): string => {
  if (event.kind === 'marchReturned' && event.recalled) {
    return chronicleMarchRecalled()
  }
  if (event.kind === 'battleFought' && !event.won) {
    return chronicleBattleLost()
  }
  return headings[event.kind]()
}

export function chronicleRowOf(event: FiefEvent, readAt: Date): ChronicleRow {
  const subject = subjectOf(event)
  return {
    key: `${event.kind}-${subject.identity}-${event.occurredAt}`,
    occurredAt: event.occurredAt,
    instant: formatInstant(new Date(event.occurredAt), readAt),
    heading: headingOf(event),
    subject: subject.text,
    amounts: amountsOf(event),
  }
}
