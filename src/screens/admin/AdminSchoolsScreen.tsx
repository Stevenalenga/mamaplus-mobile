import { useState } from 'react'
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type School = {
  id: string
  name: string
  location: string
  educatorCount: number
  createdAt: string
}

let nextId = 100

export default function AdminSchoolsScreen() {
  const [schools, setSchools] = useState<School[]>([
    { id: '1', name: 'Nairobi Care Academy', location: 'Nairobi, Kenya', educatorCount: 3, createdAt: new Date().toISOString() },
    { id: '2', name: 'Mombasa Nursing Institute', location: 'Mombasa, Kenya', educatorCount: 2, createdAt: new Date().toISOString() },
  ])

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState('')

  function handleAdd() {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Please enter a school name.')
      return
    }
    const school: School = {
      id: String(nextId++),
      name: newName.trim(),
      location: newLocation.trim() || 'Kenya',
      educatorCount: 0,
      createdAt: new Date().toISOString(),
    }
    setSchools((prev) => [school, ...prev])
    setNewName('')
    setNewLocation('')
    setShowForm(false)
  }

  function startEdit(school: School) {
    setEditingId(school.id)
    setEditName(school.name)
    setEditLocation(school.location)
  }

  function saveEdit() {
    if (!editName.trim()) return
    setSchools((prev) =>
      prev.map((s) =>
        s.id === editingId ? { ...s, name: editName.trim(), location: editLocation.trim() || s.location } : s
      )
    )
    setEditingId(null)
  }

  function handleDelete(school: School) {
    Alert.alert('Delete School', `Delete "${school.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setSchools((prev) => prev.filter((s) => s.id !== school.id)),
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>School Manager</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm((v) => !v)}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>{showForm ? '✕ Cancel' : '+ Add School'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Manage schools and their educator assignments.</Text>

        {/* Add form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New School</Text>
            <TextInput
              style={styles.input}
              placeholder="School name"
              placeholderTextColor="#94a3b8"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Location (e.g. Nairobi, Kenya)"
              placeholderTextColor="#94a3b8"
              value={newLocation}
              onChangeText={setNewLocation}
            />
            <TouchableOpacity
              style={[styles.saveBtn, !newName.trim() && styles.btnDisabled]}
              onPress={handleAdd}
              disabled={!newName.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>Add School</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* School list */}
        <Text style={styles.sectionTitle}>{schools.length} School{schools.length !== 1 ? 's' : ''}</Text>

        {schools.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏫</Text>
            <Text style={styles.emptyText}>No schools yet. Add one above.</Text>
          </View>
        ) : (
          schools.map((school) => (
            <View key={school.id} style={styles.schoolCard}>
              {editingId === school.id ? (
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="School name"
                    placeholderTextColor="#94a3b8"
                  />
                  <TextInput
                    style={styles.input}
                    value={editLocation}
                    onChangeText={setEditLocation}
                    placeholder="Location"
                    placeholderTextColor="#94a3b8"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={saveEdit}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setEditingId(null)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.schoolInfo}>
                    <View style={styles.schoolIconWrap}>
                      <Text style={styles.schoolIcon}>🏫</Text>
                    </View>
                    <View style={styles.schoolDetails}>
                      <Text style={styles.schoolName}>{school.name}</Text>
                      <Text style={styles.schoolLocation}>📍 {school.location}</Text>
                      <Text style={styles.schoolMeta}>{school.educatorCount} educator{school.educatorCount !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                  <View style={styles.schoolActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                      onPress={() => startEdit(school)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: '#2563eb' }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]}
                      onPress={() => handleDelete(school)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  container: { padding: 20, paddingBottom: 40 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  addBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
    ...shadow,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    ...shadow,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#94a3b8' },
  schoolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },
  schoolInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  schoolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  schoolIcon: { fontSize: 22 },
  schoolDetails: { flex: 1 },
  schoolName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  schoolLocation: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  schoolMeta: { fontSize: 12, color: '#94a3b8' },
  schoolActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  editForm: { gap: 10 },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
})
