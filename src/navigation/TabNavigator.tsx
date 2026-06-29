import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Platform, StyleSheet, View } from 'react-native'
import HomeScreen from '../screens/HomeScreen'
import CoursesScreen from '../screens/CoursesScreen'
import ProfileStackNavigator from './ProfileStackNavigator'
import CourseDetailScreen from '../screens/CourseDetailScreen'
import { UserTabParamList, UserStackParamList } from '../types'
import { useTabBarScreenOptions } from './useTabBarScreenOptions'

const Tab = createBottomTabNavigator<UserTabParamList>()
const Stack = createNativeStackNavigator<UserStackParamList>()

const PRIMARY = '#2563eb'
const INACTIVE = '#94a3b8'

function HomeIcon({ focused }: { focused: boolean }) {
  const color = focused ? PRIMARY : INACTIVE
  return (
    <View style={icon.wrap}>
      <View style={[icon.roofBase, { borderBottomColor: color }]} />
      <View style={[icon.houseBody, { borderColor: color, borderTopWidth: 0 }]}>
        <View style={[icon.door, { borderColor: color }]} />
      </View>
    </View>
  )
}

function CoursesIcon({ focused }: { focused: boolean }) {
  const color = focused ? PRIMARY : INACTIVE
  return (
    <View style={icon.wrap}>
      <View style={[icon.book, { borderColor: color }]}>
        <View style={[icon.bookSpine, { backgroundColor: color }]} />
        <View style={[icon.line, { backgroundColor: color, marginTop: 3 }]} />
        <View style={[icon.line, { backgroundColor: color, marginTop: 3 }]} />
        <View style={[icon.line, { backgroundColor: color, marginTop: 3, width: '60%' }]} />
      </View>
    </View>
  )
}

function ProfileIcon({ focused }: { focused: boolean }) {
  const color = focused ? PRIMARY : INACTIVE
  return (
    <View style={icon.wrap}>
      <View style={[icon.head, { borderColor: color }]} />
      <View style={[icon.shoulders, { borderColor: color }]} />
    </View>
  )
}

const icon = StyleSheet.create({
  wrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'flex-end' },
  roofBase: {
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  houseBody: { width: 14, height: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'flex-end' },
  door: { width: 4, height: 6, borderWidth: 1.5, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  book: { width: 18, height: 22, borderWidth: 1.5, borderRadius: 2, flexDirection: 'row', padding: 3 },
  bookSpine: { width: 2, height: '100%', marginRight: 3, borderRadius: 1 },
  line: { height: 1.5, width: '100%', borderRadius: 1 },
  head: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, marginBottom: 2 },
  shoulders: { width: 20, height: 8, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 1.5, borderBottomWidth: 0 },
})

function UserTabs() {
  const screenOptions = useTabBarScreenOptions()

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <HomeIcon focused={focused} /> }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ tabBarIcon: ({ focused }) => <CoursesIcon focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} /> }} />
    </Tab.Navigator>
  )
}

/** USER navigator: tabs + course detail stack */
export default function UserNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        statusBarStyle: 'dark',
        ...(Platform.OS === 'android'
          ? {
              statusBarBackgroundColor: '#f8fafc',
              statusBarTranslucent: false,
            }
          : {}),
      }}
    >
      <Stack.Screen name="Tabs" component={UserTabs} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
    </Stack.Navigator>
  )
}
