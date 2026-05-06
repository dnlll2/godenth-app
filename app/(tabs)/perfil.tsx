import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

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

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login') } }
    ])
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>

  const tipoCor = Colors[profile?.tipo_profissional as keyof typeof Colors] as string || Colors.primary

  return (
    <ScrollView style={styles.container}>
      {/* Cover */}
      <View style={[styles.cover, { backgroundColor: tipoCor + '30' }]} />

      {/* Avatar */}
      <View style={styles.avatarRow}>
        <View style={[styles.avatar, { backgroundColor: tipoCor }]}>
          <Text style={styles.avatarText}>{profile?.nome?.charAt(0) || 'U'}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}><Text style={styles.editBtnText}>Editar perfil</Text></TouchableOpacity>
      </View>

      <View style={styles.main}>
        <Text style={styles.name}>{profile?.nome}</Text>
        <Text style={styles.role}>{profile?.tipo_profissional} {profile?.cro ? `· ${profile.cro} ✓` : ''}</Text>
        {profile?.cidade && <Text style={styles.loc}>📍 {profile.cidade} · {profile.estado}</Text>}

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: tipoCor + '15', borderColor: tipoCor + '40' }]}>
            <Text style={[styles.badgeText, { color: tipoCor }]}>{profile?.tipo_profissional}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.goldLight, borderColor: Colors.gold + '40' }]}>
            <Text style={[styles.badgeText, { color: Colors.gold }]}>⭐ {profile?.plano}</Text>
          </View>
        </View>

        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={[styles.statN, { color: tipoCor }]}>0</Text><Text style={styles.statL}>Conexões</Text></View>
        <View style={styles.stat}><Text style={[styles.statN, { color: tipoCor }]}>{profile?.anos_experiencia || 0}</Text><Text style={styles.statL}>Anos exp.</Text></View>
        <View style={styles.stat}><Text style={[styles.statN, { color: tipoCor }]}>0</Text><Text style={styles.statL}>Visitas</Text></View>
      </View>

      {/* Especialidade */}
      {profile?.especialidade && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Especialidade</Text>
          <Text style={styles.sectionText}>{profile.especialidade}</Text>
        </View>
      )}

      {/* Ações */}
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
        <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.red + '30' }]} onPress={handleLogout}>
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionText, { color: Colors.red }]}>Sair da conta</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cover: { height: 110 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -32, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.white },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  editBtn: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  editBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  main: { paddingHorizontal: 16, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text },
  role: { fontSize: 13, color: Colors.text2, marginTop: 3 },
  loc: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 7, marginTop: 10, flexWrap: 'wrap' },
  badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 11, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  bio: { fontSize: 13, color: Colors.text2, lineHeight: 20, marginTop: 12 },
  stats: { flexDirection: 'row', backgroundColor: Colors.surface, marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: Colors.border },
  statN: { fontSize: 20, fontWeight: '800' },
  statL: { fontSize: 10, color: Colors.text3, marginTop: 2, fontWeight: '600' },
  section: { margin: 16, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sectionText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  actions: { margin: 16, backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: Colors.border },
  actionIcon: { fontSize: 19, width: 28 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  actionArrow: { fontSize: 18, color: Colors.text3 },
})
