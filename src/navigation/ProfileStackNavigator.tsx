import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import ProfileScreen from '../screens/ProfileScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import ChangePasswordScreen from '../screens/ChangePasswordScreen'
import AgencyCaregiversScreen from '../screens/agency/AgencyCaregiversScreen'
import ContactScreen from '../screens/ContactScreen'
import BlogScreen from '../screens/BlogScreen'
import BlogDetailScreen from '../screens/BlogDetailScreen'
import { ProfileStackParamList } from '../types'

const Stack = createNativeStackNavigator<ProfileStackParamList>()

function ProfileBlogScreen() {
  return <BlogScreen embeddedInProfile />
}

export default function ProfileStackNavigator() {
  const { user } = useAuth()
  const isAgency = user?.role === 'AGENCY'

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Blog" component={ProfileBlogScreen} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
      {isAgency ? (
        <Stack.Screen name="AgencyCaregivers" component={AgencyCaregiversScreen} />
      ) : null}
    </Stack.Navigator>
  )
}
