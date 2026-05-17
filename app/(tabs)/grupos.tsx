import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar, ScrollView,
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

// Config visual por categoria — ordem de exibição e cores
const CATEGORIAS: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  odontologia: { label: 'Odontologia',    emoji: '🩺', color: '#1A6FD4', bg: '#EEF4FF' },
  protese:     { label: 'Prótese Dentária', emoji: '🦷', color: '#7B3FC4', bg: '#F3EEFF' },
}

const ORDEM_CATS = ['odontologia', 'protese']

type Filtro = 'todos' | string

export default function GruposScreen() {
  const { user } = useAuthStore()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todos')

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

  const onRefresh = () => { setRefreshing(true); fetchGrupos() }

  // Categorias presentes nos dados, na ordem definida
  const catsPresentes = ORDEM_CATS.filter(c => grupos.some(g => g.categoria === c))

  // Seções filtradas
  const sections = (filtro === 'todos' ? catsPresentes : [filtro])
    .map(cat => ({ cat, grupos: grupos.filter(g => g.categoria === cat) }))
    .filter(s => s.grupos.length > 0)

  // Contagem por categoria para os chips
  const countByCat = (cat: string) => grupos.filter(g => g.categoria === cat).length

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

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Grupos</Text>
          <Text style={s.headerSub}>Comunidades especializadas</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={s.addBtn} onPress={() => { /* criar grupo */ }}>
            <Text style={s.addBtnT}>+ Novo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filtro de categorias ── */}
      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          <TouchableOpacity
            style={[s.chip, filtro === 'todos' && s.chipActive]}
            onPress={() => setFiltro('todos')}
          >
            <Text style={[s.chipT, filtro === 'todos' && s.chipActiveT]}>
              Todos · {grupos.length}
            </Text>
          </TouchableOpacity>

          {catsPresentes.map(cat => {
            const conf = CATEGORIAS[cat]
            const ativo = filtro === cat
            return (
              <TouchableOpacity
                key={cat}
                style={[s.chip, ativo && { backgroundColor: conf.color, borderColor: conf.color }]}
                onPress={() => setFiltro(ativo ? 'todos' : cat)}
              >
                <Text style={[s.chipT, ativo && s.chipActiveT]}>
                  {conf?.emoji} {conf?.label ?? cat} · {countByCat(cat)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* ── Lista de grupos por seção ── */}
      <FlatList
        data={sections}
        keyExtractor={item => item.cat}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} tintColor={TEAL} />
        }
        renderItem={({ item }) => {
          const conf = CATEGORIAS[item.cat] ?? { label: item.cat, emoji: '💬', color: TEAL, bg: '#E6F7F8' }
          return (
            <View style={s.section}>
              {/* Header da seção */}
              <View style={[s.sectionHeader, { backgroundColor: conf.bg, borderLeftColor: conf.color }]}>
                <Text style={s.sectionEmoji}>{conf.emoji}</Text>
                <Text style={[s.sectionLabel, { color: conf.color }]}>{conf.label}</Text>
                <Text style={[s.sectionCount, { color: conf.color }]}>{item.grupos.length} grupos</Text>
              </View>

              {/* Cards dos grupos */}
              {item.grupos.map(grupo => (
                <TouchableOpacity
                  key={grupo.id}
                  style={s.card}
                  activeOpacity={0.75}
                  onPress={() => router.push(`/grupo/${grupo.id}` as any)}
                >
                  <View style={[s.cardIcon, { backgroundColor: conf.color + '18' }]}>
                    <Text style={s.cardIconT}>{grupo.icone}</Text>
                  </View>
                  <View style={s.cardBody}>
                    <Text style={s.cardNome} numberOfLines={2}>{grupo.nome}</Text>
                    <Text style={s.cardDesc} numberOfLines={2}>{grupo.descricao}</Text>
                    <Text style={[s.cardMeta, { color: conf.color }]}>
                      {grupo.total_posts} {grupo.total_posts === 1 ? 'publicação' : 'publicações'}
                    </Text>
                  </View>
                  <Text style={s.cardArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )
        }}
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

  // Header
  header: {
    backgroundColor: TEAL,
    paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  addBtn:      { backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnT:     { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Filtro
  filterBar:    { backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    borderRadius: 20, borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: CARD,
  },
  chipActive:  { backgroundColor: TEAL, borderColor: TEAL },
  chipT:       { fontSize: 12, fontWeight: '700', color: MUTED },
  chipActiveT: { color: '#fff' },

  // Lista
  list: { padding: 14, paddingBottom: 40 },

  section: { marginBottom: 24 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderLeftWidth: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 10,
  },
  sectionEmoji: { fontSize: 18 },
  sectionLabel: { fontSize: 14, fontWeight: '800', flex: 1 },
  sectionCount: { fontSize: 11, fontWeight: '600' },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIcon:  { width: 50, height: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardIconT: { fontSize: 24 },
  cardBody:  { flex: 1 },
  cardNome:  { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 3, lineHeight: 19 },
  cardDesc:  { fontSize: 12, color: MUTED, lineHeight: 17, marginBottom: 5 },
  cardMeta:  { fontSize: 11, fontWeight: '600' },
  cardArrow: { fontSize: 22, color: BORDER, marginLeft: 8 },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: MUTED },
})
