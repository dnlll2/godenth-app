import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Modal, FlatList, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

const CATEGORIAS = [
  { key: 'clinico', label: 'Clínico e Profissional Técnico', cor: '#00A880', profissoes: ['Cirurgião-Dentista','Técnico em Prótese Dentária'] },
  { key: 'tecnico', label: 'Técnicos e Auxiliares', cor: '#1A6FD4', profissoes: ['Técnico em Saúde Bucal (TSB)','Auxiliar em Saúde Bucal (ASB)','Auxiliar de Prótese Dentária'] },
  { key: 'comercial', label: 'Comercial', cor: '#C49800', profissoes: ['Gerente Comercial','Representante Comercial','Recepcionista / Secretária','CRC / Call Center','Consultor de Vendas'] },
  { key: 'administrativo', label: 'Administrativo', cor: '#7B3FC4', profissoes: ['Gerente Administrativo','Auxiliar Administrativo','Financeiro','RH / Recursos Humanos','Contabilidade','TI / Tecnologia'] },
  { key: 'marketing', label: 'Marketing e Criação', cor: '#D4186A', profissoes: ['Marketing Digital','Designer Gráfico / UI','Filmmaker / Videomaker','Fotógrafo','Social Media','Gestor de Tráfego','Copywriter'] },
  { key: 'formacao', label: 'Formação', cor: '#0891B2', profissoes: ['Estudante de Odontologia','Estudante de Prótese Dentária','Estudante de Administração','Estudante de Marketing'] },
]

// Espaço ocupado pela pergunta + subtítulo na posição final (~2 linhas título + subtítulo + gap)
const QUESTION_BLOCK_HEIGHT = 170

export default function Cadastro() {
  const { height } = useWindowDimensions()
  const { setCadastroData } = useAuthStore()

  const [showSplash, setShowSplash] = useState(true)
  const [profissao, setProfissao] = useState<any>(null)
  const [extras, setExtras] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [catSelecionada, setCatSelecionada] = useState<any>(null)
  const [fase, setFase] = useState<'principal' | 'mais_cargos'>('principal')

  // ── Splash ──
  const splashFade = useRef(new Animated.Value(1)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const pageAnim = useRef(new Animated.Value(0)).current
  const faseAnim = useRef(new Animated.Value(1)).current

  // ── Pergunta: fade in único (opacity só vai 0→1, nunca desce) ──
  const questionOpacity = useRef(new Animated.Value(0)).current
  // Começa deslocada para o centro visual da tela, vai para 0 (posição final no topo)
  const questionTranslateY = useRef(new Animated.Value(Math.round(height / 2 - 160))).current
  const questionSubOpacity = useRef(new Animated.Value(0)).current

  // ── Header + footer: somem durante fase 1 ──
  const contentOpacity = useRef(new Animated.Value(0)).current

  // ── Itens em cascata ──
  const itemAnims = useRef(
    CATEGORIAS.map(() => ({ opacity: new Animated.Value(0), translateY: new Animated.Value(30) }))
  ).current

  // ── Mais cargos ──
  const maisQuestionOpacity = useRef(new Animated.Value(0)).current
  const maisListOpacity = useRef(new Animated.Value(0)).current
  const maisListTranslateY = useRef(new Animated.Value(60)).current

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
        Animated.timing(pageAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(() => {
          // Fase 1: pergunta aparece com fade in no centro (opacity 0→1, translateY não muda)
          Animated.timing(questionOpacity, { toValue: 1, duration: 900, useNativeDriver: true }).start(() => {
            // Fase 2: pergunta sobe (translateY→0), subtítulo + header + itens aparecem
            // opacity da pergunta NÃO é animada aqui — fica em 1 para sempre
            Animated.parallel([
              Animated.spring(questionTranslateY, { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
              Animated.timing(questionSubOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.stagger(150, itemAnims.map(anim =>
                Animated.parallel([
                  Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                  Animated.spring(anim.translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
                ])
              )),
            ]).start()
          })
        })
      })
    }, 3500)
  }, [])

  const abrirCategoria = (cat: any) => setCatSelecionada(cat)
  const voltarNivel1 = () => setCatSelecionada(null)

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
      maisQuestionOpacity.setValue(0)
      maisListOpacity.setValue(0)
      maisListTranslateY.setValue(60)
      Animated.timing(faseAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start(() => {
        Animated.sequence([
          Animated.timing(maisQuestionOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(maisListOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(maisListTranslateY, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
          ]),
        ]).start()
      })
    })
  }

  const continuar = () => {
    setCadastroData({ profissao, extras })
    router.push('/(auth)/cadastro3')
  }

  if (showSplash) {
    return (
      <Animated.View style={[styles.splash, { opacity: splashFade }]}>
        <Animated.View style={{ alignItems: 'center', opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Text style={styles.splashLogo}>
            <Text style={{ color: '#C49800' }}>Go</Text>
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
    <Animated.View style={[{ flex: 1, backgroundColor: '#1c909b' }, { opacity: pageAnim }]}>

      {/* Header + progresso — invisíveis durante fase 1 */}
      <Animated.View style={{ opacity: contentOpacity }}>
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
            <Text style={{ color: '#C49800' }}>Go</Text>
            <Text style={{ color: '#fff' }}>Denth</Text>
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.progressRow}>
          <View style={[styles.bar, styles.barOn]} />
          <View style={[styles.bar, styles.barOn]} />
          {[3,4,5,6,7].map(i => <View key={i} style={styles.bar} />)}
        </View>
      </Animated.View>

      {/* Conteúdo com transição entre fases */}
      <Animated.View style={{ flex: 1, opacity: faseAnim }}>
        {fase === 'principal' ? (
          <View style={{ flex: 1 }}>

            {/* Pergunta: absolutamente posicionada, translateY leva do centro ao topo */}
            <Animated.View
              pointerEvents="none"
              style={[styles.questionAbs, {
                opacity: questionOpacity,
                transform: [{ translateY: questionTranslateY }],
              }]}
            >
              <Text style={styles.questionTitle}>
                Qual é a sua{'\n'}profissão principal?
              </Text>
              <Animated.Text style={[styles.questionSub, { opacity: questionSubOpacity }]}>
                Selecione a profissão que melhor te define
              </Animated.Text>
            </Animated.View>

            {/* Lista: paddingTop reserva espaço para a pergunta no topo */}
            <ScrollView
              contentContainerStyle={styles.scrollList}
              keyboardShouldPersistTaps="handled"
            >
              {CATEGORIAS.map((cat, i) => {
                const selected = profissao?.categoria === cat.label
                return (
                  <Animated.View
                    key={cat.key}
                    style={{ opacity: itemAnims[i].opacity, transform: [{ translateY: itemAnims[i].translateY }] }}
                  >
                    <TouchableOpacity
                      style={[styles.catRow, selected && styles.catRowSelected]}
                      onPress={() => { setCatSelecionada(cat); setModalVisible(true) }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.catDotSmall, { backgroundColor: cat.cor }]} />
                      <Text style={[styles.catRowLabel, selected && styles.catRowLabelSelected]}>
                        {cat.label}
                      </Text>
                      {selected
                        ? <Text style={styles.catRowCheck}>✓</Text>
                        : <Text style={styles.catRowArrow}>›</Text>
                      }
                    </TouchableOpacity>
                  </Animated.View>
                )
              })}

              {profissao && (
                <View style={styles.selectedBadge}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedBadgeProfissao}>{profissao.label}</Text>
                    <Text style={styles.selectedBadgeCat}>{profissao.categoria}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setProfissao(null)}>
                    <Text style={styles.selectedBadgeRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollPrincipal} keyboardShouldPersistTaps="handled">
            <Animated.Text style={[styles.questionTitle, { opacity: maisQuestionOpacity }]}>
              Você tem mais{'\n'}algum cargo?
            </Animated.Text>
            <Animated.Text style={[styles.questionSub, { opacity: maisQuestionOpacity }]}>
              Ex: dentista e gerente, representante e social media...
            </Animated.Text>

            <Animated.View style={{ opacity: maisListOpacity, transform: [{ translateY: maisListTranslateY }] }}>
              {extras.map((e, i) => (
                <View key={i} style={[styles.catRow, { borderColor: e.cor, backgroundColor: e.cor + '22', marginBottom: 10 }]}>
                  <View style={[styles.catDotSmall, { backgroundColor: e.cor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catRowLabel}>{e.label}</Text>
                    <Text style={styles.selectedBadgeCat}>{e.categoria}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setExtras(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={styles.selectedBadgeRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.catRow, { borderColor: 'rgba(255,255,255,0.3)', borderStyle: 'dashed' }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catRowLabel, { color: 'rgba(255,255,255,0.75)' }]}>+ Adicionar cargo</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        )}
      </Animated.View>

      {/* Footer — invisível durante fase 1 */}
      <Animated.View style={{ opacity: contentOpacity }}>
        <View style={styles.footerTeal}>
          {fase === 'principal' ? (
            <TouchableOpacity style={[styles.btn, !profissao && styles.btnOff]} disabled={!profissao} onPress={irParaMaisCargos}>
              <Text style={styles.btnT}>{profissao ? 'Continuar →' : 'Selecione sua profissão'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1c909b' }]} onPress={() => setModalVisible(true)}>
                <Text style={[styles.btnT, { color: '#1c909b' }]}>+ Sim, adicionar cargo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={continuar}>
                <Text style={styles.btnT}>Não, continuar →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); setCatSelecionada(null) }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {!catSelecionada ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecione a área</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
                </View>
                <FlatList data={CATEGORIAS} keyExtractor={item => item.key} renderItem={({ item }) => (
                  <TouchableOpacity style={styles.catItem} onPress={() => abrirCategoria(item)}>
                    <View style={[styles.catDot, { backgroundColor: item.cor }]} />
                    <Text style={styles.catLabel}>{item.label}</Text>
                    <Text style={styles.catArrow}>›</Text>
                  </TouchableOpacity>
                )} />
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={voltarNivel1}><Text style={[styles.modalBackText, { color: catSelecionada.cor }]}>← Voltar</Text></TouchableOpacity>
                  <Text style={styles.modalTitle}>{catSelecionada.label}</Text>
                  <TouchableOpacity onPress={() => { setModalVisible(false); setCatSelecionada(null) }}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
                </View>
                <FlatList data={catSelecionada.profissoes} keyExtractor={item => item} renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.profItem, profissao?.label === item && { backgroundColor: catSelecionada.cor + '10' }]} onPress={() => selecionarProfissao(item)}>
                    <Text style={[styles.profLabel, profissao?.label === item && { color: catSelecionada.cor, fontWeight: '800' }]}>{item}</Text>
                    {profissao?.label === item && <Text style={{ color: catSelecionada.cor, fontWeight: '900' }}>✓</Text>}
                  </TouchableOpacity>
                )} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // ── Splash ──
  splash: { flex: 1, backgroundColor: '#1c909b', justifyContent: 'center', alignItems: 'center' },
  splashLogo: { fontSize: 64, fontFamily: 'Poppins-ExtraBold', letterSpacing: 4 },
  splashLine: { width: 50, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, marginVertical: 12 },
  splashTagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 4 },

  // ── Header / progresso ──
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1c909b' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontFamily: 'Poppins-ExtraBold' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1c909b' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#C49800' },

  // ── Pergunta: posição absoluta, translateY vai do centro ao topo ──
  questionAbs: {
    position: 'absolute',
    top: 36,
    left: 24,
    right: 24,
    zIndex: 5,
  },
  questionTitle: { fontSize: 34, fontWeight: '800', color: '#fff', lineHeight: 42, marginBottom: 10 },
  questionSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 0 },

  // ── Lista: paddingTop reserva espaço para a pergunta fixada no topo ──
  scrollList: { paddingTop: QUESTION_BLOCK_HEIGHT, paddingHorizontal: 24, paddingBottom: 20 },

  // ── Mais cargos ──
  scrollPrincipal: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 120 },

  // ── Itens ──
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14,
    padding: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  catRowSelected: { borderColor: '#C49800', backgroundColor: 'rgba(196,152,0,0.12)' },
  catDotSmall: { width: 11, height: 11, borderRadius: 6 },
  catRowLabel: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '600' },
  catRowLabelSelected: { color: '#C49800', fontWeight: '800' },
  catRowArrow: { fontSize: 20, color: 'rgba(255,255,255,0.4)' },
  catRowCheck: { fontSize: 16, color: '#C49800', fontWeight: '900' },
  selectedBadge: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(196,152,0,0.15)', borderRadius: 14,
    padding: 16, borderWidth: 1.5, borderColor: '#C49800',
  },
  selectedBadgeProfissao: { fontSize: 15, fontWeight: '800', color: '#C49800' },
  selectedBadgeCat: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  selectedBadgeRemove: { fontSize: 18, color: 'rgba(255,255,255,0.5)', padding: 4 },

  // ── Footer ──
  footerTeal: { padding: 16 },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff: { backgroundColor: 'rgba(255,255,255,0.25)' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // ── Modal ──
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
