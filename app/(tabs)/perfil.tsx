import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

export default function Perfil() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me')
      setProfile(res.data)
    } catch (err) { console.log(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProfile() }, [])

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00A880" /></View>

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Perfil</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.cover} />

      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.nome?.charAt(0) || 'U'}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <Text style={styles.name}>{profile?.nome}</Text>
        <Text style={styles.role}>{profile?.tipo_profissional}</Text>
        {profile?.cidade ? <Text style={styles.loc}>📍 {profile.cidade} · {profile.estado}</Text> : null}

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile?.tipo_profissional}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: 'rgba(196,152,0,0.1)', borderColor: 'rgba(196,152,0,0.3)' }]}>
            <Text style={[styles.badgeText, { color: '#C49800' }]}>⭐ {profile?.plano}</Text>
          </View>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statN}>0</Text><Text style={styles.statL}>Conexões</Text></View>
        <View style={styles.stat}><Text style={styles.statN}>0</Text><Text style={styles.statL}>Posts</Text></View>
        <View style={styles.stat}><Text style={styles.statN}>0</Text><Text style={styles.statL}>Visitas</Text></View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🏢</Text>
          <Text style={styles.actionText}>Minhas páginas</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📁</Text>
          <Text style={styles.actionText}>Minhas candidaturas</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Configurações</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: 'rgba(229,57,53,0.2)' }]} onPress={handleLogout}>
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionText, { color: '#E53935' }]}>Sair da conta</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cover: { height: 100, backgroundColor: '#007A6E' },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -32, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1A6FD4', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  editBtn: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  editBtnText: { fontSize: 13, fontWeight: '800', color: '#00A880' },
  main: { paddingHorizontal: 16, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: '#0A1C14' },
  role: { fontSize: 13, color: '#3A6550', marginTop: 3 },
  loc: { fontSize: 12, color: '#7A9E8E', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 7, marginTop: 10 },
  badge: { backgroundColor: 'rgba(0,168,128,0.1)', borderWidth: 1, borderColor: 'rgba(0,168,128,0.3)', borderRadius: 100, paddingHorizontal: 11, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#00A880' },
  stats: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D0E8DA' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#D0E8DA' },
  statN: { fontSize: 20, fontWeight: '800', color: '#00A880' },
  statL: { fontSize: 10, color: '#7A9E8E', marginTop: 2, fontWeight: '600' },
  actions: { margin: 16, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#D0E8DA' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  actionIcon: { fontSize: 19, width: 28 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0A1C14' },
  actionArrow: { fontSize: 18, color: '#7A9E8E' },
})
