import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const TEAL   = '#1c909b'
const GOLD   = '#C49800'
const BG     = '#F4F8F6'
const CARD   = '#FFFFFF'
const BORDER = '#D8ECE4'
const TEXT   = '#0a2228'
const MUTED  = '#5a7a72'

interface Grupo {
  id: number
  nome: string
  descricao: string
  categoria: string
  icone: string
  total_posts: number
  created_at: string
}

const CATEGORIA_LABEL: Record<string, string> = {
  protese: '🦷 Prótese Dentária',
  odontologia: '🩺 Odontologia Geral',
}

export default function GruposScreen() {
  const { user } = useAuthStore()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = user?.plano === 'black'

  const fetchGrupos = useCallback(async () => {
    try {
      const res = await api.get('/grupos')
      setGrupos(res.data)
    } catch (err) {
      console.error('Erro ao buscar grupos:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchGrupos() }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchGrupos()
  }

  // Agrupa por categoria
  const categorias = [...new Set(grupos.map(g => g.categoria))]
  const sections = categorias.map(cat => ({
    categoria: cat,
    grupos: grupos.filter(g => g.categoria === cat),
  }))

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    )
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Grupos</Text>
          <Text style={s.headerSub}>Comunidades especializadas</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={s.addBtn} onPress={() => {/* futuro: criar grupo */}}>
            <Text style={s.addBtnT}>+ Novo</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sections}
        keyExtractor={item => item.categoria}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} tintColor={TEAL} />}
        renderItem={({ item }) => (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{CATEGORIA_LABEL[item.categoria] ?? item.categoria}</Text>
            {item.grupos.map(grupo => (
              <TouchableOpacity
                key={grupo.id}
                style={s.card}
                activeOpacity={0.75}
                onPress={() => router.push(`/grupo/${grupo.id}` as any)}
              >
                <View style={s.cardIcon}>
                  <Text style={s.cardIconT}>{grupo.icone}</Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardNome} numberOfLines={1}>{grupo.nome}</Text>
                  <Text style={s.cardDesc} numberOfLines={2}>{grupo.descricao}</Text>
                  <Text style={s.cardMeta}>{grupo.total_posts} publicações</Text>
                </View>
                <Text style={s.cardArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyText}>Nenhum grupo disponível ainda.</Text>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  header: {
    backgroundColor: TEAL,
    paddingTop: 52, paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  addBtn:  { backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnT: { color: '#fff', fontSize: 13, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 32 },

  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: TEAL, marginBottom: 10, letterSpacing: 0.3, textTransform: 'uppercase' },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon:  { width: 52, height: 52, borderRadius: 14, backgroundColor: TEAL + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardIconT: { fontSize: 26 },
  cardBody:  { flex: 1 },
  cardNome:  { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 3 },
  cardDesc:  { fontSize: 12, color: MUTED, lineHeight: 17, marginBottom: 5 },
  cardMeta:  { fontSize: 11, color: TEAL, fontWeight: '600' },
  cardArrow: { fontSize: 22, color: BORDER, marginLeft: 8 },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: MUTED },
})
