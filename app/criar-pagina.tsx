import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, Modal, FlatList,
} from 'react-native'
import { router } from 'expo-router'
import api from '../services/api'
import { Colors } from '../constants/colors'

const CATEGORIAS = [
  { key: 'clinica',     label: '🦷 Clínica Odontológica',      cor: Colors.clinica },
  { key: 'laboratorio', label: '🔬 Laboratório de Prótese',     cor: Colors.laboratorio },
  { key: 'fabricante',  label: '🏭 Fabricante / Distribuidora', cor: Colors.fabricante },
  { key: 'ensino',      label: '🎓 Instituição de Ensino',      cor: Colors.ensino },
  { key: 'marketing',   label: '📣 Marketing & Comunicação',    cor: Colors.marketing },
  { key: 'gestao',      label: '💼 Gestão & Consultoria',       cor: Colors.gestao },
  { key: 'servicos',    label: '🛠️ Serviços Profissionais',    cor: Colors.servicos },
]

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function CriarPagina() {
  const [categoria, setCategoria] = useState('')
  const [nome, setNome]           = useState('')
  const [descricao, setDescricao] = useState('')
  const [telefone, setTelefone]   = useState('')
  const [site, setSite]           = useState('')
  const [cnpj, setCnpj]           = useState('')
  const [loading, setLoading]     = useState(false)

  // Localização
  const [estados, setEstados]           = useState<any[]>([])
  const [cidades, setCidades]           = useState<any[]>([])
  const [estadoSel, setEstadoSel]       = useState<any>(null)
  const [cidadeSel, setCidadeSel]       = useState<any>(null)
  const [loadingCidades, setLoadingCidades] = useState(false)
  const [modalEstado, setModalEstado]   = useState(false)
  const [modalCidade, setModalCidade]   = useState(false)
  const [buscaCidade, setBuscaCidade]   = useState('')

  const corAtual = CATEGORIAS.find(c => c.key === categoria)?.cor || Colors.primary

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(r => r.json())
      .then(data => setEstados(data))
      .catch(() => {})
  }, [])

  const carregarCidades = async (uf: any) => {
    setEstadoSel(uf)
    setCidadeSel(null)
    setBuscaCidade('')
    setLoadingCidades(true)
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.id}/municipios?orderBy=nome`
      )
      const data = await res.json()
      setCidades(data)
    } catch {}
    setLoadingCidades(false)
  }

  const cidadesFiltradas = buscaCidade
    ? cidades.filter(c => normalize(c.nome).includes(normalize(buscaCidade)))
    : cidades

  const handleCriar = async () => {
    if (!nome.trim())  return Alert.alert('Atenção', 'Informe o nome da empresa')
    if (!categoria)    return Alert.alert('Atenção', 'Selecione uma categoria')
    setLoading(true)
    try {
      const res = await api.post('/pages', {
        nome, categoria, descricao,
        cidade: cidadeSel?.nome || '',
        estado: estadoSel?.sigla || '',
        telefone, site, cnpj, cor: corAtual,
      })
      Alert.alert('✅ Empresa criada!', 'Sua empresa já está no ar.', [
        { text: 'Ver empresa', onPress: () => router.replace(`/pagina/${res.data.page.id}` as any) },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível criar a empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>
      <View style={[s.header, { backgroundColor: corAtual }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nova Empresa</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.sectionTitle}>Categoria *</Text>
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

        <Text style={s.sectionTitle}>Informações básicas</Text>
        <Text style={s.label}>Nome da empresa *</Text>
        <TextInput
          style={s.input}
          placeholder="Ex: Clínica Odonto SP"
          placeholderTextColor={Colors.text3}
          value={nome}
          onChangeText={setNome}
        />

        <Text style={s.label}>Descrição</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Fale sobre a empresa, serviços e diferenciais…"
          placeholderTextColor={Colors.text3}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={s.sectionTitle}>Localização</Text>

        {/* Estado */}
        <Text style={s.label}>Estado</Text>
        <TouchableOpacity style={s.select} onPress={() => setModalEstado(true)}>
          <Text style={[s.selectText, !estadoSel && { color: Colors.text3 }]}>
            {estadoSel ? `${estadoSel.sigla} — ${estadoSel.nome}` : 'Selecione o estado…'}
          </Text>
          <Text style={s.selectArrow}>˅</Text>
        </TouchableOpacity>

        {/* Cidade */}
        <Text style={s.label}>Cidade</Text>
        <TouchableOpacity
          style={[s.select, !estadoSel && s.selectDisabled]}
          onPress={() => estadoSel && setModalCidade(true)}
          disabled={!estadoSel}
        >
          {loadingCidades
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={[s.selectText, !cidadeSel && { color: Colors.text3 }]}>
                {cidadeSel
                  ? cidadeSel.nome
                  : estadoSel ? 'Selecione a cidade…' : 'Selecione o estado primeiro'}
              </Text>
          }
          <Text style={s.selectArrow}>˅</Text>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Contato</Text>
        <Text style={s.label}>Telefone</Text>
        <TextInput
          style={s.input}
          placeholder="(11) 99999-9999"
          placeholderTextColor={Colors.text3}
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        <Text style={s.label}>Site</Text>
        <TextInput
          style={s.input}
          placeholder="www.empresa.com.br"
          placeholderTextColor={Colors.text3}
          value={site}
          onChangeText={setSite}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={s.label}>CNPJ</Text>
        <TextInput
          style={s.input}
          placeholder="00.000.000/0000-00"
          placeholderTextColor={Colors.text3}
          value={cnpj}
          onChangeText={setCnpj}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[s.btn, { backgroundColor: corAtual }, loading && { opacity: 0.7 }]}
          onPress={handleCriar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Criar Empresa →</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Estado */}
      <Modal visible={modalEstado} animationType="fade" transparent onRequestClose={() => setModalEstado(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Selecione o Estado</Text>
              <TouchableOpacity onPress={() => setModalEstado(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={estados}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.modalItem}
                  onPress={() => { carregarCidades(item); setModalEstado(false) }}
                >
                  <Text style={s.modalItemSigla}>{item.sigla}</Text>
                  <Text style={[s.modalItemLabel, estadoSel?.id === item.id && s.modalItemActive]}>
                    {item.nome}
                  </Text>
                  {estadoSel?.id === item.id && <Text style={{ color: '#fff' }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Cidade */}
      <Modal
        visible={modalCidade}
        animationType="fade"
        transparent
        onRequestClose={() => { setModalCidade(false); setBuscaCidade('') }}
      >
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Selecione a Cidade</Text>
              <TouchableOpacity onPress={() => { setModalCidade(false); setBuscaCidade('') }}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={cidadesFiltradas}
              keyExtractor={item => item.id.toString()}
              ListHeaderComponent={
                <TextInput
                  style={s.modalSearch}
                  placeholder="Buscar cidade…"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={buscaCidade}
                  onChangeText={setBuscaCidade}
                  autoCapitalize="none"
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.modalItem}
                  onPress={() => { setCidadeSel(item); setModalCidade(false); setBuscaCidade('') }}
                >
                  <Text style={[s.modalItemLabel, cidadeSel?.id === item.id && s.modalItemActive]}>
                    {item.nome}
                  </Text>
                  {cidadeSel?.id === item.id && <Text style={{ color: '#fff' }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
  },
  backBtn: { width: 40 },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  scroll: { padding: 16, paddingBottom: 80 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: Colors.text2,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 10,
  },
  grid: { gap: 8 },
  catBtn: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 13, padding: 13, backgroundColor: Colors.white },
  catLabel: { fontSize: 14, fontWeight: '600', color: Colors.text2 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.text2, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, padding: 13, fontSize: 14, color: Colors.text, marginBottom: 12,
  },
  textarea: { height: 100 },
  select: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  selectDisabled: { opacity: 0.5 },
  selectText: { fontSize: 14, color: Colors.text, flex: 1 },
  selectArrow: { color: Colors.text2, fontSize: 18 },
  btn: { borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: 'rgba(28,144,155,0.92)', borderRadius: 20, width: '85%', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },
  modalClose: { fontSize: 20, color: '#fff' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  modalItemSigla: { fontSize: 13, fontWeight: '800', color: '#fff', width: 30 },
  modalItemLabel: { fontSize: 15, color: '#fff', flex: 1, textAlign: 'center' },
  modalItemActive: { fontWeight: '800' },
  modalSearch: {
    margin: 10, padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff', fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
})
