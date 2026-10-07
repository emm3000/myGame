import { vi } from 'vitest'

export interface SentNotice {
  readonly title: string
  readonly body: string | undefined
  readonly tag: string | undefined
}

export interface NotificationStub {
  readonly sent: Array<SentNotice>
  readonly requestPermission: ReturnType<typeof vi.fn<() => Promise<NotificationPermission>>>
  readonly setPermission: (permission: NotificationPermission) => void
}

export function stubNotification(
  permission: NotificationPermission,
  answer: NotificationPermission = permission,
): NotificationStub {
  const sent: Array<SentNotice> = []
  const requestPermission = vi.fn(async (): Promise<NotificationPermission> => {
    Stub.permission = answer
    return answer
  })
  class Stub {
    static permission: NotificationPermission = permission
    static requestPermission = requestPermission
    constructor(title: string, options?: NotificationOptions) {
      sent.push({ title, body: options?.body, tag: options?.tag })
    }
  }
  vi.stubGlobal('Notification', Stub)
  return {
    sent,
    requestPermission,
    setPermission: (next) => {
      Stub.permission = next
    },
  }
}
