import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { fetchBlogPosts } from '../api/client'
import { formatBlogDate, resolveBlogImageUrl } from '../lib/blog-utils'
import { BlogPost, ProfileStackParamList, UserStackParamList } from '../types'

type NavProp = NativeStackNavigationProp<UserStackParamList & ProfileStackParamList>

type Props = {
  embeddedInProfile?: boolean
}

export default function BlogScreen({ embeddedInProfile = false }: Props) {
  const navigation = useNavigation<NavProp>()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (category?: string | null) => {
    try {
      setError('')
      const res = await fetchBlogPosts(category || undefined)
      if (res.success) {
        setPosts(res.data.posts)
        setCategories(res.data.categories)
      } else {
        setError('Unable to load blog posts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load blog posts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load(selectedCategory)
  }, [load, selectedCategory])

  function openPost(post: BlogPost) {
    navigation.navigate('BlogDetail', { slug: post.slug, title: post.title })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              load(selectedCategory)
            }}
            tintColor="#2563eb"
          />
        }
      >
        {embeddedInProfile ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.title}>MamaPlus Blog</Text>
        <Text style={styles.subtitle}>
          Expert insights on childcare, parenting, and building a career as a professional caregiver
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>
              All Posts
            </Text>
          </TouchableOpacity>
          {categories.map((category) => {
            const active = selectedCategory === category
            return (
              <TouchableOpacity
                key={category}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color="#2563eb" style={{ marginTop: 32 }} />
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Couldn’t load posts</Text>
            <Text style={styles.emptyBody}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setLoading(true)
                load(selectedCategory)
              }}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyBody}>
              {selectedCategory
                ? `No published articles in “${selectedCategory}”.`
                : 'Check back soon for childcare tips and caregiver guidance.'}
            </Text>
          </View>
        ) : (
          posts.map((post) => {
            const imageUrl = resolveBlogImageUrl(post.image)
            return (
              <TouchableOpacity
                key={post.slug}
                style={styles.card}
                onPress={() => openPost(post)}
                activeOpacity={0.85}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.cover} resizeMode="cover" />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Text style={styles.coverPlaceholderText}>📰</Text>
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.category}>{post.category}</Text>
                  <Text style={styles.postTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <Text style={styles.description} numberOfLines={2}>
                    {post.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>{formatBlogDate(post.publishedAt)}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.meta}>{post.readTime}</Text>
                  </View>
                  <Text style={styles.readMore}>Read more →</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 36 },
  backRow: { marginBottom: 8 },
  backText: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748b', lineHeight: 22, marginBottom: 18 },
  filters: { gap: 8, paddingBottom: 18 },
  chip: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cover: { width: '100%', height: 160, backgroundColor: '#e2e8f0' },
  coverPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: { fontSize: 36 },
  cardBody: { padding: 16 },
  category: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  postTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  description: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  meta: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  metaDot: { marginHorizontal: 6, color: '#cbd5e1' },
  readMore: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
})
