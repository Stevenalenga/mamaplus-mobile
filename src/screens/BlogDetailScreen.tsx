import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { fetchBlogPost } from '../api/client'
import { formatBlogDate, resolveBlogImageUrl } from '../lib/blog-utils'
import { BlogPost, ProfileStackParamList, UserStackParamList } from '../types'

type Props =
  | NativeStackScreenProps<UserStackParamList, 'BlogDetail'>
  | NativeStackScreenProps<ProfileStackParamList, 'BlogDetail'>

export default function BlogDetailScreen({ navigation, route }: Props) {
  const { slug } = route.params
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchBlogPost(slug)
      if (res.success) {
        setPost(res.data.post)
        setRelatedPosts(res.data.relatedPosts)
      } else {
        setError('Post not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this post')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  const imageUrl = resolveBlogImageUrl(post?.image)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 40 }} />
      ) : error || !post ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Post not found</Text>
          <Text style={styles.emptyBody}>{error || 'This article may have been removed.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.category}>{post.category}</Text>
          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.meta}>{post.author}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>{formatBlogDate(post.publishedAt)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>{post.readTime}</Text>
          </View>

          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>📰</Text>
            </View>
          )}

          <Text style={styles.content}>{post.content}</Text>

          {post.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {post.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {relatedPosts.length > 0 ? (
            <>
              <Text style={styles.relatedTitle}>Related Articles</Text>
              {relatedPosts.map((related) => (
                <TouchableOpacity
                  key={related.slug}
                  style={styles.relatedCard}
                  onPress={() =>
                    (navigation as any).push('BlogDetail', {
                      slug: related.slug,
                      title: related.title,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.relatedCategory}>{related.category}</Text>
                  <Text style={styles.relatedPostTitle} numberOfLines={2}>
                    {related.title}
                  </Text>
                  <Text style={styles.relatedDescription} numberOfLines={2}>
                    {related.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  back: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
  container: { padding: 20, paddingBottom: 40 },
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
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 12, lineHeight: 34 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 },
  meta: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  metaDot: { marginHorizontal: 6, color: '#cbd5e1' },
  cover: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    marginBottom: 20,
  },
  coverPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  coverPlaceholderText: { fontSize: 42 },
  content: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
    marginBottom: 24,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  tag: {
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { color: '#c2410c', fontWeight: '600', fontSize: 12 },
  relatedTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  relatedCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 10,
  },
  relatedCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  relatedPostTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  relatedDescription: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  emptyCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
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
