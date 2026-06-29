import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ProfileStackParamList } from '../types'

type Props = NativeStackScreenProps<ProfileStackParamList, 'Contact'>

export default function ContactScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact MamaPlus</Text>
          <Text style={styles.text}>Email: info@mamaplus.co.ke</Text>
          <Text style={styles.text}>Website: mamaplus.co.ke</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:info@mamaplus.co.ke')}>
            <Text style={styles.link}>Send us an email →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>M-Pesa Paybill</Text>
          <Text style={styles.text}>Paybill: 4182157</Text>
          <Text style={styles.text}>Account: Your ID number</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FAQ</Text>
          <Text style={styles.faqQ}>How do I enroll in a course?</Text>
          <Text style={styles.text}>Browse Courses, tap Enroll on a free course, or complete checkout on the web portal for paid courses.</Text>
          <Text style={styles.faqQ}>How do agencies sponsor caregivers?</Text>
          <Text style={styles.text}>Search for a caregiver, tap Recruit, then Sponsor and pick a course.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  back: { color: '#2563eb', fontWeight: '600', marginRight: 12 },
  title: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  container: { padding: 20, gap: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  text: { fontSize: 14, color: '#475569', lineHeight: 21, marginBottom: 6 },
  link: { color: '#2563eb', fontWeight: '600', marginTop: 8 },
  faqQ: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 10, marginBottom: 4 },
})
