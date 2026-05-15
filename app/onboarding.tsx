import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, Dimensions,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

const SLIDES = [
  {
    icon: '🦷',
    titulo: 'Bem-vindo ao GoDenth',
    sub: 'O network profissional feito para a odontologia brasileira.',
    acent: '#00A880',
    circles: ['#00A88033', '#00A88018', '#00A88008'],
  },
  {
    icon: '🤝',
    titulo: 'Conecte-se',
    sub: 'Encontre dentistas, técnicos, clínicas e profissionais da área na sua região.',
    acent: '#1A6FD4',
    circles: ['#1A6FD433', '#1A6FD418', '#1A6FD408'],
  },
  {
    icon: '💼',
    titulo: 'Mostre seu trabalho',
    sub: 'Portfólio, serviços e experiência no seu perfil profissional.',
    acent: '#C49800',
    circles: ['#C4980033', '#C4980018', '#C4980008'],
  },
  {
    icon: '🚀',
    titulo: 'Encontre oportunidades',
    sub: 'Vagas, parcerias e muito mais para impulsionar sua carreira.',
    acent: '#00A880',
    circles: ['#00A88033', '#00A88018', '#00A88008'],
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current

  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

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
    <LinearGradient
      colors={['#071410', '#0A1C14', '#0D2318']}
      style={s.root}
    >
      <StatusBar style="light" />

      {/* Círculos decorativos de fundo — fixos */}
      <View style={s.decoWrap} pointerEvents="none">
        <View style={[s.circle, s.circleXL, { borderColor: '#00A88010' }]} />
        <View style={[s.circle, s.circleLG, { borderColor: '#00A88018' }]} />
        <View style={[s.circle, s.circleSM, { borderColor: '#00A88022' }]} />
        <View style={[s.circleBlob, { backgroundColor: '#00A8880C', top: -60, right: -80 }]} />
        <View style={[s.circleBlob, { backgroundColor: '#C498000A', bottom: 80, left: -60 }]} />
      </View>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>
          <Text style={s.go}>Go</Text>
          <Text style={s.denth}>Denth</Text>
        </Text>
        {!isLast && (
          <TouchableOpacity onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.skip}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Conteúdo central animado */}
      <Animated.View style={[s.center, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Círculos decorativos do slide (responsivos à cor do slide) */}
        <View style={[s.iconRing3, { borderColor: slide.circles[2] }]} />
        <View style={[s.iconRing2, { borderColor: slide.circles[1] }]} />
        <View style={[s.iconRing1, { borderColor: slide.circles[0], backgroundColor: slide.circles[2] }]} />

        <View style={[s.iconWrap, { backgroundColor: slide.acent + '1A', borderColor: slide.acent + '44' }]}>
          <Text style={s.icon}>{slide.icon}</Text>
        </View>

        <Text style={s.titulo}>{slide.titulo}</Text>
        <Text style={s.sub}>{slide.sub}</Text>

        {/* Linha decorativa sob o subtítulo */}
        <View style={[s.accentBar, { backgroundColor: slide.acent }]} />
      </Animated.View>

      {/* Rodapé fixo */}
      <View style={s.footer}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((sl, i) => (
            <Dot key={i} active={i === current} color={sl.acent} />
          ))}
        </View>

        {/* Contador */}
        <Text style={s.counter}>{current + 1} / {SLIDES.length}</Text>

        {/* Botão */}
        <TouchableOpacity
          style={[s.btn, isLast ? s.btnGold : s.btnGreen]}
          onPress={goNext}
          activeOpacity={0.82}
        >
          <Text style={[s.btnT, isLast && s.btnTDark]}>
            {isLast ? '🚀 Começar' : 'Próximo →'}
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
    <Animated.View
      style={{
        width: widthAnim,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: opacityAnim,
        marginHorizontal: 3,
      }}
    />
  )
}

const CONTENT_MAX = 480

const s = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
  },

  // Decoração de fundo
  decoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  circleXL: { width: 520, height: 520, borderColor: '#00A88010' },
  circleLG: { width: 380, height: 380, borderColor: '#00A88018' },
  circleSM: { width: 260, height: 260, borderColor: '#00A88022' },
  circleBlob: { position: 'absolute', width: 240, height: 240, borderRadius: 120 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 12,
  },
  logo: { fontSize: 22, fontWeight: '900' },
  go: { color: '#00A880' },
  denth: { color: '#FFFFFF' },
  skip: { fontSize: 14, color: '#3A6550', fontWeight: '600' },

  // Centro
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    width: '100%',
  },

  // Anéis decorativos do ícone
  iconRing3: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
  },
  iconRing2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  iconRing1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
  },

  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 40,
  },
  icon: { fontSize: 54 },

  titulo: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
    fontFamily: 'Poppins-ExtraBold',
  },
  sub: {
    fontSize: 16,
    color: '#7AA88A',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    maxWidth: 340,
  },
  accentBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 28,
    opacity: 0.7,
  },

  // Rodapé
  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 52 : 36,
    alignItems: 'center',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    width: '100%',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  counter: {
    fontSize: 12,
    color: '#3A6550',
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: 1,
  },
  btn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnGreen: { backgroundColor: '#00A880' },
  btnGold: { backgroundColor: '#C49800' },
  btnT: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  btnTDark: { color: '#0A1C14' },
})
