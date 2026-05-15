import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Linking, Platform, Alert,
  Modal, TextInput, KeyboardAvoidingView, Animated,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

const API_BASE = 'https://godenth-api-production.up.railway.app'

const CAT_COR: Record<string, string> = {
  clinica: Colors.clinica,
  laboratorio: Colors.laboratorio,
  fabricante: Colors.fabricante,
  ensino: Colors.ensino,
  marketing: Colors.marketing,
  gestao: Colors.gestao,
  servicos: Colors.servicos,
}

const CAT_LABEL: Record<string, string> = {
  clinica: 'Clínica Odontológica',
  laboratorio: 'Laboratório de Prótese',
  fabricante: 'Fabricante / Distribuidora',
  ensino: 'Instituição de Ensino',
  marketing: 'Marketing & Comunicação',
  gestao: 'Gestão & Consultoria',
  servicos: 'Serviços Profissionais',
}

const ABAS = ['Sobre', 'Publicações', 'Vagas']
const CONTRATOS = ['CLT', 'PJ', 'Freelancer', 'Estágio']

function resolveUrl(url?: string | null) {
  if (!url) return null
  return url.startsWith('http') ? url : API_BASE + url
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

// ─── Modal: Nova Publicação ───────────────────────────────────────────────────
function NovaPublicacaoModal({ visible, pageId, onClose, onCreated }: {
  visible: boolean; pageId: string; onClose: () => void; onCreated: () => void
}) {
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)

  const close = () => { setTexto(''); onClose() }

  const salvar = async () => {
    if (!texto.trim()) return Alert.alert('Atenção', 'Escreva algo antes de publicar.')
    setSaving(true)
    try {
      await api.post('/posts', {
        tipo_post: 'texto',
        data_json: { descricao: texto.trim() },
        page_id: parseInt(pageId),
      })
      setTexto('')
      onCreated()
      onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>Nova Publicação</Text>
          <TextInput
            style={m.textarea}
            placeholder="Compartilhe uma novidade, conquista ou informação relevante…"
            placeholderTextColor={Colors.text3}
            value={texto}
            onChangeText={setTexto}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoFocus
          />
          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Publicar →</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}>
            <Text style={m.cancelT}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Modal: Nova Vaga ─────────────────────────────────────────────────────────
function NovaVagaModal({ visible, pageId, pageName, onClose, onCreated }: {
  visible: boolean; pageId: string; pageName: string; onClose: () => void; onCreated: () => void
}) {
  const [cargo, setCargo] = useState('')
  const [contrato, setContrato] = useState('')
  const [salario, setSalario] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setCargo(''); setContrato(''); setSalario(''); setEspecialidade('') }
  const close = () => { reset(); onClose() }

  const salvar = async () => {
    if (!cargo.trim()) return Alert.alert('Atenção', 'Informe o cargo.')
    if (!contrato) return Alert.alert('Atenção', 'Selecione o tipo de contrato.')
    setSaving(true)
    try {
      await api.post('/vagas', {
        page_id: parseInt(pageId),
        cargo: cargo.trim(),
        contrato,
        salario: salario.trim() || null,
        especialidade: especialidade.trim() || null,
      })
      reset()
      onCreated()
      onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar a vaga.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <ScrollView contentContainerStyle={m.sheetScroll} keyboardShouldPersistTaps="handled">
          <View style={m.handle} />
          <Text style={m.title}>Nova Vaga</Text>
          <Text style={m.subtitle}>Publicando por: {pageName}</Text>

          <Text style={m.label}>Cargo *</Text>
          <TextInput style={m.input} placeholder="Ex: Cirurgião-Dentista" placeholderTextColor={Colors.text3} value={cargo} onChangeText={setCargo} />

          <Text style={m.label}>Tipo de contrato *</Text>
          <View style={m.chips}>
            {CONTRATOS.map(c => (
              <TouchableOpacity key={c} style={[m.chip, contrato === c && m.chipOn]} onPress={() => setContrato(c)}>
                <Text style={[m.chipT, contrato === c && m.chipTOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={m.label}>Salário</Text>
          <TextInput style={m.input} placeholder="Ex: R$ 4.000 - R$ 6.000" placeholderTextColor={Colors.text3} value={salario} onChangeText={setSalario} />

          <Text style={m.label}>Especialidade</Text>
          <TextInput style={m.input} placeholder="Ex: Implantodontia" placeholderTextColor={Colors.text3} value={especialidade} onChangeText={setEspecialidade} />

          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Publicar Vaga →</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}>
            <Text style={m.cancelT}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function PaginaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('Sobre')
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followCount, setFollowCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [candidaturas, setCandidaturas] = useState<Set<number>>(new Set())
  const [candidatandoId, setCandidatandoId] = useState<number | null>(null)
  const [modalPost, setModalPost] = useState(false)
  const [modalVaga, setModalVaga] = useState(false)

  const isOwner = user?.id === page?.user_id

  const loadPage = () => {
    setLoading(true)
    api.get(`/pages/${id}`)
      .then(r => {
        setPage(r.data)
        setFollowing(r.data.is_following)
        setFollowCount(r.data.seguidores || 0)
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar a página'))
      .finally(() => setLoading(false))
  }

  const loadPosts = () => {
    setPostsLoading(true)
    api.get(`/pages/${id}/posts`)
      .then(r => setPosts(r.data.posts || []))
      .catch(() => null)
      .finally(() => setPostsLoading(false))
  }

  useEffect(() => { loadPage() }, [id])

  useEffect(() => {
    if (aba === 'Publicações' && posts.length === 0) loadPosts()
  }, [aba])

  const toggleFollow = async () => {
    setFollowLoading(true)
    try {
      const res = await api.post(`/follows/${id}`)
      setFollowing(res.data.following)
      setFollowCount(prev => res.data.following ? prev + 1 : Math.max(0, prev - 1))
    } catch {
      Alert.alert('Erro', 'Não foi possível processar.')
    } finally { setFollowLoading(false) }
  }

  const candidatar = async (vagaId: number) => {
    setCandidatandoId(vagaId)
    try {
      await api.post(`/vagas/${vagaId}/candidatar`, { respostas: [] })
      setCandidaturas(prev => new Set([...prev, vagaId]))
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível candidatar.')
    } finally { setCandidatandoId(null) }
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  if (!page) return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 20 }}>Página não encontrada</Text>
      <TouchableOpacity style={s.btnBack} onPress={() => router.back()}>
        <Text style={s.btnBackT}>← Voltar</Text>
      </TouchableOpacity>
    </View>
  )

  const cor = page.cor || CAT_COR[page.categoria] || Colors.primary
  const logoSrc = resolveUrl(page.logo_url)
  const coverSrc = resolveUrl(page.cover_url)
  const vagas: any[] = page.vagas || []

  return (
    <View style={s.root}>
      {/* ── Header fixo de navegação ── */}
      <View style={[s.navBar, { backgroundColor: cor }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.navSide}>
          <Text style={s.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={s.navTitle} numberOfLines={1}>{page.nome}</Text>
        {isOwner ? (
          <TouchableOpacity style={s.navSide} onPress={() => router.push(`/editar-pagina/${id}` as any)}>
            <Text style={s.navAction}>Editar</Text>
          </TouchableOpacity>
        ) : <View style={s.navSide} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Cover + Logo (LinkedIn style) ── */}
        <View style={[s.cover, { backgroundColor: cor }]}>
          {coverSrc ? (
            <Image source={{ uri: coverSrc }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={s.coverWatermark} numberOfLines={1} ellipsizeMode="clip">
              {(CAT_LABEL[page.categoria] || '').toUpperCase()}
            </Text>
          )}
        </View>

        <View style={s.profileRow}>
          <View style={s.logoWrap}>
            {logoSrc ? (
              <Image source={{ uri: logoSrc }} style={s.logo} resizeMode="cover" />
            ) : (
              <View style={[s.logo, s.logoPlaceholder, { backgroundColor: cor }]}>
                <Text style={s.logoLetter}>{page.nome?.charAt(0) || 'P'}</Text>
              </View>
            )}
            {page.verificada && (
              <View style={[s.verifiedBadge, { backgroundColor: cor }]}>
                <Text style={s.verifiedT}>✓</Text>
              </View>
            )}
          </View>

          {/* Botão Seguir / Editar */}
          {isOwner ? (
            <TouchableOpacity style={s.editBtn} onPress={() => router.push(`/editar-pagina/${id}` as any)}>
              <Text style={[s.editBtnT, { color: cor }]}>✏️ Editar página</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.followBtn, following ? s.followingBtn : { backgroundColor: cor }]}
              onPress={toggleFollow}
              disabled={followLoading}
            >
              {followLoading
                ? <ActivityIndicator color={following ? cor : '#fff'} size="small" />
                : <Text style={[s.followBtnT, following && { color: cor }]}>
                    {following ? '✓ Seguindo' : '+ Seguir'}
                  </Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Info ── */}
        <View style={s.info}>
          <Text style={s.nome}>{page.nome}</Text>
          <Text style={[s.catLabel, { color: cor }]}>{CAT_LABEL[page.categoria] || page.categoria}</Text>
          {(page.cidade || page.estado) && (
            <Text style={s.loc}>📍 {page.cidade}{page.estado ? ` · ${page.estado}` : ''}</Text>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={[s.statN, { color: cor }]}>{followCount}</Text>
            <Text style={s.statL}>Seguidores</Text>
          </View>
          <View style={[s.stat, s.statBorder]}>
            <Text style={[s.statN, { color: cor }]}>{vagas.length}</Text>
            <Text style={s.statL}>Vagas abertas</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statN, { color: cor }]}>{posts.length > 0 ? posts.length : '—'}</Text>
            <Text style={s.statL}>Publicações</Text>
          </View>
        </View>

        {/* ── Contato ── */}
        {(page.telefone || page.site) && (
          <View style={s.contacts}>
            {page.telefone && (
              <TouchableOpacity style={[s.contactBtn, { borderColor: cor }]} onPress={() => Linking.openURL(`tel:${page.telefone}`)}>
                <Text style={[s.contactBtnT, { color: cor }]}>📞 Ligar</Text>
              </TouchableOpacity>
            )}
            {page.site && (
              <TouchableOpacity style={[s.contactBtn, { borderColor: cor }]} onPress={() => Linking.openURL(page.site.startsWith('http') ? page.site : `https://${page.site}`)}>
                <Text style={[s.contactBtnT, { color: cor }]}>🌐 Site</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Painel do dono ── */}
        {isOwner && (
          <View style={s.ownerPanel}>
            <Text style={s.ownerTitle}>Gerenciar página</Text>
            <View style={s.ownerBtns}>
              <TouchableOpacity style={[s.ownerBtn, { backgroundColor: cor }]} onPress={() => setModalPost(true)}>
                <Text style={s.ownerBtnT}>✏️ Nova Publicação</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.ownerBtn, s.ownerBtnGold]} onPress={() => setModalVaga(true)}>
                <Text style={s.ownerBtnT}>💼 Nova Vaga</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Abas ── */}
        <View style={s.abas}>
          {ABAS.map(a => (
            <TouchableOpacity key={a} style={[s.aba, aba === a && { borderBottomColor: cor }]} onPress={() => setAba(a)}>
              <Text style={[s.abaT, aba === a && { color: cor }]}>
                {a}{a === 'Vagas' && vagas.length > 0 ? ` (${vagas.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab: Sobre ── */}
        {aba === 'Sobre' && (
          <View style={s.tab}>
            {page.descricao ? (
              <View style={s.card}>
                <Text style={s.cardTitle}>📝 Sobre a empresa</Text>
                <Text style={s.cardText}>{page.descricao}</Text>
              </View>
            ) : null}
            <View style={s.card}>
              <Text style={s.cardTitle}>📋 Informações</Text>
              {page.cnpj ? <InfoRow label="CNPJ" value={page.cnpj} /> : null}
              {page.telefone ? <InfoRow label="Telefone" value={page.telefone} /> : null}
              {page.site ? <InfoRow label="Site" value={page.site} color={cor} /> : null}
              {page.cidade ? <InfoRow label="Cidade" value={`${page.cidade}${page.estado ? ` · ${page.estado}` : ''}`} /> : null}
              {!page.cnpj && !page.telefone && !page.site && !page.cidade && (
                <Text style={s.emptyT}>Nenhuma informação cadastrada</Text>
              )}
            </View>
          </View>
        )}

        {/* ── Tab: Publicações ── */}
        {aba === 'Publicações' && (
          <View style={s.tab}>
            {postsLoading ? (
              <ActivityIndicator color={cor} style={{ marginTop: 32 }} />
            ) : posts.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📢</Text>
                <Text style={s.emptyT}>Nenhuma publicação ainda</Text>
                {isOwner && (
                  <TouchableOpacity style={[s.emptyBtn, { borderColor: cor }]} onPress={() => setModalPost(true)}>
                    <Text style={[s.emptyBtnT, { color: cor }]}>+ Criar primeira publicação</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : posts.map(post => (
              <PostCard key={post.id} post={post} pageLogo={logoSrc} pageName={page.nome} cor={cor} />
            ))}
          </View>
        )}

        {/* ── Tab: Vagas ── */}
        {aba === 'Vagas' && (
          <View style={s.tab}>
            {isOwner && (
              <TouchableOpacity style={[s.newVagaBtn, { backgroundColor: cor }]} onPress={() => setModalVaga(true)}>
                <Text style={s.newVagaBtnT}>+ Nova Vaga</Text>
              </TouchableOpacity>
            )}
            {vagas.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
                <Text style={s.emptyT}>Nenhuma vaga aberta no momento</Text>
              </View>
            ) : vagas.map(vaga => (
              <VagaCard
                key={vaga.id}
                vaga={vaga}
                cor={cor}
                jaCandidata={candidaturas.has(vaga.id)}
                loading={candidatandoId === vaga.id}
                onCandidatar={() => candidatar(vaga.id)}
                isOwner={isOwner}
              />
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Modais ── */}
      <NovaPublicacaoModal
        visible={modalPost}
        pageId={id}
        onClose={() => setModalPost(false)}
        onCreated={() => { setPosts([]); loadPosts() }}
      />
      <NovaVagaModal
        visible={modalVaga}
        pageId={id}
        pageName={page.nome}
        onClose={() => setModalVaga(false)}
        onCreated={loadPage}
      />
    </View>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Text style={s.infoRow}>
      {label}: <Text style={[s.infoVal, color ? { color } : {}]}>{value}</Text>
    </Text>
  )
}

function PostCard({ post, pageLogo, pageName, cor }: any) {
  const texto = post.data_json?.descricao || ''
  return (
    <View style={s.postCard}>
      <View style={s.postHeader}>
        {pageLogo ? (
          <Image source={{ uri: pageLogo }} style={s.postAvatar} resizeMode="cover" />
        ) : (
          <View style={[s.postAvatar, { backgroundColor: cor, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{pageName?.charAt(0)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.postAuthor}>{pageName}</Text>
          <Text style={s.postTime}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>
      {texto ? <Text style={s.postText}>{texto}</Text> : null}
    </View>
  )
}

function VagaCard({ vaga, cor, jaCandidata, loading, onCandidatar, isOwner }: any) {
  return (
    <View style={s.vagaCard}>
      <View style={s.vagaTop}>
        <Text style={s.vagaTitulo} numberOfLines={1}>{vaga.cargo || vaga.titulo}</Text>
        {vaga.destaque && (
          <View style={[s.vagaDestaquePill, { backgroundColor: cor + '18' }]}>
            <Text style={[s.vagaDestaquePillT, { color: cor }]}>Destaque</Text>
          </View>
        )}
      </View>
      <View style={s.vagaMeta}>
        {vaga.contrato && <View style={s.vagaTag}><Text style={s.vagaTagT}>{vaga.contrato}</Text></View>}
        {vaga.modelo && <View style={s.vagaTag}><Text style={s.vagaTagT}>{vaga.modelo}</Text></View>}
        {(vaga.cidade || vaga.estado) && (
          <Text style={s.vagaLoc}>📍 {vaga.cidade}{vaga.estado ? ` · ${vaga.estado}` : ''}</Text>
        )}
      </View>
      {vaga.salario ? <Text style={s.vagaSalario}>{vaga.salario}</Text> : null}
      {!isOwner && (
        <TouchableOpacity
          style={[s.candidatarBtn, jaCandidata ? s.candidatarBtnDone : { backgroundColor: cor }]}
          onPress={!jaCandidata ? onCandidatar : undefined}
          disabled={jaCandidata || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[s.candidatarBtnT, jaCandidata && { color: '#059669' }]}>
                {jaCandidata ? '✓ Candidatura enviada' : 'Candidatar-se →'}
              </Text>}
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  btnBack: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  btnBackT: { color: '#fff', fontWeight: '800', fontSize: 14 },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
  },
  navSide: { width: 56 },
  navBack: { fontSize: 24, color: '#fff', fontWeight: '700' },
  navTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#fff', textAlign: 'center' },
  navAction: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'right' },

  cover: { height: 130, overflow: 'hidden' },
  coverWatermark: { position: 'absolute', bottom: -8, left: 10, right: 10, fontSize: 52, fontWeight: '900', color: 'rgba(255,255,255,0.13)', letterSpacing: 3 },

  profileRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -36, marginBottom: 10 },
  logoWrap: { position: 'relative' },
  logo: { width: 72, height: 72, borderRadius: 18, borderWidth: 3, borderColor: '#fff' },
  logoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontSize: 28, fontWeight: '900' },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  verifiedT: { color: '#fff', fontSize: 10, fontWeight: '900' },

  editBtn: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: Colors.white, marginBottom: 4 },
  editBtnT: { fontSize: 13, fontWeight: '800' },
  followBtn: { borderRadius: 100, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 4, minWidth: 100, alignItems: 'center' },
  followingBtn: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  followBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },

  info: { paddingHorizontal: 16, marginBottom: 10 },
  nome: { fontSize: 22, fontWeight: '900', color: Colors.text },
  catLabel: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  loc: { fontSize: 12, color: Colors.text3, marginTop: 3 },

  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  statN: { fontSize: 18, fontWeight: '800' },
  statL: { fontSize: 10, color: Colors.text3, marginTop: 2, fontWeight: '600' },

  contacts: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  contactBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5 },
  contactBtnT: { fontSize: 14, fontWeight: '800' },

  ownerPanel: { backgroundColor: '#FFFBEA', borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#F5C800', paddingHorizontal: 16, paddingVertical: 14 },
  ownerTitle: { fontSize: 11, fontWeight: '800', color: '#A07800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  ownerBtns: { flexDirection: 'row', gap: 10 },
  ownerBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ownerBtnGold: { backgroundColor: '#C49800' },
  ownerBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },

  abas: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  aba: { flex: 1, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  abaT: { fontSize: 13, fontWeight: '700', color: Colors.text3 },

  tab: { padding: 16, gap: 12, paddingBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  cardText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  infoRow: { fontSize: 13, color: Colors.text3, marginBottom: 6, fontWeight: '500' },
  infoVal: { fontWeight: '600', color: Colors.text },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 28, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', gap: 4 },
  emptyT: { fontSize: 14, fontWeight: '600', color: Colors.text3 },
  emptyBtn: { marginTop: 10, borderWidth: 1.5, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  emptyBtnT: { fontSize: 13, fontWeight: '700' },

  newVagaBtn: { borderRadius: 12, padding: 13, alignItems: 'center' },
  newVagaBtnT: { color: '#fff', fontWeight: '800', fontSize: 14 },

  postCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar: { width: 42, height: 42, borderRadius: 12 },
  postAuthor: { fontSize: 14, fontWeight: '800', color: Colors.text },
  postTime: { fontSize: 11, color: Colors.text3, marginTop: 1 },
  postText: { fontSize: 14, color: Colors.text, lineHeight: 22 },

  vagaCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  vagaTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  vagaTitulo: { fontSize: 16, fontWeight: '800', color: Colors.text, flex: 1 },
  vagaDestaquePill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  vagaDestaquePillT: { fontSize: 11, fontWeight: '700' },
  vagaMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  vagaTag: { backgroundColor: Colors.bg, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  vagaTagT: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  vagaLoc: { fontSize: 12, color: Colors.text3, alignSelf: 'center' },
  vagaSalario: { fontSize: 13, fontWeight: '800', color: '#059669', marginBottom: 10 },
  candidatarBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  candidatarBtnDone: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#059669' },
  candidatarBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },
})

// ─── Styles dos modais ────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  sheetScroll: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: Colors.text3, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.text2, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 14, color: Colors.text, marginBottom: 4 },
  textarea: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 14, color: Colors.text, height: 140, marginBottom: 16, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipT: { fontSize: 13, fontWeight: '700', color: Colors.text2 },
  chipTOn: { color: '#fff' },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cancel: { borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelT: { fontSize: 14, fontWeight: '700', color: Colors.text3 },
})
