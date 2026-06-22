import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { fetchAdminUsers, fetchCourses } from '../../api/client'
import { ROLE_DISPLAY_NAMES } from '../../constants'

type AdminUser = {
  id: string
  name: string | null
  email: string
  role: string
  isVerified: boolean
  createdAt: string
}

export default function AdminHomeScreen() {
  const { user, token } = useAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [totalCourses, setTotalCourses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!token) return
    try {
      const [usersRes, coursesRes] = await Promise.allSettled([
        fetchAdminUsers(token),
        fetchCourses(token),
      ])

      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        setUsers(usersRes.value.data)
      }
      if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
        setTotalCourses(coursesRes.value.data.length)
      }
    } catch (err) {
      console.warn('Admin loadData', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { loadData() }, [loadData])

  const roleBreakdown = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {})

  const verifiedCount = users.filter((u) => u.isVerified).length

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} tintColor="#2563eb" />}
      >
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name ?? 'Administrator'}</Text>
        <Text style={styles.subtitle}>Full access to platform controls, users, and content.</Text>

        {/* Platform stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Users', value: users.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Verified', value: verifiedCount, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Total Courses', value: totalCourses, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Unverified', value: users.length - verifiedCount, color: '#d97706', bg: '#fffbeb' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Role breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Users by Role</Text>
          <View style={styles.roleGrid}>
            {Object.entries(roleBreakdown).map(([role, count]) => (
              <View key={role} style={styles.roleItem}>
                <Text style={styles.roleCount}>{count}</Text>
                <Text style={styles.roleLabel}>{ROLE_DISPLAY_NAMES[role] ?? role}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent users */}
        <Text style={styles.sectionTitle}>Recent Users</Text>
        {users.slice(0, 10).map((u) => (
          <View key={u.id} style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(u.name || u.email)[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{u.name || 'Unnamed'}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
            </View>
            <View style={styles.userRight}>
              <View style={[styles.badge, { backgroundColor: '#f1f5f9' }]}>
                <Text style={styles.badgeText}>{ROLE_DISPLAY_NAMES[u.role] ?? u.role}</Text>
              </View>
              {u.isVerified && (
                <Text style={styles.verifiedDot}>✓</Text>
              )}
            </View>
          </View>
        ))}

        {users.length > 10 && (
          <Text style={styles.moreText}>+{users.length - 10} more users</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 8px rgba(15,23,42,0.06)' } as any,
  default: { shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748b' },
  container: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 16, color: '#64748b', marginBottom: 2 },
  name: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '47%', borderRadius: 14, padding: 16, ...shadow },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...shadow,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  roleCount: { fontSize: 20, fontWeight: '800', color: '#2563eb', marginBottom: 2 },
  roleLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    ...shadow,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: { color: '#2563eb', fontWeight: '800', fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#64748b' },
  userRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  verifiedDot: { color: '#16a34a', fontWeight: '800', fontSize: 14 },
  moreText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 8 },
})
