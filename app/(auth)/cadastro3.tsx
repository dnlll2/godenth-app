import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, FlatList, Animated } from 'react-native'
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

  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleTranslateY = useRef(new Animated.Value(24)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const contentTranslateY = useRef(new Animated.Value(20)).current

  const fieldAnims = useRef(
    Array.from({ length: 5 }, () => ({
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

  const fields = [
    {
      label: 'Nome completo *',
      node: (
        <TextInput
          style={styles.input}
          placeholder="Seu nome completo"
          placeholderTextColor="#AECEBE"
          value={nome}
          onChangeText={setNome}
        />
      ),
    },
    {
      label: 'E-mail *',
      node: (
        <TextInput
          style={styles.input}
          placeholder="seu@email.com.br"
          placeholderTextColor="#AECEBE"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      ),
    },
    {
      label: 'Senha *',
      node: (
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#AECEBE"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
      ),
    },
    {
      label: 'Estado',
      node: (
        <TouchableOpacity style={styles.select} onPress={() => setModalEstado(true)}>
          <Text style={[styles.selectText, !estado && { color: '#AECEBE' }]}>{estado ? estado.sigla + ' — ' + estado.nome : 'Selecione o estado...'}</Text>
          <Text style={{ color: '#7A9E8E', fontSize: 18 }}>˅</Text>
        </TouchableOpacity>
      ),
    },
    {
      label: 'Cidade',
      node: (
        <TouchableOpacity style={[styles.select, !estado && { opacity: 0.5 }]} onPress={() => estado && setModalCidade(true)} disabled={!estado}>
          {loadingCidades ? <ActivityIndicator size="small" color="#00A880" /> : (
            <Text style={[styles.selectText, !cidade && { color: '#AECEBE' }]}>{cidade ? cidade.nome : estado ? 'Selecione a cidade...' : 'Selecione o estado primeiro'}</Text>
          )}
          <Text style={{ color: '#7A9E8E', fontSize: 18 }}>˅</Text>
        </TouchableOpacity>
      ),
    },
  ]

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
          {fields.map((field, idx) => (
            <Animated.View
              key={idx}
              style={{ opacity: fieldAnims[idx].opacity, transform: [{ translateY: fieldAnims[idx].translateY }] }}
            >
              <Text style={styles.label}>{field.label}</Text>
              {field.node}
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, (!nome || !email || !senha || senha.length < 6) && styles.btnOff]}
            disabled={!nome || !email || !senha || senha.length < 6}
            onPress={handleContinuar}
          >
            <Text style={styles.btnT}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal visible={modalEstado} animationType="fade" transparent onRequestClose={() => setModalEstado(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Estado</Text>
              <TouchableOpacity onPress={() => setModalEstado(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
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

      <Modal visible={modalCidade} animationType="fade" transparent onRequestClose={() => setModalCidade(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Cidade</Text>
              <TouchableOpacity onPress={() => setModalCidade(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <FlatList
              data={cidades}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setCidade(item); setModalCidade(false) }}
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
  select: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  selectText: { fontSize: 15, color: '#0A1C14', flex: 1 },
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
})
