import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
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
import { fetchCourses } from '../../api/client'

type Course = {
  id: string
  title: string
  description?: string
  enrolledStudents: number
}

type School = {
  id: string
  name: string
  location: string
  studentCount: number
}

let nextSchoolId = 100

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const DEFAULT_SCHOOLS: School[] = [
  { id: uid(), name: 'Nairobi Central Campus', location: 'Nairobi', studentCount: 125 },
  { id: uid(), name: 'Mombasa Learning Center', location: 'Mombasa', studentCount: 87 },
]

export default function AdminAssistantHomeScreen() {
  const { user, token } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [schools, setSchools] = useState<School[]>(DEFAULT_SCHOOLS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [schoolName, setSchoolName] = useState('')
  const [schoolLocation, setSchoolLocation] = useState('')
  const [schoolStudentCount, setSchoolStudentCount] = useState('')

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
            enrolledStudents: c._count?.enrollments || 0,
          })),
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

  function addSchool() {
    if (!schoolName.trim() || !schoolLocation.trim()) return
    setSchools((prev) => [
      {
        id: String(nextSchoolId++),
        name: schoolName.trim(),
        location: schoolLocation.trim(),
        studentCount: parseInt(schoolStudentCount, 10) || 0,
      },
      ...prev,
    ])
    setSchoolName('')
    setSchoolLocation('')
    setSchoolStudentCount('')
  }

  function removeSchool(id: string) {
    setSchools((prev) => prev.filter((s) => s.id !== id))
  }

  const totalStudents = schools.reduce((sum, s) => sum + s.studentCount, 0)
  const totalEnrollments = courses.reduce((sum, c) => sum + c.enrolledStudents, 0)

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadCourses() }}
            tintColor="#2563eb"
          />
        }
      >
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name ?? 'Admin Assistant'}</Text>
        <Text style={styles.subtitle}>
          View courses and manage schools. Course catalog updates are reserved for administrators.
        </Text>

        <View style={styles.statsGrid}>
          {[
            { label: 'Total Courses', value: courses.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Physical Schools', value: schools.length, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Total Students', value: totalStudents, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Enrollments', value: totalEnrollments, color: '#16a34a', bg: '#f0fdf4' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Physical Schools</Text>
          <TextInput
            style={styles.input}
            placeholder="School name"
            placeholderTextColor="#94a3b8"
            value={schoolName}
            onChangeText={setSchoolName}
          />
          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Location"
              placeholderTextColor="#94a3b8"
              value={schoolLocation}
              onChangeText={setSchoolLocation}
            />
            <TextInput
              style={[styles.input, { width: 100 }]}
              placeholder="Students"
              placeholderTextColor="#94a3b8"
              value={schoolStudentCount}
              onChangeText={setSchoolStudentCount}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity
            style={[styles.addBtn, (!schoolName.trim() || !schoolLocation.trim()) && styles.btnDisabled]}
            onPress={addSchool}
            disabled={!schoolName.trim() || !schoolLocation.trim()}
          >
            <Text style={styles.addBtnText}>Add School</Text>
          </TouchableOpacity>

          {schools.length === 0 ? (
            <Text style={styles.emptyInline}>No schools yet.</Text>
          ) : (
            schools.map((school) => (
              <View key={school.id} style={styles.schoolRow}>
                <View style={styles.schoolInfo}>
                  <Text style={styles.schoolName}>{school.name}</Text>
                  <Text style={styles.schoolMeta}>
                    {school.location} · {school.studentCount} students
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeSchool(school.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Published Courses</Text>
        {courses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No published courses yet.</Text>
          </View>
        ) : (
          courses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              {course.description ? (
                <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
              ) : null}
              <Text style={styles.courseMeta}>{course.enrolledStudents} enrolled</Text>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '47%', borderRadius: 14, padding: 14, ...shadow },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, ...shadow },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  formRow: { flexDirection: 'row', gap: 8 },
  addBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  emptyInline: { color: '#94a3b8', fontSize: 14 },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 12,
  },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  schoolMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  removeText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', ...shadow },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  courseCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, ...shadow },
  courseTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  courseDesc: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  courseMeta: { fontSize: 12, color: '#94a3b8' },
})
