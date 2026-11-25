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
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { fetchSessions, revokeSession } from '../api/client'
import { AuthSession } from '../types'

function formatWhen(value: string) {
  try {
    return new Date(value).toLocaleString('en-KE')
  } catch {
    return value
  }
}

function deviceLabel(session: AuthSession) {
  if (!session.userAgent) return 'Unknown device'
  const ua = session.userAgent
  if (/android/i.test(ua)) return 'Android device'
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS device'
  if (/okhttp|expo|mamaplus/i.test(ua)) return 'Mobile app'
  if (/mozilla|chrome|safari/i.test(ua)) return 'Web browser'
  return ua.length > 48 ? `${ua.slice(0, 48)}…` : ua
}

export default function SessionsScreen() {
  const navigation = useNavigation()
  const { token, signOut } = useAuth()
  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchSessions(token)
      setSessions(res.data || [])
    } catch (error) {
      Alert.alert('Sessions', error instanceof Error ? error.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const onRevoke = (session: AuthSession) => {
    if (!token) return

    if (session.current) {
      Alert.alert('Sign out', 'This is your current session. Sign out of the app?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            signOut().catch(() => {})
          },
        },
      ])
      return
    }

    Alert.alert('Revoke session', `Sign out ${deviceLabel(session)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          setBusyId(session.id)
          try {
            await revokeSession(token, session.id)
            await load()
          } catch (error) {
            Alert.alert(
              'Could not revoke',
              error instanceof Error ? error.message : 'Request failed'
            )
          } finally {
            setBusyId(null)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Active sessions</Text>
        <Text style={styles.subtitle}>
          Devices signed into your MamaPlus account. Revoke any you do not recognize.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2563eb" />
        </View>
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
          {sessions.length === 0 ? (
            <Text style={styles.empty}>No active sessions</Text>
          ) : (
            sessions.map((session) => (
              <View key={session.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.device}>{deviceLabel(session)}</Text>
                  {session.current ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>This device</Text>
                    </View>
                  ) : null}
                </View>
                {session.ip ? <Text style={styles.meta}>IP {session.ip}</Text> : null}
                <Text style={styles.meta}>Signed in {formatWhen(session.createdAt)}</Text>
                <Text style={styles.meta}>Last seen {formatWhen(session.lastSeenAt)}</Text>
                <Text style={styles.meta}>Expires {formatWhen(session.expiresAt)}</Text>
                <TouchableOpacity
                  style={[styles.revokeBtn, session.current && styles.revokeCurrent]}
                  onPress={() => onRevoke(session)}
                  disabled={busyId === session.id}
                >
                  <Text style={[styles.revokeText, session.current && styles.revokeCurrentText]}>
                    {busyId === session.id
                      ? 'Working…'
                      : session.current
                        ? 'Sign out here'
                        : 'Revoke session'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(15,23,42,0.07)' } as any,
  default: { elevation: 3 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  back: { color: '#2563eb', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingTop: 4, paddingBottom: 40, gap: 12 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...shadow,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  device: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a' },
  badge: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: '#2563eb', fontSize: 12, fontWeight: '700' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  revokeBtn: {
    marginTop: 12,
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  revokeCurrent: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  revokeText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  revokeCurrentText: { color: '#2563eb' },
})
