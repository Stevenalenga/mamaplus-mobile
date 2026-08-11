import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuth } from '../../context/AuthContext'
import { deleteAdminReview, fetchAdminReviews, updateAdminReview } from '../../api/client'
import { AdminManageStackParamList } from '../../types'

type Props = NativeStackScreenProps<AdminManageStackParamList, 'Reviews'>

export default function AdminReviewsScreen({ navigation }: Props) {
  const { token } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'published' | 'hidden'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const published =
        filter === 'all' ? undefined : filter === 'published'
      const res = await fetchAdminReviews(token, published)
      if (res.success) setItems(res.data ?? [])
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, filter])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  function manageReview(item: any) {
    if (!token) return
    Alert.alert('Review actions', `${item.course?.title || 'Course'} · ${item.rating}/5`, [
      {
        text: item.isPublished ? 'Unpublish' : 'Publish',
        onPress: async () => {
          try {
            await updateAdminReview(token, {
              reviewId: item.id,
              isPublished: !item.isPublished,
            })
            load()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Update failed')
          }
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete review?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteAdminReview(token, item.id)
                  load()
                } catch (err) {
                  Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed')
                }
              },
            },
          ])
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
      </View>

      <View style={styles.chipsWrap}>
        {([
          ['all', 'All'],
          ['published', 'Published'],
          ['hidden', 'Hidden'],
        ] as const).map(([key, label]) => {
          const active = filter === key
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />
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
          {items.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => manageReview(item)}>
              <View style={styles.rowBetween}>
                <Text style={styles.course}>{item.course?.title || 'Course'}</Text>
                <Text style={styles.rating}>{item.rating}/5</Text>
              </View>
              <Text style={styles.user}>{item.user?.name || item.user?.email}</Text>
              {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
              <Text style={styles.badge}>{item.isPublished ? 'Published' : 'Hidden'}</Text>
            </TouchableOpacity>
          ))}
          {items.length === 0 ? <Text style={styles.empty}>No reviews found</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
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
  chipsWrap: { flexDirection: 'row', gap: 8, padding: 16, backgroundColor: '#fff' },
  chip: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 8,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  course: { fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  rating: { fontWeight: '800', color: '#d97706' },
  user: { color: '#64748b', fontSize: 13, marginBottom: 6 },
  comment: { color: '#334155', fontSize: 13, lineHeight: 19, marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 24 },
})
