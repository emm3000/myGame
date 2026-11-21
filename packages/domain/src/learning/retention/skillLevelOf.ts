export const skillLevelOf = <Resource extends string>(
  skills: ReadonlyArray<{ readonly resource: Resource }>,
  resource: Resource,
): number => skills.filter((skill) => skill.resource === resource).length
