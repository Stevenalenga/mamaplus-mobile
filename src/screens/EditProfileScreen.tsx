import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/client'
import { ProfileStackParamList } from '../types'
import PhoneInput from '../components/PhoneInput'
import { parseStoredPhoneNumber } from '../lib/phone-countries'
import { validateAndFormatProfilePhone, validateEmail } from '../lib/validation'

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>

export default function EditProfileScreen({ navigation }: Props) {
  const { user, token, updateUser } = useAuth()
  const parsedPhone = useMemo(() => parseStoredPhoneNumber(user?.phoneNumber), [user?.phoneNumber])

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phoneCountry, setPhoneCountry] = useState(parsedPhone.countryCode)
  const [phoneNumber, setPhoneNumber] = useState(parsedPhone.nationalNumber)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!token || !user) return

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter your full name.')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.')
      return
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Missing phone', 'Please enter your phone number.')
      return
    }

    const phoneResult = validateAndFormatProfilePhone(phoneNumber.trim(), phoneCountry)
    if (!phoneResult.success) {
      Alert.alert('Invalid phone', phoneResult.message)
      return
    }

    setSaving(true)
    try {
      const res = await updateProfile(token, {
        name: trimmedName,
        email: trimmedEmail,
        phoneNumber: phoneResult.phoneNumber,
      })
      if (res.success) {
        updateUser({
          ...user,
          name: res.data.name,
          email: res.data.email,
          phoneNumber: res.data.phoneNumber,
        })
        Alert.alert('Saved', 'Profile updated successfully.')
        navigation.goBack()
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#94a3b8"
            editable={!saving}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!saving}
          />

          <Text style={styles.label}>Phone number</Text>
          <PhoneInput
            countryCode={phoneCountry}
            onCountryChange={setPhoneCountry}
            value={phoneNumber}
            onChange={setPhoneNumber}
            disabled={saving}
          />

          <TouchableOpacity
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  back: { color: '#2563eb', fontWeight: '600', marginRight: 12 },
  title: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  container: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  btn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
