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
import { fetchCourses, publishCourse, unpublishCourse, deleteCourse } from '../../api/client'

type Course = {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'PUBLISHED'
  sectionCount: number
  enrolledStudents: number
  updatedAt: string
}

export default function AdminAssistantHomeScreen() {
  const { user, token } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
            updatedAt: c.updatedAt,
          }))
        )
      }
    } catch (err) {
      console.warn('AdminAssistant loadCourses', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { loadCourses() }, [loadCourses])

  async function handleToggle(course: Course) {
    if (!token) return
    const action = course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'
    Alert.alert(`${action} course?`, `"${course.title}"`, [
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

  const totalEnrollments = courses.reduce((s, c) => s + c.enrolledStudents, 0)
  const publishedCount = courses.filter((c) => c.status === 'PUBLISHED').length

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCourses() }} tintColor="#2563eb" />}
      >
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name ?? 'Admin Assistant'}</Text>
        <Text style={styles.subtitle}>Support administrators and manage courses.</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Courses', value: courses.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Published', value: publishedCount, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Total Enrolled', value: totalEnrollments, color: '#7c3aed', bg: '#f5f3ff' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Course list */}
        <Text style={styles.sectionTitle}>All Courses ({courses.length})</Text>

        {courses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No courses on the platform yet.</Text>
          </View>
        ) : (
          courses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                {course.description ? (
                  <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
                ) : null}
                <View style={styles.courseMeta}>
                  <View style={[styles.badge, { backgroundColor: course.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9' }]}>
                    <Text style={[styles.badgeText, { color: course.status === 'PUBLISHED' ? '#16a34a' : '#64748b' }]}>
                      {course.status}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>{course.sectionCount} sections</Text>
                  <Text style={styles.metaText}>{course.enrolledStudents} enrolled</Text>
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
  greeting: { fontSize: 16, color: '#64748b', marginBottom: 2 },
  name: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, ...shadow },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
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
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 12, color: '#94a3b8' },
  actions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
})
