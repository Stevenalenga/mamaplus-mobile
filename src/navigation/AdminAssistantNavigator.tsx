import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View } from 'react-native'
import AdminAssistantHomeScreen from '../screens/admin-assistant/AdminAssistantHomeScreen'
import CoursesScreen from '../screens/CoursesScreen'
import ProfileStackNavigator from './ProfileStackNavigator'
import { useTabBarScreenOptions } from './useTabBarScreenOptions'
import { AdminAssistantTabParamList } from '../types'

const Tab = createBottomTabNavigator<AdminAssistantTabParamList>()

function BrowseCoursesScreen() {
  return <CoursesScreen canEnroll={false} />
}

function icon(emoji: string, focused: boolean) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
    </View>
  )
}

export default function AdminAssistantNavigator() {
  const screenOptions = useTabBarScreenOptions()

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={AdminAssistantHomeScreen}
        options={{ tabBarIcon: ({ focused }) => icon('🏠', focused) }}
      />
      <Tab.Screen
        name="Courses"
        component={BrowseCoursesScreen}
        options={{ tabBarLabel: 'Browse', tabBarIcon: ({ focused }) => icon('📚', focused) }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarIcon: ({ focused }) => icon('👤', focused) }}
      />
    </Tab.Navigator>
  )
}
