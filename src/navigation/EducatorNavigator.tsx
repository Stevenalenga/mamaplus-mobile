import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Platform, StyleSheet, Text, View } from 'react-native'
import EducatorHomeScreen from '../screens/educator/EducatorHomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { EducatorTabParamList } from '../types'

const Tab = createBottomTabNavigator<EducatorTabParamList>()

const PRIMARY = '#2563eb'
const INACTIVE = '#94a3b8'

function icon(emoji: string, focused: boolean) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
    </View>
  )
}

export default function EducatorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={EducatorHomeScreen}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ focused }) => icon('📊', focused) }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => icon('👤', focused) }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    ...Platform.select({
      web: { boxShadow: '0 -2px 12px rgba(15,23,42,0.06)' } as any,
      default: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 },
    }),
  },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tabItem: { paddingTop: 4 },
})
