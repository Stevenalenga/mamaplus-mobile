import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { fetchCourse, fetchEnrollment } from '../api/client'
import { UserStackParamList } from '../types'

type Props = NativeStackScreenProps<UserStackParamList, 'CourseDetail'>

type Lesson = {
  id: string
  title: string
  type: string
  url?: string
  isMilestone: boolean
}

type Module = {
  id: string
  title: string
  isMilestone: boolean
  lessons: Lesson[]
}

type CourseDetail = {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'PUBLISHED'
  modules: Module[]
}

export default function CourseDetailScreen({ route, navigation }: Props) {
  const { courseId, courseTitle } = route.params
  const { token } = useAuth()

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [enrollment, setEnrollment] = useState<{ progress: number; completedResources: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!token) return

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [courseRes, enrollmentRes] = await Promise.allSettled([
          fetchCourse(token!, courseId),
          fetchEnrollment(token!, courseId),
        ])

        if (courseRes.status === 'fulfilled' && courseRes.value.success) {
          const raw = courseRes.value.data
          const mapped: CourseDetail = {
            id: raw.id,
            title: raw.title,
            description: raw.description,
            status: raw.isPublished ? 'PUBLISHED' : 'DRAFT',
            modules: (raw.modules || []).map((m: any) => ({
              id: m.id,
              title: m.title,
              isMilestone: false,
              lessons: (m.lessons || []).map((l: any) => ({
                id: l.id,
                title: l.title,
                type: l.content || 'video',
                url: l.videoUrl || undefined,
                isMilestone: false,
              })),
            })),
          }
          setCourse(mapped)
          // expand all modules by default
          setExpandedModules(new Set(mapped.modules.map((m) => m.id)))
        } else if (courseRes.status === 'rejected') {
          setError('Failed to load course details.')
        }

        if (enrollmentRes.status === 'fulfilled' && enrollmentRes.value.success) {
          const e = enrollmentRes.value.data
          setEnrollment({
            progress: e.progress || 0,
            completedResources: e.completedResources || [],
          })
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseId, token])

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const totalLessons = course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading course…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error ?? 'Course not found.'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Progress card */}
        {enrollment && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPct}>{enrollment.progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${enrollment.progress}%` as any },
                ]}
              />
            </View>
            <Text style={styles.progressSub}>
              {totalLessons} lesson{totalLessons !== 1 ? 's' : ''} · {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Description */}
        {course.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descText}>{course.description}</Text>
          </View>
        ) : null}

        {/* Modules */}
        <Text style={styles.sectionTitle}>Course Content</Text>

        {course.modules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No modules in this course yet.</Text>
          </View>
        ) : (
          course.modules.map((mod, idx) => {
            const isExpanded = expandedModules.has(mod.id)
            return (
              <View key={mod.id} style={styles.moduleCard}>
                <TouchableOpacity
                  style={styles.moduleHeader}
                  onPress={() => toggleModule(mod.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.moduleLeft}>
                    <View style={styles.moduleNum}>
                      <Text style={styles.moduleNumText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.moduleTitleWrap}>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleSub}>
                        {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                        {mod.isMilestone ? ' · Milestone' : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.lessonList}>
                    {mod.lessons.length === 0 ? (
                      <Text style={styles.noLessons}>No lessons yet.</Text>
                    ) : (
                      mod.lessons.map((lesson, lIdx) => {
                        const completed =
                          enrollment?.completedResources?.includes(lesson.id) ?? false
                        return (
                          <View
                            key={lesson.id}
                            style={[styles.lessonRow, lIdx < mod.lessons.length - 1 && styles.lessonBorder]}
                          >
                            <View style={[styles.lessonIcon, completed && styles.lessonIconDone]}>
                              <Text style={styles.lessonIconText}>
                                {completed ? '✓' : typeIcon(lesson.type)}
                              </Text>
                            </View>
                            <View style={styles.lessonInfo}>
                              <Text style={styles.lessonTitle}>{lesson.title}</Text>
                              <Text style={styles.lessonType}>
                                {lesson.type.toUpperCase()}
                                {lesson.isMilestone ? ' · Milestone' : ''}
                              </Text>
                            </View>
                            {completed && (
                              <View style={styles.doneBadge}>
                                <Text style={styles.doneBadgeText}>Done</Text>
                              </View>
                            )}
                          </View>
                        )
                      })
                    )}
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function typeIcon(type: string): string {
  switch (type) {
    case 'video': return '▶'
    case 'file': return '📄'
    case 'image': return '🖼'
    default: return '📖'
  }
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 8px rgba(15,23,42,0.06)' } as any,
  default: { shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 15 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  backBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBack: { marginRight: 12, paddingVertical: 4 },
  headerBackText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0f172a' },
  container: { padding: 20, paddingBottom: 40 },
  progressCard: {
    backgroundColor: '#2563eb',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  progressPct: { color: '#bfdbfe', fontWeight: '800', fontSize: 18 },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#ffffff', borderRadius: 4 },
  progressSub: { color: '#bfdbfe', fontSize: 13 },
  descCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    ...shadow,
  },
  descText: { fontSize: 14, color: '#475569', lineHeight: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    ...shadow,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#94a3b8' },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadow,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  moduleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  moduleNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleNumText: { color: '#2563eb', fontWeight: '800', fontSize: 13 },
  moduleTitleWrap: { flex: 1 },
  moduleTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  moduleSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  chevron: { fontSize: 16, color: '#94a3b8', marginLeft: 8 },
  lessonList: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 4 },
  noLessons: { fontSize: 13, color: '#94a3b8', padding: 14 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lessonBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  lessonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonIconDone: { backgroundColor: '#dcfce7' },
  lessonIconText: { fontSize: 12, color: '#475569' },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  lessonType: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  doneBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  doneBadgeText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
})
