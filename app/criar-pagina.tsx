import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, FlatList,
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
  const [cidade, setCidade]       = useState('')
  const [estado, setEstado]       = useState('')
  const [telefone, setTelefone]   = useState('')
  const [site, setSite]           = useState('')
  const [cnpj, setCnpj]           = useState('')
  const [loading, setLoading]     = useState(false)

  const [municipios, setMunicipios]         = useState<any[]>([])
  const [loadingMunicipios, setLoadingMunicipios] = useState(false)
  const [sugestoes, setSugestoes]           = useState<any[]>([])
  const [showSugestoes, setShowSugestoes]   = useState(false)

  const corAtual = CATEGORIAS.find(c => c.key === categoria)?.cor || Colors.primary

  useEffect(() => {
    setLoadingMunicipios(true)
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      .then(r => r.json())
      .then(data => setMunicipios(data))
      .catch(() => {})
      .finally(() => setLoadingMunicipios(false))
  }, [])

  const handleCidadeChange = (text: string) => {
    setCidade(text)
    setEstado('')
    if (text.trim().length < 2) {
      setSugestoes([])
      setShowSugestoes(false)
      return
    }
    const norm = normalize(text.trim())
    const filtered = municipios
      .filter(m => normalize(m.nome).includes(norm))
      .slice(0, 8)
    setSugestoes(filtered)
    setShowSugestoes(filtered.length > 0)
  }

  const handleSelecionarMunicipio = (municipio: any) => {
    const uf = municipio.microrregiao?.mesorregiao?.UF?.sigla || ''
    setCidade(municipio.nome)
    setEstado(uf)
    setSugestoes([])
    setShowSugestoes(false)
  }

  const handleCriar = async () => {
    if (!nome.trim())  return Alert.alert('Atenção', 'Informe o nome da empresa')
    if (!categoria)    return Alert.alert('Atenção', 'Selecione uma categoria')
    setLoading(true)
    try {
      const res = await api.post('/pages', { nome, categoria, descricao, cidade, estado, telefone, site, cnpj, cor: corAtual })
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

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowSugestoes(false)}
      >
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
        <View style={s.row}>
          <View style={{ flex: 2 }}>
            <Text style={s.label}>Cidade</Text>
            <View style={{ position: 'relative' }}>
              <View style={s.cidadeRow}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Digite a cidade…"
                  placeholderTextColor={Colors.text3}
                  value={cidade}
                  onChangeText={handleCidadeChange}
                  onFocus={() => sugestoes.length > 0 && setShowSugestoes(true)}
                  onBlur={() => setTimeout(() => setShowSugestoes(false), 150)}
                />
                {loadingMunicipios && (
                  <ActivityIndicator size="small" color={Colors.primary} style={s.cidadeLoader} />
                )}
              </View>
              {showSugestoes && (
                <View style={s.dropdown}>
                  <FlatList
                    data={sugestoes}
                    keyExtractor={item => item.id.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={s.dropdownItem}
                        onPress={() => handleSelecionarMunicipio(item)}
                      >
                        <Text style={s.dropdownItemText}>{item.nome}</Text>
                        <Text style={s.dropdownItemUF}>
                          {item.microrregiao?.mesorregiao?.UF?.sigla}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.label}>UF</Text>
            <TextInput
              style={[s.input, estado ? s.inputReadonly : null]}
              placeholder="SP"
              placeholderTextColor={Colors.text3}
              value={estado}
              onChangeText={v => setEstado(v.toUpperCase())}
              maxLength={2}
              autoCapitalize="characters"
              editable={!estado}
            />
          </View>
        </View>

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
  inputReadonly: { backgroundColor: Colors.bg, color: Colors.text2 },
  textarea: { height: 100 },
  row: { flexDirection: 'row' },
  cidadeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cidadeLoader: { position: 'absolute', right: 12 },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, marginTop: -10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dropdownItemText: { fontSize: 14, color: Colors.text, flex: 1 },
  dropdownItemUF: { fontSize: 12, fontWeight: '800', color: Colors.text2, marginLeft: 8 },
  btn: { borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
