import { useCallback, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Image, Platform, useWindowDimensions,
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

// ── Category metadata ─────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; cor: string }> = {
  clinica:      { label: 'Clínica Odontológica',    cor: '#00A880' },
  laboratorio:  { label: 'Laboratório de Prótese',   cor: '#7B3FC4' },
  fabricante:   { label: 'Fabricante / Distribuidora', cor: '#D4600A' },
  ensino:       { label: 'Instituição de Ensino',    cor: '#0891B2' },
  marketing:    { label: 'Marketing & Comunicação',  cor: '#D4186A' },
  gestao:       { label: 'Gestão & Consultoria',     cor: '#334155' },
  servicos:     { label: 'Serviços Profissionais',   cor: '#334155' },
}

// ── Card: Página de empresa ───────────────────────────────────────────────────

interface PaginaCardProps {
  page: any
  curtido: boolean
  curtindo: boolean
  onCurtir: () => void
}

function PaginaCard({ page, curtido, curtindo, onCurtir }: PaginaCardProps) {
  const logoUrl = page.logo_url
    ? (page.logo_url.startsWith('http') ? page.logo_url : API_BASE + page.logo_url)
    : null
  const cat   = CAT_META[page.categoria] || { label: page.categoria || 'Empresa', cor: PRIMARY }
  const count = page.curtidas ?? page.followers_count ?? 0

  return (
    <View style={s.card}>
      <TouchableOpacity
        style={s.cardMain}
        onPress={() => router.push(`/pagina/${page.id}` as any)}
        activeOpacity={0.78}
      >
        {logoUrl
          ? <Image source={{ uri: logoUrl }} style={s.logo} />
          : <View style={[s.logo, s.logoFb]}>
              <Text style={s.logoFbT}>{(page.nome || '?').charAt(0)}</Text>
            </View>
        }
        <View style={{ flex: 1 }}>
          <Text style={s.nome} numberOfLines={1}>{page.nome}</Text>
          <View style={[s.catBadge, { backgroundColor: cat.cor + '18', borderColor: cat.cor + '50' }]}>
            <Text style={[s.catBadgeT, { color: cat.cor }]}>{cat.label}</Text>
          </View>
          {count > 0 ? (
            <Text style={s.curtidas}>{count} {count === 1 ? 'curtida' : 'curtidas'}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.curtirBtn, curtido ? s.curtirBtnOn : null]}
        onPress={onCurtir}
        disabled={curtindo}
        activeOpacity={0.8}
      >
        {curtindo
          ? <ActivityIndicator color={curtido ? PRIMARY : '#fff'} size="small" />
          : <Text style={[s.curtirBtnT, curtido && { color: PRIMARY }]}>
              {curtido ? '❤️ Curtido' : '🤍 Curtir'}
            </Text>
        }
      </TouchableOpacity>
    </View>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>🏢</Text>
      <Text style={s.emptyTitle}>Nenhuma página encontrada</Text>
      <Text style={s.emptySub}>
        As páginas de clínicas, laboratórios e empresas do setor odontológico aparecerão aqui.
      </Text>
    </View>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Empresas() {
  const { user } = useAuthStore()
  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= 768
  const [pages, setPages]             = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [curtidos, setCurtidos]       = useState<Record<number, boolean>>({})
  const [curtindo, setCurtindo]       = useState<Record<number, boolean>>({})

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : API_BASE + user.avatar_url)
    : null

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      const res = await api.get('/pages')
      const list: any[] = res.data.pages || res.data || []
      setPages(list)
      const estado: Record<number, boolean> = {}
      list.forEach((p: any) => { if (p.is_liked != null) estado[p.id] = !!p.is_liked })
      setCurtidos(prev => ({ ...estado, ...prev }))
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

  const handleCurtir = async (pageId: number) => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    setCurtindo(prev => ({ ...prev, [pageId]: true }))
    try {
      const res = await api.post(`/follows/${pageId}`)
      const following: boolean = res.data.following ?? !curtidos[pageId]
      setCurtidos(prev => ({ ...prev, [pageId]: following }))
      setPages(prev => prev.map(p =>
        p.id === pageId
          ? { ...p, curtidas: (p.curtidas ?? 0) + (following ? 1 : -1) }
          : p
      ))
    } catch {}
    finally {
      setCurtindo(prev => ({ ...prev, [pageId]: false }))
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0E0E0' }}>

      {/* ── Header ── */}
      {!isDesktop && (
        <View style={s.header}>
          <Text style={s.headerTitle}>Páginas</Text>
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
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={pages.length === 0
            ? { flex: 1, justifyContent: 'center' }
            : { padding: 14, gap: 12, paddingBottom: 32 }
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(true) }}
              tintColor={PRIMARY}
            />
          }
        >
          {pages.length === 0 ? (
            <EmptyState />
          ) : (
            pages.map(page => (
              <PaginaCard
                key={page.id}
                page={page}
                curtido={!!curtidos[page.id]}
                curtindo={!!curtindo[page.id]}
                onCurtir={() => handleCurtir(page.id)}
              />
            ))
          )}
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

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#D0E8DA', gap: 12,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12, flexShrink: 0 },
  logoFb: { backgroundColor: '#D0E8DA', justifyContent: 'center', alignItems: 'center' },
  logoFbT: { fontSize: 20, fontWeight: '800', color: '#3A6550' },
  nome: { fontSize: 15, fontWeight: '800', color: '#0A1C14', marginBottom: 6, lineHeight: 20 },
  catBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4,
  },
  catBadgeT: { fontSize: 10, fontWeight: '800' },
  curtidas: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },

  curtirBtn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  curtirBtnOn: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA',
  },
  curtirBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },

  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0A1C14', marginBottom: 10, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#7A9E8E', textAlign: 'center', lineHeight: 19 },
})
