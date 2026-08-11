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
import { fetchAdminCertificates, revokeAdminCertificate } from '../../api/client'
import { AdminManageStackParamList } from '../../types'

type Props = NativeStackScreenProps<AdminManageStackParamList, 'Certificates'>

export default function AdminCertificatesScreen({ navigation }: Props) {
  const { token } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchAdminCertificates(token, search.trim() || undefined)
      if (res.success) setItems(res.data ?? [])
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load certificates')
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

  function revoke(item: any) {
    if (!token) return
    Alert.alert('Revoke certificate?', item.certificateNumber, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await revokeAdminCertificate(token, item.id)
            load()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Revoke failed')
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Certificates</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search certificate #, name, email"
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
          {items.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => revoke(item)}>
              <Text style={styles.number}>{item.certificateNumber}</Text>
              <Text style={styles.user}>{item.user?.name || item.user?.email}</Text>
              <Text style={styles.meta}>
                Issued {new Date(item.issuedAt).toLocaleDateString('en-KE')}
              </Text>
              <Text style={styles.hint}>Tap to revoke</Text>
            </TouchableOpacity>
          ))}
          {items.length === 0 ? <Text style={styles.empty}>No certificates found</Text> : null}
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 8,
  },
  number: { fontWeight: '800', color: '#2563eb', marginBottom: 4 },
  user: { color: '#0f172a', fontWeight: '600', marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 12 },
  hint: { color: '#94a3b8', fontSize: 11, marginTop: 8 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 24 },
})
