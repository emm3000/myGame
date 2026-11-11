export type AndroidModule = 'app' | 'map' | 'report' | 'review' | 'school' | 'signin' | 'town'

export type AndroidKey = {
  readonly module: AndroidModule
  readonly resourceName: string
}

export const androidModules: ReadonlyArray<AndroidModule> = [
  'app',
  'map',
  'report',
  'review',
  'school',
  'signin',
  'town',
]

const isAndroidModule = (segment: string): segment is AndroidModule =>
  androidModules.some((module) => module === segment)

export const isAndroidKey = (key: string): boolean => key.startsWith('android.')

export const androidKeyOf = (key: string): AndroidKey => {
  const [, module, resourceName, ...rest] = key.split('.')
  if (
    module === undefined ||
    !isAndroidModule(module) ||
    resourceName === undefined ||
    !/^[a-z][a-z0-9_]*$/.test(resourceName) ||
    rest.length > 0
  ) {
    throw new Error(`${key}: an android key is android.<module>.<resource_name>`)
  }
  return { module, resourceName }
}
