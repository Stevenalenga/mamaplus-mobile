import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { onboardUser } from '../api/client'
import MamaPlusLogo from '../components/MamaPlusLogo'

type Step = 'role' | 'gender'
type SelectedRole = 'USER' | 'AGENCY' | 'INSTRUCTOR'
type SelectedGender = 'MALE' | 'FEMALE'

const ROLE_OPTIONS: { value: SelectedRole; label: string; description: string; icon: string }[] = [
  {
    value: 'USER',
    label: 'Caregiver',
    description: 'I provide care for children, the elderly, or individuals with special needs',
    icon: '🤲',
  },
  {
    value: 'AGENCY',
    label: 'Agency',
    description: 'I represent a staffing or placement agency that manages caregivers',
    icon: '🏢',
  },
  {
    value: 'INSTRUCTOR',
    label: 'Educator',
    description: 'I create and teach courses on caregiving topics',
    icon: '📚',
  },
]

const GENDER_OPTIONS: { value: SelectedGender; label: string; icon: string }[] = [
  { value: 'MALE', label: 'Male', icon: '♂' },
  { value: 'FEMALE', label: 'Female', icon: '♀' },
]

export default function OnboardingScreen() {
  const { user, token, updateUser } = useAuth()

  const [step, setStep] = useState<Step>('role')
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null)
  const [selectedGender, setSelectedGender] = useState<SelectedGender | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!selectedRole || !token) return

    if (selectedRole === 'USER' && !selectedGender) {
      Alert.alert('Gender required', 'Please select your gender to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await onboardUser(
        token,
        selectedRole,
        selectedRole === 'USER' ? (selectedGender ?? undefined) : undefined
      )

      if (result.success && result.data) {
        // Merge the updated fields into the current user object
        const updatedUser = {
          ...user!,
          role: selectedRole,
          gender: selectedRole === 'USER' ? selectedGender : undefined,
        }
        updateUser(updatedUser)
        // AppNavigator will automatically re-render and route to the right tab
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.')
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRoleContinue() {
    if (!selectedRole) {
      Alert.alert('Role required', 'Please select your role to continue.')
      return
    }
    if (selectedRole === 'USER') {
      setStep('gender')
    } else {
      handleSubmit()
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <MamaPlusLogo width={160} height={54} />
        </View>

        {/* Header */}
        <Text style={styles.title}>
          {user?.name ? `Welcome, ${user.name}!` : 'Welcome!'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'role'
            ? 'Tell us who you are so we can personalise your experience.'
            : 'One more thing — please tell us your gender.'}
        </Text>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, step === 'role' ? styles.dotActive : styles.dotDone]} />
          <View
            style={[
              styles.dot,
              selectedRole === 'USER'
                ? step === 'gender'
                  ? styles.dotActive
                  : styles.dotInactive
                : styles.dotInactive,
            ]}
          />
        </View>

        {/* ── Step 1: Role ── */}
        {step === 'role' && (
          <View>
            {ROLE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  selectedRole === option.value && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedRole(option.value)}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                {selectedRole === option.value && (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.primaryBtn, (!selectedRole || isSubmitting) && styles.btnDisabled]}
              onPress={handleRoleContinue}
              disabled={!selectedRole || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Gender ── */}
        {step === 'gender' && (
          <View>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderCard,
                    selectedGender === option.value && styles.genderCardSelected,
                  ]}
                  onPress={() => setSelectedGender(option.value)}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  <Text style={styles.genderIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.genderLabel,
                      selectedGender === option.value && styles.genderLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[styles.outlineBtn, isSubmitting && styles.btnDisabled]}
                onPress={() => setStep('role')}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryBtnFlex,
                  (!selectedGender || isSubmitting) && styles.btnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedGender || isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Go to My Dashboard</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 8px rgba(15,23,42,0.08)' } as any,
  default: { shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 24, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotActive: { backgroundColor: '#2563eb' },
  dotDone: { backgroundColor: 'rgba(37,99,235,0.3)' },
  dotInactive: { backgroundColor: '#e2e8f0' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 12,
    ...shadow,
  },
  optionCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionIcon: { fontSize: 32, marginRight: 14 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  optionDesc: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkMark: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnFlex: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.5 },
  genderRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  genderCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingVertical: 32,
    alignItems: 'center',
    ...shadow,
  },
  genderCardSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  genderIcon: { fontSize: 40, marginBottom: 8 },
  genderLabel: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  genderLabelSelected: { color: '#2563eb' },
  genderButtons: { flexDirection: 'row', gap: 12 },
  outlineBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  outlineBtnText: { color: '#475569', fontWeight: '600', fontSize: 15 },
})
