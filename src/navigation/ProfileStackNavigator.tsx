import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import ProfileScreen from '../screens/ProfileScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import ChangePasswordScreen from '../screens/ChangePasswordScreen'
import AgencyCaregiversScreen from '../screens/agency/AgencyCaregiversScreen'
import ContactScreen from '../screens/ContactScreen'
import { ProfileStackParamList } from '../types'

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export default function ProfileStackNavigator() {
  const { user } = useAuth()
  const isAgency = user?.role === 'AGENCY'

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      {isAgency ? (
        <Stack.Screen name="AgencyCaregivers" component={AgencyCaregiversScreen} />
      ) : null}
    </Stack.Navigator>
  )
}
