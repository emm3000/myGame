import type { FiefOverview } from '@mygame/contracts'
import { useCallback, useState } from 'react'
import { finishNoticesOf } from './finishNoticesOf'

export type NoticesState = 'off' | 'on' | 'denied'

export interface FinishNoticesHandle {
  readonly state: NoticesState
  readonly toggle: () => void
  readonly notifyBetween: (previous: FiefOverview, next: FiefOverview) => void
}

const preferenceKey = 'mygame.notices'

const notificationApi = (): typeof Notification | undefined =>
  'Notification' in globalThis ? globalThis.Notification : undefined

const isGranted = (): boolean => {
  try {
    return notificationApi()?.permission === 'granted'
  } catch {
    return false
  }
}

const isStoredOn = (): boolean => {
  try {
    return localStorage.getItem(preferenceKey) === 'on'
  } catch {
    return false
  }
}

const storePreference = (isOn: boolean): void => {
  try {
    localStorage.setItem(preferenceKey, isOn ? 'on' : 'off')
  } catch {
    return
  }
}

const requestedPermission = async (): Promise<NotificationPermission> => {
  const api = notificationApi()
  if (api === undefined) {
    return 'denied'
  }
  try {
    return await api.requestPermission()
  } catch {
    return 'denied'
  }
}

const send = (title: string, options: NotificationOptions): void => {
  const api = notificationApi()
  if (api === undefined) {
    return
  }
  try {
    new api(title, options)
  } catch {
    return
  }
}

export function useFinishNotices(): FinishNoticesHandle {
  const [state, setState] = useState<NoticesState>(() =>
    isStoredOn() && isGranted() ? 'on' : 'off',
  )

  const turnOn = useCallback(async (): Promise<void> => {
    const isOn = (await requestedPermission()) === 'granted'
    storePreference(isOn)
    setState(isOn ? 'on' : 'denied')
  }, [])

  const toggle = useCallback((): void => {
    if (state !== 'on') {
      void turnOn()
      return
    }
    storePreference(false)
    setState('off')
  }, [state, turnOn])

  const notifyBetween = useCallback(
    (previous: FiefOverview, next: FiefOverview): void => {
      if (state !== 'on' || !isGranted()) {
        return
      }
      for (const notice of finishNoticesOf(previous, next)) {
        send(notice.title, { body: notice.body, tag: notice.tag })
      }
    },
    [state],
  )

  return { state, toggle, notifyBetween }
}
