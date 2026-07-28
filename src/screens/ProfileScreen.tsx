import { useCallback, useEffect, useState } from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { ROLE_DISPLAY_NAMES } from '../constants'
import { fetchCurrentUser, fetchEnrollments } from '../api/client'
import { ProfileStackParamList } from '../types'

type NavProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

export default function ProfileScreen() {
  const { user, token, signOut } = useAuth()
  const navigation = useNavigation<NavProp>()
  const [stats, setStats] = useState({ courses: 0, completed: 0, payments: 0 })

  const loadStats = useCallback(async () => {
    if (!token) return
    try {
      const [meRes, enrollRes] = await Promise.all([fetchCurrentUser(token), fetchEnrollments(token)])
      const enrollments = enrollRes.success ? enrollRes.data : []
      setStats({
        courses: enrollments.length,
        completed: enrollments.filter((e: any) => (e.progress ?? 0) >= 100).length,
        payments: meRes.success ? meRes.data._count?.payments ?? 0 : 0,
      })
    } catch {
      // keep defaults
    }
  }, [token])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const roleLabel = user ? (ROLE_DISPLAY_NAMES[user.role] ?? user.role) : ''
  const isAgency = user?.role === 'AGENCY'

  const menuItems = [
    { icon: '✏️', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') },
    ...(isAgency
      ? [{ icon: '👥', label: 'My Caregivers', onPress: () => navigation.navigate('AgencyCaregivers') }]
      : []),
    ...(user?.role !== 'USER'
      ? [{ icon: '📰', label: 'Blog', onPress: () => navigation.navigate('Blog') }]
      : []),
    { icon: '🔒', label: 'Change Password', onPress: () => navigation.navigate('ChangePassword') },
    { icon: '❓', label: 'Help & Support', onPress: () => navigation.navigate('Contact') },
  ]

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phoneNumber ? <Text style={styles.phone}>{user.phoneNumber}</Text> : null}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
          {user?.isVerified && <Text style={styles.verifiedText}>✅ Verified Account</Text>}
        </View>

        {user?.role === 'USER' && (
          <View style={styles.statsRow}>
            {[
              { label: 'Courses', value: String(stats.courses) },
              { label: 'Completed', value: String(stats.completed) },
              { label: 'Payments', value: String(stats.payments) },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, index < menuItems.length - 1 && styles.menuRowBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>MamaPlus v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(15,23,42,0.07)' } as any,
  default: { elevation: 3 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, ...shadow },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  phone: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  roleBadge: { backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8 },
  roleBadgeText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  verifiedText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, overflow: 'hidden', ...shadow },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: '#f1f5f9' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2563eb' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  menuCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', ...shadow },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0f172a' },
  chevron: { fontSize: 20, color: '#cbd5e1' },
  signOutBtn: { backgroundColor: '#fff1f2', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#fecdd3' },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: '#cbd5e1', fontSize: 12 },
})
