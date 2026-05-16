import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const HIC = '#fff'
const HIB = { stroke: HIC, strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function HeaderSearch() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx="10.5" cy="10.5" r="6.5" {...HIB} />
      <Line x1="15.5" y1="15.5" x2="21" y2="21" {...HIB} />
    </Svg>
  )
}

function HeaderBell() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M10,7 C10,5.3 14,5.3 14,7" {...HIB} />
      <Path d="M5,17 C5,12 7.5,8 12,8 C16.5,8 19,12 19,17 L20,19 L4,19 Z" {...HIB} />
      <Path d="M10,19 C10,20.7 14,20.7 14,19" {...HIB} />
    </Svg>
  )
}

const API_BASE = 'https://godenth-api-production.up.railway.app'

const FILTROS = [
  { key: 'todos',    label: 'Todos'     },
  { key: 'parceria', label: 'Parcerias' },
  { key: 'vaga',     label: 'Vagas'     },
  { key: 'ajuda',    label: 'Ajuda'     },
]

const TIPOS = [
  { key: 'parceria', label: 'Busco Parceria',   emoji: '🤝', cor: '#7B3FC4', sub: 'Procuro profissional para colaborar'      },
  { key: 'vaga',     label: 'Tenho uma Vaga',    emoji: '💼', cor: '#C49800', sub: 'Ofereço oportunidade de trabalho'          },
  { key: 'ajuda',    label: 'Preciso de Ajuda',  emoji: '🆘', cor: '#E53935', sub: 'Preciso de alguém urgente ou pontual'     },
]

const SUBS: Record<string, string[]> = {
  parceria: ['Implantodontia','Ortodontia','Prótese','Cirurgia','Endodontia','Periodontia','Pediatria','Estética','Radiologia','Saúde Bucal'],
  vaga:     ['Dentista','Auxiliar','Recepcionista','Técnico em Prótese','Protético','Administrativo','Marketing','TI'],
  ajuda:    ['Auxiliar urgente','Substituto','Técnico de cadeira','Protético','Recepcionista','Administrativo'],
}

// Metadados para tipos legados (posts antigos no feed) e novos
const TIPOS_META: Record<string, { emoji: string; label: string; cor: string }> = {
  parceria:     { emoji: '🤝', label: 'Busco Parceria',   cor: '#7B3FC4' },
  vaga:         { emoji: '💼', label: 'Tenho uma Vaga',    cor: '#C49800' },
  ajuda:        { emoji: '🆘', label: 'Preciso de Ajuda',  cor: '#E53935' },
  dica_clinica: { emoji: '💡', label: 'Dica Clínica',      cor: '#00A880' },
  caso_clinico: { emoji: '🦷', label: 'Caso Clínico',      cor: '#1A6FD4' },
  oportunidade: { emoji: '🚀', label: 'Oportunidade',      cor: '#C49800' },
  pergunta:     { emoji: '❓', label: 'Pergunta',          cor: '#7B3FC4' },
  noticia:      { emoji: '📰', label: 'Notícia',           cor: '#D4600A' },
  humor:        { emoji: '😄', label: 'Humor',             cor: '#D4186A' },
}

const PALAVRAS_PROIBIDAS = [
  'merda', 'porra', 'caralho', 'fdp', 'viado', 'buceta', 'puta', 'prostituta',
  'negro maldito', 'macaco', 'bicha',
]

function checkPalavrasProibidas(text: string) {
  const lower = text.toLowerCase()
  return PALAVRAS_PROIBIDAS.find(p => lower.includes(p)) || null
}

// ── PostModal (3 etapas) ──────────────────────────────────────────────────────

function PostModal({ visible, onClose, onPublished }: {
  visible: boolean; onClose: () => void; onPublished: () => void
}) {
  const [etapa, setEtapa]       = useState(1)
  const [tipo, setTipo]         = useState('')
  const [sub, setSub]           = useState('')
  const [texto, setTexto]       = useState('')
  const [cidade, setCidade]     = useState('')
  const [estado, setEstado]     = useState('')
  const [publishing, setPublishing] = useState(false)

  const reset = () => { setEtapa(1); setTipo(''); setSub(''); setTexto(''); setCidade(''); setEstado('') }
  const close = () => { reset(); onClose() }
  const back  = () => { if (etapa === 2) { setSub(''); setEtapa(1) } else { setEtapa(2) } }

  const tipoMeta = TIPOS.find(t => t.key === tipo)
  const cor = tipoMeta?.cor || '#00A880'

  const publish = async () => {
    if (!texto.trim()) return Alert.alert('Atenção', 'Descreva sua publicação.')
    const palavrao = checkPalavrasProibidas(texto)
    if (palavrao) return Alert.alert('Conteúdo inadequado', 'O texto contém uma palavra não permitida.')
    setPublishing(true)
    try {
      await api.post('/posts', {
        tipo_post: tipo,
        data_json: {
          texto: texto.trim(),
          subcategoria: sub || undefined,
          cidade: cidade.trim() || undefined,
          estado: estado.trim() || undefined,
        },
      })
      reset()
      onPublished()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar')
    } finally { setPublishing(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={pm.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={pm.sheet}>
          <View style={pm.handle} />

          {/* ── Header ── */}
          <View style={pm.header}>
            {etapa === 1
              ? <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={pm.close}>✕</Text>
                </TouchableOpacity>
              : <TouchableOpacity onPress={back} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={pm.backBtn}>← Voltar</Text>
                </TouchableOpacity>
            }
            <View style={pm.dots}>
              {[1, 2, 3].map(s => (
                <View key={s} style={[pm.dot, etapa >= s && { backgroundColor: cor }]} />
              ))}
            </View>
            {etapa === 3
              ? <TouchableOpacity
                  style={[pm.publishBtn, (!texto.trim() || publishing) && pm.publishBtnOff]}
                  onPress={publish}
                  disabled={!texto.trim() || publishing}
                >
                  {publishing
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={pm.publishBtnT}>Publicar</Text>}
                </TouchableOpacity>
              : <View style={{ width: 72 }} />
            }
          </View>

          {/* ── Conteúdo ── */}
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ETAPA 1 — Tipo */}
            {etapa === 1 && (
              <View style={{ gap: 12, paddingTop: 4, paddingBottom: 8 }}>
                <Text style={pm.stepTitle}>Qual o tipo de publicação?</Text>
                {TIPOS.map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[pm.tipoCard, { borderColor: t.cor + '80' }]}
                    onPress={() => { setTipo(t.key); setSub(''); setEtapa(2) }}
                    activeOpacity={0.78}
                  >
                    <Text style={pm.tipoEmoji}>{t.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[pm.tipoLabel, { color: t.cor }]}>{t.label}</Text>
                      <Text style={pm.tipoSubT}>{t.sub}</Text>
                    </View>
                    <Text style={[pm.tipoArrow, { color: t.cor }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ETAPA 2 — Subcategoria */}
            {etapa === 2 && (
              <View style={{ paddingTop: 4 }}>
                <Text style={pm.stepTitle}>Qual a categoria?</Text>
                <View style={[pm.typePill, { backgroundColor: cor + '18', borderColor: cor + '50' }]}>
                  <Text style={[pm.typePillT, { color: cor }]}>{tipoMeta?.emoji} {tipoMeta?.label}</Text>
                </View>
                <View style={pm.chipsRow}>
                  {(SUBS[tipo] || []).map(s => {
                    const on = sub === s
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[pm.chip, on && { backgroundColor: cor, borderColor: cor }]}
                        onPress={() => setSub(s)}
                        activeOpacity={0.78}
                      >
                        <Text style={[pm.chipT, on && { color: '#fff' }]}>{s}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <TouchableOpacity
                  style={[pm.nextBtn, { backgroundColor: cor }, !sub && pm.nextBtnOff]}
                  onPress={() => { if (sub) setEtapa(3) }}
                  disabled={!sub}
                >
                  <Text style={pm.nextBtnT}>Próximo →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ETAPA 3 — Texto + Localização */}
            {etapa === 3 && (
              <View style={{ paddingTop: 4 }}>
                <Text style={pm.stepTitle}>Descreva sua publicação</Text>
                <View style={[pm.typePill, { backgroundColor: cor + '18', borderColor: cor + '50' }]}>
                  <Text style={[pm.typePillT, { color: cor }]}>{tipoMeta?.emoji} {tipoMeta?.label} · {sub}</Text>
                </View>
                <TextInput
                  style={[pm.textarea, { borderColor: cor + '50' }]}
                  placeholder="Descreva o que você precisa, o perfil que busca, condições..."
                  placeholderTextColor="#A0B8AC"
                  value={texto}
                  onChangeText={setTexto}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={800}
                  autoFocus
                />
                <Text style={pm.charCount}>{texto.length}/800</Text>

                <Text style={pm.secLabel}>Localização (opcional)</Text>
                <View style={pm.locRow}>
                  <TextInput
                    style={[pm.locInput, { flex: 2 }]}
                    placeholder="Cidade"
                    placeholderTextColor="#A0B8AC"
                    value={cidade}
                    onChangeText={setCidade}
                  />
                  <TextInput
                    style={[pm.locInput, { flex: 1 }]}
                    placeholder="UF"
                    placeholderTextColor="#A0B8AC"
                    value={estado}
                    onChangeText={setEstado}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [unreadCount, setUnreadCount] = useState(0)
  const [postModal, setPostModal] = useState(false)
  const { user } = useAuthStore()

  const loadFeed = async () => {
    try {
      const params = filtro !== 'todos' ? '?tipo_post=' + filtro : ''
      const [postsRes] = await Promise.all([
        api.get('/posts' + params),
        api.get('/notifications?limit=1').then(r => setUnreadCount(r.data.unread || 0)).catch(() => null),
      ])
      setPosts(postsRes.data.posts || [])
    } catch (err) {
      console.log('Erro:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { setLoading(true); loadFeed() }, [filtro]))

  const getMeta = (tipo: string) => TIPOS_META[tipo] || { emoji: '📋', label: tipo, cor: '#00A880' }

  const renderPost = ({ item }: any) => {
    const meta  = getMeta(item.tipo_post)
    const cor   = meta.cor
    const nome  = item.page_nome || item.author_nome || 'Usuário'
    const texto = item.data_json?.texto || item.data_json?.descricao
    const sub   = item.data_json?.subcategoria
    const locCidade = item.data_json?.cidade || item.cidade
    const locEstado = item.data_json?.estado || item.estado
    const imagemUrl = item.data_json?.imagem_url
      ? (item.data_json.imagem_url.startsWith('http') ? item.data_json.imagem_url : API_BASE + item.data_json.imagem_url)
      : null
    const isActionable = ['parceria', 'vaga', 'ajuda'].includes(item.tipo_post)
    const actionLabel  = item.tipo_post === 'vaga' ? 'Candidatar' : item.tipo_post === 'ajuda' ? 'Oferecer ajuda' : 'Conectar'

    return (
      <View style={styles.card}>
        <View style={[styles.stripe, { backgroundColor: cor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
              onPress={() => item.author_id && router.push(`/usuario/${item.author_id}` as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.av, { backgroundColor: cor }]}>
                <Text style={styles.avt}>{nome.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{nome}</Text>
                {(locCidade || locEstado) && (
                  <Text style={styles.loc}>{[locCidade, locEstado].filter(Boolean).join(' · ')}</Text>
                )}
              </View>
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: cor + '20', borderColor: cor + '60' }]}>
              <Text style={[styles.badgeT, { color: cor }]}>{meta.emoji} {meta.label.toUpperCase()}</Text>
            </View>
          </View>
          {sub ? <Text style={styles.esp}>{sub}</Text> : null}
          {texto ? <Text style={styles.desc}>{texto}</Text> : null}
          {imagemUrl ? <Image source={{ uri: imagemUrl }} style={styles.postImg} resizeMode="cover" /> : null}
          <View style={styles.footer}>
            <Text style={styles.data}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
            {isActionable && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: cor }]}>
                <Text style={styles.btnT}>{actionLabel} →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#EEF7F2' }}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={{ color: '#F5C800' }}>Go</Text>
          <Text style={{ color: '#ffffff' }}>Denth</Text>
        </Text>
        <View style={styles.icons}>
          <TouchableOpacity style={styles.ico} onPress={() => setPostModal(true)}>
            <Text style={{ fontSize: 20, lineHeight: 22 }}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ico} onPress={() => router.push('/(tabs)/buscar')}>
            <HeaderSearch />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ico} onPress={() => { setUnreadCount(0); router.push('/(tabs)/notificacoes') }}>
            <HeaderBell />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeT}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
            <View style={styles.uav}>
              <Text style={styles.uavt}>{user?.nome?.charAt(0) || 'U'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtrosRow}>
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtro, filtro === f.key && styles.filtroOn]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[styles.filtroT, filtro === f.key && styles.filtroTOn]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00A880" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id?.toString()}
          renderItem={renderPost}
          contentContainerStyle={posts.length === 0 ? { flex: 1 } : { padding: 14, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeed() }} tintColor="#00A880" />}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 8 }}>Feed vazio</Text>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#00A880' }]} onPress={() => setPostModal(true)}>
                <Text style={styles.btnT}>+ Publicar agora</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <PostModal
        visible={postModal}
        onClose={() => setPostModal(false)}
        onPublished={() => {
          setPostModal(false)
          setLoading(true)
          loadFeed()
        }}
      />
    </View>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#007A6E' },
  logo: { fontSize: 26, fontFamily: 'Poppins-ExtraBold', letterSpacing: -0.5 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ico: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#E53935', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#007A6E' },
  notifBadgeT: { color: '#fff', fontSize: 9, fontWeight: '800' },
  uav: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A6FD4', justifyContent: 'center', alignItems: 'center' },
  uavt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  filtrosRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#D0E8DA', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filtro: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 7 },
  filtroOn: { backgroundColor: '#00A880', borderColor: '#00A880' },
  filtroT: { fontSize: 12, fontWeight: '700', color: '#3A6550' },
  filtroTOn: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#D0E8DA', flexDirection: 'row' },
  stripe: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  av: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  nome: { fontSize: 14, fontWeight: '800', color: '#0A1C14' },
  loc: { fontSize: 11, color: '#7A9E8E', marginTop: 1 },
  badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  badgeT: { fontSize: 9, fontWeight: '800' },
  esp: { fontSize: 13, fontWeight: '700', color: '#0A1C14', marginBottom: 5 },
  desc: { fontSize: 13, color: '#4A7060', lineHeight: 19, marginBottom: 10 },
  postImg: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEF7F2' },
  data: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  btn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  btnT: { color: '#fff', fontSize: 12, fontWeight: '800' },
})

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F4F9F6', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 12, maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  handle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },

  // header row
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  close:   { fontSize: 20, color: '#7A9E8E', fontWeight: '700', width: 72 },
  backBtn: { fontSize: 13, color: '#3A6550', fontWeight: '700', width: 72 },
  dots:    { flexDirection: 'row', gap: 6 },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0E8DA' },
  publishBtn:    { backgroundColor: '#00A880', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  publishBtnOff: { backgroundColor: '#AECEBE' },
  publishBtnT:   { color: '#fff', fontSize: 13, fontWeight: '800' },

  // step shared
  stepTitle: { fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 16 },

  // etapa 1 — tipo cards
  tipoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderWidth: 1.5, borderRadius: 16,
    padding: 16,
  },
  tipoEmoji: { fontSize: 28 },
  tipoLabel: { fontSize: 15, fontWeight: '800' },
  tipoSubT:  { fontSize: 12, color: '#7A9E8E', marginTop: 2 },
  tipoArrow: { fontSize: 22, fontWeight: '300' },

  // etapa 2 — subcategoria chips
  typePill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16 },
  typePillT: { fontSize: 12, fontWeight: '800' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9,
  },
  chipT: { fontSize: 13, fontWeight: '600', color: '#3A6550' },
  nextBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  nextBtnOff: { opacity: 0.4 },
  nextBtnT: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // etapa 3 — texto + localização
  secLabel: { fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  textarea: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 14, padding: 14, fontSize: 14, color: '#0A1C14',
    minHeight: 130, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#7A9E8E', textAlign: 'right', marginTop: 4 },
  locRow: { flexDirection: 'row', gap: 10 },
  locInput: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 12, padding: 12, fontSize: 14, color: '#0A1C14',
  },
})
