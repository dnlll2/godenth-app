#!/bin/bash
echo "Corrigindo fluxo de cadastro..."

# cadastro3.tsx - salva no store e navega
cat > "/workspaces/godenth-app/app/(auth)/cadastro3.tsx" << 'EOF'
import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, FlatList } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

export default function Cadastro3() {
  const { profissao, extras } = useLocalSearchParams<{ profissao: string, extras: string }>()
  const { setCadastroData } = useAuthStore()

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
      profissao: JSON.parse(profissao || '{}'),
      extras: JSON.parse(extras || '[]'),
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
EOF
echo "✅ cadastro3.tsx"

# especialidades.tsx - lê do store e salva
cat > "/workspaces/godenth-app/app/(auth)/especialidades.tsx" << 'EOF'
import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

const ESPECIALIDADES: any = {
  'Cirurgião-Dentista': ['Estética (Facetas e Lentes)','Odontopediatria','Implantodontia','Ortodontia','Endodontia','Harmonização Orofacial (HOF)'],
  'Técnico em Prótese Dentária': ['Gesso (Modelos e Troquéis)','Ceramista (Estratificação)','Cadista (Desenho Digital)','Resinas (Prótese Total/Parcial)','Metalurgia'],
  'Técnico em Saúde Bucal (TSB)': ['Auxílio em Cirurgia','Prevenção e Profilaxia','Radiologia'],
  'Auxiliar em Saúde Bucal (ASB)': ['Auxílio em Cirurgia','Instrumentação','Organização de Consultório'],
  'Auxiliar de Prótese Dentária': ['Gesso','Acabamento e Polimento','Auxiliar de Cadista'],
}

export default function Especialidades() {
  const { cadastroData, setCadastroData } = useAuthStore()
  const [selecionadas, setSelecionadas] = useState<string[]>([])

  const todasProfissoes = [cadastroData.profissao, ...(cadastroData.extras || [])].filter(Boolean)
  const todasEsp: string[] = []
  todasProfissoes.forEach((p: any) => {
    const lista = ESPECIALIDADES[p.label] || []
    lista.forEach((e: string) => { if (!todasEsp.includes(e)) todasEsp.push(e) })
  })

  const toggle = (esp: string) => setSelecionadas(prev => prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.logo}><Text style={{ color: '#F5C800' }}>Go</Text><Text style={{ color: '#fff' }}>Denth</Text></Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.progressRow}>
        {[1,2,3,4].map(i => <View key={i} style={[styles.bar, i <= 4 ? styles.barOn : {}]} />)}
        {[5,6,7].map(i => <View key={i} style={styles.bar} />)}
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 4 de 7</Text>
        <Text style={styles.title}>Suas{'\n'}especialidades</Text>
        <Text style={styles.sub}>Toque para selecionar — aparecem no seu perfil</Text>
        {todasEsp.length === 0 ? (
          <Text style={{ color: '#7A9E8E', textAlign: 'center', marginTop: 20 }}>Nenhuma especialidade para seu perfil</Text>
        ) : (
          <View style={styles.chips}>
            {todasEsp.map(esp => {
              const on = selecionadas.includes(esp)
              return (
                <TouchableOpacity key={esp} style={[styles.chip, on && styles.chipOn]} onPress={() => toggle(esp)}>
                  <Text style={[styles.chipT, on && styles.chipTOn]}>{esp}</Text>
                  {on && <Text style={styles.chipCheck}>✓</Text>}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
        {selecionadas.length > 0 && <Text style={styles.count}>{selecionadas.length} selecionada{selecionadas.length > 1 ? 's' : ''}</Text>}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => { setCadastroData({ especialidades: selecionadas }); router.push('/(auth)/academico') }}>
          <Text style={styles.btnT}>{selecionadas.length > 0 ? 'Continuar →' : 'Pular →'}</Text>
        </TouchableOpacity>
      </View>
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
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { backgroundColor: '#007A6E', borderColor: '#007A6E' },
  chipT: { fontSize: 13, fontWeight: '600', color: '#3A6550' },
  chipTOn: { color: '#fff' },
  chipCheck: { color: '#fff', fontSize: 11, fontWeight: '900' },
  count: { marginTop: 20, fontSize: 13, color: '#00A880', fontWeight: '700', textAlign: 'center' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
EOF
echo "✅ especialidades.tsx"

# sobre.tsx - lê do store e cria conta
cat > "/workspaces/godenth-app/app/(auth)/sobre.tsx" << 'EOF'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

const MAX_CHARS = 500

export default function Sobre() {
  const { cadastroData, login } = useAuthStore()
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)

  const finalizar = async () => {
    setLoading(true)
    try {
      await api.post('/auth/register', {
        nome: cadastroData.nome,
        email: cadastroData.email,
        password: cadastroData.senha,
        tipo_profissional: cadastroData.profissao?.label || 'dentista',
        cidade: cadastroData.cidade,
        estado: cadastroData.estado,
        bio,
      })
      await login(cadastroData.email!, cadastroData.senha!)
      router.replace('/(tabs)/feed')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.logo}><Text style={{ color: '#F5C800' }}>Go</Text><Text style={{ color: '#fff' }}>Denth</Text></Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.progressRow}>
        {[1,2,3,4,5,6,7].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Último passo!</Text>
        <Text style={styles.title}>Fale sobre{'\n'}você</Text>
        <Text style={styles.sub}>Escreva um resumo profissional — aparece no topo do seu perfil</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textarea}
            placeholder="Ex: Cirurgião-Dentista com 8 anos de experiência em Implantodontia e Estética. Apaixonado por resultados naturais e atendimento humanizado. Atuo em São Paulo - SP."
            placeholderTextColor="#AECEBE"
            value={bio}
            onChangeText={t => t.length <= MAX_CHARS && setBio(t)}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          <View style={styles.counter}>
            <Text style={[styles.counterText, bio.length > MAX_CHARS * 0.9 && { color: '#E53935' }]}>{bio.length}/{MAX_CHARS}</Text>
          </View>
        </View>
        <View style={styles.dicas}>
          <Text style={styles.dicasTitle}>💡 Dicas para um bom resumo:</Text>
          <Text style={styles.dica}>• Mencione anos de experiência</Text>
          <Text style={styles.dica}>• Cite suas principais especialidades</Text>
          <Text style={styles.dica}>• Fale do seu diferencial</Text>
          <Text style={styles.dica}>• Informe sua cidade de atuação</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={finalizar} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnT}>{bio.length > 0 ? '🚀 Criar minha conta' : 'Pular e criar conta →'}</Text>}
        </TouchableOpacity>
      </View>
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
  step: { fontSize: 11, fontWeight: '800', color: '#F5C800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 24, lineHeight: 20 },
  inputBox: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#D0E8DA', overflow: 'hidden' },
  textarea: { padding: 16, fontSize: 15, color: '#0A1C14', minHeight: 180, lineHeight: 24 },
  counter: { paddingHorizontal: 16, paddingBottom: 12, alignItems: 'flex-end' },
  counterText: { fontSize: 12, color: '#7A9E8E', fontWeight: '600' },
  dicas: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#D0E8DA' },
  dicasTitle: { fontSize: 13, fontWeight: '800', color: '#0A1C14', marginBottom: 10 },
  dica: { fontSize: 12, color: '#7A9E8E', lineHeight: 22 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
EOF
echo "✅ sobre.tsx"

echo "🎉 Pronto!"
