import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, FlatList, Animated } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

const CAPITAIS: Record<string, string> = {
  AC: 'Rio Branco', AL: 'Maceió', AM: 'Manaus', AP: 'Macapá',
  BA: 'Salvador', CE: 'Fortaleza', DF: 'Brasília', ES: 'Vitória',
  GO: 'Goiânia', MA: 'São Luís', MG: 'Belo Horizonte', MS: 'Campo Grande',
  MT: 'Cuiabá', PA: 'Belém', PB: 'João Pessoa', PE: 'Recife',
  PI: 'Teresina', PR: 'Curitiba', RJ: 'Rio de Janeiro', RN: 'Natal',
  RO: 'Porto Velho', RR: 'Boa Vista', RS: 'Porto Alegre', SC: 'Florianópolis',
  SE: 'Aracaju', SP: 'São Paulo', TO: 'Palmas',
}

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Cadastro3() {
  const { setCadastroData } = useAuthStore()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [confirmarEmail, setConfirmarEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [cidade, setCidade] = useState<any>(null)
  const [estado, setEstado] = useState<any>(null)
  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [modalEstado, setModalEstado] = useState(false)
  const [modalCidade, setModalCidade] = useState(false)
  const [loadingCidades, setLoadingCidades] = useState(false)
  const [emailCadastradoError, setEmailCadastradoError] = useState('')
  const [buscaCidade, setBuscaCidade] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)

  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleTranslateY = useRef(new Animated.Value(24)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const contentTranslateY = useRef(new Animated.Value(20)).current

  const fieldAnims = useRef(
    Array.from({ length: 6 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(16),
    }))
  ).current

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(r => r.json())
      .then(data => setEstados(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleTranslateY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(contentTranslateY, { toValue: 0, tension: 55, friction: 12, useNativeDriver: true }),
      ]),
      Animated.stagger(80, fieldAnims.map(a =>
        Animated.parallel([
          Animated.timing(a.opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(a.translateY, { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
        ])
      )),
    ]).start()
  }, [])

  const carregarCidades = async (uf: any) => {
    setEstado(uf)
    setCidade(null)
    setBuscaCidade('')
    setLoadingCidades(true)
    try {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/' + uf.id + '/municipios?orderBy=nome')
      const data = await res.json()
      const capital = CAPITAIS[uf.sigla]
      if (capital) {
        const capitalItem = data.find((c: any) => c.nome === capital)
        const rest = data.filter((c: any) => c.nome !== capital)
        setCidades(capitalItem ? [capitalItem, ...rest] : data)
      } else {
        setCidades(data)
      }
    } catch {}
    setLoadingCidades(false)
  }

  const emailMatch = !confirmarEmail || email === confirmarEmail

  const senhaForca = (() => {
    if (!senha) return null
    const score = [
      senha.length >= 8,
      /[A-Z]/.test(senha),
      /[a-z]/.test(senha),
      /[0-9]/.test(senha),
    ].filter(Boolean).length
    if (score <= 2) return 'fraca'
    if (score === 3) return 'média'
    return 'forte'
  })()

  const senhaHint = (() => {
    if (!senha) return ''
    const missing: string[] = []
    if (senha.length < 8) missing.push('mínimo 8 caracteres')
    if (!/[A-Z]/.test(senha)) missing.push('uma letra maiúscula')
    if (!/[a-z]/.test(senha)) missing.push('uma letra minúscula')
    if (!/[0-9]/.test(senha)) missing.push('um número')
    return missing.length ? 'Falta: ' + missing.join(', ') : ''
  })()

  const forcaCor = senhaForca === 'forte' ? '#38A169' : senhaForca === 'média' ? '#DD6B20' : '#E53E3E'
  const forcaNivel = senhaForca === 'forte' ? 3 : senhaForca === 'média' ? 2 : senhaForca ? 1 : 0

  const cidadesFiltradas = buscaCidade
    ? cidades.filter(c => normalize(c.nome).includes(normalize(buscaCidade)))
    : cidades

  const canContinue = !!nome && !!email && !!confirmarEmail && emailMatch && senhaForca === 'forte' && !checkingEmail

  const handleContinuar = async () => {
    if (!emailMatch) return
    setCheckingEmail(true)
    try {
      const res = await api.get('/auth/check-email', { params: { email } })
      if (res.data?.exists) {
        setEmailCadastradoError('Este e-mail já está cadastrado. Faça login ou use outro e-mail')
        setCheckingEmail(false)
        return
      }
    } catch {
      // proceed on network/server error
    }
    setCheckingEmail(false)
    setCadastroData({ nome, email, senha, cidade: cidade?.nome || '', estado: estado?.sigla || '' })
    router.push('/(auth)/especialidades')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>
          <Text style={{ color: '#C49800' }}>Go</Text>
          <Text style={{ color: '#fff' }}>Denth</Text>
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.progressRow}>
        {[1,2,3].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
        {[4,5,6,7].map(i => <View key={i} style={styles.bar} />)}
      </View>

      <Animated.View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}>
        <Text style={styles.step}>Passo 3 de 7</Text>
        <Text style={styles.title}>Seus dados pessoais</Text>
        <Text style={styles.sub}>Essas informações formam seu currículo profissional</Text>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Nome */}
          <Animated.View style={{ opacity: fieldAnims[0].opacity, transform: [{ translateY: fieldAnims[0].translateY }] }}>
            <Text style={styles.label}>Nome completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome completo"
              placeholderTextColor="#AECEBE"
              value={nome}
              onChangeText={setNome}
            />
          </Animated.View>

          {/* Email */}
          <Animated.View style={{ opacity: fieldAnims[1].opacity, transform: [{ translateY: fieldAnims[1].translateY }] }}>
            <Text style={styles.label}>E-mail *</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com.br"
              placeholderTextColor="#AECEBE"
              value={email}
              onChangeText={v => { setEmail(v); setEmailCadastradoError('') }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Animated.View>

          {/* Confirmar email */}
          <Animated.View style={{ opacity: fieldAnims[2].opacity, transform: [{ translateY: fieldAnims[2].translateY }] }}>
            <Text style={styles.label}>Confirmar e-mail *</Text>
            <TextInput
              style={[styles.input, confirmarEmail.length > 0 && !emailMatch && styles.inputError]}
              placeholder="Repita seu e-mail"
              placeholderTextColor="#AECEBE"
              value={confirmarEmail}
              onChangeText={v => { setConfirmarEmail(v); setEmailCadastradoError('') }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {confirmarEmail.length > 0 && !emailMatch && (
              <Text style={styles.errorText}>Os e-mails não coincidem</Text>
            )}
            {!!emailCadastradoError && (
              <Text style={styles.errorText}>{emailCadastradoError}</Text>
            )}
          </Animated.View>

          {/* Senha */}
          <Animated.View style={{ opacity: fieldAnims[3].opacity, transform: [{ translateY: fieldAnims[3].translateY }] }}>
            <Text style={styles.label}>Senha *</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#AECEBE"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
            {senha.length > 0 && (
              <View style={{ marginTop: -8, marginBottom: 10 }}>
                <View style={styles.strengthRow}>
                  {[1, 2, 3].map(n => (
                    <View key={n} style={[styles.strengthBar, n <= forcaNivel && { backgroundColor: forcaCor }]} />
                  ))}
                  <Text style={[styles.strengthLabel, { color: forcaCor }]}>{senhaForca}</Text>
                </View>
                {!!senhaHint && <Text style={styles.senhaHint}>{senhaHint}</Text>}
              </View>
            )}
          </Animated.View>

          {/* Estado */}
          <Animated.View style={{ opacity: fieldAnims[4].opacity, transform: [{ translateY: fieldAnims[4].translateY }] }}>
            <Text style={styles.label}>Estado</Text>
            <TouchableOpacity style={styles.select} onPress={() => setModalEstado(true)}>
              <Text style={[styles.selectText, !estado && { color: '#AECEBE' }]}>
                {estado ? estado.sigla + ' — ' + estado.nome : 'Selecione o estado...'}
              </Text>
              <Text style={{ color: '#7A9E8E', fontSize: 18 }}>˅</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Cidade */}
          <Animated.View style={{ opacity: fieldAnims[5].opacity, transform: [{ translateY: fieldAnims[5].translateY }] }}>
            <Text style={styles.label}>Cidade</Text>
            <TouchableOpacity
              style={[styles.select, !estado && { opacity: 0.5 }]}
              onPress={() => estado && setModalCidade(true)}
              disabled={!estado}
            >
              {loadingCidades
                ? <ActivityIndicator size="small" color="#00A880" />
                : <Text style={[styles.selectText, !cidade && { color: '#AECEBE' }]}>
                    {cidade ? cidade.nome : estado ? 'Selecione a cidade...' : 'Selecione o estado primeiro'}
                  </Text>
              }
              <Text style={{ color: '#7A9E8E', fontSize: 18 }}>˅</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, !canContinue && styles.btnOff]}
            disabled={!canContinue}
            onPress={handleContinuar}
          >
            {checkingEmail
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.btnT}>Continuar →</Text>
            }
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Modal Estado */}
      <Modal visible={modalEstado} animationType="fade" transparent onRequestClose={() => setModalEstado(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Estado</Text>
              <TouchableOpacity onPress={() => setModalEstado(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={estados}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { carregarCidades(item); setModalEstado(false) }}
                >
                  <Text style={styles.modalItemSigla}>{item.sigla}</Text>
                  <Text style={[styles.modalItemLabel, estado?.id === item.id && { color: '#fff', fontWeight: '800' }]}>{item.nome}</Text>
                  {estado?.id === item.id && <Text style={{ color: '#fff' }}>✓</Text>}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Cidade</Text>
              <TouchableOpacity onPress={() => { setModalCidade(false); setBuscaCidade('') }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={cidadesFiltradas}
              keyExtractor={item => item.id.toString()}
              ListHeaderComponent={
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar cidade..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={buscaCidade}
                  onChangeText={setBuscaCidade}
                  autoCapitalize="none"
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setCidade(item); setModalCidade(false); setBuscaCidade('') }}
                >
                  <Text style={[styles.modalItemLabel, cidade?.id === item.id && { color: '#fff', fontWeight: '800' }]}>{item.nome}</Text>
                  {cidade?.id === item.id && <Text style={{ color: '#fff' }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c909b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1c909b' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontFamily: 'Poppins-ExtraBold' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1c909b' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#C49800' },
  step: { fontSize: 11, fontWeight: '800', color: '#C49800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 4 },
  content: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  scroll: { padding: 20, paddingBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#3A6550', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 14, fontSize: 15, color: '#0A1C14', marginBottom: 14 },
  inputError: { borderColor: '#E53E3E', marginBottom: 4 },
  errorText: { fontSize: 11, color: '#E53E3E', fontWeight: '600', marginBottom: 12, marginTop: 0 },
  select: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  selectText: { fontSize: 15, color: '#0A1C14', flex: 1 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#D0E8DA' },
  strengthLabel: { fontSize: 11, fontWeight: '700', width: 38, textAlign: 'right' },
  senhaHint: { fontSize: 11, color: '#DD6B20', fontWeight: '500' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff: { backgroundColor: '#AECEBE' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: 'rgba(196,152,0,0.70)', borderRadius: 20, width: '85%', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },
  modalClose: { fontSize: 20, color: '#fff' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  modalItemSigla: { fontSize: 13, fontWeight: '800', color: '#fff', width: 30 },
  modalItemLabel: { fontSize: 15, color: '#fff', flex: 1, textAlign: 'center' },
  searchInput: {
    margin: 10, padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff', fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
})
