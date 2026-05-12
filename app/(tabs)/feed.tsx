import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const API_BASE = 'https://godenth-api-production.up.railway.app'

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vaga', label: 'Vagas' },
  { key: 'disponibilidade', label: 'Disponível' },
  { key: 'parceria', label: 'Parcerias' },
  { key: 'dica_clinica', label: 'Dicas' },
  { key: 'caso_clinico', label: 'Casos' },
  { key: 'pergunta', label: 'Perguntas' },
]

const TOPICOS = [
  { key: 'dica_clinica',  label: 'Dica Clínica',   icon: '💡', cor: '#00A880' },
  { key: 'caso_clinico',  label: 'Caso Clínico',    icon: '🦷', cor: '#1A6FD4' },
  { key: 'oportunidade',  label: 'Oportunidade',    icon: '🚀', cor: '#C49800' },
  { key: 'pergunta',      label: 'Pergunta',         icon: '❓', cor: '#7B3FC4' },
  { key: 'noticia',       label: 'Notícia',          icon: '📰', cor: '#D4600A' },
  { key: 'humor',         label: 'Humor',            icon: '😄', cor: '#D4186A' },
]

const PALAVRAS_PROIBIDAS = [
  'merda', 'porra', 'caralho', 'fdp', 'viado', 'buceta', 'puta', 'prostituta',
  'negro maldito', 'macaco', 'bicha',
]

function checkPalavrasProibidas(text: string) {
  const lower = text.toLowerCase()
  return PALAVRAS_PROIBIDAS.find(p => lower.includes(p)) || null
}

// ── PostModal ─────────────────────────────────────────────────────────────────

function PostModal({ visible, onClose, onPublished }: {
  visible: boolean; onClose: () => void; onPublished: () => void
}) {
  const [topico, setTopico] = useState('')
  const [texto, setTexto] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const reset = () => { setTopico(''); setTexto(''); setImageUri(null) }

  const close = () => { reset(); onClose() }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true, quality: 0.7,
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  const publish = async () => {
    if (!topico) return Alert.alert('Atenção', 'Selecione um tópico')
    if (!texto.trim()) return Alert.alert('Atenção', 'Escreva algo antes de publicar')

    const palavrao = checkPalavrasProibidas(texto)
    if (palavrao) return Alert.alert('Conteúdo inadequado', `O texto contém uma palavra não permitida.`)

    setPublishing(true)
    try {
      let imagem_url: string | null = null
      if (imageUri) {
        const fd = new FormData()
        fd.append('image', { uri: imageUri, type: 'image/jpeg', name: 'post.jpg' } as any)
        const upRes = await api.post('/posts/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imagem_url = upRes.data.url
      }
      await api.post('/posts', {
        tipo_post: topico,
        data_json: { texto: texto.trim(), imagem_url },
      })
      reset()
      onPublished()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar')
    } finally { setPublishing(false) }
  }

  const t = TOPICOS.find(t => t.key === topico)
  const cor = t?.cor || '#00A880'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={pm.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={pm.sheet}>
          <View style={pm.handle} />
          <View style={pm.header}>
            <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={pm.close}>✕</Text>
            </TouchableOpacity>
            <Text style={pm.title}>Nova publicação</Text>
            <TouchableOpacity
              style={[pm.publishBtn, (!topico || !texto.trim()) && pm.publishBtnOff]}
              onPress={publish}
              disabled={!topico || !texto.trim() || publishing}
            >
              {publishing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={pm.publishBtnT}>Publicar</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Tópico */}
            <Text style={pm.secLabel}>Tópico *</Text>
            <View style={pm.topicosRow}>
              {TOPICOS.map(t => {
                const on = topico === t.key
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[pm.topico, on && { borderColor: t.cor, backgroundColor: t.cor + '18' }]}
                    onPress={() => setTopico(t.key)}
                  >
                    <Text style={pm.topicoIcon}>{t.icon}</Text>
                    <Text style={[pm.topicoLabel, on && { color: t.cor, fontWeight: '800' }]}>{t.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Texto */}
            <Text style={pm.secLabel}>Conteúdo *</Text>
            <TextInput
              style={[pm.textarea, topico && { borderColor: cor + '60' }]}
              placeholder={topico ? `Compartilhe sua ${t?.label.toLowerCase()}...` : 'Selecione um tópico acima...'}
              placeholderTextColor="#A0B8AC"
              value={texto}
              onChangeText={setTexto}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
              editable={!!topico}
            />
            <Text style={pm.charCount}>{texto.length}/1000</Text>

            {/* Foto */}
            <TouchableOpacity style={pm.photoBtn} onPress={pickImage}>
              <Text style={pm.photoBtnT}>📷 {imageUri ? 'Trocar foto' : 'Adicionar foto (opcional)'}</Text>
            </TouchableOpacity>
            {imageUri ? (
              <View style={pm.previewWrap}>
                <Image source={{ uri: imageUri }} style={pm.preview} resizeMode="cover" />
                <TouchableOpacity style={pm.removeImg} onPress={() => setImageUri(null)}>
                  <Text style={pm.removeImgT}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

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

  const getCor = (tipo: string) => {
    if (tipo === 'vaga') return '#C49800'
    if (tipo === 'parceria') return '#7B3FC4'
    if (tipo === 'dica_clinica') return '#00A880'
    if (tipo === 'caso_clinico') return '#1A6FD4'
    if (tipo === 'oportunidade') return '#C49800'
    if (tipo === 'pergunta') return '#7B3FC4'
    if (tipo === 'noticia') return '#D4600A'
    if (tipo === 'humor') return '#D4186A'
    return '#00A880'
  }

  const getTopicoMeta = (tipo: string) => {
    return TOPICOS.find(t => t.key === tipo) || null
  }

  const renderPost = ({ item }: any) => {
    const cor = getCor(item.tipo_post)
    const nome = item.page_nome || item.author_nome || 'Usuário'
    const topicoMeta = getTopicoMeta(item.tipo_post)
    const isSocialPost = topicoMeta !== null
    const texto = item.data_json?.texto || item.data_json?.descricao
    const imagemUrl = item.data_json?.imagem_url
      ? (item.data_json.imagem_url.startsWith('http') ? item.data_json.imagem_url : API_BASE + item.data_json.imagem_url)
      : null

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
                <Text style={styles.loc}>{item.cidade} · {item.estado}</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: cor + '20', borderColor: cor + '60' }]}>
              <Text style={[styles.badgeT, { color: cor }]}>
                {topicoMeta ? `${topicoMeta.icon} ${topicoMeta.label.toUpperCase()}` : item.tipo_post?.toUpperCase()}
              </Text>
            </View>
          </View>
          {!isSocialPost && item.data_json?.especialidade
            ? <Text style={styles.esp}>{item.data_json.especialidade}</Text>
            : null}
          {texto ? <Text style={styles.desc}>{texto}</Text> : null}
          {imagemUrl ? (
            <Image source={{ uri: imagemUrl }} style={styles.postImg} resizeMode="cover" />
          ) : null}
          <View style={styles.footer}>
            <Text style={styles.data}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
            {!isSocialPost && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: cor }]}>
                <Text style={styles.btnT}>{item.tipo_post === 'vaga' ? 'Candidatar' : 'Contato'} →</Text>
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
            <Text style={{ fontSize: 18 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ico} onPress={() => { setUnreadCount(0); router.push('/(tabs)/notificacoes') }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#EEF7F2', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 12,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  handle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  close: { fontSize: 20, color: '#7A9E8E', fontWeight: '700', width: 36 },
  title: { fontSize: 17, fontWeight: '800', color: '#0A1C14' },
  publishBtn: { backgroundColor: '#00A880', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  publishBtnOff: { backgroundColor: '#AECEBE' },
  publishBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secLabel: { fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  topicosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  topico: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8,
  },
  topicoIcon: { fontSize: 14 },
  topicoLabel: { fontSize: 12, fontWeight: '600', color: '#3A6550' },
  textarea: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 14, padding: 14, fontSize: 14, color: '#0A1C14',
    minHeight: 120, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#7A9E8E', textAlign: 'right', marginTop: 4, marginBottom: 14 },
  photoBtn: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 12, padding: 13, alignItems: 'center', borderStyle: 'dashed',
  },
  photoBtnT: { fontSize: 13, fontWeight: '700', color: '#00A880' },
  previewWrap: { marginTop: 10, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  removeImg: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center',
  },
  removeImgT: { color: '#fff', fontWeight: '800', fontSize: 12 },
})
