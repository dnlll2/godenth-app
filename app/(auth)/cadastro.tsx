import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useFonts, Orbitron_700Bold, Orbitron_900Black } from '@expo-google-fonts/orbitron'

const { width, height } = Dimensions.get('window')

const PROFISSOES = [
  { key: 'dentista', label: '🦷 Dentista / Especialista', desc: 'Clínico geral, ortodontista, implantodontista...' },
  { key: 'protetico', label: '🔬 Técnico em Prótese', desc: 'Prótese dentária, CAD/CAM, cerâmica...' },
  { key: 'clinica', label: '🏥 Clínica / Consultório', desc: 'Proprietário ou gestor de clínica' },
  { key: 'laboratorio', label: '🏭 Laboratório', desc: 'Laboratório de prótese ou análises' },
  { key: 'estudante', label: '📚 Estudante', desc: 'Graduação ou pós-graduação em odontologia' },
  { key: 'fornecedor', label: '📦 Fornecedor / Indústria', desc: 'Materiais, equipamentos, tecnologia' },
  { key: 'gestao', label: '⚙️ Gestão / Administração', desc: 'Administração de clínicas e consultórios' },
  { key: 'marketing', label: '📢 Marketing', desc: 'Marketing odontológico e comunicação' },
]

export default function Cadastro() {
  const [showSplash, setShowSplash] = useState(true)
  const [profissao, setProfissao] = useState('')
  
  const [fontsLoaded] = useFonts({ Orbitron_700Bold, Orbitron_900Black })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.6)).current
  const glowAnim = useRef(new Animated.Value(0)).current
  const taglineAnim = useRef(new Animated.Value(0)).current
  const splashFade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!fontsLoaded) return

    // Logo entra devagar
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 30, friction: 10, useNativeDriver: true }),
      ]),
      // Tagline aparece depois
      Animated.timing(taglineAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start()

    // Sai após 4s
    setTimeout(() => {
      Animated.timing(splashFade, { toValue: 0, duration: 800, useNativeDriver: true }).start(() => {
        setShowSplash(false)
      })
    }, 4000)
  }, [fontsLoaded])

  if (showSplash || !fontsLoaded) {
    return (
      <Animated.View style={[styles.splash, { opacity: splashFade }]}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <Text style={styles.splashLogo}>
            <Text style={{ color: '#F5C800' }}>Go</Text>
            <Text style={{ color: '#ffffff' }}>Denth</Text>
          </Text>
          <View style={styles.splashDivider} />
          <Animated.Text style={[styles.splashTagline, { opacity: taglineAnim }]}>
            Conecte · Encontre · Cresça
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    )
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

      <View style={styles.progress}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
      </View>

      <View style={styles.body}>
        <Text style={styles.step}>Passo 1 de 3</Text>
        <Text style={styles.title}>Qual é a sua{'\n'}profissão?</Text>
        <Text style={styles.sub}>Isso personaliza sua experiência no GoDenth</Text>

        <View style={styles.list}>
          {PROFISSOES.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.option, profissao === p.key && styles.optionOn]}
              onPress={() => setProfissao(p.key)}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionIcon}>{p.label.split(' ')[0]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, profissao === p.key && styles.optionLabelOn]}>
                    {p.label.substring(p.label.indexOf(' ') + 1)}
                  </Text>
                  <Text style={styles.optionDesc}>{p.desc}</Text>
                </View>
              </View>
              {profissao === p.key && (
                <View style={styles.check}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !profissao && styles.btnDisabled]}
          disabled={!profissao}
          onPress={() => router.push({ pathname: '/(auth)/cadastro2', params: { profissao } })}
        >
          <Text style={styles.btnT}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#007A6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    fontSize: 56,
    fontFamily: 'Orbitron_900Black',
    letterSpacing: 2,
  },
  splashDivider: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    marginVertical: 16,
  },
  splashTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 3,
  },
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E',
  },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontWeight: '800' },
  progress: { flexDirection: 'row', gap: 6, padding: 16, backgroundColor: '#007A6E' },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressActive: { backgroundColor: '#F5C800' },
  body: { flex: 1, padding: 20 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 14, color: '#7A9E8E', marginBottom: 20 },
  list: { gap: 10 },
  option: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: '#D0E8DA',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  optionOn: { borderColor: '#00A880', backgroundColor: 'rgba(0,168,128,0.05)' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  optionIcon: { fontSize: 24 },
  optionLabel: { fontSize: 14, fontWeight: '700', color: '#0A1C14', marginBottom: 2 },
  optionLabelOn: { color: '#00A880' },
  optionDesc: { fontSize: 11, color: '#7A9E8E' },
  check: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#00A880', justifyContent: 'center', alignItems: 'center',
  },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#AECEBE' },
  btnT: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
