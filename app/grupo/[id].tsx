import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
  TextInput, Image, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const TEAL   = '#1c909b'
const GOLD   = '#C49800'
const BG     = '#F4F8F6'
const CARD   = '#FFFFFF'
const BORDER = '#D8ECE4'
const TEXT   = '#0a2228'
const MUTED  = '#5a7a72'

const API_BASE = 'https://godenth-api-production.up.railway.app'

interface GrupoPost {
  id: number
  grupo_id: number
  texto: string | null
  imagem_url: string | null
  created_at: string
  author_id: number
  author_nome: string
  author_tipo: string
  author_avatar: string | null
  author_especialidade: string | null
}

interface Grupo {
  id: number
  nome: string
  descricao: string
  categoria: string
  icone: string
  total_posts: number
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function Avatar({ uri, nome, size = 40 }: { uri?: string | null; nome: string; size?: number }) {
  const initials = nome?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
  if (uri) {
    const src = uri.startsWith('http') ? uri : API_BASE + uri
    return <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: BORDER }} />
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: TEAL + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: TEAL }}>{initials}</Text>
    </View>
  )
}

export default function GrupoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()

  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [posts, setPosts] = useState<GrupoPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Publish modal
  const [modalOpen, setModalOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [imagem, setImagem] = useState<{ uri: string; name: string; type: string } | null>(null)
  const [publishing, setPublishing] = useState(false)

  const fetchAll = useCallback(async () => {
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

  useEffect(() => { fetchAll() }, [fetchAll])

  const onRefresh = () => {
    setRefreshing(true)
    fetchAll()
  }

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permissão necessária', 'Permita acesso à galeria para adicionar fotos.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      const ext = asset.uri.split('.').pop() || 'jpg'
      setImagem({ uri: asset.uri, name: `foto.${ext}`, type: `image/${ext}` })
    }
  }

  const handlePublish = async () => {
    if (!texto.trim() && !imagem) {
      Alert.alert('Atenção', 'Escreva algo ou adicione uma imagem.')
      return
    }
    setPublishing(true)
    try {
      const form = new FormData()
      if (texto.trim()) form.append('texto', texto.trim())
      if (imagem) {
        form.append('imagem', { uri: imagem.uri, name: imagem.name, type: imagem.type } as any)
      }
      await api.post(`/grupos/${id}/posts`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setTexto('')
      setImagem(null)
      setModalOpen(false)
      fetchAll()
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível publicar.')
    } finally {
      setPublishing(false)
    }
  }

  const resetModal = () => {
    setTexto('')
    setImagem(null)
    setModalOpen(false)
  }

  const renderPost = ({ item }: { item: GrupoPost }) => (
    <View style={s.postCard}>
      <View style={s.postHeader}>
        <Avatar uri={item.author_avatar} nome={item.author_nome} />
        <View style={s.postAuthorInfo}>
          <Text style={s.postAuthorNome}>{item.author_nome}</Text>
          <Text style={s.postAuthorTipo}>{item.author_especialidade || item.author_tipo}</Text>
        </View>
        <Text style={s.postTime}>{timeAgo(item.created_at)}</Text>
      </View>
      {!!item.texto && <Text style={s.postTexto}>{item.texto}</Text>}
      {!!item.imagem_url && (
        <Image
          source={{ uri: item.imagem_url.startsWith('http') ? item.imagem_url : API_BASE + item.imagem_url }}
          style={s.postImagem}
          resizeMode="cover"
        />
      )}
    </View>
  )

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
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnT}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerIcon}>{grupo?.icone}</Text>
          <View>
            <Text style={s.headerNome} numberOfLines={1}>{grupo?.nome}</Text>
            <Text style={s.headerMeta}>{grupo?.total_posts} publicações</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Descrição */}
      {!!grupo?.descricao && (
        <View style={s.descBar}>
          <Text style={s.descText}>{grupo.descricao}</Text>
        </View>
      )}

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.feedContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} tintColor={TEAL} />}
        renderItem={renderPost}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💬</Text>
            <Text style={s.emptyTitle}>Nenhuma publicação ainda</Text>
            <Text style={s.emptyText}>Seja o primeiro a compartilhar algo neste grupo!</Text>
          </View>
        }
      />

      {/* FAB publicar */}
      <TouchableOpacity style={s.fab} onPress={() => setModalOpen(true)} activeOpacity={0.85}>
        <Text style={s.fabT}>+</Text>
      </TouchableOpacity>

      {/* Modal publicar */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={resetModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Publicar no grupo</Text>
              <TouchableOpacity onPress={resetModal}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={s.input}
              placeholder="Compartilhe algo com o grupo..."
              placeholderTextColor={MUTED}
              multiline
              maxLength={1000}
              value={texto}
              onChangeText={setTexto}
              textAlignVertical="top"
            />

            {imagem && (
              <View style={s.imagemPreviewWrap}>
                <Image source={{ uri: imagem.uri }} style={s.imagemPreview} resizeMode="cover" />
                <TouchableOpacity style={s.imagemRemove} onPress={() => setImagem(null)}>
                  <Text style={s.imagemRemoveT}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.photoBtn} onPress={pickImage}>
                <Text style={s.photoBtnT}>📷 {imagem ? 'Trocar foto' : 'Adicionar foto'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.publishBtn, (publishing || (!texto.trim() && !imagem)) && s.publishBtnDisabled]}
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

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  header: {
    backgroundColor: TEAL,
    paddingTop: 48, paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn:    { width: 36, alignItems: 'flex-start' },
  backBtnT:   { color: '#fff', fontSize: 28, lineHeight: 30 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  headerIcon:   { fontSize: 28 },
  headerNome:   { color: '#fff', fontSize: 16, fontWeight: '800', maxWidth: 200 },
  headerMeta:   { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },

  descBar:  { backgroundColor: TEAL + '15', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  descText: { fontSize: 12, color: MUTED, lineHeight: 17 },

  feedContent: { padding: 12, paddingBottom: 90 },

  postCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  postAuthorInfo: { flex: 1 },
  postAuthorNome: { fontSize: 14, fontWeight: '700', color: TEXT },
  postAuthorTipo: { fontSize: 11, color: MUTED, marginTop: 1 },
  postTime:       { fontSize: 11, color: MUTED },
  postTexto:      { fontSize: 14, color: TEXT, lineHeight: 21, marginBottom: 8 },
  postImagem:     { width: '100%', height: 220, borderRadius: 12, marginTop: 4 },

  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    elevation: 8,
  },
  fabT: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '400' },

  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon:  { fontSize: 44, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6, textAlign: 'center' },
  emptyText:  { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    minHeight: 320,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 17, fontWeight: '800', color: TEXT },
  modalClose:  { fontSize: 16, color: MUTED, padding: 4 },

  input: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 14,
    padding: 14, fontSize: 14, color: TEXT,
    minHeight: 110, marginBottom: 12,
    backgroundColor: BG,
  },

  imagemPreviewWrap: { position: 'relative', marginBottom: 12 },
  imagemPreview:     { width: '100%', height: 180, borderRadius: 12 },
  imagemRemove:      { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  imagemRemoveT:     { color: '#fff', fontSize: 11, fontWeight: '700' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  photoBtn:     { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  photoBtnT:    { fontSize: 13, color: TEAL, fontWeight: '700' },
  publishBtn:          { flex: 1, backgroundColor: TEAL, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  publishBtnDisabled:  { opacity: 0.45 },
  publishBtnT:         { fontSize: 14, color: '#fff', fontWeight: '800' },
})
