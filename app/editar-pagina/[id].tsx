import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, Image,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

const API_BASE = 'https://godenth-api-production.up.railway.app'

const CATEGORIAS = [
  { key: 'clinica', label: '🦷 Clínica Odontológica', cor: Colors.clinica },
  { key: 'laboratorio', label: '🔬 Laboratório de Prótese', cor: Colors.laboratorio },
  { key: 'fabricante', label: '🏭 Fabricante / Distribuidora', cor: Colors.fabricante },
  { key: 'ensino', label: '🎓 Instituição de Ensino', cor: Colors.ensino },
  { key: 'marketing', label: '📣 Marketing & Comunicação', cor: Colors.marketing },
  { key: 'gestao', label: '💼 Gestão & Consultoria', cor: Colors.gestao },
  { key: 'servicos', label: '🛠️ Serviços Profissionais', cor: Colors.servicos },
]

function resolveUrl(url: string | null) {
  if (!url) return null
  return url.startsWith('http') ? url : API_BASE + url
}

export default function EditarPagina() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [categoria, setCategoria] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [telefone, setTelefone] = useState('')
  const [site, setSite] = useState('')
  const [cnpj, setCnpj] = useState('')

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const corAtual = CATEGORIAS.find(c => c.key === categoria)?.cor || Colors.primary

  useEffect(() => {
    api.get(`/pages/${id}`)
      .then(r => {
        const p = r.data
        setCategoria(p.categoria || '')
        setNome(p.nome || '')
        setDescricao(p.descricao || '')
        setCidade(p.cidade || '')
        setEstado(p.estado || '')
        setTelefone(p.telefone || '')
        setSite(p.site || '')
        setCnpj(p.cnpj || '')
        setLogoUrl(resolveUrl(p.logo_url))
        setCoverUrl(resolveUrl(p.cover_url))
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar a página'))
      .finally(() => setLoading(false))
  }, [id])

  const pickAndUpload = async (type: 'logo' | 'cover') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [3, 1],
      quality: 0.8,
    })
    if (result.canceled) return

    const uri = result.assets[0].uri
    if (type === 'logo') setUploadingLogo(true)
    else setUploadingCover(true)

    try {
      const fd = new FormData()
      fd.append(type, { uri, type: 'image/jpeg', name: `${type}.jpg` } as any)
      const res = await api.post(`/pages/${id}/upload-${type}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const fullUrl = resolveUrl(res.data.url)
      if (type === 'logo') setLogoUrl(fullUrl)
      else setCoverUrl(fullUrl)
      Alert.alert('✅ Imagem atualizada!')
    } catch {
      Alert.alert('Erro', 'Não foi possível fazer o upload. Tente novamente.')
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingCover(false)
    }
  }

  const handleSalvar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'O nome é obrigatório')
    setSaving(true)
    try {
      await api.put(`/pages/${id}`, { nome, descricao, cidade, estado, telefone, site, cnpj, cor: corAtual })
      Alert.alert('✅ Salvo!', 'As alterações foram salvas.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <View style={s.root}>
      <View style={[s.header, { backgroundColor: corAtual }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar Página</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Cover */}
        <Text style={s.sectionTitle}>Imagens</Text>
        <TouchableOpacity style={s.coverWrap} onPress={() => pickAndUpload('cover')} activeOpacity={0.85}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={s.coverImg} resizeMode="cover" />
          ) : (
            <View style={[s.coverPlaceholder, { backgroundColor: corAtual + '22' }]}>
              <Text style={[s.coverPlaceholderT, { color: corAtual }]}>Sem cover</Text>
            </View>
          )}
          <View style={s.coverOverlay}>
            {uploadingCover
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.coverOverlayT}>📷 {coverUrl ? 'Trocar cover' : 'Adicionar cover'}</Text>}
          </View>
        </TouchableOpacity>

        {/* Logo */}
        <View style={s.logoRow}>
          <TouchableOpacity style={s.logoWrap} onPress={() => pickAndUpload('logo')} activeOpacity={0.85}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={s.logoImg} resizeMode="cover" />
            ) : (
              <View style={[s.logoPlaceholder, { backgroundColor: corAtual }]}>
                <Text style={s.logoPlaceholderT}>{nome?.charAt(0) || 'P'}</Text>
              </View>
            )}
            <View style={s.logoBadge}>
              {uploadingLogo
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.logoBadgeT}>📷</Text>}
            </View>
          </TouchableOpacity>
          <Text style={s.logoHint}>Toque para {logoUrl ? 'trocar' : 'adicionar'} o logo{'\n'}Use imagem quadrada para melhor resultado</Text>
        </View>

        {/* Categoria */}
        <Text style={s.sectionTitle}>Categoria</Text>
        <View style={s.grid}>
          {CATEGORIAS.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[s.catBtn, categoria === c.key && { borderColor: c.cor, backgroundColor: c.cor + '12' }]}
              onPress={() => setCategoria(c.key)}
            >
              <Text style={[s.catLabel, categoria === c.key && { color: c.cor }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Informações básicas */}
        <Text style={s.sectionTitle}>Informações básicas</Text>
        <Text style={s.label}>Nome da página *</Text>
        <TextInput style={s.input} placeholder="Nome da empresa" placeholderTextColor={Colors.text3} value={nome} onChangeText={setNome} />

        <Text style={s.label}>Descrição</Text>
        <TextInput style={[s.input, s.textarea]} placeholder="Fale sobre a empresa, serviços e diferenciais…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />

        {/* Localização */}
        <Text style={s.sectionTitle}>Localização</Text>
        <View style={s.row}>
          <View style={{ flex: 2 }}>
            <Text style={s.label}>Cidade</Text>
            <TextInput style={s.input} placeholder="São Paulo" placeholderTextColor={Colors.text3} value={cidade} onChangeText={setCidade} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.label}>UF</Text>
            <TextInput style={s.input} placeholder="SP" placeholderTextColor={Colors.text3} value={estado} onChangeText={setEstado} maxLength={2} autoCapitalize="characters" />
          </View>
        </View>

        {/* Contato */}
        <Text style={s.sectionTitle}>Contato</Text>
        <Text style={s.label}>Telefone</Text>
        <TextInput style={s.input} placeholder="(11) 99999-9999" placeholderTextColor={Colors.text3} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />

        <Text style={s.label}>Site</Text>
        <TextInput style={s.input} placeholder="www.empresa.com.br" placeholderTextColor={Colors.text3} value={site} onChangeText={setSite} autoCapitalize="none" keyboardType="url" />

        <Text style={s.label}>CNPJ</Text>
        <TextInput style={s.input} placeholder="00.000.000/0000-00" placeholderTextColor={Colors.text3} value={cnpj} onChangeText={setCnpj} keyboardType="numeric" />

        <TouchableOpacity style={[s.btn, { backgroundColor: corAtual }, saving && { opacity: 0.7 }]} onPress={handleSalvar} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Salvar alterações →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
  },
  backBtn: { width: 40 },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  scroll: { padding: 16, paddingBottom: 80 },

  // Cover
  coverWrap: { borderRadius: 14, overflow: 'hidden', height: 120, marginBottom: 4 },
  coverImg: { width: '100%', height: 120 },
  coverPlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', borderRadius: 14, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  coverPlaceholderT: { fontSize: 13, fontWeight: '700' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  coverOverlayT: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Logo
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8, marginTop: 8 },
  logoWrap: { position: 'relative', width: 72, height: 72 },
  logoImg: { width: 72, height: 72, borderRadius: 16, borderWidth: 2, borderColor: Colors.border },
  logoPlaceholder: { width: 72, height: 72, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  logoPlaceholderT: { color: '#fff', fontSize: 28, fontWeight: '900' },
  logoBadge: { position: 'absolute', bottom: -6, right: -6, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  logoBadgeT: { fontSize: 12 },
  logoHint: { flex: 1, fontSize: 12, color: Colors.text3, lineHeight: 18 },

  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 10 },
  grid: { gap: 8 },
  catBtn: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 13, padding: 13, backgroundColor: Colors.white },
  catLabel: { fontSize: 14, fontWeight: '600', color: Colors.text2 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.text2, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 14, color: Colors.text, marginBottom: 12 },
  textarea: { height: 100 },
  row: { flexDirection: 'row' },
  btn: { borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
