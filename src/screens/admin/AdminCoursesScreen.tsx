import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  publishCourse,
  unpublishCourse,
  updateCourse,
} from '../../api/client'
import {
  ApiCourse,
  buildCoursePayload,
  courseFormFromApi,
  emptyCourseForm,
  formatCoursePrice,
  CourseFormState,
} from '../../lib/course-utils'

type ManagedCourse = ApiCourse & {
  status: 'DRAFT' | 'PUBLISHED'
  enrolledStudents: number
}

function CourseFormFields({
  form,
  onChange,
  disabled,
}: {
  form: CourseFormState
  onChange: (next: CourseFormState) => void
  disabled?: boolean
}) {
  return (
    <View style={formStyles.wrap}>
      <Text style={formStyles.label}>Course Title *</Text>
      <TextInput
        style={formStyles.input}
        value={form.title}
        onChangeText={(title) => onChange({ ...form, title })}
        placeholder="e.g., Maternal Nutrition"
        placeholderTextColor="#94a3b8"
        editable={!disabled}
      />

      <View style={formStyles.row}>
        <View style={formStyles.half}>
          <Text style={formStyles.label}>Duration</Text>
          <TextInput
            style={formStyles.input}
            value={form.durationLabel}
            onChangeText={(durationLabel) => onChange({ ...form, durationLabel })}
            placeholder="e.g., 3 Days"
            placeholderTextColor="#94a3b8"
            editable={!disabled}
          />
        </View>
        <View style={formStyles.half}>
          <Text style={formStyles.label}>Time / Dates</Text>
          <TextInput
            style={formStyles.input}
            value={form.scheduleDates}
            onChangeText={(scheduleDates) => onChange({ ...form, scheduleDates })}
            placeholder="e.g., 13th – 15th May 2026"
            placeholderTextColor="#94a3b8"
            editable={!disabled}
          />
        </View>
      </View>

      <Text style={formStyles.label}>Place / Location</Text>
      <TextInput
        style={formStyles.input}
        value={form.location}
        onChangeText={(location) => onChange({ ...form, location })}
        placeholder="e.g., Nairobi"
        placeholderTextColor="#94a3b8"
        editable={!disabled}
      />

      <Text style={formStyles.label}>Course Description *</Text>
      <TextInput
        style={[formStyles.input, formStyles.textArea]}
        value={form.description}
        onChangeText={(description) => onChange({ ...form, description })}
        placeholder="Describe what participants will learn..."
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={4}
        editable={!disabled}
      />

      <View style={formStyles.row}>
        <View style={formStyles.half}>
          <Text style={formStyles.label}>Currency</Text>
          <View style={formStyles.currencyRow}>
            {(['KES', 'USD'] as const).map((c) => (
              <TouchableOpacity
                key={c}
                style={[formStyles.currencyBtn, form.currency === c && formStyles.currencyBtnActive]}
                onPress={() => onChange({ ...form, currency: c })}
                disabled={disabled}
              >
                <Text style={[formStyles.currencyBtnText, form.currency === c && formStyles.currencyBtnTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={formStyles.half}>
          <Text style={formStyles.label}>Price</Text>
          <TextInput
            style={formStyles.input}
            value={form.price}
            onChangeText={(price) => onChange({ ...form, price })}
            placeholder="e.g., 24000"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            editable={!disabled}
          />
        </View>
      </View>

      <Text style={formStyles.label}>Target Audience</Text>
      <TextInput
        style={[formStyles.input, formStyles.textArea]}
        value={form.targetAudienceText}
        onChangeText={(targetAudienceText) => onChange({ ...form, targetAudienceText })}
        placeholder="One audience per line"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={3}
        editable={!disabled}
      />

      <Text style={formStyles.label}>Learning Objectives</Text>
      <TextInput
        style={[formStyles.input, formStyles.textArea]}
        value={form.learningObjectivesText}
        onChangeText={(learningObjectivesText) => onChange({ ...form, learningObjectivesText })}
        placeholder="One objective per line"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={3}
        editable={!disabled}
      />

      <Text style={formStyles.label}>Key Benefits</Text>
      <TextInput
        style={[formStyles.input, formStyles.textArea]}
        value={form.keyBenefitsText}
        onChangeText={(keyBenefitsText) => onChange({ ...form, keyBenefitsText })}
        placeholder="One benefit per line"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={3}
        editable={!disabled}
      />

      <View style={formStyles.switchRow}>
        <Text style={formStyles.label}>Feature on browse page</Text>
        <Switch
          value={form.isFeatured}
          onValueChange={(isFeatured) => onChange({ ...form, isFeatured })}
          disabled={disabled}
          trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
          thumbColor={form.isFeatured ? '#2563eb' : '#f8fafc'}
        />
      </View>
    </View>
  )
}

export default function AdminCoursesScreen() {
  const { token } = useAuth()

  const [courses, setCourses] = useState<ManagedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [createForm, setCreateForm] = useState<CourseFormState>(emptyCourseForm)
  const [editForm, setEditForm] = useState<CourseFormState | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadCourses = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchCourses(token, true)
      if (res.success) {
        const mapped = res.data.map((c: any) => ({
          ...c,
          status: c.isPublished ? 'PUBLISHED' : 'DRAFT',
          enrolledStudents: c._count?.enrollments || 0,
        }))
        setCourses(mapped)
        if (selectedCourseId) {
          const selected = mapped.find((c: ManagedCourse) => c.id === selectedCourseId)
          if (selected) {
            setEditForm(courseFormFromApi(selected))
          } else {
            setSelectedCourseId(null)
            setEditForm(null)
          }
        }
      }
    } catch (err) {
      console.warn('AdminCourses loadCourses', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, selectedCourseId])

  useEffect(() => { loadCourses() }, [loadCourses])

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId],
  )

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(search.toLowerCase()),
  )

  const totalEnrollments = courses.reduce((sum, c) => sum + c.enrolledStudents, 0)

  function selectCourse(course: ManagedCourse) {
    setSelectedCourseId(course.id)
    setEditForm(courseFormFromApi(course))
    setMessage(null)
  }

  async function handleCreate() {
    if (!token || !createForm.title.trim() || !createForm.description.trim()) {
      Alert.alert('Required', 'Course title and description are required.')
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await createCourse(token, buildCoursePayload(createForm))
      if (res.success) {
        setCreateForm(emptyCourseForm)
        setMessage('Course created. Publish it when ready to show on Browse Courses.')
        await loadCourses()
        if (res.data?.id) setSelectedCourseId(res.data.id)
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create course.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSave() {
    if (!token || !selectedCourseId || !editForm) return
    if (!editForm.title.trim() || !editForm.description.trim()) {
      Alert.alert('Required', 'Course title and description are required.')
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await updateCourse(token, selectedCourseId, buildCoursePayload(editForm))
      setMessage('Course updated successfully.')
      await loadCourses()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update course.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(course: ManagedCourse) {
    if (!token) return
    const action = course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'
    Alert.alert(`${action}?`, `"${course.title}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        onPress: async () => {
          setSubmitting(true)
          try {
            course.status === 'PUBLISHED'
              ? await unpublishCourse(token, course.id)
              : await publishCourse(token, course.id)
            setMessage(`Course ${action.toLowerCase()}ed.`)
            await loadCourses()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed.')
          } finally {
            setSubmitting(false)
          }
        },
      },
    ])
  }

  async function handleDelete(course: ManagedCourse) {
    if (!token) return
    Alert.alert('Delete Course', `Delete "${course.title}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true)
          try {
            await deleteCourse(token, course.id)
            if (selectedCourseId === course.id) {
              setSelectedCourseId(null)
              setEditForm(null)
            }
            setMessage('Course deleted.')
            await loadCourses()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete.')
          } finally {
            setSubmitting(false)
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadCourses() }}
            tintColor="#2563eb"
          />
        }
      >
        <Text style={styles.pageTitle}>Course Management</Text>
        <Text style={styles.subtitle}>
          Create and edit courses shown on Browse Courses. Only published courses are visible to users.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{courses.length}</Text>
            <Text style={styles.statLabel}>Total Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#2563eb' }]}>{totalEnrollments}</Text>
            <Text style={styles.statLabel}>Total Enrollments</Text>
          </View>
        </View>

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Course</Text>
          <CourseFormFields form={createForm} onChange={setCreateForm} disabled={submitting} />
          <TouchableOpacity
            style={[styles.primaryBtn, (submitting || !createForm.title.trim() || !createForm.description.trim()) && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={submitting || !createForm.title.trim() || !createForm.description.trim()}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Course</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses…"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.sectionTitle}>All Courses ({filtered.length})</Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{search ? 'No courses match your search.' : 'No courses yet.'}</Text>
          </View>
        ) : (
          filtered.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, selectedCourseId === course.id && styles.courseCardSelected]}
              onPress={() => selectCourse(course)}
              activeOpacity={0.85}
            >
              <View style={styles.courseHeader}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  {course.description ? (
                    <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
                  ) : null}
                  <Text style={styles.courseMeta}>
                    {course.durationLabel || 'Duration TBD'} · {course.location || 'Location TBD'} · {formatCoursePrice(course)}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: course.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9' }]}>
                    <Text style={[styles.badgeText, { color: course.status === 'PUBLISHED' ? '#16a34a' : '#64748b' }]}>
                      {course.status}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: course.status === 'PUBLISHED' ? '#fffbeb' : '#f0fdf4' }]}
                  onPress={() => handleToggle(course)}
                  disabled={submitting}
                >
                  <Text style={[styles.actionBtnText, { color: course.status === 'PUBLISHED' ? '#d97706' : '#16a34a' }]}>
                    {course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]}
                  onPress={() => handleDelete(course)}
                  disabled={submitting}
                >
                  <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {selectedCourse && editForm ? (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.cardTitle}>Edit Course</Text>
            <Text style={styles.editSubtitle}>{selectedCourse.title}</Text>
            <CourseFormFields form={editForm} onChange={setEditForm} disabled={submitting} />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: selectedCourse.status === 'PUBLISHED' ? '#fffbeb' : '#f0fdf4', flex: 1 }]}
                onPress={() => handleToggle(selectedCourse)}
                disabled={submitting}
              >
                <Text style={[styles.actionBtnText, { color: selectedCourse.status === 'PUBLISHED' ? '#d97706' : '#16a34a' }]}>
                  {selectedCourse.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 8px rgba(15,23,42,0.06)' } as any,
  default: { shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
})

const formStyles = StyleSheet.create({
  wrap: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 6,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  currencyBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  currencyBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  currencyBtnText: { fontWeight: '700', color: '#64748b', fontSize: 13 },
  currencyBtnTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748b' },
  container: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, ...shadow },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  messageBox: { backgroundColor: '#ecfdf5', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#a7f3d0' },
  messageText: { color: '#047857', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, ...shadow },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  editSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  searchBox: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, marginBottom: 12, ...shadow },
  searchInput: { height: 44, fontSize: 15, color: '#0f172a' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', ...shadow },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  courseCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...shadow },
  courseCardSelected: { borderWidth: 2, borderColor: '#2563eb' },
  courseHeader: { marginBottom: 12 },
  courseInfo: {},
  courseTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  courseDesc: { fontSize: 13, color: '#64748b', marginBottom: 6, lineHeight: 19 },
  courseMeta: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
})
