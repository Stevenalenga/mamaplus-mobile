import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { ROLE_DISPLAY_NAMES } from '../constants'

type MenuItem = {
  icon: string
  label: string
  subtitle?: string
  danger?: boolean
  onPress?: () => void
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  const roleLabel = user ? (ROLE_DISPLAY_NAMES[user.role] ?? user.role) : ''

  const menuItems: MenuItem[] = [
    { icon: '✏️', label: 'Edit Profile', subtitle: 'Update your name & photo' },
    { icon: '🔔', label: 'Notifications', subtitle: 'Manage your alerts' },
    { icon: '🔒', label: 'Change Password', subtitle: 'Keep your account secure' },
    { icon: '🌐', label: 'Language', subtitle: 'English' },
    { icon: '❓', label: 'Help & Support', subtitle: 'FAQs and contact us' },
    { icon: '📄', label: 'Terms & Privacy', subtitle: 'Legal information' },
  ]

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Avatar + info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
          {user?.isVerified && (
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedText}>✅ Verified Account</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Courses', value: '2' },
            { label: 'Completed', value: '1' },
            { label: 'Certificates', value: '1' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, index < menuItems.length - 1 && styles.menuRowBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                  {item.label}
                </Text>
                {item.subtitle && <Text style={styles.menuSub}>{item.subtitle}</Text>}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MamaPlus v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(15,23,42,0.07)' } as any,
  default: { shadowColor: '#0f172a', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...shadow,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#ffffff', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b', marginBottom: 10 },
  roleBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 8,
  },
  roleBadgeText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  verifiedRow: { marginTop: 4 },
  verifiedText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...shadow,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2563eb' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadow,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  menuLabelDanger: { color: '#ef4444' },
  menuSub: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  chevron: { fontSize: 20, color: '#cbd5e1' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  signOutIcon: { fontSize: 18 },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: '#cbd5e1', fontSize: 12 },
})
