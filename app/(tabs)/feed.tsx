import { useCallback, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Image, Platform,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const API_BASE = 'https://godenth-api.onrender.com'
const PRIMARY  = '#1c909b'
const GOLD     = '#C49800'

// ── SVG icons ─────────────────────────────────────────────────────────────────

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

function calcularPerfilPct(user: any): number {
  if (!user) return 0
  const checks = [
    !!user.avatar_url,
    !!user.bio?.trim(),
    !!user.cidade,
    !!user.estado,
    !!(user.especialidades?.length),
    !!(user.habilidades?.length),
    !!user.celular,
    !!(user.formacao?.length),
    !!(user.experiencia?.length),
  ]
  return Math.round(checks.filter(Boolean).length / checks.length * 100)
}

function calcularCompatClient(user: any, vaga: any): number {
  const reqObrig: string[] = vaga.requisitos_obrigatorios || []
  const reqDesej: string[] = vaga.requisitos_desejaveis  || []
  if (!reqObrig.length && !reqDesej.length) return 100
  const userCaps = [
    ...(user?.especialidades || []),
    ...(user?.habilidades    || []),
    ...((user?.cargos_extras || []).map((c: any) => typeof c === 'string' ? c : c.cargo || '')),
    user?.tipo_profissional || '',
  ].map((c: string) => c.toLowerCase().trim()).filter(Boolean)
  const n = (s: string) => s.toLowerCase().trim()
  let score = reqObrig.length
    ? reqObrig.filter(r => userCaps.includes(n(r))).length / reqObrig.length * 70
    : 70
  score += reqDesej.length
    ? reqDesej.filter(r => userCaps.includes(n(r))).length / reqDesej.length * 30
    : 30
  return Math.round(score)
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

const STATUS_META: Record<string, { label: string; cor: string }> = {
  pendente:   { label: 'Pendente',   cor: GOLD       },
  em_analise: { label: 'Em Análise', cor: '#1A6FD4'  },
  aprovado:   { label: 'Aprovado',   cor: '#00A880'  },
  reprovado:  { label: 'Reprovado',  cor: '#E53935'  },
}

const PARC_META: Record<string, { emoji: string; label: string; cor: string }> = {
  parceria: { emoji: '🤝', label: 'Busco Parceria',   cor: '#7B3FC4' },
  ajuda:    { emoji: '🆘', label: 'Preciso de Ajuda', cor: '#E53935' },
}

// ── Card: Vaga ────────────────────────────────────────────────────────────────

function VagaCard({ vaga, user }: { vaga: any; user: any }) {
  const pct      = vaga._pct ?? calcularCompatClient(user, vaga)
  const barCor   = pct >= 80 ? '#00A880' : pct >= 50 ? GOLD : '#EF4444'
  const cCor     = CONTRATO_COR[vaga.contrato] || '#7A9E8E'
  const loc      = [vaga.cidade || vaga.empresa_cidade, vaga.estado || vaga.empresa_estado].filter(Boolean).join(' · ')
  const logoUrl  = vaga.logo_url
    ? (vaga.logo_url.startsWith('http') ? vaga.logo_url : API_BASE + vaga.logo_url)
    : null
  const salMin   = vaga.salario_min
  const salMax   = vaga.salario_max
  const salario  = salMin
    ? `R$ ${Number(salMin).toLocaleString('pt-BR')}${salMax ? ` – ${Number(salMax).toLocaleString('pt-BR')}` : ''}`
    : null

  return (
    <View style={s.vagaCard}>
      <View style={s.vagaTop}>
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
        <View style={[s.pctCircle, { borderColor: barCor }]}>
          <Text style={[s.pctT, { color: barCor }]}>{pct}%</Text>
        </View>
      </View>

      <View style={s.chips}>
        {vaga.contrato ? (
          <View style={[s.chip, { borderColor: cCor + '70', backgroundColor: cCor + '14' }]}>
            <Text style={[s.chipT, { color: cCor }]}>{vaga.contrato}</Text>
          </View>
        ) : null}
        {loc     ? <View style={s.chip}><Text style={s.chipT}>📍 {loc}</Text></View>     : null}
        {salario ? <View style={s.chip}><Text style={s.chipT}>{salario}</Text></View> : null}
      </View>

      <View style={s.compatBar}>
        <View style={[s.compatFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: barCor }]} />
      </View>

      <TouchableOpacity
        style={[s.actionBtn, { backgroundColor: PRIMARY }]}
        onPress={() => router.push('/(tabs)/vagas' as any)}
        activeOpacity={0.8}
      >
        <Text style={s.actionBtnT}>Ver vaga →</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Card: Parceria / Ajuda ────────────────────────────────────────────────────

function ParceriaCard({ post }: { post: any }) {
  const meta      = PARC_META[post.tipo_post] || PARC_META.parceria
  const avatarUrl = post.author_avatar
    ? (post.author_avatar.startsWith('http') ? post.author_avatar : API_BASE + post.author_avatar)
    : null
  const nome = post.page_nome || post.author_nome || 'Usuário'
  const loc  = [post.data_json?.cidade, post.data_json?.estado].filter(Boolean).join(' · ')

  return (
    <View style={[s.parcCard, { borderLeftColor: meta.cor }]}>
      <View style={s.parcTop}>
        {avatarUrl
          ? <Image source={{ uri: avatarUrl }} style={s.parcAv} />
          : <View style={[s.parcAv, { backgroundColor: meta.cor + '28', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: meta.cor, fontWeight: '800', fontSize: 15 }}>{nome.charAt(0)}</Text>
            </View>
        }
        <View style={{ flex: 1 }}>
          <Text style={s.parcNome}  numberOfLines={1}>{nome}</Text>
          {post.tipo_profissional ? <Text style={s.parcCargo} numberOfLines={1}>{post.tipo_profissional}</Text> : null}
          {loc ? <Text style={s.parcLoc}>{loc}</Text> : null}
        </View>
        <View style={[s.parcTag, { backgroundColor: meta.cor + '18', borderColor: meta.cor + '60' }]}>
          <Text style={[s.parcTagT, { color: meta.cor }]}>{meta.emoji} {meta.label}</Text>
        </View>
      </View>
      {post.data_json?.subcategoria
        ? <View style={s.parcSub}><Text style={s.parcSubT}>{post.data_json.subcategoria}</Text></View>
        : null}
      {post.data_json?.texto
        ? <Text style={s.parcTexto} numberOfLines={4}>{post.data_json.texto}</Text>
        : null}
      <Text style={s.parcTempo}>{tempoRelativo(post.created_at)}</Text>
    </View>
  )
}

// ── Card: Grupo ───────────────────────────────────────────────────────────────

function GrupoCard({ grupo }: { grupo: any }) {
  return (
    <TouchableOpacity
      style={s.grupoCard}
      onPress={() => router.push(`/grupo/${grupo.id}` as any)}
      activeOpacity={0.78}
    >
      <View style={[s.grupoIcon, { backgroundColor: PRIMARY + '1A' }]}>
        <Text style={{ fontSize: 22 }}>{grupo.icone || '🦷'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.grupoNome} numberOfLines={1}>{grupo.nome}</Text>
        <Text style={s.grupoDesc} numberOfLines={2}>{grupo.descricao}</Text>
      </View>
      {grupo.total_posts > 0 ? (
        <View style={s.grupoBadge}>
          <Text style={s.grupoBadgeT}>{grupo.total_posts}</Text>
          <Text style={s.grupoBadgeSub}> posts</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

// ── Card: Candidatura ─────────────────────────────────────────────────────────

function CandidaturaCard({ cand }: { cand: any }) {
  const vaga  = cand.vaga || cand
  const status = cand.status || 'pendente'
  const sm    = STATUS_META[status] || { label: status, cor: '#7A9E8E' }
  const pct   = cand.compatibilidade_pct ?? cand.compatibilidade ?? null
  const loc   = [vaga.cidade || vaga.empresa_cidade, vaga.estado || vaga.empresa_estado].filter(Boolean).join(' · ')

  return (
    <View style={s.candCard}>
      <View style={s.candTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.candEmpresa} numberOfLines={1}>{vaga.empresa_nome || 'Empresa'}</Text>
          <Text style={s.candCargo}   numberOfLines={2}>{vaga.cargo || 'Cargo não informado'}</Text>
          {loc ? <Text style={s.candLoc}>{loc}</Text> : null}
        </View>
        <View style={[s.statusBadge, { backgroundColor: sm.cor + '1E', borderColor: sm.cor + '60' }]}>
          <Text style={[s.statusT, { color: sm.cor }]}>{sm.label}</Text>
        </View>
      </View>
      <View style={s.candFoot}>
        <Text style={s.candData}>{tempoRelativo(cand.created_at || cand.data_candidatura)}</Text>
        {pct !== null ? (
          <View style={s.candPct}>
            <Text style={s.candPctT}>{pct}% compatível</Text>
          </View>
        ) : null}
      </View>
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

type Aba = 'vagas' | 'parcerias' | 'grupos' | 'candidaturas'

const ABAS: { key: Aba; label: string }[] = [
  { key: 'vagas',        label: 'Vagas para mim' },
  { key: 'parcerias',    label: 'Parcerias'       },
  { key: 'grupos',       label: 'Grupos'          },
  { key: 'candidaturas', label: 'Candidaturas'    },
]

const EMPTY: Record<Aba, any[]> = { vagas: [], parcerias: [], grupos: [], candidaturas: [] }

export default function Painel() {
  const { user } = useAuthStore()
  const [aba, setAba]               = useState<Aba>('vagas')
  const [allData, setAllData]       = useState<Record<Aba, any[]>>(EMPTY)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const abaRef = useRef<Aba>('vagas')

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : API_BASE + user.avatar_url)
    : null
  const perfilPct = calcularPerfilPct(user)

  const loadData = useCallback(async (tab: Aba, isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      let items: any[] = []
      if (tab === 'vagas') {
        const res = await api.get('/vagas')
        items = (res.data.vagas || [])
          .map((v: any) => ({ ...v, _pct: calcularCompatClient(user, v) }))
          .sort((a: any, b: any) => b._pct - a._pct)
      } else if (tab === 'parcerias') {
        const [pr, ar] = await Promise.all([
          api.get('/posts?tipo_post=parceria'),
          api.get('/posts?tipo_post=ajuda').catch(() => ({ data: { posts: [] } })),
        ])
        items = [...(pr.data.posts || []), ...(ar.data.posts || [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      } else if (tab === 'grupos') {
        const res = await api.get('/grupos/meus').catch(() => api.get('/grupos'))
        items = res.data.grupos || res.data || []
      } else if (tab === 'candidaturas') {
        const res = await api.get('/vagas/minhas-candidaturas')
        items = res.data.candidaturas || res.data || []
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
    <View style={{ flex: 1, backgroundColor: '#F4F8F6' }}>

      {/* ── App Header ── */}
      <View style={s.header}>
        <Text style={s.logo}>
          <Text style={{ color: '#F5C800' }}>Go</Text>
          <Text style={{ color: '#fff' }}>Denth</Text>
        </Text>
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

      {/* ── Email verification banner ── */}
      {!user?.email_verificado && (
        <TouchableOpacity style={s.verifBanner} onPress={() => router.push('/configuracoes' as any)} activeOpacity={0.85}>
          <Text style={s.verifBannerT}>Verifique seu email para garantir o acesso completo</Text>
          <Text style={s.verifBannerLink}>Verificar →</Text>
        </TouchableOpacity>
      )}

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1 }}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(abaRef.current, true) }}
            tintColor={PRIMARY}
          />
        }
      >
        {/* [0] Profile card */}
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
        <View style={s.profileCard}>
          <TouchableOpacity
            style={s.profileLeft}
            onPress={() => router.push('/(tabs)/perfil' as any)}
            activeOpacity={0.78}
          >
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.profileAv} />
              : <View style={[s.profileAv, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 22 }}>{user?.nome?.charAt(0) || 'U'}</Text>
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.profileNome} numberOfLines={1}>{user?.nome || 'Usuário'}</Text>
              {user?.tipo_profissional
                ? <Text style={s.profileCargo} numberOfLines={1}>{user.tipo_profissional}</Text>
                : null}
              {(user?.cidade || user?.estado)
                ? <Text style={s.profileLoc}>📍 {[user?.cidade, user?.estado].filter(Boolean).join(', ')}</Text>
                : null}
            </View>
          </TouchableOpacity>

          {perfilPct < 100 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/editar-perfil' as any)} activeOpacity={0.78}>
              <View style={s.profilePctRow}>
                <View style={s.profilePctBar}>
                  <View style={[s.profilePctFill, { width: `${perfilPct}%` as any }]} />
                </View>
                <Text style={s.profilePctTxt}>{perfilPct}%</Text>
              </View>
              <Text style={s.profileCompleteLink}>Completar perfil →</Text>
            </TouchableOpacity>
          )}
        </View>
        </View>

        {/* [1] Aba bar — sticks to top on scroll */}
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

        {/* [2] Tab content */}
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          {loading ? (
            <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={
                aba === 'vagas'        ? '💼' :
                aba === 'parcerias'    ? '🤝' :
                aba === 'grupos'       ? '👥' : '📋'
              }
              title={
                aba === 'vagas'        ? 'Nenhuma vaga encontrada'     :
                aba === 'parcerias'    ? 'Nenhuma parceria no momento' :
                aba === 'grupos'       ? 'Nenhum grupo encontrado'     :
                'Nenhuma candidatura'
              }
              sub={
                aba === 'vagas'        ? 'Novas oportunidades aparecerão aqui conforme forem publicadas' :
                aba === 'parcerias'    ? 'Acompanhe novidades da rede de profissionais'                  :
                aba === 'grupos'       ? 'Acesse a aba Grupos para participar de comunidades'            :
                'Candidate-se a vagas para acompanhar o status aqui'
              }
            />
          ) : aba === 'vagas' ? (
            <View style={{ gap: 12 }}>
              {items.map(v => <VagaCard key={v.id} vaga={v} user={user} />)}
            </View>
          ) : aba === 'parcerias' ? (
            <View style={{ gap: 12 }}>
              {items.map(p => <ParceriaCard key={p.id} post={p} />)}
            </View>
          ) : aba === 'grupos' ? (
            <View style={{ gap: 10 }}>
              {items.map(g => <GrupoCard key={g.id} grupo={g} />)}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {items.map((c, i) => <CandidaturaCard key={c.id ?? i} cand={c} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: PRIMARY,
  },
  logo: { fontSize: 26, fontFamily: 'Poppins-ExtraBold', letterSpacing: -0.5 },
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

  // Verification banner
  verifBanner: {
    backgroundColor: '#FFF3E0', borderBottomWidth: 1, borderBottomColor: '#FFCC80',
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  verifBannerT: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17, fontWeight: '600' },
  verifBannerLink: { fontSize: 12, color: '#E65100', fontWeight: '800', flexShrink: 0 },

  // Profile card
  profileCard: {
    backgroundColor: '#fff', padding: 16,
    borderRadius: 16, borderWidth: 1, borderColor: '#D0E8DA', gap: 12,
  },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAv: { width: 54, height: 54, borderRadius: 27, flexShrink: 0 },
  profileNome: { fontSize: 16, fontWeight: '800', color: '#0A1C14' },
  profileCargo: { fontSize: 12, color: PRIMARY, fontWeight: '600', marginTop: 2 },
  profileLoc: { fontSize: 12, color: '#7A9E8E', marginTop: 2 },
  profilePctRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profilePctBar: { flex: 1, height: 5, backgroundColor: '#E0F0EC', borderRadius: 3, overflow: 'hidden' },
  profilePctFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 3 },
  profilePctTxt: { fontSize: 12, fontWeight: '800', color: PRIMARY, width: 34, textAlign: 'right' },
  profileCompleteLink: { fontSize: 12, fontWeight: '700', color: GOLD, marginTop: 4 },

  // Aba bar
  abaBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  abaScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  abaBtn: {
    backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
  },
  abaBtnOn: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  abaBtnT: { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  abaBtnTOn: { color: '#fff' },

  // Vaga card
  vagaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', gap: 10 },
  vagaTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vagaLogo: { width: 40, height: 40, borderRadius: 10, flexShrink: 0 },
  vagaLogoFb: { backgroundColor: '#D0E8DA', justifyContent: 'center', alignItems: 'center' },
  vagaLogoFbT: { fontSize: 16, fontWeight: '800', color: '#3A6550' },
  vagaEmpresa: { fontSize: 12, fontWeight: '700', color: '#3A6550' },
  vagaCargo: { fontSize: 15, fontWeight: '800', color: '#0A1C14', marginTop: 2, lineHeight: 20 },
  pctCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  pctT: { fontSize: 12, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4 },
  chipT: { fontSize: 11, fontWeight: '700', color: '#3A6550' },
  compatBar: { height: 5, backgroundColor: '#EEF7F2', borderRadius: 3, overflow: 'hidden' },
  compatFill: { height: '100%', borderRadius: 3 },
  actionBtn: { borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  actionBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Parceria card
  parcCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', borderLeftWidth: 4, gap: 8 },
  parcTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  parcAv: { width: 42, height: 42, borderRadius: 21, flexShrink: 0 },
  parcNome: { fontSize: 14, fontWeight: '800', color: '#0A1C14' },
  parcCargo: { fontSize: 12, color: PRIMARY, fontWeight: '600', marginTop: 1 },
  parcLoc: { fontSize: 11, color: '#7A9E8E', marginTop: 1 },
  parcTag: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  parcTagT: { fontSize: 10, fontWeight: '800' },
  parcSub: { alignSelf: 'flex-start', backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  parcSubT: { fontSize: 12, fontWeight: '700', color: '#3A6550' },
  parcTexto: { fontSize: 13, color: '#4A7060', lineHeight: 19 },
  parcTempo: { fontSize: 11, color: '#A0B8AC', fontWeight: '600' },

  // Grupo card
  grupoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', flexDirection: 'row', alignItems: 'center', gap: 12 },
  grupoIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  grupoNome: { fontSize: 14, fontWeight: '800', color: '#0A1C14' },
  grupoDesc: { fontSize: 12, color: '#7A9E8E', marginTop: 2, lineHeight: 17 },
  grupoBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: PRIMARY + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  grupoBadgeT: { fontSize: 14, fontWeight: '900', color: PRIMARY },
  grupoBadgeSub: { fontSize: 10, color: PRIMARY, fontWeight: '600' },

  // Candidatura card
  candCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', gap: 10 },
  candTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  candEmpresa: { fontSize: 12, fontWeight: '700', color: '#3A6550' },
  candCargo: { fontSize: 15, fontWeight: '800', color: '#0A1C14', marginTop: 2, lineHeight: 20 },
  candLoc: { fontSize: 11, color: '#7A9E8E', marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  statusT: { fontSize: 11, fontWeight: '800' },
  candFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEF7F2' },
  candData: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  candPct: { borderWidth: 1, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  candPctT: { fontSize: 11, fontWeight: '700', color: '#3A6550' },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#7A9E8E', textAlign: 'center', lineHeight: 19 },
})
