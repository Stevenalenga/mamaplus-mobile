import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CompositeNavigationProp } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { ROLE_DISPLAY_NAMES, ROLE_DASHBOARD_LABELS } from '../constants'
import { fetchCurrentUser, fetchEnrollments } from '../api/client'
import MamaPlusLogo from '../components/MamaPlusLogo'
import { UserStackParamList, UserTabParamList } from '../types'

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<UserTabParamList, 'Home'>,
  NativeStackNavigationProp<UserStackParamList>
>

type EnrolledCourse = {
  courseId: string
  title: string
  progress: number
}

export default function HomeScreen() {
  const { user, token } = useAuth()
  const navigation = useNavigation<NavProp>()
  const [stats, setStats] = useState({ enrollments: 0, payments: 0, reviews: 0 })
  const [inProgress, setInProgress] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [meRes, enrollRes] = await Promise.all([
        fetchCurrentUser(token),
        fetchEnrollments(token),
      ])
      if (meRes.success && meRes.data._count) {
        setStats({
          enrollments: meRes.data._count.enrollments ?? 0,
          payments: meRes.data._count.payments ?? 0,
          reviews: meRes.data._count.reviews ?? 0,
        })
      }
      if (enrollRes.success) {
        const active = enrollRes.data
          .filter((e: any) => (e.progress ?? 0) < 100)
          .map((e: any) => ({
            courseId: e.courseId,
            title: e.course?.title ?? 'Course',
            progress: e.progress ?? 0,
          }))
        setInProgress(active)
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const roleLabel = user ? (ROLE_DISPLAY_NAMES[user.role] ?? user.role) : 'Guest'
  const description = user ? (ROLE_DASHBOARD_LABELS[user.role] ?? '') : ''

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <MamaPlusLogo width={150} height={50} />
        </View>

        <View style={styles.card}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name ?? 'User'} 👋</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Courses')} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionLabel}>Browse{'\n'}Courses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Courses')} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionLabel}>Track{'\n'}Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>My{'\n'}Profile</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#2563eb" style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.statsRow}>
              {[
                { label: 'Enrolled', value: stats.enrollments },
                { label: 'Payments', value: stats.payments },
                { label: 'Reviews', value: stats.reviews },
              ].map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {inProgress.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>In Progress</Text>
                {inProgress.map((c) => (
                  <TouchableOpacity
                    key={c.courseId}
                    style={styles.progressCard}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: c.courseId, courseTitle: c.title })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.progressTitle}>{c.title}</Text>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${c.progress}%` as any }]} />
                    </View>
                    <Text style={styles.progressPct}>{c.progress}% complete</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 32 },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(15,23,42,0.08)' },
      default: { elevation: 4 },
    }),
  },
  greeting: { fontSize: 16, color: '#64748b', marginBottom: 4 },
  name: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  roleBadgeText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  description: { color: '#475569', fontSize: 15, lineHeight: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      default: { elevation: 2 },
    }),
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center', lineHeight: 17 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: '#f1f5f9' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2563eb' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  progressTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  progressTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#2563eb' },
  progressPct: { fontSize: 12, color: '#64748b' },
})
