import { useState } from 'react'
import {
  ActivityIndicator,
  Platform,
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
import { UserStackParamList } from '../types'

type NavProp = NativeStackNavigationProp<UserStackParamList>

type CourseCategory = 'All' | 'Maternal' | 'Infant' | 'Nutrition' | 'Mental Health'

const CATEGORIES: CourseCategory[] = ['All', 'Maternal', 'Infant', 'Nutrition', 'Mental Health']

const SAMPLE_COURSES = [
  {
    id: '1',
    title: 'Maternal Health Basics',
    category: 'Maternal',
    duration: '4 weeks',
    lessons: 12,
    enrolled: true,
    progress: 60,
    color: '#eff6ff',
    accent: '#2563eb',
    icon: '🤱',
  },
  {
    id: '2',
    title: 'Infant Nutrition & Care',
    category: 'Infant',
    duration: '3 weeks',
    lessons: 9,
    enrolled: true,
    progress: 100,
    color: '#f0fdf4',
    accent: '#16a34a',
    icon: '👶',
  },
  {
    id: '3',
    title: 'Postpartum Mental Health',
    category: 'Mental Health',
    duration: '2 weeks',
    lessons: 6,
    enrolled: false,
    progress: 0,
    color: '#fdf4ff',
    accent: '#9333ea',
    icon: '🧠',
  },
  {
    id: '4',
    title: 'Breastfeeding & Nutrition',
    category: 'Nutrition',
    duration: '2 weeks',
    lessons: 8,
    enrolled: false,
    progress: 0,
    color: '#fff7ed',
    accent: '#ea580c',
    icon: '🥗',
  },
]

export default function CoursesScreen() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<CourseCategory>('All')
  const navigation = useNavigation<NavProp>()

  const filtered = SAMPLE_COURSES.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const enrolled = filtered.filter((c) => c.enrolled)
  const available = filtered.filter((c) => !c.enrolled)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Courses</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, activeCategory === cat && styles.pillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Enrolled courses */}
        {enrolled.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My Courses ({enrolled.length})</Text>
            {enrolled.map((course) => (
              <View key={course.id} style={[styles.courseCard, { backgroundColor: course.color }]}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseIcon}>{course.icon}</Text>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseMeta}>
                      {course.lessons} lessons · {course.duration}
                    </Text>
                  </View>
                  {course.progress === 100 && (
                    <View style={[styles.badge, { backgroundColor: '#16a34a' }]}>
                      <Text style={styles.badgeText}>Done</Text>
                    </View>
                  )}
                </View>
                {course.progress < 100 && (
                  <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${course.progress}%` as any, backgroundColor: course.accent },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressLabel, { color: course.accent }]}>
                      {course.progress}%
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: course.accent }]}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseTitle: course.title })}
                >
                  <Text style={styles.actionBtnText}>
                    {course.progress === 100 ? 'Review' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Available courses */}
        {available.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Available Courses</Text>
            {available.map((course) => (
              <View key={course.id} style={styles.courseCardWhite}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseIcon}>{course.icon}</Text>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseMeta}>
                      {course.lessons} lessons · {course.duration}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.enrollBtn, { borderColor: course.accent }]}>
                  <Text style={[styles.enrollBtnText, { color: course.accent }]}>Enroll Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No courses found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(15,23,42,0.07)' } as any,
  default: { shadowColor: '#0f172a', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    ...shadow,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#0f172a' },
  categoryRow: { gap: 8, paddingBottom: 16 },
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
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  courseCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    ...shadow,
  },
  courseCardWhite: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    ...shadow,
  },
  courseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  courseIcon: { fontSize: 32, marginRight: 12 },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  courseMeta: { fontSize: 13, color: '#64748b' },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 13, fontWeight: '700', minWidth: 36 },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  enrollBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  enrollBtnText: { fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#94a3b8' },
})
