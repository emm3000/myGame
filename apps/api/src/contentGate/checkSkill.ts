import type { GateContent } from './GateContent'

const skillResource = 'money'

const skillRatePercent = 5

export const checkSkill = ({ curriculum }: GateContent): ReadonlyArray<string> => {
  const { resource, ratePercent } = curriculum.skill
  return [
    ...(resource === skillResource ? [] : [`skill raises ${resource}, not ${skillResource}`]),
    ...(ratePercent === skillRatePercent
      ? []
      : [`skill rate is ${ratePercent} %, not ${skillRatePercent} %`]),
  ]
}
