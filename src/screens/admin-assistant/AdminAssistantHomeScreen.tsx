import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useAuth } from '../../context/AuthContext'
import { AdminAssistantTabParamList } from '../../types'

type NavProp = BottomTabNavigationProp<AdminAssistantTabParamList>

export default function AdminAssistantHomeScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NavProp>()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name ?? 'Admin Assistant'}</Text>
        <Text style={styles.subtitle}>
          Your mobile workspace matches the web assistant role — manage MamaPlus blog content.
        </Text>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Blog')}
        >
          <Text style={styles.icon}>📰</Text>
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>Blog</Text>
            <Text style={styles.cardSub}>Browse and open published articles</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.icon}>👤</Text>
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardSub}>Update your account details</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 36 },
  greeting: { fontSize: 16, color: '#64748b', marginBottom: 2 },
  name: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
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
