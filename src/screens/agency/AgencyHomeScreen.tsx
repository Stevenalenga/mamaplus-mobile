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
import { fetchAgencyStats, fetchAvailableCaregivers, recruitCaregiver } from '../../api/client'

type AgencyStats = {
  totalCaregivers: number
  activeCaregivers: number
  completedPlacements: number
  inactiveCaregivers: number
  avgRating: number
  ratedCount: number
}

type Caregiver = {
  id: string
  name: string | null
  email: string
  gender: string | null
  phoneNumber: string | null
  createdAt: string
  _count: { enrollments: number; certificates: number }
}

export default function AgencyHomeScreen() {
  const { user, token } = useAuth()

  const [stats, setStats] = useState<AgencyStats | null>(null)
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recruitingId, setRecruitingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!token) return
    try {
      const [statsRes, caregiversRes] = await Promise.allSettled([
        fetchAgencyStats(token),
        fetchAvailableCaregivers(token),
      ])

      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.data)
      }
      if (caregiversRes.status === 'fulfilled' && caregiversRes.value.success) {
        setCaregivers(caregiversRes.value.data)
      }
    } catch (err) {
      console.warn('Agency loadData failed', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleRecruit(caregiver: Caregiver) {
    if (!token) return
    Alert.alert(
      'Recruit Caregiver',
      `Add ${caregiver.name || caregiver.email} to your agency?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recruit',
          onPress: async () => {
            setRecruitingId(caregiver.id)
            try {
              const res = await recruitCaregiver(token, caregiver.id)
              if (res.success) {
                setCaregivers((prev) => prev.filter((c) => c.id !== caregiver.id))
                loadData()
              }
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to recruit caregiver.')
            } finally {
              setRecruitingId(null)
            }
          },
        },
      ]
    )
  }

  const statItems = [
    { label: 'Total Caregivers', value: stats?.totalCaregivers ?? 0, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Active Placements', value: stats?.activeCaregivers ?? 0, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Completed', value: stats?.completedPlacements ?? 0, color: '#d97706', bg: '#fffbeb' },
    {
      label: 'Avg Rating',
      value: stats?.avgRating ? stats.avgRating.toFixed(1) : '—',
      color: '#7c3aed',
      bg: '#f5f3ff',
    },
  ]

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
        <Text style={styles.name}>{user?.name ?? 'Agency'}</Text>
        <Text style={styles.subtitle}>Manage caregivers, track placements, and grow your agency.</Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {statItems.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Available caregivers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Caregivers</Text>
          <Text style={styles.sectionCount}>{caregivers.length} available</Text>
        </View>

        {caregivers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No available caregivers</Text>
            <Text style={styles.emptyDesc}>All caregivers on the platform have already been recruited.</Text>
          </View>
        ) : (
          caregivers.slice(0, 10).map((cg) => (
            <View key={cg.id} style={styles.caregiverCard}>
              <View style={styles.cgAvatar}>
                <Text style={styles.cgAvatarText}>
                  {(cg.name || cg.email)[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.cgInfo}>
                <Text style={styles.cgName}>{cg.name || 'Unnamed Caregiver'}</Text>
                <Text style={styles.cgEmail} numberOfLines={1}>{cg.email}</Text>
                <View style={styles.cgMeta}>
                  {cg.gender ? (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{cg.gender}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.metaText}>{cg._count.enrollments} courses</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{cg._count.certificates} certs</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.recruitBtn, recruitingId === cg.id && styles.recruitBtnDisabled]}
                onPress={() => handleRecruit(cg)}
                disabled={recruitingId === cg.id}
                activeOpacity={0.85}
              >
                {recruitingId === cg.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.recruitBtnText}>Recruit</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {caregivers.length > 10 && (
          <Text style={styles.moreText}>+{caregivers.length - 10} more caregivers available</Text>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    padding: 16,
    ...shadow,
  },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  sectionCount: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    ...shadow,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  caregiverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  cgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cgAvatarText: { color: '#2563eb', fontWeight: '800', fontSize: 18 },
  cgInfo: { flex: 1 },
  cgName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  cgEmail: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  cgMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaPill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metaPillText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  metaText: { fontSize: 11, color: '#94a3b8' },
  metaDot: { fontSize: 11, color: '#cbd5e1' },
  recruitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  recruitBtnDisabled: { opacity: 0.6 },
  recruitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  moreText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 8 },
})
