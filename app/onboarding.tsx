import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, FlatList, Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    icon: '🦷',
    titulo: 'Bem-vindo ao GoDenth',
    sub: 'O network profissional feito para a odontologia brasileira.',
    acent: '#00A880',
  },
  {
    icon: '🤝',
    titulo: 'Conecte-se',
    sub: 'Encontre dentistas, técnicos, clínicas e profissionais da área na sua região.',
    acent: '#1A6FD4',
  },
  {
    icon: '💼',
    titulo: 'Mostre seu trabalho',
    sub: 'Portfólio, serviços e experiência no seu perfil profissional.',
    acent: '#C49800',
  },
  {
    icon: '🚀',
    titulo: 'Encontre oportunidades',
    sub: 'Vagas, parcerias e muito mais para impulsionar sua carreira.',
    acent: '#00A880',
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const ref = useRef<FlatList>(null)

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      const next = current + 1
      ref.current?.scrollToIndex({ index: next, animated: true })
      setCurrent(next)
    } else {
      finish()
    }
  }

  const finish = async () => {
    await AsyncStorage.setItem('godenth_onboarding_seen', '1')
    router.replace('/(tabs)/feed')
  }

  const isLast = current === SLIDES.length - 1
  const slide = SLIDES[current]

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Text style={s.logo}><Text style={s.go}>Go</Text><Text style={s.denth}>Denth</Text></Text>
        {!isLast && (
          <TouchableOpacity onPress={finish} style={s.skipBtn}>
            <Text style={s.skipT}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrent(idx)
        }}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            <View style={[s.iconWrap, { backgroundColor: item.acent + '22', borderColor: item.acent + '66' }]}>
              <Text style={s.icon}>{item.icon}</Text>
            </View>
            <Text style={s.titulo}>{item.titulo}</Text>
            <Text style={s.sub}>{item.sub}</Text>
          </View>
        )}
      />

      <View style={s.bottom}>
        <View style={s.dots}>
          {SLIDES.map((sl, i) => (
            <View key={i} style={[s.dot, i === current && { backgroundColor: sl.acent, width: 24 }]} />
          ))}
        </View>

        <TouchableOpacity
          style={[s.btn, isLast && s.btnGold]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={[s.btnT, isLast && s.btnTDark]}>
            {isLast ? '🚀 Começar' : 'Próximo →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1C14', paddingTop: Platform.OS === 'ios' ? 52 : 32 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, marginBottom: 8,
  },
  logo: { fontSize: 22, fontWeight: '900' },
  go: { color: '#00A880' },
  denth: { color: '#FFFFFF' },
  skipBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  skipT: { fontSize: 14, color: '#3A6550', fontWeight: '600' },

  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 24,
  },
  iconWrap: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 44, borderWidth: 2,
  },
  icon: { fontSize: 66 },
  titulo: {
    fontSize: 30, fontWeight: '900', color: '#FFFFFF',
    textAlign: 'center', marginBottom: 16, lineHeight: 36,
  },
  sub: {
    fontSize: 16, color: '#7AA88A', textAlign: 'center',
    lineHeight: 26, fontWeight: '500',
  },

  bottom: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 52 : 40, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E3A2A' },

  btn: {
    width: '100%', backgroundColor: '#00A880',
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
  },
  btnGold: { backgroundColor: '#C49800' },
  btnT: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  btnTDark: { color: '#0A1C14' },
})
