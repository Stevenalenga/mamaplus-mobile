import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from '../../context/AuthContext'
import { fetchCourses, publishCourse, unpublishCourse, deleteCourse, createCourse } from '../../api/client'

type Course = {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'PUBLISHED'
  sectionCount: number
  enrolledStudents: number
  instructorName?: string
  updatedAt: string
}

export default function AdminCoursesScreen() {
  const { token } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')

  const loadCourses = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchCourses(token)
      if (res.success) {
        setCourses(
          res.data.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            status: c.isPublished ? 'PUBLISHED' : 'DRAFT',
            sectionCount: (c.modules || []).length,
            enrolledStudents: c._count?.enrollments || 0,
            instructorName: c.instructor?.name || c.instructor?.email || null,
            updatedAt: c.updatedAt,
          }))
        )
      }
    } catch (err) {
      console.warn('AdminCourses loadCourses', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { loadCourses() }, [loadCourses])

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'ALL' || c.status === filter
    return matchesSearch && matchesFilter
  })

  async function handleToggle(course: Course) {
    if (!token) return
    const action = course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'
    Alert.alert(`${action}?`, `"${course.title}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        onPress: async () => {
          try {
            course.status === 'PUBLISHED'
              ? await unpublishCourse(token, course.id)
              : await publishCourse(token, course.id)
            loadCourses()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed.')
          }
        },
      },
    ])
  }

  async function handleDelete(course: Course) {
    if (!token) return
    Alert.alert('Delete Course', `Delete "${course.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCourse(token, course.id)
            loadCourses()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete.')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading courses…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCourses() }} tintColor="#2563eb" />}
      >
        <Text style={styles.pageTitle}>Course Management</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses…"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter pills */}
        <View style={styles.pillRow}>
          {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, filter === f && styles.pillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.resultCount}>{filtered.length} course{filtered.length !== 1 ? 's' : ''}</Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No courses found.</Text>
          </View>
        ) : (
          filtered.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                {course.description ? (
                  <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  <View style={[styles.badge, { backgroundColor: course.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9' }]}>
                    <Text style={[styles.badgeText, { color: course.status === 'PUBLISHED' ? '#16a34a' : '#64748b' }]}>
                      {course.status}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>{course.sectionCount} sections</Text>
                  <Text style={styles.metaText}>{course.enrolledStudents} enrolled</Text>
                  {course.instructorName ? (
                    <Text style={styles.metaText} numberOfLines={1}>by {course.instructorName}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: course.status === 'PUBLISHED' ? '#fffbeb' : '#f0fdf4' }]}
                  onPress={() => handleToggle(course)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, { color: course.status === 'PUBLISHED' ? '#d97706' : '#16a34a' }]}>
                    {course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]}
                  onPress={() => handleDelete(course)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    ...shadow,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#0f172a' },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  pillTextActive: { color: '#ffffff' },
  resultCount: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    ...shadow,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#94a3b8' },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },
  courseInfo: { marginBottom: 12 },
  courseTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  courseDesc: { fontSize: 13, color: '#64748b', marginBottom: 8, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 12, color: '#94a3b8' },
  actions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
})
