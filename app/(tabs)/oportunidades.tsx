import { useCallback, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Image, Platform, Linking, useWindowDimensions,
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

// ── helpers ───────────────────────────────────────────────────────────────────

function calcularCompatAvancado(user: any, vaga: any): number {
  let score = 0
  const vagaEstado = (vaga.estado || vaga.empresa_estado || '').toLowerCase().trim()
  const vagaCidade = (vaga.cidade || vaga.empresa_cidade || '').toLowerCase().trim()
  if (!vagaEstado) { score += 20 }
  else if (user?.estado && user.estado.toLowerCase().trim() === vagaEstado) {
    score += 10
    if (vagaCidade && user?.cidade && user.cidade.toLowerCase().trim() === vagaCidade) score += 10
  }
  const reqObrig: string[] = vaga.requisitos_obrigatorios || []
  const reqDesej: string[] = vaga.requisitos_desejaveis  || []
  const userCaps = [
    ...(user?.especialidades || []),
    ...(user?.habilidades    || []),
    ...((user?.cargos_extras || []).map((c: any) => typeof c === 'string' ? c : c.cargo || '')),
    user?.tipo_profissional || '',
  ].map((c: string) => c.toLowerCase().trim()).filter(Boolean)
  const n = (s: string) => s.toLowerCase().trim()
  score += reqObrig.length ? (reqObrig.filter(r => userCaps.includes(n(r))).length / reqObrig.length) * 40 : 40
  score += reqDesej.length ? (reqDesej.filter(r => userCaps.includes(n(r))).length / reqDesej.length) * 20 : 20
  if (user?.formacao?.length)   score += 10
  if (user?.experiencia?.length) score += 10
  return Math.min(100, Math.round(score))
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

const CONTRATO_COR: Record<string, string> = {
  CLT: '#00A880', PJ: '#1A6FD4', Freelancer: GOLD, 'Estágio': '#7B3FC4',
}

const TIPO_CURSO_META: Record<string, { emoji: string; cor: string }> = {
  curso:       { emoji: '🎓', cor: '#1A6FD4' },
  treinamento: { emoji: '🏋️', cor: '#7B3FC4' },
  palestra:    { emoji: '🎤', cor: PRIMARY   },
  evento:      { emoji: '🗓️', cor: GOLD      },
}

// ── Card: Vaga de interesse ───────────────────────────────────────────────────

function VagaInteresseCard({ vaga, user }: { vaga: any; user: any }) {
  const pct    = vaga._pct ?? calcularCompatAvancado(user, vaga)
  const barCor = pct >= 60 ? '#00A880' : pct >= 30 ? GOLD : '#EF4444'
  const cCor   = CONTRATO_COR[vaga.contrato] || '#7A9E8E'
  const loc    = [vaga.cidade || vaga.empresa_cidade, vaga.estado || vaga.empresa_estado].filter(Boolean).join(' · ')
  const logoUrl = vaga.logo_url
    ? (vaga.logo_url.startsWith('http') ? vaga.logo_url : API_BASE + vaga.logo_url)
    : null

  return (
    <View style={s.vagaCard}>
      <View style={s.vagaTop}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
          onPress={() => vaga.page_id && router.push(`/pagina/${vaga.page_id}` as any)}
          activeOpacity={vaga.page_id ? 0.72 : 1}
          disabled={!vaga.page_id}
        >
          {logoUrl
            ? <Image source={{ uri: logoUrl }} style={s.vagaLogo} />
            : <View style={[s.vagaLogo, s.vagaLogoFb]}>
                <Text style={s.vagaLogoFbT}>{(vaga.empresa_nome || '?').charAt(0)}</Text>
              </View>
          }
          <View style={{ flex: 1 }}>
            <Text style={s.vagaEmpresa} numberOfLines={1}>{vaga.empresa_nome}</Text>
            <Text style={s.vagaCargo}   numberOfLines={2}>{vaga.cargo}</Text>
          </View>
        </TouchableOpacity>
        <View style={[s.pctBadge, { borderColor: barCor + '80', backgroundColor: barCor + '15' }]}>
          <Text style={[s.pctT, { color: barCor }]}>{pct}%</Text>
        </View>
      </View>
      <View style={s.chips}>
        {vaga.contrato ? (
          <View style={[s.chip, { borderColor: cCor + '70', backgroundColor: cCor + '14' }]}>
            <Text style={[s.chipT, { color: cCor }]}>{vaga.contrato}</Text>
          </View>
        ) : null}
        {loc ? <View style={s.chip}><Text style={s.chipT}>📍 {loc}</Text></View> : null}
      </View>
      <TouchableOpacity
        style={[s.actionBtn, { backgroundColor: '#475569' }]}
        onPress={() => router.push('/(tabs)/vagas' as any)}
        activeOpacity={0.8}
      >
        <Text style={s.actionBtnT}>Ver vaga →</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Card: Curso / Evento ──────────────────────────────────────────────────────

function CursoCard({ pub, pageNome, pageLogo }: { pub: any; pageNome: string; pageLogo: string | null }) {
  const meta    = TIPO_CURSO_META[pub.tipo] || { emoji: '📋', cor: PRIMARY }
  const dados   = pub.dados || {}
  const logoUrl = pageLogo
    ? (pageLogo.startsWith('http') ? pageLogo : API_BASE + pageLogo)
    : null

  const handleLink = () => {
    if (dados.link_inscricao) Linking.openURL(dados.link_inscricao).catch(() => null)
  }

  return (
    <View style={s.cursoCard}>
      <View style={s.cursoTop}>
        {logoUrl
          ? <Image source={{ uri: logoUrl }} style={s.cursoLogo} />
          : <View style={[s.cursoLogo, { backgroundColor: meta.cor + '25', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
            </View>
        }
        <View style={{ flex: 1 }}>
          <Text style={s.cursoPageNome} numberOfLines={1}>{pageNome}</Text>
          <Text style={s.cursoTitulo}   numberOfLines={2}>{pub.titulo}</Text>
        </View>
        <View style={[s.cursoBadge, { backgroundColor: meta.cor + '18', borderColor: meta.cor + '50' }]}>
          <Text style={[s.cursoBadgeT, { color: meta.cor }]}>{meta.emoji} {pub.tipo?.toUpperCase()}</Text>
        </View>
      </View>

      {dados.descricao ? (
        <Text style={s.cursoDesc} numberOfLines={3}>{dados.descricao}</Text>
      ) : null}

      <View style={s.cursoPills}>
        {dados.modalidade    ? <View style={s.cursoPill}><Text style={s.cursoPillT}>{dados.modalidade}</Text></View>    : null}
        {dados.carga_horaria ? <View style={s.cursoPill}><Text style={s.cursoPillT}>⏱ {dados.carga_horaria}</Text></View> : null}
        {dados.data_inicio   ? <View style={s.cursoPill}><Text style={s.cursoPillT}>📅 {dados.data_inicio}</Text></View>  : null}
        {dados.data          ? <View style={s.cursoPill}><Text style={s.cursoPillT}>📅 {dados.data}</Text></View>         : null}
        {dados.local         ? <View style={s.cursoPill}><Text style={s.cursoPillT}>📍 {dados.local}</Text></View>        : null}
      </View>

      {dados.link_inscricao ? (
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: meta.cor }]} onPress={handleLink} activeOpacity={0.8}>
          <Text style={s.actionBtnT}>Inscrever-se →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Aba = 'interesse' | 'cursos'

const ABAS: { key: Aba; label: string }[] = [
  { key: 'interesse', label: 'Talvez te interesse' },
  { key: 'cursos',    label: 'Cursos e Eventos'    },
]

const EMPTY: Record<Aba, any[]> = { interesse: [], cursos: [] }

export default function Oportunidades() {
  const { user } = useAuthStore()
  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= 768
  const [aba, setAba]               = useState<Aba>('interesse')
  const [allData, setAllData]       = useState<Record<Aba, any[]>>(EMPTY)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const abaRef = useRef<Aba>('interesse')

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : API_BASE + user.avatar_url)
    : null

  const loadData = useCallback(async (tab: Aba, isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      let items: any[] = []
      if (tab === 'interesse') {
        const res = await api.get('/vagas')
        items = (res.data.vagas || [])
          .map((v: any) => ({ ...v, _pct: calcularCompatAvancado(user, v) }))
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      } else if (tab === 'cursos') {
        const pagesRes = await api.get('/pages').catch(() => ({ data: { pages: [] } }))
        const pages: any[] = (pagesRes.data.pages || pagesRes.data || []).slice(0, 8)
        const pubsArr = await Promise.all(
          pages.map((p: any) =>
            api.get(`/pages/${p.id}/publicacoes`)
              .then(r => (r.data || []).map((pub: any) => ({
                ...pub,
                _pageNome: p.nome,
                _pageLogo: p.logo_url,
              })))
              .catch(() => [] as any[])
          )
        )
        const tipos = ['curso', 'treinamento', 'palestra', 'evento']
        items = pubsArr
          .flat()
          .filter((pub: any) => tipos.includes(pub.tipo))
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
      setAllData(prev => ({ ...prev, [tab]: items }))
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  const loadNotifCount = useCallback(() => {
    api.get('/notifications?limit=1')
      .then(r => setUnreadCount(r.data.unread || 0))
      .catch(() => null)
  }, [])

  useFocusEffect(useCallback(() => {
    loadNotifCount()
    setLoading(true)
    loadData(abaRef.current)
  }, [loadData, loadNotifCount]))

  const switchAba = (tab: Aba) => {
    setAba(tab)
    abaRef.current = tab
    setLoading(true)
    loadData(tab)
  }

  const items = allData[aba]

  return (
    <View style={{ flex: 1, backgroundColor: '#E0E0E0' }}>

      {/* ── Header (mobile only) ── */}
      {!isDesktop && (
        <View style={s.header}>
          <Text style={s.headerTitle}>Oportunidades</Text>
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

      {/* ── Aba bar ── */}
      <View style={s.abaBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.abaScroll}>
          {ABAS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[s.abaBtn, aba === a.key && s.abaBtnOn]}
              onPress={() => switchAba(a.key)}
              activeOpacity={0.78}
            >
              <Text style={[s.abaBtnT, aba === a.key && s.abaBtnTOn]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(abaRef.current, true) }}
            tintColor={PRIMARY}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={aba === 'interesse' ? '🔍' : '🎓'}
            title={aba === 'interesse' ? 'Nenhuma vaga no momento'   : 'Nenhum curso ou evento'}
            sub={aba === 'interesse'
              ? 'Vagas de áreas relacionadas aparecerão aqui'
              : 'Cursos, treinamentos e eventos publicados pelas empresas aparecerão aqui'
            }
          />
        ) : aba === 'interesse' ? (
          <View style={{ gap: 12 }}>
            {items.map(v => <VagaInteresseCard key={v.id} vaga={v} user={user} />)}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {items.map((pub, i) => (
              <CursoCard
                key={pub.id ?? i}
                pub={pub}
                pageNome={pub._pageNome}
                pageLogo={pub._pageLogo}
              />
            ))}
          </View>
        )}
      </ScrollView>
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

  abaBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  abaScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  abaBtn: {
    backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
  },
  abaBtnOn: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  abaBtnT: { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  abaBtnTOn: { color: '#fff' },

  // Vaga interesse card
  vagaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', gap: 10 },
  vagaTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vagaLogo: { width: 40, height: 40, borderRadius: 10, flexShrink: 0 },
  vagaLogoFb: { backgroundColor: '#D0E8DA', justifyContent: 'center', alignItems: 'center' },
  vagaLogoFbT: { fontSize: 16, fontWeight: '800', color: '#3A6550' },
  vagaEmpresa: { fontSize: 12, fontWeight: '700', color: '#3A6550' },
  vagaCargo: { fontSize: 15, fontWeight: '800', color: '#0A1C14', marginTop: 2, lineHeight: 20 },
  pctBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0, alignItems: 'center' },
  pctT: { fontSize: 13, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4 },
  chipT: { fontSize: 11, fontWeight: '700', color: '#3A6550' },

  // Curso card
  cursoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', gap: 10 },
  cursoTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cursoLogo: { width: 44, height: 44, borderRadius: 10, flexShrink: 0 },
  cursoPageNome: { fontSize: 11, fontWeight: '700', color: '#7A9E8E' },
  cursoTitulo: { fontSize: 15, fontWeight: '800', color: '#0A1C14', marginTop: 2, lineHeight: 20 },
  cursoBadge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  cursoBadgeT: { fontSize: 9, fontWeight: '800' },
  cursoDesc: { fontSize: 13, color: '#4A7060', lineHeight: 18 },
  cursoPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cursoPill: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  cursoPillT: { fontSize: 11, fontWeight: '600', color: '#555' },

  actionBtn: { borderRadius: 12, paddingVertical: 11, alignItems: 'center', ...(Platform.OS === 'web' ? { maxWidth: 300, alignSelf: 'center' as const } : {}) },
  actionBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#7A9E8E', textAlign: 'center', lineHeight: 19 },
})
