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
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { createEnrollment, fetchCourses, fetchEnrollments } from '../api/client'
import { UserStackParamList } from '../types'

type NavProp = NativeStackNavigationProp<UserStackParamList>

type CourseItem = {
  id: string
  title: string
  description?: string
  category?: string
  level?: string
  priceKES?: number
  priceUSD?: number
  isPublished?: boolean
  progress?: number
  enrolled?: boolean
}

type Props = {
  canEnroll?: boolean
}

export default function CoursesScreen({ canEnroll = true }: Props) {
  const { token } = useAuth()
  const navigation = useNavigation<NavProp>()
  const [search, setSearch] = useState('')
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        fetchCourses(token),
        canEnroll ? fetchEnrollments(token) : Promise.resolve({ success: true, data: [] }),
      ])
      const enrollmentMap = new Map<string, { progress: number }>()
      if (enrollmentsRes.success) {
        for (const e of enrollmentsRes.data) {
          enrollmentMap.set(e.courseId, { progress: e.progress ?? 0 })
        }
      }
      const published = (coursesRes.success ? coursesRes.data : []).filter(
        (c: any) => c.isPublished !== false
      )
      setCourses(
        published.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          level: c.level,
          priceKES: c.priceKES,
          priceUSD: c.priceUSD,
          isPublished: c.isPublished,
          enrolled: enrollmentMap.has(c.id),
          progress: enrollmentMap.get(c.id)?.progress ?? 0,
        }))
      )
    } catch (err) {
      console.warn('Courses load failed', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, canEnroll])

  useEffect(() => { load() }, [load])

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )
  const enrolled = filtered.filter((c) => c.enrolled)
  const available = filtered.filter((c) => !c.enrolled)

  async function handleEnroll(course: CourseItem) {
    if (!token || !canEnroll) return
    const isFree = (course.priceKES ?? 0) <= 0 && (course.priceUSD ?? 0) <= 0
    if (!isFree) {
      Alert.alert(
        'Paid course',
        'Paid courses require checkout on the web portal. Free courses can be enrolled here.'
      )
      return
    }
    setEnrollingId(course.id)
    try {
      await createEnrollment(token, course.id)
      Alert.alert('Enrolled!', `You are now enrolled in "${course.title}".`)
      load()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Enrollment failed.')
    } finally {
      setEnrollingId(null)
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
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      >
        <Text style={styles.pageTitle}>Courses</Text>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {enrolled.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My Courses ({enrolled.length})</Text>
            {enrolled.map((course) => (
              <View key={course.id} style={styles.courseCard}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                {course.description ? <Text style={styles.courseMeta} numberOfLines={2}>{course.description}</Text> : null}
                {course.progress !== undefined && course.progress < 100 && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${course.progress}%` as any }]} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseTitle: course.title })}
                >
                  <Text style={styles.primaryBtnText}>{course.progress === 100 ? 'Review' : 'Continue'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {available.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Available Courses</Text>
            {available.map((course) => (
              <View key={course.id} style={styles.courseCardWhite}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                {course.description ? <Text style={styles.courseMeta} numberOfLines={2}>{course.description}</Text> : null}
                <Text style={styles.price}>
                  {(course.priceKES ?? 0) <= 0 && (course.priceUSD ?? 0) <= 0
                    ? 'Free'
                    : `KES ${course.priceKES ?? course.priceUSD}`}
                </Text>
                {canEnroll ? (
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={() => handleEnroll(course)}
                    disabled={enrollingId === course.id}
                  >
                    {enrollingId === course.id ? (
                      <ActivityIndicator color="#2563eb" />
                    ) : (
                      <Text style={styles.outlineBtnText}>Enroll Now</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <Text style={styles.empty}>No courses found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(15,23,42,0.07)' } as any,
  default: { elevation: 3 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  searchBox: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, marginBottom: 16, ...shadow },
  searchInput: { height: 44, fontSize: 15, color: '#0f172a' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  courseCard: { backgroundColor: '#eff6ff', borderRadius: 18, padding: 18, marginBottom: 14, ...shadow },
  courseCardWhite: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, ...shadow },
  courseTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  courseMeta: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  price: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 10 },
  progressTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 3 },
  primaryBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  outlineBtn: { borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  outlineBtnText: { color: '#2563eb', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
})
