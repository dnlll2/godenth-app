import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, Platform,
} from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors, PlanColors } from '../../constants/colors'

const PLANOS = ['gratuito', 'premium', 'black'] as const
const STATUS = ['ativo', 'inativo', 'banido'] as const

type Plano = typeof PLANOS[number]
type Status = typeof STATUS[number]

interface Stats {
  total_usuarios: number
  total_posts: number
  total_conexoes: number
  total_paginas: number
  total_vagas: number
}

interface UserRow {
  id: number
  nome: string
  email: string
  tipo_profissional: string
  plano: Plano
  status: Status
  embaixador: boolean
  created_at: string
}

export default function AdminPanel() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [actionUser, setActionUser] = useState<number | null>(null)

  useEffect(() => {
    if (user?.plano !== 'black') {
      router.replace('/(tabs)/feed' as any)
      return
    }
    fetchStats()
    fetchUsers('')
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data)
    } catch { /* silently fail */ }
  }

  const fetchUsers = async (q: string) => {
    setLoadingUsers(true)
    try {
      const res = await api.get('/admin/users', { params: { q, limit: 40 } })
      setUsers(res.data.users)
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível carregar usuários')
    } finally {
      setLoadingUsers(false)
      setLoading(false)
    }
  }

  const handleSearch = (text: string) => {
    setQuery(text)
    fetchUsers(text)
  }

  const changePlano = (userId: number, planoAtual: Plano) => {
    Alert.alert('Alterar plano', `Plano atual: ${planoAtual}`, [
      ...PLANOS.filter(p => p !== planoAtual).map(p => ({
        text: p.charAt(0).toUpperCase() + p.slice(1),
        onPress: async () => {
          setActionUser(userId)
          try {
            await api.put(`/admin/users/${userId}/plano`, { plano: p })
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, plano: p } : u))
          } catch (err: any) {
            Alert.alert('Erro', err.response?.data?.error || 'Falha ao atualizar')
          } finally { setActionUser(null) }
        },
      })),
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  const toggleEmbaixador = async (userId: number, embaixadorAtual: boolean) => {
    Alert.alert(
      'Embaixador',
      embaixadorAtual ? 'Remover título de Embaixador?' : 'Promover a Embaixador 🌟?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: embaixadorAtual ? 'Remover' : 'Promover',
          style: embaixadorAtual ? 'destructive' : 'default',
          onPress: async () => {
            setActionUser(userId)
            try {
              const res = await api.put(`/admin/users/${userId}/embaixador`, {})
              setUsers(prev => prev.map(u => u.id === userId ? { ...u, embaixador: res.data.embaixador } : u))
            } catch (err: any) {
              Alert.alert('Erro', err.response?.data?.error || 'Falha ao atualizar')
            } finally { setActionUser(null) }
          },
        },
      ]
    )
  }

  const changeStatus = (userId: number, statusAtual: Status) => {
    Alert.alert('Alterar status', `Status atual: ${statusAtual}`, [
      ...STATUS.filter(s => s !== statusAtual).map(s => ({
        text: s.charAt(0).toUpperCase() + s.slice(1),
        style: s === 'banido' ? 'destructive' as const : 'default' as const,
        onPress: async () => {
          setActionUser(userId)
          try {
            await api.put(`/admin/users/${userId}/status`, { status: s })
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: s } : u))
          } catch (err: any) {
            Alert.alert('Erro', err.response?.data?.error || 'Falha ao atualizar')
          } finally { setActionUser(null) }
        },
      })),
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.gold} size="large" /></View>

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerSide}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Painel Admin</Text>
        <View style={s.headerSide} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {stats && (
          <>
            <Text style={s.sectionTitle}>Estatísticas</Text>
            <View style={s.statsGrid}>
              <StatCard label="Usuários" value={stats.total_usuarios} />
              <StatCard label="Posts" value={stats.total_posts} />
              <StatCard label="Conexões" value={stats.total_conexoes} />
              <StatCard label="Páginas" value={stats.total_paginas} />
              <StatCard label="Vagas" value={stats.total_vagas} />
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>Usuários</Text>
        <TextInput
          style={s.search}
          placeholder="Buscar por nome ou e-mail…"
          placeholderTextColor={Colors.text3}
          value={query}
          onChangeText={handleSearch}
        />

        {loadingUsers ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 20 }} />
        ) : users.map(u => (
          <View key={u.id} style={s.userCard}>
            <View style={s.userTop}>
              <View style={s.userInitial}>
                <Text style={s.userInitialT}>{u.nome?.charAt(0) || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userName} numberOfLines={1}>{u.nome}</Text>
                <Text style={s.userEmail} numberOfLines={1}>{u.email}</Text>
                <Text style={s.userCargo} numberOfLines={1}>{u.tipo_profissional}</Text>
              </View>
              {actionUser === u.id && <ActivityIndicator color={Colors.gold} size="small" />}
            </View>
            <View style={s.userActions}>
              <TouchableOpacity
                style={[s.planoBadge, { backgroundColor: PlanColors[u.plano] + '18', borderColor: PlanColors[u.plano] + '55' }]}
                onPress={() => changePlano(u.id, u.plano)}
              >
                <Text style={[s.planoBadgeT, { color: PlanColors[u.plano] }]}>
                  {u.plano.charAt(0).toUpperCase() + u.plano.slice(1)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.statusBadge, u.status === 'banido' && { backgroundColor: Colors.red + '18', borderColor: Colors.red + '55' }]}
                onPress={() => changeStatus(u.id, u.status)}
              >
                <Text style={[s.statusBadgeT, u.status === 'banido' && { color: Colors.red }, u.status === 'ativo' && { color: Colors.green }]}>
                  {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.embaixadorBadge, u.embaixador && { backgroundColor: '#7B3FC418', borderColor: '#7B3FC455' }]}
                onPress={() => toggleEmbaixador(u.id, u.embaixador)}
              >
                <Text style={[s.embaixadorBadgeT, u.embaixador && { color: '#7B3FC4' }]}>
                  {u.embaixador ? '🌟 Embaixador' : '☆ Promover'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value.toLocaleString('pt-BR')}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
    backgroundColor: '#0A1C14',
  },
  headerSide: { width: 40 },
  back: { fontSize: 24, color: Colors.gold, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.gold },
  scroll: { padding: 16, paddingBottom: 80 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, minWidth: '45%', flex: 1 },
  statValue: { fontSize: 26, fontWeight: '900', color: Colors.gold },
  statLabel: { fontSize: 11, fontWeight: '700', color: Colors.text3, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  search: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 14, color: Colors.text, marginBottom: 12 },

  userCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  userInitial: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  userInitialT: { fontSize: 18, fontWeight: '800', color: Colors.text2 },
  userName: { fontSize: 14, fontWeight: '800', color: Colors.text },
  userEmail: { fontSize: 12, color: Colors.text3, marginTop: 1 },
  userCargo: { fontSize: 11, color: Colors.text3, marginTop: 1 },
  userActions: { flexDirection: 'row', gap: 8 },
  planoBadge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  planoBadgeT: { fontSize: 12, fontWeight: '800' },
  statusBadge: { borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.surface },
  statusBadgeT: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  embaixadorBadge: { borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.surface },
  embaixadorBadgeT: { fontSize: 12, fontWeight: '700', color: Colors.text3 },
})
