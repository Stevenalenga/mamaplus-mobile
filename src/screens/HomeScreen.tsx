import { useMemo } from 'react'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { ROLE_DISPLAY_NAMES, ROLE_DASHBOARD_LABELS } from '../constants'
import MamaPlusLogo from '../components/MamaPlusLogo'

export default function HomeScreen() {
  const { user } = useAuth()

  const roleLabel = useMemo(() => {
    if (!user) return 'Guest'
    return ROLE_DISPLAY_NAMES[user.role] ?? user.role
  }, [user])

  const description = useMemo(() => {
    if (!user) return ''
    return ROLE_DASHBOARD_LABELS[user.role] ?? 'Your role dashboard is ready.'
  }, [user])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <MamaPlusLogo width={150} height={50} />
        </View>

        {/* Welcome card */}
        <View style={styles.card}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name ?? 'User'} 👋</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Quick stats */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionLabel}>Browse{'\n'}Courses</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionLabel}>Track{'\n'}Progress</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionLabel}>My{'\n'}Certificates</Text>
          </View>
        </View>

        {/* Next steps */}
        <Text style={styles.sectionTitle}>Next Steps</Text>
        <View style={styles.stepsCard}>
          {[
            { icon: '✅', text: 'Complete your profile' },
            { icon: '📖', text: 'Enroll in a course' },
            { icon: '🎯', text: 'Track your progress' },
          ].map((step) => (
            <View key={step.text} style={styles.stepRow}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(15,23,42,0.08)' },
      default: { shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    }),
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  roleBadgeText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 13,
  },
  description: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15,23,42,0.06)' },
      default: { shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    }),
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 17,
  },
  stepsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15,23,42,0.06)' },
      default: { shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    }),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepText: {
    fontSize: 15,
    color: '#334155',
  },
})
