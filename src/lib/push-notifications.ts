import { AppState, Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { registerPushToken, unregisterPushToken } from '../api/client'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  )
}

/** Ask permission, create Android channel, return Expo push token. */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    throw new Error('Push notifications are not available on web')
  }
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device')
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'MamaPlus',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E85D4C',
      sound: 'default',
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    throw new Error(
      'Notification permission was denied. Enable it in phone Settings → Apps → MamaPlus → Notifications.'
    )
  }

  const projectId = getProjectId()
  if (!projectId) {
    throw new Error('EAS projectId missing; cannot get Expo push token')
  }

  try {
    const push = await Notifications.getExpoPushTokenAsync({ projectId })
    if (!push.data) {
      throw new Error('Expo did not return a push token')
    }
    return push.data
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // Common when google-services.json / Firebase Installations / FCM is misconfigured
    throw new Error(
      `Could not get Expo push token (${message}). Ensure notification permission is allowed and this build includes google-services.json.`
    )
  }
}

export type PushSyncResult = {
  ok: boolean
  token?: string
  error?: string
}

/** Register this device's Expo push token with the MamaPlus API. */
export async function syncPushTokenWithServer(authToken: string): Promise<PushSyncResult> {
  try {
    const expoToken = await getExpoPushToken()
    if (!expoToken) {
      return { ok: false, error: 'No push token received' }
    }

    await registerPushToken(authToken, {
      token: expoToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceId: Device.modelName || Device.osName || undefined,
    })

    return { ok: true, token: expoToken }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to register push token'
    console.warn('Failed to register push token', error)
    return { ok: false, error: message }
  }
}

/** Remove this device token from the server (call before clearing auth). */
export async function removePushTokenFromServer(
  authToken: string,
  expoToken?: string | null
): Promise<void> {
  try {
    await unregisterPushToken(authToken, expoToken || undefined)
  } catch (error) {
    console.warn('Failed to unregister push token', error)
  }
}

/** Wire foreground listeners so alerts also show while the app is open. */
export function attachNotificationListeners() {
  const received = Notifications.addNotificationReceivedListener((notification) => {
    console.info('[MamaPlus] Notification received', notification.request.content.title)
  })
  const response = Notifications.addNotificationResponseReceivedListener((resp) => {
    console.info('[MamaPlus] Notification tapped', resp.notification.request.content.data)
  })
  return () => {
    received.remove()
    response.remove()
  }
}

/** Re-register when the app returns to foreground (permission may have been granted in Settings). */
export function watchAppStateForPushRegistration(
  getAuthToken: () => string | null,
  onResult?: (result: PushSyncResult) => void
) {
  const sub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return
    const token = getAuthToken()
    if (!token) return
    syncPushTokenWithServer(token).then((result) => onResult?.(result))
  })
  return () => sub.remove()
}
