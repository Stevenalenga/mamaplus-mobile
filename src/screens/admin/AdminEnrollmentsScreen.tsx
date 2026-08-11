import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuth } from '../../context/AuthContext'
import { fetchAdminEnrollments, updateAdminEnrollment } from '../../api/client'
import { AdminManageStackParamList } from '../../types'

type Props = NativeStackScreenProps<AdminManageStackParamList, 'Enrollments'>

const STATUSES = ['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED']

export default function AdminEnrollmentsScreen({ navigation }: Props) {
  const { token } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchAdminEnrollments(token, {
        search: search.trim() || undefined,
        status: status || undefined,
        limit: 50,
      })
      if (res.success) {
        setItems(res.data.enrollments ?? [])
        setTotal(res.data.total ?? 0)
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load enrollments')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, search, status])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => load(), 250)
    return () => clearTimeout(t)
  }, [load])

  function editEnrollment(item: any) {
    if (!token) return
    Alert.alert('Update enrollment', `${item.user?.name || item.user?.email} · ${item.course?.title}`, [
      ...STATUSES.map((s) => ({
        text: s,
        onPress: async () => {
          try {
            await updateAdminEnrollment(token, {
              enrollmentId: item.id,
              status: s,
              progress: s === 'COMPLETED' ? 100 : undefined,
            })
            load()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Update failed')
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Enrollments</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search user or course"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, !status && styles.chipActive]}
            onPress={() => setStatus(null)}
          >
            <Text style={[styles.chipText, !status && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {STATUSES.map((s) => {
            const active = status === s
            return (
              <TouchableOpacity
                key={s}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
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
          <Text style={styles.count}>{total} enrollments</Text>
          {items.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => editEnrollment(item)}>
              <Text style={styles.course}>{item.course?.title || 'Course'}</Text>
              <Text style={styles.user}>{item.user?.name || item.user?.email}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.badge}>{item.status}</Text>
                <Text style={styles.progress}>{item.progress ?? 0}%</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  title: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  filters: { padding: 16, paddingBottom: 8, backgroundColor: '#fff' },
  search: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#0f172a',
  },
  chips: { gap: 8, paddingBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  count: { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 8,
  },
  course: { fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  user: { color: '#64748b', fontSize: 13, marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progress: { fontWeight: '700', color: '#0f172a' },
})
