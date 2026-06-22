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
import {
  fetchCourses,
  createCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
} from '../../api/client'

type CourseStatus = 'DRAFT' | 'PUBLISHED'

type ManagedCourse = {
  id: string
  title: string
  description?: string
  status: CourseStatus
  sectionCount: number
  enrolledStudents: number
  updatedAt: string
}

export default function EducatorHomeScreen() {
  const { user, token } = useAuth()

  const [courses, setCourses] = useState<ManagedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const loadCourses = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchCourses(token, true)
      if (res.success) {
        const mapped: ManagedCourse[] = res.data.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          status: c.isPublished ? 'PUBLISHED' : 'DRAFT',
          sectionCount: (c.modules || []).length,
          enrolledStudents: c._count?.enrollments || 0,
          updatedAt: c.updatedAt,
        }))
        setCourses(mapped)
      }
    } catch (err) {
      console.warn('Educator loadCourses failed', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  async function handleCreate() {
    if (!token || !draftTitle.trim() || !draftDesc.trim()) return
    setSubmitting(true)
    try {
      const res = await createCourse(token, {
        title: draftTitle.trim(),
        description: draftDesc.trim(),
      })
      if (res.success) {
        setDraftTitle('')
        setDraftDesc('')
        setShowCreateForm(false)
        loadCourses()
        Alert.alert('Draft created', 'Your course draft has been created. Go to the portal to add sections and lessons.')
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create course.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(course: ManagedCourse) {
    Alert.alert('Delete Course', `Delete "${course.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return
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

  async function handleTogglePublish(course: ManagedCourse) {
    if (!token) return
    const action = course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'
    Alert.alert(
      `${action} Course`,
      `${action} "${course.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: async () => {
            try {
              if (course.status === 'PUBLISHED') {
                await unpublishCourse(token, course.id)
              } else {
                await publishCourse(token, course.id)
              }
              loadCourses()
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : `Failed to ${action.toLowerCase()}.`)
            }
          },
        },
      ]
    )
  }

  const totalStudents = courses.reduce((s, c) => s + c.enrolledStudents, 0)
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
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCourses() }} tintColor="#2563eb" />}
      >
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name ?? 'Educator'}</Text>
        <Text style={styles.subtitle}>Create courses, add milestones, save drafts, then publish when ready.</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'My Courses', value: courses.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Published', value: publishedCount, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Students', value: totalStudents, color: '#7c3aed', bg: '#f5f3ff' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Create new draft */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.createHeader}
            onPress={() => setShowCreateForm((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>Create New Draft Course</Text>
            <Text style={styles.toggleIcon}>{showCreateForm ? '▾' : '▸'}</Text>
          </TouchableOpacity>

          {showCreateForm && (
            <View style={styles.createForm}>
              <TextInput
                style={styles.input}
                placeholder="Course title"
                placeholderTextColor="#94a3b8"
                value={draftTitle}
                onChangeText={setDraftTitle}
                editable={!submitting}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Course description"
                placeholderTextColor="#94a3b8"
                value={draftDesc}
                onChangeText={setDraftDesc}
                multiline
                numberOfLines={3}
                editable={!submitting}
              />
              <TouchableOpacity
                style={[styles.createBtn, (!draftTitle.trim() || !draftDesc.trim() || submitting) && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={!draftTitle.trim() || !draftDesc.trim() || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Create Draft</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My courses list */}
        <Text style={styles.sectionTitle}>My Courses ({courses.length})</Text>

        {courses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptyDesc}>Create your first draft course above.</Text>
          </View>
        ) : (
          courses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseTop}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  {course.description ? (
                    <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
                  ) : null}
                  <View style={styles.courseMeta}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: course.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: course.status === 'PUBLISHED' ? '#16a34a' : '#64748b' },
                        ]}
                      >
                        {course.status}
                      </Text>
                    </View>
                    <Text style={styles.metaText}>{course.sectionCount} sections</Text>
                    <Text style={styles.metaText}>{course.enrolledStudents} students</Text>
                  </View>
                </View>
              </View>

              <View style={styles.courseActions}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: course.status === 'PUBLISHED' ? '#fffbeb' : '#f0fdf4' },
                  ]}
                  onPress={() => handleTogglePublish(course)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: course.status === 'PUBLISHED' ? '#d97706' : '#16a34a' },
                    ]}
                  >
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...shadow,
  },
  createHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  toggleIcon: { fontSize: 16, color: '#94a3b8' },
  createForm: { marginTop: 14, gap: 10 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  createBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    ...shadow,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },
  courseTop: { marginBottom: 12 },
  courseInfo: {},
  courseTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  courseDesc: { fontSize: 13, color: '#64748b', marginBottom: 8, lineHeight: 19 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 12, color: '#94a3b8' },
  courseActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
})
