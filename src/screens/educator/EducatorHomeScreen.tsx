import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useAuth } from '../../context/AuthContext'
import { fetchCourses } from '../../api/client'
import { decodeLessonResourceMeta, decodeModuleDescription, mapLessonType } from '../../lib/course-authoring'
import { EducatorTabParamList } from '../../types'

type NavProp = BottomTabNavigationProp<EducatorTabParamList, 'Home'>

type LessonItem = {
  id: string
  title: string
  type: string
  isMilestone: boolean
}

type CourseSection = {
  id: string
  title: string
  isMilestone: boolean
  lessons: LessonItem[]
}

type ManagedCourse = {
  id: string
  title: string
  description?: string
  sections: CourseSection[]
  enrolledStudents: number
}

function mapApiCourse(course: any): ManagedCourse {
  return {
    id: course.id,
    title: course.title,
    description: course.description || '',
    sections: (course.modules || []).map((module: any) => {
      const moduleMeta = decodeModuleDescription(module.description)
      return {
        id: module.id,
        title: module.title,
        isMilestone: moduleMeta.isMilestone,
        lessons: (module.lessons || []).map((lesson: any) => {
          const lessonMeta = decodeLessonResourceMeta(lesson.resourceUrls)
          return {
            id: lesson.id,
            title: lesson.title,
            type: mapLessonType(lesson.content),
            isMilestone: lessonMeta.isMilestone,
          }
        }),
      }
    }),
    enrolledStudents: course._count?.enrollments || 0,
  }
}

export default function EducatorHomeScreen() {
  const { user, token } = useAuth()
  const navigation = useNavigation<NavProp>()

  const [courses, setCourses] = useState<ManagedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const loadCourses = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchCourses(token)
      if (res.success) {
        const mapped = res.data.map(mapApiCourse)
        setCourses(mapped)
        if (mapped.length > 0 && !mapped.some((c) => c.id === selectedCourseId)) {
          setSelectedCourseId(mapped[0].id)
        }
        if (mapped.length === 0) setSelectedCourseId(null)
      }
    } catch (err) {
      console.warn('Educator loadCourses failed', err)
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

  const totalStudents = courses.reduce((sum, c) => sum + c.enrolledStudents, 0)

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadCourses() }}
            tintColor="#2563eb"
          />
        }
      >
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name ?? 'Educator'}</Text>
        <Text style={styles.subtitle}>
          Browse published courses. The course catalog is managed by administrators.
        </Text>

        <View style={styles.statsRow}>
          {[
            { label: 'Published Courses', value: courses.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Total Enrolled', value: totalStudents, color: '#2563eb', bg: '#eff6ff' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Published Courses</Text>
        {courses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No published courses yet.</Text>
          </View>
        ) : (
          courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, selectedCourseId === course.id && styles.courseCardSelected]}
              onPress={() => setSelectedCourseId(course.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.courseTitle}>{course.title}</Text>
              {course.description ? (
                <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
              ) : null}
              <View style={styles.courseMeta}>
                <View style={styles.publishedBadge}>
                  <Text style={styles.publishedBadgeText}>PUBLISHED</Text>
                </View>
                <Text style={styles.metaText}>{course.sections.length} sections</Text>
                <Text style={styles.metaText}>{course.enrolledStudents} enrolled</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {selectedCourse ? (
          <View style={styles.contentCard}>
            <Text style={styles.cardTitle}>Course Content</Text>
            <Text style={styles.selectedTitle}>{selectedCourse.title}</Text>
            {selectedCourse.description ? (
              <Text style={styles.selectedDesc}>{selectedCourse.description}</Text>
            ) : null}

            {selectedCourse.sections.length === 0 ? (
              <Text style={styles.emptyInline}>No sections in this course yet.</Text>
            ) : (
              selectedCourse.sections.map((section) => (
                <View key={section.id} style={styles.sectionCard}>
                  <Text style={styles.sectionName}>{section.title}</Text>
                  <Text style={styles.sectionSub}>
                    {section.isMilestone ? 'Section milestone' : 'Regular section'}
                  </Text>
                  {section.lessons.length === 0 ? (
                    <Text style={styles.emptyInline}>No lessons in this section.</Text>
                  ) : (
                    section.lessons.map((lesson) => (
                      <View key={lesson.id} style={styles.lessonRow}>
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        <Text style={styles.lessonType}>
                          {lesson.type.toUpperCase()}{lesson.isMilestone ? ' · Milestone' : ''}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ))
            )}
          </View>
        ) : null}

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Courses')}>
            <Text style={styles.primaryBtnText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>
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
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 16, ...shadow },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  courseCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, ...shadow },
  courseCardSelected: { borderWidth: 2, borderColor: '#2563eb' },
  courseTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  courseDesc: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  publishedBadge: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  publishedBadgeText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 12, color: '#94a3b8' },
  contentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 6, marginBottom: 16, ...shadow },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  selectedTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  selectedDesc: { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 20 },
  sectionCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginBottom: 10 },
  sectionName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  sectionSub: { fontSize: 11, color: '#94a3b8', marginBottom: 8 },
  lessonRow: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 8 },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  lessonType: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  emptyInline: { fontSize: 13, color: '#94a3b8' },
  quickActions: { marginTop: 4 },
  primaryBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
