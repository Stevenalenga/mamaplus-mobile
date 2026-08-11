import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useAuth } from '../../context/AuthContext'
import { fetchAdminStats } from '../../api/client'
import { ROLE_DISPLAY_NAMES } from '../../constants'
import { AdminTabParamList } from '../../types'

type StatsData = {
  users: { total: number; newThisWeek: number; newThisMonth: number; byRole: Record<string, number> }
  enrollments: { total: number; active: number; completed: number; avgProgress: number }
  courses: {
    published: number
    draft: number
    topByEnrollment: Array<{ id: string; title: string; enrollments: number }>
  }
  revenue: {
    byCurrency: Array<{ currency: string; total: number; count: number }>
    overTime: Array<{ date: string; amount: number }>
  }
  schools: { active: number; educators: number }
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string
    createdAt: string
  }>
}

type NavProp = BottomTabNavigationProp<AdminTabParamList>

export default function AdminHomeScreen() {
  const { user, token } = useAuth()
  const navigation = useNavigation<NavProp>()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    try {
      setError('')
      const res = await fetchAdminStats(token)
      if (res.success && res.data) {
        setStats({
          ...res.data,
          schools: res.data.schools ?? { active: 0, educators: 0 },
          revenue: {
            byCurrency: res.data.revenue?.byCurrency ?? [],
            overTime: res.data.revenue?.overTime ?? [],
          },
          recentActivity: res.data.recentActivity ?? [],
        })
      } else {
        setError('Failed to load dashboard stats')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading overview…</Text>
        </View>
      </SafeAreaView>
    )
  }

  const totalRevenue = (stats?.revenue.byCurrency ?? []).reduce((sum, r) => sum + (r.total || 0), 0)
  const revenueLabel =
    (stats?.revenue.byCurrency ?? [])
      .map((r) => `${r.currency} ${(r.total || 0).toLocaleString()}`)
      .join(' · ') || 'No revenue yet'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name ?? 'Administrator'}</Text>
        <Text style={styles.subtitle}>Live metrics across users, courses, and revenue</Text>

        {error || !stats ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error || 'Unable to load dashboard'}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setLoading(true)
                load()
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {[
                {
                  label: 'Total Users',
                  value: String(stats.users.total),
                  sub: `+${stats.users.newThisWeek} this week`,
                  color: '#2563eb',
                  bg: '#eff6ff',
                },
                {
                  label: 'Enrollments',
                  value: String(stats.enrollments.total),
                  sub: `${stats.enrollments.active} active`,
                  color: '#7c3aed',
                  bg: '#f5f3ff',
                },
                {
                  label: 'Courses',
                  value: String(stats.courses.published),
                  sub: `${stats.courses.draft} drafts`,
                  color: '#0891b2',
                  bg: '#ecfeff',
                },
                {
                  label: 'Avg Progress',
                  value: `${stats.enrollments.avgProgress}%`,
                  sub: `${stats.enrollments.completed} completed`,
                  color: '#16a34a',
                  bg: '#f0fdf4',
                },
                {
                  label: 'Revenue',
                  value: totalRevenue > 0 ? totalRevenue.toLocaleString() : '—',
                  sub: revenueLabel,
                  color: '#d97706',
                  bg: '#fffbeb',
                },
                {
                  label: 'Schools',
                  value: String(stats.schools.active),
                  sub: `${stats.schools.educators} educators`,
                  color: '#db2777',
                  bg: '#fdf2f8',
                },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statSub} numberOfLines={2}>
                    {s.sub}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('Manage')}
              >
                <Text style={styles.actionBtnText}>Manage Users</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={() => navigation.navigate('Courses')}
              >
                <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Courses</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Users by Role</Text>
              {Object.entries(stats.users.byRole).map(([role, count]) => (
                <View key={role} style={styles.roleRow}>
                  <Text style={styles.roleLabel}>{ROLE_DISPLAY_NAMES[role] ?? role}</Text>
                  <Text style={styles.roleCount}>{count}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top Courses</Text>
              {stats.courses.topByEnrollment.length === 0 ? (
                <Text style={styles.emptyText}>No enrollments yet</Text>
              ) : (
                stats.courses.topByEnrollment.map((course, index) => (
                  <View key={course.id} style={styles.topCourseRow}>
                    <Text style={styles.topCourseRank}>{index + 1}</Text>
                    <Text style={styles.topCourseTitle} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <Text style={styles.topCourseCount}>{course.enrollments}</Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {stats.recentActivity.length === 0 ? (
              <Text style={styles.emptyText}>No recent activity</Text>
            ) : (
              stats.recentActivity.map((item) => (
                <View key={item.id} style={styles.activityCard}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityDesc}>{item.description}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(item.createdAt).toLocaleString('en-KE')}
                  </Text>
                </View>
              ))
            )}
          </>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '47%', borderRadius: 14, padding: 14, ...shadow },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  statSub: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#fff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnPrimary: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  actionBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  actionBtnTextPrimary: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...shadow,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  roleLabel: { color: '#64748b', fontSize: 14 },
  roleCount: { fontWeight: '700', color: '#0f172a' },
  topCourseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  topCourseRank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#eff6ff',
    textAlign: 'center',
    lineHeight: 22,
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12,
    marginRight: 10,
    overflow: 'hidden',
  },
  topCourseTitle: { flex: 1, color: '#0f172a', fontWeight: '600', fontSize: 14 },
  topCourseCount: { color: '#64748b', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    ...shadow,
  },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  activityDesc: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  activityTime: { fontSize: 11, color: '#94a3b8' },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  errorText: { color: '#b91c1c', textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
})
