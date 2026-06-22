import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoadingScreen from './src/screens/LoadingScreen'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import UserNavigator from './src/navigation/TabNavigator'
import AgencyNavigator from './src/navigation/AgencyNavigator'
import EducatorNavigator from './src/navigation/EducatorNavigator'
import AdminAssistantNavigator from './src/navigation/AdminAssistantNavigator'
import AdminNavigator from './src/navigation/AdminNavigator'
import { RootStackParamList } from './src/types'

const Stack = createNativeStackNavigator<RootStackParamList>()

function AppNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // ── Unauthenticated ───────────────────────────────────────────────
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'PENDING' ? (
          // ── Onboarding (new users) ────────────────────────────────────────
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : user.role === 'AGENCY' ? (
          // ── Agency ────────────────────────────────────────────────────────
          <Stack.Screen name="AgencyMain" component={AgencyNavigator} />
        ) : user.role === 'INSTRUCTOR' ? (
          // ── Educator ──────────────────────────────────────────────────────
          <Stack.Screen name="EducatorMain" component={EducatorNavigator} />
        ) : user.role === 'ADMIN_ASSISTANT' ? (
          // ── Admin Assistant ───────────────────────────────────────────────
          <Stack.Screen name="AdminAssistantMain" component={AdminAssistantNavigator} />
        ) : user.role === 'ADMIN' ? (
          // ── Administrator ─────────────────────────────────────────────────
          <Stack.Screen name="AdminMain" component={AdminNavigator} />
        ) : (
          // ── Caregiver (USER) — default ────────────────────────────────────
          <Stack.Screen name="UserMain" component={UserNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
