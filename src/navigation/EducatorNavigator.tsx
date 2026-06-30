import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View } from 'react-native'
import EducatorHomeScreen from '../screens/educator/EducatorHomeScreen'
import CoursesScreen from '../screens/CoursesScreen'
import ProfileStackNavigator from './ProfileStackNavigator'
import { EducatorTabParamList } from '../types'
import { useTabBarScreenOptions } from './useTabBarScreenOptions'

const Tab = createBottomTabNavigator<EducatorTabParamList>()

function icon(emoji: string, focused: boolean) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
    </View>
  )
}

function BrowseCoursesScreen() {
  return <CoursesScreen canEnroll={false} />
}

export default function EducatorNavigator() {
  const screenOptions = useTabBarScreenOptions()

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={EducatorHomeScreen}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ focused }) => icon('📊', focused) }}
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
