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
import { fetchAdminUsers, updateAdminUserRole } from '../../api/client'
import { ROLE_DISPLAY_NAMES } from '../../constants'
import { AdminManageStackParamList } from '../../types'

type Props = NativeStackScreenProps<AdminManageStackParamList, 'Users'>

type AdminUser = {
  id: string
  name: string | null
  email: string
  role: string
  phoneNumber?: string | null
  isVerified: boolean
  createdAt: string
  _count?: { enrollments: number }
}

const ROLES = ['USER', 'AGENCY', 'INSTRUCTOR', 'ADMIN_ASSISTANT', 'ADMIN', 'PENDING']

export default function AdminUsersScreen({ navigation }: Props) {
  const { user, token } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchAdminUsers(token, {
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        limit: 50,
      })
      if (res.success) {
        setUsers(res.data.users ?? [])
        setTotal(res.data.total ?? 0)
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, search, roleFilter])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => load(), 250)
    return () => clearTimeout(t)
  }, [load])

  function changeRole(target: AdminUser) {
    if (!token || target.id === user?.id) {
      Alert.alert('Not allowed', 'You cannot change your own role.')
      return
    }
    Alert.alert('Change role', `${target.name || target.email}`, [
      ...ROLES.map((role) => ({
        text: ROLE_DISPLAY_NAMES[role] ?? role,
        onPress: async () => {
          try {
            await updateAdminUserRole(token, target.id, role)
            load()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update role')
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
        <Text style={styles.title}>Users</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search name, email, phone"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, !roleFilter && styles.chipActive]}
            onPress={() => setRoleFilter(null)}
          >
            <Text style={[styles.chipText, !roleFilter && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {ROLES.map((role) => {
            const active = roleFilter === role
            return (
              <TouchableOpacity
                key={role}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setRoleFilter(role)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {ROLE_DISPLAY_NAMES[role] ?? role}
                </Text>
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
              tintColor="#2563eb"
            />
          }
        >
          <Text style={styles.count}>{total} users</Text>
          {users.map((u) => (
            <TouchableOpacity key={u.id} style={styles.row} onPress={() => changeRole(u)} activeOpacity={0.85}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(u.name || u.email)[0].toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{u.name || 'Unnamed'}</Text>
                <Text style={styles.email} numberOfLines={1}>
                  {u.email}
                </Text>
                {u.phoneNumber ? <Text style={styles.meta}>{u.phoneNumber}</Text> : null}
              </View>
              <View style={styles.right}>
                <Text style={styles.badge}>{ROLE_DISPLAY_NAMES[u.role] ?? u.role}</Text>
                <Text style={styles.meta}>{u._count?.enrollments ?? 0} enrolled</Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#2563eb', fontWeight: '800' },
  info: { flex: 1 },
  name: { fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  email: { color: '#64748b', fontSize: 12 },
  meta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  badge: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
})
