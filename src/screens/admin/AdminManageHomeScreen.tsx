import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AdminManageStackParamList } from '../../types'

type Props = NativeStackScreenProps<AdminManageStackParamList, 'ManageHome'>

const ITEMS: Array<{
  key: keyof AdminManageStackParamList
  icon: string
  title: string
  subtitle: string
}> = [
  { key: 'Users', icon: '👥', title: 'Users', subtitle: 'Search, filter, and change roles' },
  { key: 'Enrollments', icon: '🎓', title: 'Enrollments', subtitle: 'Track progress and status' },
  { key: 'Payments', icon: '💳', title: 'Payments', subtitle: 'Revenue and payment history' },
  { key: 'Agencies', icon: '🏢', title: 'Agencies', subtitle: 'Agency accounts and placements' },
  { key: 'Reviews', icon: '⭐', title: 'Reviews', subtitle: 'Publish or remove course reviews' },
  { key: 'Certificates', icon: '🏅', title: 'Certificates', subtitle: 'Issued certificates' },
  { key: 'Schools', icon: '🏫', title: 'Schools', subtitle: 'School manager' },
  { key: 'Blog', icon: '📰', title: 'Blog', subtitle: 'Published articles' },
]

export default function AdminManageHomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Manage</Text>
        <Text style={styles.subtitle}>Platform controls matching the web admin dashboard</Text>

        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(item.key)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 18, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 10,
  },
  icon: { fontSize: 24, marginRight: 12 },
  textWrap: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  cardSub: { fontSize: 13, color: '#64748b' },
  chevron: { fontSize: 22, color: '#94a3b8', fontWeight: '600' },
})
