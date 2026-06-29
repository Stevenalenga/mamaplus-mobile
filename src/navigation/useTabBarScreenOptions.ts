import { Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'

/** Icon + label area above the home-indicator / nav-bar inset */
const TAB_CONTENT_HEIGHT = 56

const PRIMARY = '#2563eb'
const INACTIVE = '#94a3b8'

export function useTabBarScreenOptions(): BottomTabNavigationOptions {
  const insets = useSafeAreaInsets()

  // Use device-reported inset; fall back on Android when the OS reports 0
  // (some 3-button nav devices still overlay the tab bar).
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 16 : 0
  )

  const tabBarHeight = TAB_CONTENT_HEIGHT + bottomInset + 8

  return {
    headerShown: false,
    tabBarActiveTintColor: PRIMARY,
    tabBarInactiveTintColor: INACTIVE,
    tabBarStyle: {
      backgroundColor: '#ffffff',
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
      height: tabBarHeight,
      paddingBottom: bottomInset,
      paddingTop: 8,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: '0 -2px 12px rgba(15,23,42,0.06)' } as object)
        : {
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 8,
          }),
    },
    tabBarLabelStyle: tabBarStyles.label,
    tabBarItemStyle: tabBarStyles.tabItem,
  }
}

const tabBarStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tabItem: { paddingTop: 4 },
})
