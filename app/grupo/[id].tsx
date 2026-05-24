import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
  TextInput, Image, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, Alert, Share, Dimensions,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const { width: SCREEN_W } = Dimensions.get('window')
const TEAL      = '#1c909b'
const GOLD      = '#C49800'
const BG        = '#FAFAF8'
const CARD      = '#FFFFFF'
const BORDER    = '#E4EEE9'
const TEXT      = '#0a2228'
const MUTED     = '#5a7a72'
const COVER_H   = 160

const CAT_COLOR: Record<string, string> = {
  odontologia: '#1A6FD4',
  protese:     '#7B3FC4',
}

const CAT_LABEL: Record<string, string> = {
  odontologia: 'Odontologia',
  protese:     'Prótese Dentária',
}

// ─── Header icons ────────────────────────────────────────────────────────────

const IB = { stroke: '#fff', strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function PlusIcon()   { return <Svg width={20} height={20} viewBox="0 0 24 24"><Line x1="12" y1="5" x2="12" y2="19" {...IB} /><Line x1="5" y1="12" x2="19" y2="12" {...IB} /></Svg> }
function SearchIcon() { return <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx="10.5" cy="10.5" r="6.5" {...IB} /><Line x1="15.5" y1="15.5" x2="21" y2="21" {...IB} /></Svg> }
function BellIcon()   { return <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M10,7 C10,5.3 14,5.3 14,7" {...IB} /><Path d="M5,17 C5,12 7.5,8 12,8 C16.5,8 19,12 19,17 L20,19 L4,19 Z" {...IB} /><Path d="M10,19 C10,20.7 14,20.7 14,19" {...IB} /></Svg> }
function TrashIcon()  {
  const t = { stroke: '#E53935', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" {...t} />
      <Line x1="10" y1="11" x2="10" y2="17" {...t} />
      <Line x1="14" y1="11" x2="14" y2="17" {...t} />
    </Svg>
  )
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface Grupo {
  id: number; nome: string; descricao: string
  categoria: string; icone: string; capa_url: string | null
  total_posts: number; total_membros: number; is_member: boolean
  created_at: string
  ultimos_ativos: { id: number; nome: string; avatar_url: string | null }[]
}

interface GrupoPost {
  id: number; grupo_id: number; texto: string | null; imagem_url: string | null
  created_at: string; author_id: number; author_nome: string
  author_tipo: string; author_avatar: string | null
  author_especialidade: string | null; author_cidade: string | null; author_estado: string | null
}

interface Membro {
  id: number; nome: string; tipo_profissional: string
  cidade: string | null; estado: string | null
  avatar_url: string | null; especialidade: string | null
}

type Tab = 'discussao' | 'membros' | 'sobre'
type ImageAsset = { uri: string; name: string; type: string; base64?: string | null }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(d).toLocaleDateString('pt-BR')
}

function Avatar({ uri, nome, size = 40, border }: { uri?: string | null; nome: string; size?: number; border?: string }) {
  const src = uri || null
  const initials = (nome ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const inner = src
    ? <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    : (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: TEAL + '25', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: TEAL }}>{initials}</Text>
      </View>
    )
  if (!border) return inner
  return (
    <View style={{ width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, backgroundColor: border, alignItems: 'center', justifyContent: 'center' }}>
      {inner}
    </View>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PostCard({ post, accentColor, canDelete, onDelete }: {
  post: GrupoPost; accentColor: string
  canDelete?: boolean; onDelete?: () => void
}) {
  return (
    <View style={pc.card}>
      <View style={pc.header}>
        <TouchableOpacity style={pc.authorRow} onPress={() => router.push(`/usuario/${post.author_id}` as any)} activeOpacity={0.7}>
          <Avatar uri={post.author_avatar} nome={post.author_nome} size={42} />
          <View style={pc.meta}>
            <Text style={pc.nome}>{post.author_nome}</Text>
            <Text style={pc.sub}>
              {post.author_especialidade || post.author_tipo}
              {post.author_cidade ? ` · ${post.author_cidade}` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={pc.timeRow}>
          <Text style={pc.time}>{timeAgo(post.created_at)}</Text>
          {canDelete && (
            <TouchableOpacity style={pc.deleteBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <TrashIcon />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {!!post.texto && <Text style={pc.texto}>{post.texto}</Text>}
      {!!post.imagem_url && (
        <Image source={{ uri: post.imagem_url }} style={pc.img} resizeMode="cover" />
      )}
      <View style={[pc.stripe, { backgroundColor: accentColor }]} />
    </View>
  )
}

const pc = StyleSheet.create({
  card:      { backgroundColor: CARD, marginBottom: 8, borderRadius: 0, overflow: 'hidden' },
  header:    { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  meta:      { flex: 1 },
  nome:   { fontSize: 14, fontWeight: '700', color: TEXT },
  sub:    { fontSize: 11, color: MUTED, marginTop: 1 },
  timeRow:   { alignItems: 'flex-end', gap: 6 },
  time:      { fontSize: 11, color: MUTED },
  deleteBtn: { padding: 2 },
  texto:  { fontSize: 14, color: TEXT, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 12 },
  img:    { width: '100%', height: 240 },
  stripe: { height: 3, width: '100%', opacity: 0.5 },
})

function MemberRow({ m }: { m: Membro }) {
  return (
    <View style={mr.row}>
      <Avatar uri={m.avatar_url} nome={m.nome} size={46} />
      <View style={mr.info}>
        <Text style={mr.nome}>{m.nome}</Text>
        <Text style={mr.sub}>
          {m.especialidade || m.tipo_profissional}
          {m.cidade ? ` · ${m.cidade}/${m.estado}` : ''}
        </Text>
      </View>
    </View>
  )
}

const mr = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  info: { flex: 1 },
  nome: { fontSize: 14, fontWeight: '700', color: TEXT },
  sub:  { fontSize: 12, color: MUTED, marginTop: 2 },
})

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function GrupoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const isAdmin = user?.plano === 'black'

  const [grupo, setGrupo]       = useState<Grupo | null>(null)
  const [posts, setPosts]       = useState<GrupoPost[]>([])
  const [membros, setMembros]   = useState<Membro[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab]   = useState<Tab>('discussao')
  const [membrosLoaded, setMembrosLoaded] = useState(false)

  // Publish modal
  const [modalOpen, setModalOpen]   = useState(false)
  const [texto, setTexto]           = useState('')
  const [imagem, setImagem]         = useState<ImageAsset | null>(null)
  const [publishing, setPublishing] = useState(false)

  // Cover upload
  const [capaLoading, setCapaLoading] = useState(false)

  const accent = CAT_COLOR[grupo?.categoria ?? ''] ?? TEAL
  const avatarUrl = user?.avatar_url || null

  const handleBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/feed' as any)
  }

  const fetchGrupo = useCallback(async () => {
    try {
      const [gRes, pRes] = await Promise.all([
        api.get(`/grupos/${id}`),
        api.get(`/grupos/${id}/posts`),
      ])
      setGrupo(gRes.data)
      setPosts(pRes.data)
    } catch (err) {
      console.error('Erro ao carregar grupo:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  const fetchMembros = useCallback(async () => {
    if (membrosLoaded) return
    try {
      const res = await api.get(`/grupos/${id}/membros`)
      setMembros(res.data)
      setMembrosLoaded(true)
    } catch (err) {
      console.error('Erro ao carregar membros:', err)
    }
  }, [id, membrosLoaded])

  useEffect(() => { fetchGrupo() }, [fetchGrupo])

  useEffect(() => {
    if (activeTab === 'membros') fetchMembros()
  }, [activeTab])

  const onRefresh = () => {
    setRefreshing(true)
    setMembrosLoaded(false)
    fetchGrupo()
  }

  const handleEntrar = async () => {
    try {
      await api.post(`/grupos/${id}/entrar`)
      setGrupo(prev => prev ? { ...prev, is_member: true, total_membros: prev.total_membros + 1 } : prev)
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível entrar no grupo.')
    }
  }

  const handlePublish = async () => {
    if (!texto.trim() && !imagem) { Alert.alert('Atenção', 'Escreva algo ou adicione uma imagem.'); return }
    setPublishing(true)
    try {
      const payload: Record<string, any> = {}
      if (texto.trim()) payload.texto = texto.trim()
      if (imagem?.base64) { payload.imagem_base64 = imagem.base64; payload.imagem_tipo = imagem.type }
      await api.post(`/grupos/${id}/posts`, payload)
      setTexto(''); setImagem(null); setModalOpen(false)
      setGrupo(prev => prev ? { ...prev, is_member: true } : prev)
      fetchGrupo()
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível publicar.')
    } finally {
      setPublishing(false)
    }
  }

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permissão necessária', 'Permita acesso à galeria.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsEditing: true, base64: true })
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0]
      const mime = a.mimeType || 'image/jpeg'
      const ext = mime.split('/')[1] || 'jpg'
      setImagem({ uri: a.uri, name: `foto.${ext}`, type: mime, base64: a.base64 || null })
    }
  }

  const handleCapaUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para alterar a capa.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85, allowsEditing: true, aspect: [16, 6], base64: true,
    })
    if (result.canceled || !result.assets[0]) return
    const a = result.assets[0]
    if (!a.base64) { Alert.alert('Erro', 'Não foi possível ler a imagem.'); return }
    setCapaLoading(true)
    try {
      const res = await api.put(`/grupos/${id}/capa`, {
        imagem_base64: a.base64,
        imagem_tipo: a.mimeType || 'image/jpeg',
      })
      setGrupo(prev => prev ? { ...prev, capa_url: res.data.capa_url } : prev)
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível atualizar a capa.')
    } finally {
      setCapaLoading(false)
    }
  }

  const handleDeletePost = (postId: number) => {
    Alert.alert('Deletar post', 'Tem certeza que deseja remover este post?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/grupos/${id}/posts/${postId}`)
            setPosts(prev => prev.filter(p => p.id !== postId))
            setGrupo(prev => prev ? { ...prev, total_posts: Math.max(0, prev.total_posts - 1) } : prev)
          } catch (err: any) {
            Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível deletar o post.')
          }
        },
      },
    ])
  }

  const handleMore = () => {
    const opts = grupo?.is_member
      ? [{ text: 'Compartilhar grupo', onPress: () => Share.share({ message: `Participe do grupo "${grupo?.nome}" no GoDenth!` }) },
         { text: 'Cancelar', style: 'cancel' as const }]
      : [{ text: 'Compartilhar grupo', onPress: () => Share.share({ message: `Participe do grupo "${grupo?.nome}" no GoDenth!` }) },
         { text: 'Cancelar', style: 'cancel' as const }]
    Alert.alert(grupo?.nome ?? 'Grupo', '', opts)
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  const ListHeader = () => {
    if (!grupo) return null
    const capaUri = grupo.capa_url || null
    const ultimos = grupo.ultimos_ativos ?? []

    return (
      <View>
        {/* ── Capa ── */}
        <View style={s.coverWrap}>
          {capaUri
            ? <Image source={{ uri: capaUri }} style={s.coverImg} resizeMode="cover" />
            : <View style={[s.coverImg, { backgroundColor: accent }]}>
                <Text style={s.coverEmoji}>{grupo.icone}</Text>
              </View>
          }
          {isAdmin && (
            <View style={s.coverTopBar}>
              <TouchableOpacity style={s.coverBtn} onPress={handleCapaUpload} disabled={capaLoading}>
                {capaLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.coverBtnT}>📷</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Info do grupo ── */}
        <View style={s.infoCard}>
          <Text style={s.grupoNome}>{grupo.nome}</Text>

          <View style={s.metaRow}>
            <View style={[s.tipoBadge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
              <Text style={[s.tipoT, { color: accent }]}>🌐 Público</Text>
            </View>
            <Text style={s.metaSep}>·</Text>
            <Text style={s.metaText}>👥 {grupo.total_membros} {grupo.total_membros === 1 ? 'membro' : 'membros'}</Text>
            <Text style={s.metaSep}>·</Text>
            <Text style={[s.metaText, { color: accent }]}>{CAT_LABEL[grupo.categoria] ?? grupo.categoria}</Text>
          </View>

          {/* Avatares sobrepostos dos últimos ativos */}
          {ultimos.length > 0 && (
            <View style={s.avatarsRow}>
              <View style={[s.avatarsStack, { width: Math.min(ultimos.length, 8) * 22 + 12 }]}>
                {ultimos.slice(0, 8).map((m, i) => (
                  <View key={m.id} style={[s.avatarOverlap, { left: i * 22, zIndex: 8 - i }]}>
                    <Avatar uri={m.avatar_url} nome={m.nome} size={30} border="#fff" />
                  </View>
                ))}
              </View>
              <Text style={s.avatarsLabel}>
                {ultimos.length === 1
                  ? `${ultimos[0].nome.split(' ')[0]} publicou recentemente`
                  : `${ultimos[0].nome.split(' ')[0]} e outros publicaram`}
              </Text>
            </View>
          )}

          {/* Botões de ação */}
          <View style={s.actionRow}>
            {grupo.is_member
              ? (
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: accent }]} onPress={() => setModalOpen(true)}>
                  <Text style={s.btnPrimaryT}>✏️  Publicar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: accent }]} onPress={handleEntrar}>
                  <Text style={s.btnPrimaryT}>+ Entrar</Text>
                </TouchableOpacity>
              )
            }
            <TouchableOpacity style={s.btnOutline} onPress={() => Share.share({ message: `Participe do grupo "${grupo.nome}" no GoDenth!` })}>
              <Text style={[s.btnOutlineT, { color: accent }]}>Convidar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnIcon} onPress={handleMore}>
              <Text style={s.btnIconT}>···</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tab bar ── */}
        <View style={s.tabBar}>
          {(['discussao', 'membros', 'sobre'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && [s.tabActive, { borderBottomColor: accent }]]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabT, activeTab === tab && { color: accent }]}>
                {tab === 'discussao' ? 'Discussão' : tab === 'membros' ? 'Membros' : 'Sobre'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Write bar (só na aba Discussão) ── */}
        {activeTab === 'discussao' && (
          <TouchableOpacity style={s.writeBar} onPress={() => setModalOpen(true)} activeOpacity={0.8}>
            <Avatar uri={null} nome={user?.nome ?? '?'} size={36} />
            <View style={s.writeInput}>
              <Text style={s.writeInputT}>Escreva algo no grupo...</Text>
            </View>
            <Text style={s.writeCamera}>📷</Text>
          </TouchableOpacity>
        )}

        {/* Cabeçalho das abas Membros e Sobre */}
        {activeTab === 'membros' && (
          <View style={s.tabSectionHeader}>
            <Text style={s.tabSectionT}>👥 {grupo.total_membros} membros ativos</Text>
          </View>
        )}
        {activeTab === 'sobre' && (
          <View style={s.sobreSection}>
            {!!grupo.descricao && (
              <>
                <Text style={s.sobreLabel}>📝 Descrição</Text>
                <Text style={s.sobreBody}>{grupo.descricao}</Text>
              </>
            )}
            <View style={s.sobreDivider} />
            <Text style={s.sobreLabel}>📁 Categoria</Text>
            <Text style={s.sobreBody}>{CAT_LABEL[grupo.categoria] ?? grupo.categoria}</Text>
            <View style={s.sobreDivider} />
            <Text style={s.sobreLabel}>🌐 Visibilidade</Text>
            <Text style={s.sobreBody}>Público — qualquer pessoa pode ver e entrar</Text>
            <View style={s.sobreDivider} />
            <Text style={s.sobreLabel}>📅 Criado em</Text>
            <Text style={s.sobreBody}>{new Date(grupo.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <View style={s.sobreDivider} />
            <Text style={s.sobreLabel}>💬 Publicações</Text>
            <Text style={s.sobreBody}>{grupo.total_posts} {grupo.total_posts === 1 ? 'publicação' : 'publicações'}</Text>
          </View>
        )}
      </View>
    )
  }

  const getListData = (): any[] => {
    if (activeTab === 'discussao') return posts
    if (activeTab === 'membros') return membros
    return []
  }

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'discussao') {
      const canDelete = isAdmin || item.author_id === user?.id
      return (
        <PostCard
          post={item}
          accentColor={accent}
          canDelete={canDelete}
          onDelete={() => handleDeletePost(item.id)}
        />
      )
    }
    if (activeTab === 'membros') return <MemberRow m={item} />
    return null
  }

  const ListEmpty = () => {
    if (activeTab === 'sobre') return null
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>{activeTab === 'membros' ? '👥' : '💬'}</Text>
        <Text style={s.emptyTitle}>{activeTab === 'membros' ? 'Nenhum membro ainda' : 'Nenhuma publicação ainda'}</Text>
        <Text style={s.emptyBody}>
          {activeTab === 'membros'
            ? 'Os membros aparecerão aqui após publicarem no grupo.'
            : 'Seja o primeiro a compartilhar algo neste grupo!'}
        </Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EFEFEF' }}>
        <View style={s.appHeader}>
          <TouchableOpacity style={s.headerBack} onPress={handleBack}>
            <Text style={s.headerBackT}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/feed' as any)} activeOpacity={0.8}>
            <Text style={s.headerLogo}>
              <Text style={{ color: '#F5C800' }}>Go</Text>
              <Text style={{ color: '#fff' }}>Denth</Text>
            </Text>
          </TouchableOpacity>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      {/* ── App Header ── */}
      <View style={s.appHeader}>
        <TouchableOpacity style={s.headerBack} onPress={handleBack}>
          <Text style={s.headerBackT}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/feed' as any)} activeOpacity={0.8}>
          <Text style={s.headerLogo}>
            <Text style={{ color: '#F5C800' }}>Go</Text>
            <Text style={{ color: '#fff' }}>Denth</Text>
          </Text>
        </TouchableOpacity>
        <View style={s.headerIcons}>
          <TouchableOpacity style={s.headerIco} onPress={() => router.push('/(tabs)/publicar' as any)}>
            <PlusIcon />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerIco} onPress={() => router.push('/(tabs)/buscar' as any)}>
            <SearchIcon />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerIco} onPress={() => router.push('/(tabs)/notificacoes' as any)}>
            <BellIcon />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil' as any)}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.headerAv} />
              : <View style={s.headerAv}><Text style={s.headerAvT}>{user?.nome?.charAt(0) || 'U'}</Text></View>
            }
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={getListData()}
        keyExtractor={(item: any) => String(item.id ?? 'sobre')}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} tintColor={TEAL} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Modal de publicação ── */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => { setTexto(''); setImagem(null); setModalOpen(false) }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Avatar uri={null} nome={user?.nome ?? '?'} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={s.modalUserNome}>{user?.nome}</Text>
                <Text style={s.modalGrupoNome}>{grupo?.icone} {grupo?.nome}</Text>
              </View>
              <TouchableOpacity onPress={() => { setTexto(''); setImagem(null); setModalOpen(false) }}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={s.modalInput}
              placeholder={`O que você quer compartilhar, ${user?.nome?.split(' ')[0]}?`}
              placeholderTextColor={MUTED}
              multiline
              maxLength={1000}
              value={texto}
              onChangeText={setTexto}
              textAlignVertical="top"
              autoFocus
            />

            {imagem && (
              <View style={s.previewWrap}>
                <Image source={{ uri: imagem.uri }} style={s.preview} resizeMode="cover" />
                <TouchableOpacity style={s.previewRemove} onPress={() => setImagem(null)}>
                  <Text style={s.previewRemoveT}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[s.modalFooter, { borderTopColor: BORDER }]}>
              <TouchableOpacity style={s.footerPhoto} onPress={handlePickImage}>
                <Text style={s.footerPhotoT}>📷</Text>
                <Text style={[s.footerPhotoLabel, { color: accent }]}>Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.publishBtn, { backgroundColor: accent }, (!texto.trim() && !imagem) && s.publishBtnOff]}
                onPress={handlePublish}
                disabled={publishing || (!texto.trim() && !imagem)}
              >
                {publishing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.publishBtnT}>Publicar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#EFEFEF' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },
  listContent: { paddingBottom: 40 },

  // App header
  appHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: TEAL,
  },
  headerBack:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerBackT: { color: '#fff', fontSize: 26, lineHeight: 30, fontWeight: '300', marginTop: -2 },
  headerLogo:  { fontSize: 22, fontFamily: 'Poppins-ExtraBold', letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIco:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerAv:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A6FD4', justifyContent: 'center', alignItems: 'center' },
  headerAvT:   { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Cover
  coverWrap:   { width: SCREEN_W, height: COVER_H, position: 'relative' },
  coverImg:    { width: '100%', height: COVER_H, alignItems: 'center', justifyContent: 'center' },
  coverEmoji:  { fontSize: 56, opacity: 0.6 },
  coverTopBar: {
    position: 'absolute', top: 8, right: 14,
  },
  coverBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
  coverBtnT: { color: '#fff', fontSize: 20, lineHeight: 22, fontWeight: '600' },

  // Info card
  infoCard: { backgroundColor: CARD, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  grupoNome: { fontSize: 20, fontWeight: '900', color: TEXT, marginBottom: 6 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  tipoBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tipoT:     { fontSize: 11, fontWeight: '700' },
  metaSep:   { color: MUTED, fontSize: 11 },
  metaText:  { fontSize: 12, color: MUTED, fontWeight: '600' },

  // Overlapping avatars
  avatarsRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  avatarsStack: { position: 'relative', height: 34 },
  avatarOverlap:{ position: 'absolute', top: 0 },
  avatarsLabel: { fontSize: 11, color: MUTED, flex: 1 },

  // Action buttons
  actionRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  btnPrimary:   { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnPrimaryT:  { color: '#fff', fontSize: 14, fontWeight: '800' },
  btnOutline:   { borderWidth: 1.5, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  btnOutlineT:  { fontSize: 13, fontWeight: '700' },
  btnIcon:      { borderWidth: 1.5, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  btnIconT:     { fontSize: 12, color: MUTED, letterSpacing: 1 },

  // Tab bar
  tabBar:   { flexDirection: 'row', backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 1 },
  tab:      { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive:{ borderBottomWidth: 3 },
  tabT:     { fontSize: 13, fontWeight: '700', color: MUTED },

  // Write bar
  writeBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, padding: 12, gap: 10, marginBottom: 1 },
  writeInput: { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  writeInputT:{ fontSize: 13, color: MUTED },
  writeCamera:{ fontSize: 22 },

  // Section headers
  tabSectionHeader: { backgroundColor: BG, paddingHorizontal: 16, paddingVertical: 10 },
  tabSectionT:      { fontSize: 13, fontWeight: '700', color: MUTED },

  // Sobre
  sobreSection: { backgroundColor: CARD, padding: 16, marginBottom: 1 },
  sobreLabel:   { fontSize: 11, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  sobreBody:    { fontSize: 14, color: TEXT, lineHeight: 21 },
  sobreDivider: { height: 1, backgroundColor: BORDER, marginVertical: 14 },

  // Empty
  empty:     { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, backgroundColor: CARD, paddingBottom: 48 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6, textAlign: 'center' },
  emptyBody: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19 },

  // Publish modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:   { backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '90%' },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  modalUserNome:{ fontSize: 15, fontWeight: '800', color: TEXT },
  modalGrupoNome:{ fontSize: 11, color: MUTED, marginTop: 1 },
  modalClose:   { fontSize: 16, color: MUTED, padding: 4 },
  modalInput:   { minHeight: 100, fontSize: 15, color: TEXT, paddingHorizontal: 16, textAlignVertical: 'top', lineHeight: 22 },
  previewWrap:  { position: 'relative', marginHorizontal: 16, marginBottom: 10 },
  preview:      { width: '100%', height: 200, borderRadius: 12 },
  previewRemove:{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  previewRemoveT:{ color: '#fff', fontSize: 11, fontWeight: '700' },
  modalFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  footerPhoto:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerPhotoT: { fontSize: 22 },
  footerPhotoLabel: { fontSize: 13, fontWeight: '700' },
  publishBtn:   { borderRadius: 20, paddingHorizontal: 22, paddingVertical: 9 },
  publishBtnOff:{ opacity: 0.4 },
  publishBtnT:  { color: '#fff', fontSize: 14, fontWeight: '800' },
})
