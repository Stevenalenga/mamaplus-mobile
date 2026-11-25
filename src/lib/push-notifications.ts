import { Platform } from 'react-native'
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
    throw new Error('Notification permission was denied. Enable it in phone Settings → Apps → MamaPlus → Notifications.')
  }

  const projectId = getProjectId()
  if (!projectId) {
    throw new Error('EAS projectId missing; cannot get Expo push token')
  }

  const push = await Notifications.getExpoPushTokenAsync({ projectId })
  if (!push.data) {
    throw new Error('Expo did not return a push token')
  }
  return push.data
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
