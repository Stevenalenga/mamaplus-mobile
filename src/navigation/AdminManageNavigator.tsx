import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AdminManageHomeScreen from '../screens/admin/AdminManageHomeScreen'
import AdminUsersScreen from '../screens/admin/AdminUsersScreen'
import AdminEnrollmentsScreen from '../screens/admin/AdminEnrollmentsScreen'
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen'
import AdminAgenciesScreen from '../screens/admin/AdminAgenciesScreen'
import AdminReviewsScreen from '../screens/admin/AdminReviewsScreen'
import AdminCertificatesScreen from '../screens/admin/AdminCertificatesScreen'
import AdminSchoolsScreen from '../screens/admin/AdminSchoolsScreen'
import BlogScreen from '../screens/BlogScreen'
import { AdminManageStackParamList } from '../types'

const Stack = createNativeStackNavigator<AdminManageStackParamList>()

function ManageBlogScreen() {
  return <BlogScreen embeddedInProfile />
}

export default function AdminManageNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManageHome" component={AdminManageHomeScreen} />
      <Stack.Screen name="Users" component={AdminUsersScreen} />
      <Stack.Screen name="Enrollments" component={AdminEnrollmentsScreen} />
      <Stack.Screen name="Payments" component={AdminPaymentsScreen} />
      <Stack.Screen name="Agencies" component={AdminAgenciesScreen} />
      <Stack.Screen name="Reviews" component={AdminReviewsScreen} />
      <Stack.Screen name="Certificates" component={AdminCertificatesScreen} />
      <Stack.Screen name="Schools" component={AdminSchoolsScreen} />
      <Stack.Screen name="Blog" component={ManageBlogScreen} />
    </Stack.Navigator>
  )
}
