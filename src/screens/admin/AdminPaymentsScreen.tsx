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
import { fetchAdminPayments } from '../../api/client'
import { AdminManageStackParamList } from '../../types'

type Props = NativeStackScreenProps<AdminManageStackParamList, 'Payments'>

const STATUSES = ['SUCCESS', 'PENDING', 'FAILED', 'ABANDONED', 'REFUNDED']

export default function AdminPaymentsScreen({ navigation }: Props) {
  const { token } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchAdminPayments(token, {
        search: search.trim() || undefined,
        status: status || undefined,
        limit: 50,
      })
      if (res.success) {
        setItems(res.data.payments ?? [])
        setSummary(res.data.summary ?? [])
        setTotal(res.data.total ?? 0)
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load payments')
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payments</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search reference, name, email"
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
          {summary.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
              {summary.map((s, idx) => (
                <View key={`${s.currency}-${s.status}-${idx}`} style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>
                    {s.currency} {(s.total || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.summaryLabel}>
                    {s.status} · {s.count}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <Text style={styles.count}>{total} payments</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.amount}>
                  {item.currency} {(item.amount || 0).toLocaleString()}
                </Text>
                <Text style={styles.badge}>{item.status}</Text>
              </View>
              <Text style={styles.user}>{item.user?.name || item.user?.email}</Text>
              <Text style={styles.meta}>
                {item.paymentMethod || '—'} · {item.reference || 'No reference'}
              </Text>
              <Text style={styles.meta}>
                {item.paidAt
                  ? new Date(item.paidAt).toLocaleString('en-KE')
                  : new Date(item.createdAt).toLocaleString('en-KE')}
              </Text>
            </View>
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
  summaryRow: { gap: 8, marginBottom: 12 },
  summaryCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 140,
  },
  summaryValue: { fontWeight: '800', color: '#2563eb', marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: '#64748b' },
  count: { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 8,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  amount: { fontWeight: '800', color: '#0f172a', fontSize: 16 },
  badge: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  user: { color: '#334155', fontWeight: '600', marginBottom: 4 },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
})
