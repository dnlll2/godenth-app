import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Modal, FlatList } from 'react-native'
import { router } from 'expo-router'

const CATEGORIAS = [
  { key: 'clinico', label: 'Clínico e Profissional Técnico', cor: '#00A880', profissoes: ['Cirurgião-Dentista','Técnico em Prótese Dentária'] },
  { key: 'tecnico', label: 'Técnicos e Auxiliares', cor: '#1A6FD4', profissoes: ['Técnico em Saúde Bucal (TSB)','Auxiliar em Saúde Bucal (ASB)','Auxiliar de Prótese Dentária'] },
  { key: 'comercial', label: 'Comercial', cor: '#C49800', profissoes: ['Gerente Comercial','Representante Comercial','Recepcionista / Secretária','CRC / Call Center','Consultor de Vendas'] },
  { key: 'administrativo', label: 'Administrativo', cor: '#7B3FC4', profissoes: ['Gerente Administrativo','Auxiliar Administrativo','Financeiro','RH / Recursos Humanos','Contabilidade','TI / Tecnologia'] },
  { key: 'marketing', label: 'Marketing e Criação', cor: '#D4186A', profissoes: ['Marketing Digital','Designer Gráfico / UI','Filmmaker / Videomaker','Fotógrafo','Social Media','Gestor de Tráfego','Copywriter'] },
  { key: 'formacao', label: 'Formação', cor: '#0891B2', profissoes: ['Estudante de Odontologia','Estudante de Prótese Dentária','Estudante de Administração','Estudante de Marketing'] },
]

export default function Cadastro() {
  const [showSplash, setShowSplash] = useState(true)
  const [profissao, setProfissao] = useState<any>(null)
  const [extras, setExtras] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [catSelecionada, setCatSelecionada] = useState<any>(null)
  const [fase, setFase] = useState<'principal' | 'mais_cargos'>('principal')

  const splashFade = useRef(new Animated.Value(1)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const pageAnim = useRef(new Animated.Value(0)).current
  const faseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start()

    setTimeout(() => {
      Animated.timing(splashFade, { toValue: 0, duration: 700, useNativeDriver: true }).start(() => {
        setShowSplash(false)
        Animated.timing(pageAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
      })
    }, 3500)
  }, [])

  const abrirCategoria = (cat: any) => {
    setCatSelecionada(cat)
  }

  const voltarNivel1 = () => {
    setCatSelecionada(null)
  }

  const selecionarProfissao = (prof: string) => {
    const nova = { label: prof, categoria: catSelecionada.label, cor: catSelecionada.cor }
    if (fase === 'principal') {
      setProfissao(nova)
    } else {
      setExtras(prev => [...prev.filter(e => e.label !== prof), nova])
    }
    setModalVisible(false)
    setCatSelecionada(null)
  }

  const irParaMaisCargos = () => {
    Animated.timing(faseAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
      setFase('mais_cargos')
      Animated.timing(faseAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
    })
  }

  if (showSplash) {
    return (
      <Animated.View style={[styles.splash, { opacity: splashFade }]}>
        <Animated.View style={{ alignItems: 'center', opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Text style={styles.splashLogo}>
            <Text style={{ color: '#F5C800' }}>Go</Text>
            <Text style={{ color: '#fff' }}>Denth</Text>
          </Text>
        </Animated.View>
        <Animated.View style={{ alignItems: 'center', opacity: taglineOpacity, marginTop: 24 }}>
          <View style={styles.splashLine} />
          <Text style={styles.splashTagline}>Conecte · Encontre · Cresça</Text>
          <View style={styles.splashLine} />
        </Animated.View>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: '#EEF7F2' }, { opacity: pageAnim }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (fase === 'mais_cargos') {
            Animated.timing(faseAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
              setFase('principal')
              Animated.timing(faseAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
            })
          } else {
            router.back()
          }
        }}>
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
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </View>

      <Animated.View style={{ flex: 1, opacity: faseAnim }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.step}>Passo 1 de 4</Text>

          {fase === 'principal' ? (
            <>
              <Text style={styles.title}>Qual é a sua{'\n'}profissão principal?</Text>
              <Text style={styles.sub}>Selecione a profissão que melhor te define</Text>

              <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
                {profissao ? (
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropdownCat, { color: profissao.cor }]}>{profissao.categoria}</Text>
                    <Text style={styles.dropdownSelected}>{profissao.label}</Text>
                  </View>
                ) : (
                  <Text style={styles.dropdownPlaceholder}>Toque para selecionar...</Text>
                )}
                <Text style={styles.dropdownArrow}>˅</Text>
              </TouchableOpacity>

              {profissao && (
                <View style={[styles.selectedCard, { borderColor: profissao.cor }]}>
                  <View style={[styles.selectedDot, { backgroundColor: profissao.cor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedLabel}>{profissao.label}</Text>
                    <Text style={[styles.selectedCat, { color: profissao.cor }]}>{profissao.categoria}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setProfissao(null)}>
                    <Text style={styles.selectedRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.title}>Você tem mais{'\n'}algum cargo?</Text>
              <Text style={styles.sub}>Ex: dentista e gerente, representante e social media...</Text>

              {extras.map((e, i) => (
                <View key={i} style={[styles.selectedCard, { borderColor: e.cor, marginBottom: 10 }]}>
                  <View style={[styles.selectedDot, { backgroundColor: e.cor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedLabel}>{e.label}</Text>
                    <Text style={[styles.selectedCat, { color: e.cor }]}>{e.categoria}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setExtras(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={styles.selectedRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.addBtnT}>+ Adicionar cargo</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        {fase === 'principal' ? (
          <TouchableOpacity
            style={[styles.btn, !profissao && styles.btnOff]}
            disabled={!profissao}
            onPress={irParaMaisCargos}
          >
            <Text style={styles.btnT}>{profissao ? 'Continuar →' : 'Selecione sua profissão'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#EEF7F2', borderWidth: 2, borderColor: '#007A6E' }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={[styles.btnT, { color: '#007A6E' }]}>+ Sim, adicionar cargo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.push({ pathname: '/(auth)/especialidades', params: { profissao: JSON.stringify(profissao), extras: JSON.stringify(extras) } })}
            >
              <Text style={styles.btnT}>Não, continuar →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); setCatSelecionada(null) }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {!catSelecionada ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecione a área</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={CATEGORIAS}
                  keyExtractor={item => item.key}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.catItem} onPress={() => abrirCategoria(item)}>
                      <View style={[styles.catDot, { backgroundColor: item.cor }]} />
                      <Text style={styles.catLabel}>{item.label}</Text>
                      <Text style={styles.catArrow}>›</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={voltarNivel1}>
                    <Text style={[styles.modalBackText, { color: catSelecionada.cor }]}>← Voltar</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{catSelecionada.label}</Text>
                  <TouchableOpacity onPress={() => { setModalVisible(false); setCatSelecionada(null) }}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={catSelecionada.profissoes}
                  keyExtractor={item => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.profItem, profissao?.label === item && { backgroundColor: catSelecionada.cor + '10' }]}
                      onPress={() => selecionarProfissao(item)}
                    >
                      <Text style={[styles.profLabel, profissao?.label === item && { color: catSelecionada.cor, fontWeight: '800' }]}>{item}</Text>
                      {profissao?.label === item && <Text style={{ color: catSelecionada.cor, fontWeight: '900' }}>✓</Text>}
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#007A6E', justifyContent: 'center', alignItems: 'center' },
  splashLogo: { fontSize: 64, fontWeight: '900', letterSpacing: 4 },
  splashLine: { width: 50, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, marginVertical: 12 },
  splashTagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontWeight: '800' },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007A6E' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#F5C800' },
  scroll: { padding: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 24 },
  dropdown: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#D0E8DA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownPlaceholder: { fontSize: 15, color: '#AECEBE', flex: 1 },
  dropdownSelected: { fontSize: 16, fontWeight: '800', color: '#0A1C14' },
  dropdownCat: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  dropdownArrow: { fontSize: 22, color: '#7A9E8E' },
  selectedCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  selectedDot: { width: 10, height: 10, borderRadius: 5 },
  selectedLabel: { fontSize: 14, fontWeight: '800', color: '#0A1C14' },
  selectedCat: { fontSize: 11, marginTop: 2, fontWeight: '700' },
  selectedRemove: { fontSize: 16, color: '#7A9E8E', padding: 4 },
  addBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#D0E8DA', borderStyle: 'dashed', alignItems: 'center', marginTop: 12 },
  addBtnT: { fontSize: 14, fontWeight: '700', color: '#00A880' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff: { backgroundColor: '#AECEBE' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#0A1C14', flex: 1, textAlign: 'center' },
  modalClose: { fontSize: 20, color: '#7A9E8E', padding: 4 },
  modalBackText: { fontSize: 14, fontWeight: '700' },
  catItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  catLabel: { fontSize: 15, fontWeight: '600', color: '#0A1C14', flex: 1 },
  catArrow: { fontSize: 20, color: '#7A9E8E' },
  profItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' },
  profLabel: { fontSize: 15, color: '#0A1C14', flex: 1 },
})
