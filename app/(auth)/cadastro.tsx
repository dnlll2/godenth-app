import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native'
import { router } from 'expo-router'
import { Svg, Path, Circle, Rect } from 'react-native-svg'

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

const CATEGORIAS = [
  {
    key: 'clinico', label: 'Clínico e Profissional Técnico', cor: '#00A880',
    profissoes: ['Cirurgião-Dentista','Ortodontista','Implantodontista','Endodontista','Periodontista','Odontopediatra','Cirurgião Bucomaxilofacial','Técnico em Prótese Dentária'],
  },
  {
    key: 'tecnico', label: 'Técnicos e Auxiliares', cor: '#1A6FD4',
    profissoes: ['Técnico em Saúde Bucal (TSB)','Auxiliar em Saúde Bucal (ASB)','Auxiliar de Prótese Dentária','Técnico em Radiologia'],
  },
  {
    key: 'comercial', label: 'Comercial', cor: '#C49800',
    profissoes: ['Gerente Comercial','Representante Comercial','Recepcionista / Secretária','CRC / Call Center','Consultor de Vendas'],
  },
  {
    key: 'administrativo', label: 'Administrativo', cor: '#7B3FC4',
    profissoes: ['Gerente Administrativo','Auxiliar Administrativo','Financeiro','RH / Recursos Humanos','Contabilidade','TI / Tecnologia'],
  },
  {
    key: 'marketing', label: 'Marketing e Criação', cor: '#D4186A',
    profissoes: ['Marketing Digital','Designer Gráfico / UI','Filmmaker / Videomaker','Fotógrafo','Social Media','Gestor de Tráfego','Copywriter'],
  },
  {
    key: 'formacao', label: 'Formação', cor: '#0891B2',
    profissoes: ['Estudante de Odontologia','Estudante de Prótese Dentária','Estudante de Administração','Estudante de Marketing'],
  },
]

export default function Cadastro() {
  const [showSplash, setShowSplash] = useState(true)
  const [aberto, setAberto] = useState<string | null>(null)
  const [selecionadas, setSelecionadas] = useState<string[]>([])

  const splashFade = useRef(new Animated.Value(1)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const pageAnim = useRef(new Animated.Value(0)).current

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

  const toggleAberto = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setAberto(prev => prev === key ? null : key)
  }

  const toggleProfissao = (prof: string) => {
    setSelecionadas(prev =>
      prev.includes(prof) ? prev.filter(p => p !== prof) : [...prev, prof]
    )
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
    <Animated.View style={[{ flex: 1 }, { opacity: pageAnim }]}>
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
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 1 de 4</Text>
        <Text style={styles.title}>Qual é a sua{'\n'}área de atuação?</Text>
        <Text style={styles.sub}>Toque para expandir e selecionar sua profissão</Text>

        <View style={styles.accordion}>
          {CATEGORIAS.map(cat => {
            const isOpen = aberto === cat.key
            return (
              <View key={cat.key} style={[styles.acordCard, isOpen && { borderColor: cat.cor }]}>
                <TouchableOpacity style={styles.acordHeader} onPress={() => toggleAberto(cat.key)}>
                  <Text style={[styles.acordLabel, isOpen && { color: cat.cor }]}>{cat.label}</Text>
                  <Text style={[styles.acordArrow, isOpen && { color: cat.cor }]}>{isOpen ? '˅' : '›'}</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.acordBody}>
                    <View style={[styles.acordDivider, { backgroundColor: cat.cor + '30' }]} />
                    {cat.profissoes.map(prof => {
                      const on = selecionadas.includes(prof)
                      return (
                        <TouchableOpacity
                          key={prof}
                          style={styles.profItem}
                          onPress={() => toggleProfissao(prof)}
                        >
                          <View style={[styles.profCheck, on && { backgroundColor: cat.cor, borderColor: cat.cor }]}>
                            {on && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                          </View>
                          <Text style={[styles.profLabel, on && { color: cat.cor, fontWeight: '700' }]}>{prof}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, selecionadas.length === 0 && styles.btnOff]}
          disabled={selecionadas.length === 0}
          onPress={() => router.push({
            pathname: '/(auth)/cadastro3',
            params: { profissoes: JSON.stringify(selecionadas) }
          })}
        >
          <Text style={styles.btnT}>
            {selecionadas.length > 0
              ? `Continuar com ${selecionadas.length} cargo${selecionadas.length > 1 ? 's' : ''} →`
              : 'Selecione ao menos uma profissão'}
          </Text>
        </TouchableOpacity>
      </View>
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
  scroll: { padding: 16, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 20 },
  accordion: { gap: 10 },
  acordCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 2, borderColor: '#D0E8DA', overflow: 'hidden' },
  acordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  acordLabel: { fontSize: 15, fontWeight: '700', color: '#0A1C14', flex: 1 },
  acordArrow: { fontSize: 20, color: '#7A9E8E', fontWeight: '700' },
  acordDivider: { height: 1, marginHorizontal: 16, marginBottom: 8 },
  acordBody: { paddingBottom: 8 },
  profItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  profCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D0E8DA', justifyContent: 'center', alignItems: 'center' },
  profLabel: { fontSize: 14, color: '#3A6550', flex: 1 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff: { backgroundColor: '#AECEBE' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
