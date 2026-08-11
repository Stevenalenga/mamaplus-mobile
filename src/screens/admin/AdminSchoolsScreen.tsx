import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuth } from '../../context/AuthContext'
import {
  createAdminSchool,
  deleteAdminSchool,
  fetchAdminSchools,
  updateAdminSchool,
} from '../../api/client'
import { AdminManageStackParamList } from '../../types'

type Props = NativeStackScreenProps<AdminManageStackParamList, 'Schools'>

type School = {
  id: string
  name: string
  location?: string | null
  county?: string | null
  studentCount?: number
  isActive?: boolean
  _count?: { educators: number }
}

export default function AdminSchoolsScreen({ navigation }: Props) {
  const { token } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [county, setCounty] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchAdminSchools(token)
      if (res.success) setSchools(res.data ?? [])
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load schools')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  function resetForm() {
    setName('')
    setLocation('')
    setCounty('')
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(school: School) {
    setEditingId(school.id)
    setName(school.name)
    setLocation(school.location || '')
    setCounty(school.county || '')
    setShowForm(true)
  }

  async function handleSave() {
    if (!token || !name.trim()) {
      Alert.alert('Name required', 'Please enter a school name.')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateAdminSchool(token, editingId, {
          name: name.trim(),
          location: location.trim() || undefined,
          county: county.trim() || undefined,
        })
      } else {
        await createAdminSchool(token, {
          name: name.trim(),
          location: location.trim() || undefined,
          county: county.trim() || undefined,
        })
      }
      resetForm()
      await load()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save school')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(school: School) {
    if (!token) return
    Alert.alert('Delete School', `Delete "${school.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminSchool(token, school.id)
            load()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed')
          }
        },
      },
    ])
  }

  async function toggleActive(school: School) {
    if (!token) return
    try {
      await updateAdminSchool(token, school.id, { isActive: !(school.isActive !== false) })
      load()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Schools</Text>
        <TouchableOpacity
          onPress={() => {
            if (showForm) resetForm()
            else {
              setEditingId(null)
              setShowForm(true)
            }
          }}
        >
          <Text style={styles.add}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                load()
              }}
            />
          }
        >
          {showForm ? (
            <View style={styles.form}>
              <Text style={styles.label}>{editingId ? 'Edit school' : 'New school'}</Text>
              <TextInput
                style={styles.input}
                placeholder="School name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Location"
                placeholderTextColor="#94a3b8"
                value={location}
                onChangeText={setLocation}
              />
              <TextInput
                style={styles.input}
                placeholder="County"
                placeholderTextColor="#94a3b8"
                value={county}
                onChangeText={setCounty}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save School'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {schools.map((school) => (
            <View key={school.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{school.name}</Text>
                <Switch
                  value={school.isActive !== false}
                  onValueChange={() => toggleActive(school)}
                />
              </View>
              <Text style={styles.meta}>
                {[school.location, school.county].filter(Boolean).join(' · ') || 'No location'}
              </Text>
              <Text style={styles.meta}>
                {school._count?.educators ?? 0} educators · {school.studentCount ?? 0} students
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => startEdit(school)}>
                  <Text style={styles.edit}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(school)}>
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {schools.length === 0 ? <Text style={styles.empty}>No schools yet</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  back: { color: '#2563eb', fontWeight: '600', marginRight: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0f172a' },
  add: { color: '#2563eb', fontWeight: '700' },
  container: { padding: 16, paddingBottom: 32 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
  },
  label: { fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 8,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  meta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  edit: { color: '#2563eb', fontWeight: '700' },
  delete: { color: '#dc2626', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 24 },
})
