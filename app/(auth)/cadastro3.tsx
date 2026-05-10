import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, FlatList } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

export default function Cadastro3() {
  const { setCadastroData, cadastroData } = useAuthStore()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [cidade, setCidade] = useState<any>(null)
  const [estado, setEstado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [modalEstado, setModalEstado] = useState(false)
  const [modalCidade, setModalCidade] = useState(false)
  const [loadingCidades, setLoadingCidades] = useState(false)

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(r => r.json())
      .then(data => setEstados(data))
      .catch(() => {})
  }, [])

  const carregarCidades = async (uf: any) => {
    setEstado(uf)
    setCidade(null)
    setLoadingCidades(true)
    try {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/' + uf.id + '/municipios?orderBy=nome')
      const data = await res.json()
      setCidades(data)
    } catch {}
    setLoadingCidades(false)
  }

  const handleContinuar = () => {
    if (!nome || !email || !senha) return Alert.alert('Atenção', 'Preencha nome, email e senha')
    if (senha.length < 6) return Alert.alert('Atenção', 'Senha deve ter pelo menos 6 caracteres')

    setCadastroData({
      nome,
      email,
      senha,
      cidade: cidade?.nome || '',
      estado: estado?.sigla || '',
    })

    router.push('/(auth)/especialidades')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>
          <Text style={{ color: '#F5C800' }}>Go</Text>
          <Text style={{ color: '#fff' }}>Denth</Text>
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.progressRow}>
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 3 de 7</Text>
        <Text style={styles.title}>Seus dados{'\n'}pessoais</Text>
        <Text style={styles.sub}>Essas informações formam seu currículo profissional</Text>

        <Text style={styles.label}>Nome completo *</Text>
        <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#AECEBE" value={nome} onChangeText={setNome} />

        <Text style={styles.label}>E-mail *</Text>
        <TextInput style={styles.input} placeholder="seu@email.com.br" placeholderTextColor="#AECEBE" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Senha *</Text>
        <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" placeholderTextColor="#AECEBE" value={senha} onChangeText={setSenha} secureTextEntry />

        <Text style={styles.label}>Estado</Text>
        <TouchableOpacity style={styles.select} onPress={() => setModalEstado(true)}>
          <Text style={[styles.selectText, !estado && { color: '#AECEBE' }]}>{estado ? estado.sigla + ' — ' + estado.nome : 'Selecione o estado...'}</Text>
          <Text style={{ color: '#7A9E8E', fontSize: 18 }}>˅</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Cidade</Text>
        <TouchableOpacity style={[styles.select, !estado && { opacity: 0.5 }]} onPress={() => estado && setModalCidade(true)} disabled={!estado}>
          {loadingCidades ? <ActivityIndicator size="small" color="#00A880" /> : (
            <Text style={[styles.selectText, !cidade && { color: '#AECEBE' }]}>{cidade ? cidade.nome : estado ? 'Selecione a cidade...' : 'Selecione o estado primeiro'}</Text>
          )}
          <Text style={{ color: '#7A9E8E', fontSize: 18 }}>˅</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, (!nome || !email || !senha) && styles.btnOff]} disabled={!nome || !email || !senha} onPress={handleContinuar}>
          <Text style={styles.btnT}>Continuar →</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalEstado} animationType="slide" transparent onRequestClose={() => setModalEstado(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Estado</Text>
              <TouchableOpacity onPress={() => setModalEstado(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <FlatList data={estados} keyExtractor={item => item.id.toString()} renderItem={({ item }) => (
              <TouchableOpacity style={[styles.modalItem, estado?.id === item.id && styles.modalItemOn]} onPress={() => { carregarCidades(item); setModalEstado(false) }}>
                <Text style={styles.modalItemSigla}>{item.sigla}</Text>
                <Text style={[styles.modalItemLabel, estado?.id === item.id && { color: '#00A880', fontWeight: '800' }]}>{item.nome}</Text>
                {estado?.id === item.id && <Text style={{ color: '#00A880' }}>✓</Text>}
              </TouchableOpacity>
            )} />
          </View>
        </View>
      </Modal>

      <Modal visible={modalCidade} animationType="slide" transparent onRequestClose={() => setModalCidade(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Cidade</Text>
              <TouchableOpacity onPress={() => setModalCidade(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <FlatList data={cidades} keyExtractor={item => item.id.toString()} renderItem={({ item }) => (
              <TouchableOpacity style={[styles.modalItem, cidade?.id === item.id && styles.modalItemOn]} onPress={() => { setCidade(item); setModalCidade(false) }}>
                <Text style={[styles.modalItemLabel, cidade?.id === item.id && { color: '#00A880', fontWeight: '800' }]}>{item.nome}</Text>
                {cidade?.id === item.id && <Text style={{ color: '#00A880' }}>✓</Text>}
              </TouchableOpacity>
            )} />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontWeight: '800' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007A6E' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#F5C800' },
  scroll: { padding: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#3A6550', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 14, fontSize: 15, color: '#0A1C14', marginBottom: 14 },
  select: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  selectText: { fontSize: 15, color: '#0A1C14', flex: 1 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff: { backgroundColor: '#AECEBE' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0A1C14', flex: 1, textAlign: 'center' },
  modalClose: { fontSize: 20, color: '#7A9E8E' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' },
  modalItemOn: { backgroundColor: 'rgba(0,168,128,0.06)' },
  modalItemSigla: { fontSize: 13, fontWeight: '800', color: '#00A880', width: 30 },
  modalItemLabel: { fontSize: 15, color: '#0A1C14', flex: 1 },
})
