import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native'
import { router } from 'expo-router'
import api from '../services/api'
import { Colors } from '../constants/colors'

const CATEGORIAS = [
  { key: 'clinica', label: '🦷 Clínica Odontológica', cor: Colors.clinica },
  { key: 'laboratorio', label: '🔬 Laboratório de Prótese', cor: Colors.laboratorio },
  { key: 'fabricante', label: '🏭 Fabricante / Distribuidora', cor: Colors.fabricante },
  { key: 'ensino', label: '🎓 Instituição de Ensino', cor: Colors.ensino },
  { key: 'marketing', label: '📣 Marketing & Comunicação', cor: Colors.marketing },
  { key: 'gestao', label: '💼 Gestão & Consultoria', cor: Colors.gestao },
  { key: 'servicos', label: '🛠️ Serviços Profissionais', cor: Colors.servicos },
]

export default function CriarPagina() {
  const [categoria, setCategoria] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [telefone, setTelefone] = useState('')
  const [site, setSite] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [loading, setLoading] = useState(false)

  const corAtual = CATEGORIAS.find(c => c.key === categoria)?.cor || Colors.primary

  const handleCriar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'Informe o nome da página')
    if (!categoria) return Alert.alert('Atenção', 'Selecione uma categoria')
    setLoading(true)
    try {
      const res = await api.post('/pages', { nome, categoria, descricao, cidade, estado, telefone, site, cnpj, cor: corAtual })
      Alert.alert('✅ Página criada!', 'Sua página já está no ar.', [
        { text: 'Ver página', onPress: () => router.replace(`/pagina/${res.data.page.id}` as any) },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível criar a página')
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
        <Text style={s.headerTitle}>Nova Página</Text>
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
        <Text style={s.label}>Nome da página *</Text>
        <TextInput style={s.input} placeholder="Ex: Clínica Odonto SP" placeholderTextColor={Colors.text3} value={nome} onChangeText={setNome} />

        <Text style={s.label}>Descrição</Text>
        <TextInput style={[s.input, s.textarea]} placeholder="Fale sobre a empresa, serviços e diferenciais…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />

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

        <Text style={s.sectionTitle}>Contato</Text>
        <Text style={s.label}>Telefone</Text>
        <TextInput style={s.input} placeholder="(11) 99999-9999" placeholderTextColor={Colors.text3} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />

        <Text style={s.label}>Site</Text>
        <TextInput style={s.input} placeholder="www.empresa.com.br" placeholderTextColor={Colors.text3} value={site} onChangeText={setSite} autoCapitalize="none" keyboardType="url" />

        <Text style={s.label}>CNPJ</Text>
        <TextInput style={s.input} placeholder="00.000.000/0000-00" placeholderTextColor={Colors.text3} value={cnpj} onChangeText={setCnpj} keyboardType="numeric" />

        <TouchableOpacity style={[s.btn, { backgroundColor: corAtual }, loading && { opacity: 0.7 }]} onPress={handleCriar} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Criar Página →</Text>}
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
