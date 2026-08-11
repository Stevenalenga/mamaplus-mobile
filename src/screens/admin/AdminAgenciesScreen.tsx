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
import { fetchAdminAgencies } from '../../api/client'
import { AdminManageStackParamList } from '../../types'

type Props = NativeStackScreenProps<AdminManageStackParamList, 'Agencies'>

export default function AdminAgenciesScreen({ navigation }: Props) {
  const { token } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [placementStats, setPlacementStats] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchAdminAgencies(token, {
        search: search.trim() || undefined,
        limit: 50,
      })
      if (res.success) {
        setItems(res.data.agencies ?? [])
        setPlacementStats(res.data.placementStats ?? {})
        setTotal(res.data.total ?? 0)
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load agencies')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, search])

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
        <Text style={styles.title}>Agencies</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search agencies"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
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
          {Object.keys(placementStats).length > 0 ? (
            <View style={styles.statsRow}>
              {Object.entries(placementStats).map(([status, count]) => (
                <View key={status} style={styles.statChip}>
                  <Text style={styles.statCount}>{count}</Text>
                  <Text style={styles.statLabel}>{status}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.count}>{total} agencies</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.name}>{item.name || 'Unnamed agency'}</Text>
              <Text style={styles.email}>{item.email}</Text>
              {item.phoneNumber ? <Text style={styles.meta}>{item.phoneNumber}</Text> : null}
              <Text style={styles.meta}>
                {item._count?.recruitedCaregivers ?? 0} caregivers recruited
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
  filters: { padding: 16, backgroundColor: '#fff' },
  search: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0f172a',
  },
  list: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statChip: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statCount: { fontWeight: '800', color: '#2563eb' },
  statLabel: { fontSize: 11, color: '#64748b' },
  count: { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 8,
  },
  name: { fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  email: { color: '#64748b', fontSize: 13 },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
})
