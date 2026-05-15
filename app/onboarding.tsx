import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, Dimensions,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    titulo: 'Bem-vindo ao GoDenth',
    sub: 'O network profissional feito para a odontologia brasileira.',
    acent: '#007A6E',
    rings: ['#007A6E33', '#007A6E1A', '#007A6E0A'],
  },
  {
    titulo: 'Conecte-se',
    sub: 'Encontre dentistas, técnicos, clínicas e profissionais da área na sua região.',
    acent: '#00A880',
    rings: ['#00A88033', '#00A8801A', '#00A8800A'],
  },
  {
    titulo: 'Mostre seu trabalho',
    sub: 'Portfólio, serviços e experiência no seu perfil profissional.',
    acent: '#C49800',
    rings: ['#C4980033', '#C498001A', '#C498000A'],
  },
  {
    titulo: 'Encontre oportunidades',
    sub: 'Vagas, parcerias e muito mais para impulsionar sua carreira.',
    acent: '#007A6E',
    rings: ['#007A6E33', '#007A6E1A', '#007A6E0A'],
  },
]

// Ícone 1: dente — coroa arredondada + duas raízes
function ToothIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 60, height: 68, alignItems: 'center' }}>
      <View style={[ti.crown, { shadowColor: color }]} />
      <View style={ti.roots}>
        <View style={ti.rootL} />
        <View style={{ width: 8 }} />
        <View style={ti.rootR} />
      </View>
    </View>
  )
}
const ti = StyleSheet.create({
  crown: { width: 56, height: 34, backgroundColor: '#fff', borderRadius: 16, marginBottom: 4 },
  roots: { flexDirection: 'row', alignItems: 'flex-start' },
  rootL: { width: 20, height: 28, backgroundColor: '#fff', borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 14, borderBottomRightRadius: 8 },
  rootR: { width: 20, height: 28, backgroundColor: '#fff', borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 8, borderBottomRightRadius: 14 },
})

// Ícone 2: rede — 3 nós em triângulo + linhas conectoras
function NetworkIcon() {
  const dot = 18
  return (
    <View style={{ width: 72, height: 66, position: 'relative' }}>
      {/* Linhas */}
      <View style={[ni.line, { top: 20, left: 15, width: 42, transform: [{ rotate: '0deg' }] }]} />
      <View style={[ni.line, { top: 9, left: 11, width: 34, transform: [{ rotate: '58deg' }] }]} />
      <View style={[ni.line, { top: 9, right: 11, width: 34, transform: [{ rotate: '-58deg' }] }]} />
      {/* Nós */}
      <View style={[ni.dot, { top: 0, left: '50%', marginLeft: -dot / 2 }]} />
      <View style={[ni.dot, { bottom: 0, left: 0 }]} />
      <View style={[ni.dot, { bottom: 0, right: 0 }]} />
    </View>
  )
}
const ni = StyleSheet.create({
  dot: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  line: { position: 'absolute', height: 2, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 1 },
})

// Ícone 3: portfólio — cartão com linhas de conteúdo + estrela
function PortfolioIcon() {
  return (
    <View style={pi.card}>
      <View style={[pi.line, { width: '90%' }]} />
      <View style={[pi.line, { width: '70%' }]} />
      <View style={pi.divider} />
      <View style={[pi.line, { width: '80%' }]} />
      <View style={[pi.line, { width: '55%' }]} />
      {/* Estrela badge */}
      <View style={pi.badge}>
        <StarShape />
      </View>
    </View>
  )
}
function StarShape() {
  const s = 10
  return (
    <View style={{ width: s * 2, height: s * 2, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: s * 2, height: s * 0.7, backgroundColor: '#C49800', borderRadius: 2 }} />
      <View style={{ position: 'absolute', width: s * 0.7, height: s * 2, backgroundColor: '#C49800', borderRadius: 2 }} />
      <View style={{ position: 'absolute', width: s * 2, height: s * 0.7, backgroundColor: '#C49800', borderRadius: 2, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: s * 0.7, height: s * 2, backgroundColor: '#C49800', borderRadius: 2, transform: [{ rotate: '45deg' }] }} />
    </View>
  )
}
const pi = StyleSheet.create({
  card: { width: 64, height: 76, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, borderWidth: 2, borderColor: '#fff', padding: 10, justifyContent: 'center', gap: 6 },
  line: { height: 3, backgroundColor: '#fff', borderRadius: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 2 },
  badge: { position: 'absolute', top: -12, right: -12, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
})

// Ícone 4: crescimento — seta para cima com base
function GrowthIcon() {
  return (
    <View style={{ alignItems: 'center', width: 52, height: 72 }}>
      {/* Triângulo (seta) */}
      <View style={gi.arrowHead} />
      {/* Haste */}
      <View style={gi.stem} />
      {/* Base */}
      <View style={gi.base} />
      {/* Linhas de velocidade */}
      <View style={[gi.speed, { top: 18, left: -18, width: 14 }]} />
      <View style={[gi.speed, { top: 28, left: -22, width: 10 }]} />
      <View style={[gi.speed, { top: 18, right: -18, width: 14 }]} />
      <View style={[gi.speed, { top: 28, right: -22, width: 10 }]} />
    </View>
  )
}
const gi = StyleSheet.create({
  arrowHead: { width: 0, height: 0, borderLeftWidth: 20, borderLeftColor: 'transparent', borderRightWidth: 20, borderRightColor: 'transparent', borderBottomWidth: 32, borderBottomColor: '#fff' },
  stem: { width: 14, height: 26, backgroundColor: '#fff', marginTop: -2 },
  base: { width: 40, height: 6, backgroundColor: '#fff', borderRadius: 3 },
  speed: { position: 'absolute', height: 2.5, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 2 },
})

const ICONS = [ToothIcon, NetworkIcon, PortfolioIcon, GrowthIcon]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current

  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1
  const Icon = ICONS[current]

  const animateTransition = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(nextIndex)
      slideAnim.setValue(24)
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start()
    })
  }

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      animateTransition(current + 1)
    } else {
      finish()
    }
  }

  const finish = async () => {
    await AsyncStorage.setItem('godenth_onboarding_seen', '1')
    router.replace('/(tabs)/feed')
  }

  return (
    <LinearGradient colors={['#071410', '#0A1C14', '#0D2318']} style={s.root}>
      <StatusBar style="light" />

      {/* Círculos decorativos fixos de fundo */}
      <View style={s.decoWrap} pointerEvents="none">
        <View style={[s.circle, s.circleXL]} />
        <View style={[s.circle, s.circleLG]} />
        <View style={[s.circle, s.circleSM]} />
        <View style={[s.blob, { top: -60, right: -80, backgroundColor: '#007A6E0C' }]} />
        <View style={[s.blob, { bottom: 80, left: -60, backgroundColor: '#C498000A' }]} />
      </View>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}><Text style={s.go}>Go</Text><Text style={s.denth}>Denth</Text></Text>
        {!isLast && (
          <TouchableOpacity onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.skip}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Conteúdo animado */}
      <Animated.View style={[s.center, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Anéis decorativos reativos ao slide */}
        <View style={[s.ring3, { borderColor: slide.rings[2] }]} />
        <View style={[s.ring2, { borderColor: slide.rings[1] }]} />
        <View style={[s.ring1, { borderColor: slide.rings[0] }]} />

        {/* Ícone */}
        <View style={[s.iconWrap, { backgroundColor: slide.acent }]}>
          <Icon color={slide.acent} />
        </View>

        <Text style={s.titulo}>{slide.titulo}</Text>
        <Text style={s.sub}>{slide.sub}</Text>
        <View style={[s.bar, { backgroundColor: slide.acent }]} />
      </Animated.View>

      {/* Rodapé fixo */}
      <View style={s.footer}>
        <View style={s.dots}>
          {SLIDES.map((sl, i) => (
            <Dot key={i} active={i === current} color={sl.acent} />
          ))}
        </View>
        <Text style={s.counter}>{current + 1} / {SLIDES.length}</Text>
        <TouchableOpacity
          style={[s.btn, isLast ? s.btnGold : s.btnGreen]}
          onPress={goNext}
          activeOpacity={0.82}
        >
          <Text style={[s.btnT, isLast && s.btnTDark]}>
            {isLast ? 'Começar →' : 'Próximo →'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

function Dot({ active, color }: { active: boolean; color: string }) {
  const widthAnim = useRef(new Animated.Value(active ? 24 : 8)).current
  const opacityAnim = useRef(new Animated.Value(active ? 1 : 0.3)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, { toValue: active ? 24 : 8, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: active ? 1 : 0.3, duration: 200, useNativeDriver: false }),
    ]).start()
  }, [active])

  return (
    <Animated.View style={{ width: widthAnim, height: 8, borderRadius: 4, backgroundColor: color, opacity: opacityAnim, marginHorizontal: 3 }} />
  )
}

const CONTENT_MAX = 480

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === 'ios' ? 52 : 32 },

  decoWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', borderRadius: 9999, borderWidth: 1 },
  circleXL: { width: 520, height: 520, borderColor: '#007A6E0E' },
  circleLG: { width: 380, height: 380, borderColor: '#007A6E18' },
  circleSM: { width: 260, height: 260, borderColor: '#007A6E22' },
  blob: { position: 'absolute', width: 240, height: 240, borderRadius: 120 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingBottom: 12 },
  logo: { fontSize: 22, fontWeight: '900' },
  go: { color: '#00A880' },
  denth: { color: '#FFFFFF' },
  skip: { fontSize: 14, color: '#3A6550', fontWeight: '600' },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, maxWidth: CONTENT_MAX,
    alignSelf: 'center', width: '100%',
  },

  ring3: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1 },
  ring2: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1 },
  ring1: { position: 'absolute', width: 155, height: 155, borderRadius: 78, borderWidth: 1 },

  iconWrap: {
    width: 116, height: 116, borderRadius: 58,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
    shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  titulo: {
    fontSize: 30, fontWeight: '900', color: '#FFFFFF',
    textAlign: 'center', marginBottom: 16, lineHeight: 38,
    fontFamily: 'Poppins-ExtraBold',
  },
  sub: { fontSize: 16, color: '#7AA88A', textAlign: 'center', lineHeight: 26, fontWeight: '500', maxWidth: 340 },
  bar: { width: 40, height: 3, borderRadius: 2, marginTop: 28, opacity: 0.7 },

  footer: {
    paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36,
    alignItems: 'center', maxWidth: CONTENT_MAX, alignSelf: 'center', width: '100%',
  },
  dots: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  counter: { fontSize: 12, color: '#3A6550', fontWeight: '600', marginBottom: 20, letterSpacing: 1 },
  btn: { width: '100%', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  btnGreen: { backgroundColor: '#007A6E' },
  btnGold: { backgroundColor: '#C49800' },
  btnT: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  btnTDark: { color: '#0A1C14' },
})
