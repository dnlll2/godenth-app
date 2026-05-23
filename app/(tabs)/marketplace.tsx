import { useCallback, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Image, Linking,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const API_BASE = 'https://godenth-api.onrender.com'
const PRIMARY  = '#1c909b'
const GOLD     = '#C49800'

const IB = { stroke: '#fff', strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function SearchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx="10.5" cy="10.5" r="6.5" {...IB} />
      <Line x1="15.5" y1="15.5" x2="21" y2="21" {...IB} />
    </Svg>
  )
}

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M10,7 C10,5.3 14,5.3 14,7" {...IB} />
      <Path d="M5,17 C5,12 7.5,8 12,8 C16.5,8 19,12 19,17 L20,19 L4,19 Z" {...IB} />
      <Path d="M10,19 C10,20.7 14,20.7 14,19" {...IB} />
    </Svg>
  )
}

function tempoRelativo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'agora'
  if (diff < 3600)   return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400)  return `há ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'ontem'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

const VENDA_KEYWORDS = ['venda', 'vend', 'equipament', 'insumo', 'material', 'produto', 'compra', 'loja']

function isVendaGroup(grupo: any): boolean {
  const text = `${grupo.nome} ${grupo.descricao} ${grupo.categoria}`.toLowerCase()
  return VENDA_KEYWORDS.some(k => text.includes(k))
}

// ── Card: Produto ─────────────────────────────────────────────────────────────

function ProdutoCard({ post, grupoNome }: { post: any; grupoNome: string }) {
  const imgUrl = post.imagem_url
    ? (post.imagem_url.startsWith('http') ? post.imagem_url : API_BASE + post.imagem_url)
    : null
  const avatarUrl = post.author_avatar
    ? (post.author_avatar.startsWith('http') ? post.author_avatar : API_BASE + post.author_avatar)
    : null

  const handleContato = () => {
    if (post.author_id) router.push(`/usuario/${post.author_id}` as any)
  }

  return (
    <View style={s.card}>
      {imgUrl ? (
        <Image source={{ uri: imgUrl }} style={s.cardImg} resizeMode="cover" />
      ) : null}
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
            onPress={() => post.author_id && router.push(`/usuario/${post.author_id}` as any)}
            activeOpacity={0.75}
          >
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.av} />
              : <View style={[s.av, { backgroundColor: PRIMARY + '30', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: PRIMARY, fontWeight: '800', fontSize: 12 }}>{(post.author_nome || 'U').charAt(0)}</Text>
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.autorNome} numberOfLines={1}>{post.author_nome || 'Usuário'}</Text>
              {post.author_tipo
                ? <Text style={s.autorTipo} numberOfLines={1}>{post.author_tipo}</Text>
                : null}
            </View>
          </TouchableOpacity>
          <View style={s.grupoBadge}>
            <Text style={s.grupoBadgeT} numberOfLines={1}>{grupoNome}</Text>
          </View>
        </View>

        {post.texto ? (
          <Text style={s.texto} numberOfLines={5}>{post.texto}</Text>
        ) : null}

        <View style={s.footer}>
          <Text style={s.tempo}>{tempoRelativo(post.created_at)}</Text>
          <TouchableOpacity style={s.contatoBtn} onPress={handleContato} activeOpacity={0.8}>
            <Text style={s.contatoBtnT}>Contatar →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>🛒</Text>
      <Text style={s.emptyTitle}>Marketplace em breve</Text>
      <Text style={s.emptySub}>
        Os grupos de venda de equipamentos e insumos aparecerão aqui.
        Acesse a aba Grupos para participar das comunidades de venda.
      </Text>
      <TouchableOpacity
        style={[s.contatoBtn, { marginTop: 16, paddingHorizontal: 24 }]}
        onPress={() => router.push('/grupo/1' as any)}
        activeOpacity={0.8}
      >
        <Text style={s.contatoBtnT}>Ver Grupos →</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface PostComGrupo { post: any; grupoNome: string }

export default function Marketplace() {
  const { user } = useAuthStore()
  const [posts, setPosts]           = useState<PostComGrupo[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [gruposVenda, setGruposVenda] = useState<any[]>([])

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : API_BASE + user.avatar_url)
    : null

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      const gruposRes = await api.get('/grupos')
      const todos: any[] = gruposRes.data || []
      const vendas = todos.filter(isVendaGroup)
      setGruposVenda(vendas)

      if (vendas.length === 0) {
        setPosts([])
        return
      }

      const postsArrays = await Promise.all(
        vendas.map((g: any) =>
          api.get(`/grupos/${g.id}/posts`)
            .then(r => (r.data || []).map((p: any) => ({ post: p, grupoNome: g.nome })))
            .catch(() => [] as PostComGrupo[])
        )
      )
      const combined: PostComGrupo[] = postsArrays
        .flat()
        .sort((a, b) => new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime())
      setPosts(combined)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadNotifCount = useCallback(() => {
    api.get('/notifications?limit=1')
      .then(r => setUnreadCount(r.data.unread || 0))
      .catch(() => null)
  }, [])

  useFocusEffect(useCallback(() => {
    loadNotifCount()
    loadData()
  }, [loadData, loadNotifCount]))

  return (
    <View style={{ flex: 1, backgroundColor: '#E0E0E0' }}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Marketplace</Text>
          {gruposVenda.length > 0 && (
            <Text style={s.headerSub}>{gruposVenda.length} {gruposVenda.length === 1 ? 'grupo' : 'grupos'} de venda</Text>
          )}
        </View>
        <View style={s.headerIcons}>
          <TouchableOpacity style={s.ico} onPress={() => router.push('/(tabs)/buscar' as any)}>
            <SearchIcon />
          </TouchableOpacity>
          <TouchableOpacity style={s.ico} onPress={() => router.push('/(tabs)/notificacoes' as any)}>
            <BellIcon />
            {unreadCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeT}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil' as any)}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.uav} />
              : <View style={s.uav}><Text style={s.uavt}>{user?.nome?.charAt(0) || 'U'}</Text></View>
            }
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : posts.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(true) }} tintColor={PRIMARY} />
          }
        >
          <EmptyState />
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(true) }} tintColor={PRIMARY} />
          }
        >
          {posts.map(({ post, grupoNome }, i) => (
            <ProdutoCard key={post.id ?? i} post={post} grupoNome={grupoNome} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: PRIMARY,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ico: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: -3, right: -3, backgroundColor: '#E53935',
    borderRadius: 9, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: PRIMARY,
  },
  notifBadgeT: { color: '#fff', fontSize: 9, fontWeight: '800' },
  uav: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A6FD4', justifyContent: 'center', alignItems: 'center' },
  uavt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#D0E8DA', overflow: 'hidden' },
  cardImg: { width: '100%', height: 200 },
  cardBody: { padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  av: { width: 36, height: 36, borderRadius: 18, flexShrink: 0 },
  autorNome: { fontSize: 13, fontWeight: '800', color: '#0A1C14' },
  autorTipo: { fontSize: 11, color: PRIMARY, fontWeight: '600', marginTop: 1 },
  grupoBadge: { backgroundColor: PRIMARY + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 120 },
  grupoBadgeT: { fontSize: 10, fontWeight: '700', color: PRIMARY },
  texto: { fontSize: 14, color: '#2A4030', lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEF7F2' },
  tempo: { fontSize: 11, color: '#A0B8AC', fontWeight: '600' },
  contatoBtn: { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  contatoBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0A1C14', marginBottom: 10, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#7A9E8E', textAlign: 'center', lineHeight: 19 },
})
