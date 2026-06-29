import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View } from 'react-native'
import AgencyHomeScreen from '../screens/agency/AgencyHomeScreen'
import SearchCaregiversScreen from '../screens/agency/SearchCaregiversScreen'
import ProfileStackNavigator from './ProfileStackNavigator'
import { AgencyTabParamList } from '../types'
import { useTabBarScreenOptions } from './useTabBarScreenOptions'

const Tab = createBottomTabNavigator<AgencyTabParamList>()

function icon(emoji: string, focused: boolean) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
    </View>
  )
}

export default function AgencyNavigator() {
  const screenOptions = useTabBarScreenOptions()

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={AgencyHomeScreen}
        options={{ tabBarIcon: ({ focused }) => icon('🏠', focused) }}
      />
      <Tab.Screen
        name="Search"
        component={SearchCaregiversScreen}
        options={{ tabBarLabel: 'Search', tabBarIcon: ({ focused }) => icon('🔍', focused) }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarIcon: ({ focused }) => icon('👤', focused) }}
      />
    </Tab.Navigator>
  )
}
