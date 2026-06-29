import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { searchCaregivers, recruitCaregiver, fetchCourses, sponsorCaregiver } from '../../api/client'

type Caregiver = {
  id: string
  name: string | null
  email: string
  gender: string | null
  phoneNumber: string | null
  _count: { enrollments: number; certificates: number }
}

export default function SearchCaregiversScreen() {
  const { token } = useAuth()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Caregiver[]>([])
  const [searching, setSearching] = useState(false)
  const [recruitingId, setRecruitingId] = useState<string | null>(null)
  const [recruitedIds, setRecruitedIds] = useState<Set<string>>(new Set())
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch() {
    if (!query.trim() || !token) return
    setSearching(true)
    setHasSearched(true)
    try {
      const res = await searchCaregivers(token, query.trim())
      if (res.success) {
        setResults(res.data)
      }
    } catch (err) {
      Alert.alert('Search failed', err instanceof Error ? err.message : 'Unable to search.')
    } finally {
      setSearching(false)
    }
  }

  async function handleSponsor(cg: Caregiver) {
    if (!token) return
    try {
      const coursesRes = await fetchCourses(token)
      const courses = (coursesRes.success ? coursesRes.data : []).filter((c: any) => c.isPublished !== false)
      if (courses.length === 0) {
        Alert.alert('No courses', 'No published courses available to sponsor.')
        return
      }
      const buttons = courses.slice(0, 5).map((c: any) => ({
        text: c.title,
        onPress: async () => {
          try {
            await sponsorCaregiver(token, cg.id, c.id)
            Alert.alert('Sponsored!', `${cg.name || 'Caregiver'} enrolled in "${c.title}".`)
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Sponsorship failed.')
          }
        },
      }))
      Alert.alert('Sponsor Course', `Pick a course for ${cg.name || cg.email}`, [
        ...buttons,
        { text: 'Cancel', style: 'cancel' },
      ])
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load courses.')
    }
  }

  async function handleRecruit(cg: Caregiver) {
    if (!token) return
    Alert.alert(
      'Recruit Caregiver',
      `Add ${cg.name || cg.email} to your agency?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recruit',
          onPress: async () => {
            setRecruitingId(cg.id)
            try {
              const res = await recruitCaregiver(token, cg.id)
              if (res.success) {
                setRecruitedIds((prev) => new Set([...prev, cg.id]))
                Alert.alert('Recruited', 'Caregiver added. Would you like to sponsor a course?', [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Sponsor', onPress: () => handleSponsor(cg) },
                ])
              }
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to recruit.')
            } finally {
              setRecruitingId(null)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Search Caregivers</Text>
        <Text style={styles.subtitle}>Find and recruit caregivers to your agency.</Text>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email…"
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[styles.searchBtn, (!query.trim() || searching) && styles.btnDisabled]}
            onPress={handleSearch}
            disabled={!query.trim() || searching}
            activeOpacity={0.85}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.searchBtnText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {hasSearched && !searching && results.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No caregivers found for "{query}"</Text>
          </View>
        )}

        {results.map((cg) => {
          const recruited = recruitedIds.has(cg.id)
          return (
            <View key={cg.id} style={styles.card}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>
                  {(cg.name || cg.email)[0].toUpperCase()}
                </Text>
              </View>

              <View style={styles.info}>
                <Text style={styles.cgName}>{cg.name || 'Unnamed Caregiver'}</Text>
                <Text style={styles.cgEmail} numberOfLines={1}>{cg.email}</Text>
                {cg.phoneNumber ? (
                  <Text style={styles.cgPhone}>{cg.phoneNumber}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  {cg.gender ? (
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>{cg.gender}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.metaText}>{cg._count.enrollments} courses</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.metaText}>{cg._count.certificates} certs</Text>
                </View>
              </View>

              {recruited ? (
                <View style={styles.recruitedActions}>
                  <View style={styles.recruitedBadge}>
                    <Text style={styles.recruitedText}>✓ Recruited</Text>
                  </View>
                  <TouchableOpacity style={styles.sponsorBtn} onPress={() => handleSponsor(cg)}>
                    <Text style={styles.sponsorBtnText}>Sponsor</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.recruitBtn, recruitingId === cg.id && styles.btnDisabled]}
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
              )}
            </View>
          )
        })}
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
  container: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    ...shadow,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#0f172a' },
  searchBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    ...shadow,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#94a3b8', textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#2563eb', fontWeight: '800', fontSize: 18 },
  info: { flex: 1 },
  cgName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  cgEmail: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  cgPhone: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  metaText: { fontSize: 11, color: '#94a3b8' },
  dot: { fontSize: 11, color: '#cbd5e1' },
  recruitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  recruitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  recruitedBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recruitedText: { color: '#16a34a', fontWeight: '700', fontSize: 12 },
  recruitedActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  sponsorBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sponsorBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
})
