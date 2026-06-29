import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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
import { fetchRecruitedCaregivers, rateCaregiver } from '../../api/client'
import { ProfileStackParamList } from '../../types'

type Props = NativeStackScreenProps<ProfileStackParamList, 'AgencyCaregivers'>

export default function AgencyCaregiversScreen({ navigation }: Props) {
  const { token } = useAuth()
  const [recruited, setRecruited] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [ratingTarget, setRatingTarget] = useState<any | null>(null)
  const [ratingValue, setRatingValue] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchRecruitedCaregivers(token)
      if (res.success) setRecruited(res.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  function openRating(recruitment: any) {
    setRatingTarget(recruitment)
    setRatingValue(recruitment.rating ? String(recruitment.rating) : '')
    setReviewText('')
  }

  function closeRating() {
    setRatingTarget(null)
    setRatingValue('')
    setReviewText('')
  }

  async function submitRating() {
    if (!token || !ratingTarget) return
    const rating = parseInt(ratingValue, 10)
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid', 'Enter a rating between 1 and 5.')
      return
    }
    setSubmitting(true)
    try {
      await rateCaregiver(token, ratingTarget.id, rating, reviewText || undefined)
      closeRating()
      load()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to rate.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Caregivers</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      >
        {recruited.length === 0 ? (
          <Text style={styles.empty}>No recruited caregivers yet.</Text>
        ) : (
          recruited.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.name}>{r.caregiver?.name || r.caregiver?.email}</Text>
              <Text style={styles.meta}>Status: {r.status} · {r.caregiver?._count?.enrollments ?? 0} courses</Text>
              {r.rating ? <Text style={styles.rating}>★ {r.rating}/5</Text> : null}
              <TouchableOpacity style={styles.rateBtn} onPress={() => openRating(r)}>
                <Text style={styles.rateBtnText}>{r.rating ? 'Update Rating' : 'Rate Caregiver'}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!ratingTarget} transparent animationType="fade" onRequestClose={closeRating}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Caregiver</Text>
            <Text style={styles.modalSubtitle}>
              {ratingTarget?.caregiver?.name || ratingTarget?.caregiver?.email}
            </Text>
            <Text style={styles.label}>Rating (1–5)</Text>
            <TextInput
              style={styles.input}
              value={ratingValue}
              onChangeText={setRatingValue}
              keyboardType="number-pad"
              placeholder="5"
              maxLength={1}
            />
            <Text style={styles.label}>Review (optional)</Text>
            <TextInput
              style={[styles.input, styles.reviewInput]}
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Share feedback…"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeRating} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitRating} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  container: { padding: 20 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      default: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(15,23,42,0.06)' } as object,
    }),
  },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  rating: { fontSize: 14, color: '#d97706', fontWeight: '700', marginTop: 6 },
  rateBtn: {
    marginTop: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rateBtnText: { color: '#2563eb', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  reviewInput: { minHeight: 72, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 88,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700' },
})
