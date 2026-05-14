import { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, Image } from 'react-native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    emoji: '🦷',
    titulo: 'Bem-vindo ao GoDenth',
    sub: 'O network profissional feito para a odontologia brasileira.',
    cor: '#007A6E',
  },
  {
    emoji: '🤝',
    titulo: 'Conecte-se com Profissionais',
    sub: 'Encontre cirurgiões-dentistas, técnicos, clínicas, laboratórios e fornecedores da sua região.',
    cor: '#1A6FD4',
  },
  {
    emoji: '📣',
    titulo: 'Feed Profissional',
    sub: 'Compartilhe dicas clínicas, casos de sucesso, perguntas e oportunidades com toda a comunidade.',
    cor: '#7B3FC4',
  },
  {
    emoji: '💼',
    titulo: 'Vagas e Serviços',
    sub: 'Publique ou candidate-se a vagas CLT, PJ e Freelancer. Contrate serviços especializados.',
    cor: '#C49800',
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const ref = useRef<FlatList>(null)

  const next = () => {
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

  const slide = SLIDES[current]

  return (
    <View style={styles.container}>
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
          <View style={[styles.slide, { width }]}>
            <View style={[styles.emojiWrap, { backgroundColor: item.cor }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.sub}>{item.sub}</Text>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && { backgroundColor: slide.cor, width: 20 }]} />
          ))}
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: slide.cor }]} onPress={next}>
          <Text style={styles.btnT}>
            {current < SLIDES.length - 1 ? 'Próximo →' : '🚀 Começar'}
          </Text>
        </TouchableOpacity>

        {current < SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skip} onPress={finish}>
            <Text style={styles.skipT}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, paddingTop: 80 },
  emojiWrap: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56 },
  titulo: { fontSize: 28, fontWeight: '800', color: '#0A1C14', textAlign: 'center', marginBottom: 16, lineHeight: 34 },
  sub: { fontSize: 16, color: '#3A6550', textAlign: 'center', lineHeight: 24 },
  bottom: { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0E8DA' },
  btn: { width: '100%', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skip: { marginTop: 14 },
  skipT: { fontSize: 14, color: '#7A9E8E', fontWeight: '600' },
})
