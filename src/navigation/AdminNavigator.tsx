import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View } from 'react-native'
import AdminHomeScreen from '../screens/admin/AdminHomeScreen'
import AdminCoursesScreen from '../screens/admin/AdminCoursesScreen'
import AdminSchoolsScreen from '../screens/admin/AdminSchoolsScreen'
import ProfileStackNavigator from './ProfileStackNavigator'
import { AdminTabParamList } from '../types'
import { useTabBarScreenOptions } from './useTabBarScreenOptions'

const Tab = createBottomTabNavigator<AdminTabParamList>()

function icon(emoji: string, focused: boolean) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
    </View>
  )
}

export default function AdminNavigator() {
  const screenOptions = useTabBarScreenOptions()

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={AdminHomeScreen}
        options={{ tabBarIcon: ({ focused }) => icon('🏠', focused) }}
      />
      <Tab.Screen
        name="Courses"
        component={AdminCoursesScreen}
        options={{ tabBarLabel: 'Courses', tabBarIcon: ({ focused }) => icon('📚', focused) }}
      />
      <Tab.Screen
        name="Schools"
        component={AdminSchoolsScreen}
        options={{ tabBarLabel: 'Schools', tabBarIcon: ({ focused }) => icon('🏫', focused) }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarIcon: ({ focused }) => icon('👤', focused) }}
      />
    </Tab.Navigator>
  )
}
