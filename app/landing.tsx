import { useWindowDimensions, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native'
import { router } from 'expo-router'

const HEADER_COLOR = '#1c909b'
const BG = '#FAFAF8'
const GOLD = '#C49800'
const DARK = '#0A1C14'
const MUTED = '#5A7A6E'
const BORDER = '#D8ECE4'

const BENEFICIOS = [
  { icon: '🤝', titulo: 'Conecte-se', desc: 'Encontre dentistas, técnicos e clínicas. Construa sua rede profissional odontológica.' },
  { icon: '💼', titulo: 'Encontre vagas', desc: 'Vagas exclusivas para profissionais da odontologia. Candidate-se em segundos.' },
  { icon: '🏆', titulo: 'Mostre seu portfólio', desc: 'Publique seus casos clínicos e conquiste novas oportunidades de trabalho.' },
  { icon: '🏢', titulo: 'Páginas de empresa', desc: 'Crie a presença digital da sua clínica, laboratório ou escola de odontologia.' },
]

const NUMEROS = [
  { valor: '2.800+', label: 'Profissionais' },
  { valor: '340+', label: 'Vagas abertas' },
  { valor: '15.000+', label: 'Conexões feitas' },
  { valor: '420+', label: 'Clínicas cadastradas' },
]

function AppMockup() {
  return (
    <View style={m.phone}>
      <View style={m.phoneScreen}>
        {/* Fake header */}
        <View style={m.fakeHeader}>
          <Text style={m.fakeHeaderT}>GoDenth</Text>
          <View style={m.fakeNotif} />
        </View>
        {/* Fake profile card */}
        <View style={m.fakeCard}>
          <View style={m.fakeAvatar} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={[m.fakeLine, { width: '70%', height: 9 }]} />
            <View style={[m.fakeLine, { width: '50%', height: 7 }]} />
            <View style={[m.fakeChip]} />
          </View>
        </View>
        {/* Fake feed post */}
        <View style={m.fakeFeed}>
          <View style={m.fakeFeedTop}>
            <View style={[m.fakeAvatar, { width: 28, height: 28, borderRadius: 14 }]} />
            <View style={{ flex: 1, gap: 3 }}>
              <View style={[m.fakeLine, { width: '60%', height: 7 }]} />
              <View style={[m.fakeLine, { width: '40%', height: 6 }]} />
            </View>
          </View>
          <View style={[m.fakeLine, { width: '90%', height: 6, marginTop: 8 }]} />
          <View style={[m.fakeLine, { width: '75%', height: 6, marginTop: 4 }]} />
          <View style={[m.fakeLine, { width: '55%', height: 6, marginTop: 4 }]} />
        </View>
        {/* Fake vaga card */}
        <View style={[m.fakeFeed, { backgroundColor: '#EAF6F3' }]}>
          <View style={[m.fakeLine, { width: '55%', height: 8, backgroundColor: '#1c909b40' }]} />
          <View style={[m.fakeLine, { width: '80%', height: 6, marginTop: 6, backgroundColor: '#1c909b25' }]} />
          <View style={[m.fakeLine, { width: '40%', height: 6, marginTop: 4, backgroundColor: '#1c909b25' }]} />
        </View>
      </View>
    </View>
  )
}

export default function Landing() {
  const { width } = useWindowDimensions()
  const isWide = Platform.OS === 'web' && width > 768

  return (
    <ScrollView style={s.root} contentContainerStyle={s.rootContent}>
      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.logo}>Go<Text style={s.logoBold}>Denth</Text></Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={s.headerLogin}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerCta} onPress={() => router.push('/(auth)/cadastro' as any)}>
            <Text style={s.headerCtaT}>Criar conta grátis</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── HERO ── */}
      <View style={[s.hero, isWide && s.heroWide]}>
        <View style={[s.heroLeft, isWide && s.heroLeftWide]}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeT}>🦷 Exclusivo para odontologia</Text>
          </View>
          <Text style={[s.heroTitle, isWide && s.heroTitleWide]}>
            A rede profissional da{'\n'}
            <Text style={s.heroTitleGold}>odontologia brasileira</Text>
          </Text>
          <Text style={[s.heroSub, isWide && s.heroSubWide]}>
            Conecte-se com profissionais, encontre vagas, publique no feed e faça sua carreira odontológica crescer de verdade.
          </Text>
          <View style={[s.heroButtons, isWide && s.heroButtonsWide]}>
            <TouchableOpacity style={s.btnPrimary} onPress={() => router.push('/(auth)/cadastro' as any)}>
              <Text style={s.btnPrimaryT}>Criar conta grátis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={s.btnSecondaryT}>Já tenho conta →</Text>
            </TouchableOpacity>
          </View>
        </View>
        {isWide && (
          <View style={s.heroRight}>
            <AppMockup />
          </View>
        )}
      </View>

      {/* ── NÚMEROS ── */}
      <View style={s.numerosSection}>
        <View style={[s.numerosRow, isWide && s.numerosRowWide]}>
          {NUMEROS.map(n => (
            <View key={n.label} style={s.numeroCard}>
              <Text style={s.numeroValor}>{n.valor}</Text>
              <Text style={s.numeroLabel}>{n.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── BENEFÍCIOS ── */}
      <View style={s.benefSection}>
        <Text style={[s.sectionTitle, isWide && s.sectionTitleWide]}>Tudo que você precisa, em um só lugar</Text>
        <Text style={s.sectionSub}>A plataforma feita para cada profissional da odontologia</Text>
        <View style={[s.benefGrid, isWide && s.benefGridWide]}>
          {BENEFICIOS.map(b => (
            <View key={b.titulo} style={[s.benefCard, isWide && s.benefCardWide]}>
              <Text style={s.benefIcon}>{b.icon}</Text>
              <Text style={s.benefTitulo}>{b.titulo}</Text>
              <Text style={s.benefDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={s.ctaSection}>
        <Text style={[s.ctaTitle, isWide && s.ctaTitleWide]}>
          Faça parte da maior rede odontológica do Brasil
        </Text>
        <Text style={s.ctaSub}>
          Gratuito para começar. Sem cartão de crédito.
        </Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(auth)/cadastro' as any)}>
          <Text style={s.ctaBtnT}>Criar minha conta grátis</Text>
        </TouchableOpacity>
      </View>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        <Text style={s.footerLogo}>GoDenth</Text>
        <Text style={s.footerSub}>A rede profissional da odontologia brasileira</Text>
        <Text style={s.footerCopy}>© 2025 GoDenth · Todos os direitos reservados</Text>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  rootContent: { flexGrow: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: HEADER_COLOR,
  },
  logo: { fontSize: 22, color: '#fff', fontWeight: '400', letterSpacing: 0.5 },
  logoBold: { fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLogin: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  headerCta: { backgroundColor: '#fff', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  headerCtaT: { color: HEADER_COLOR, fontSize: 13, fontWeight: '800' },

  // Hero
  hero: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 48, alignItems: 'center' },
  heroWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60, gap: 60, paddingTop: 64, paddingBottom: 64 },
  heroLeft: { alignItems: 'center' },
  heroLeftWide: { alignItems: 'flex-start', flex: 1, maxWidth: 520 },
  heroBadge: { backgroundColor: GOLD + '18', borderWidth: 1, borderColor: GOLD + '40', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20 },
  heroBadgeT: { fontSize: 12, color: GOLD, fontWeight: '700' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: DARK, textAlign: 'center', lineHeight: 38 },
  heroTitleWide: { fontSize: 40, lineHeight: 52, textAlign: 'left' },
  heroTitleGold: { color: HEADER_COLOR },
  heroSub: { fontSize: 15, color: MUTED, textAlign: 'center', marginTop: 16, lineHeight: 24, maxWidth: 400 },
  heroSubWide: { fontSize: 17, textAlign: 'left', maxWidth: 460, lineHeight: 26 },
  heroButtons: { flexDirection: 'column', gap: 12, marginTop: 32, width: '100%', maxWidth: 320 },
  heroButtonsWide: { flexDirection: 'row', width: 'auto', maxWidth: undefined },
  heroRight: { alignItems: 'center', justifyContent: 'center' },

  btnPrimary: { backgroundColor: HEADER_COLOR, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnSecondary: { backgroundColor: 'transparent', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: BORDER },
  btnSecondaryT: { color: DARK, fontSize: 15, fontWeight: '700' },

  // Numbers
  numerosSection: { backgroundColor: HEADER_COLOR, paddingVertical: 36, paddingHorizontal: 20 },
  numerosRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24 },
  numerosRowWide: { justifyContent: 'space-evenly', flexWrap: 'nowrap' },
  numeroCard: { alignItems: 'center', minWidth: 120 },
  numeroValor: { fontSize: 32, fontWeight: '800', color: '#fff' },
  numeroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '600' },

  // Benefits
  benefSection: { paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center', backgroundColor: '#fff' },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: DARK, textAlign: 'center' },
  sectionTitleWide: { fontSize: 30 },
  sectionSub: { fontSize: 14, color: MUTED, marginTop: 8, textAlign: 'center', marginBottom: 36 },
  benefGrid: { flexDirection: 'column', gap: 16, width: '100%', maxWidth: 600 },
  benefGridWide: { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 900, gap: 20, justifyContent: 'center' },
  benefCard: { backgroundColor: BG, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: BORDER, width: '100%' },
  benefCardWide: { width: 390, flex: undefined },
  benefIcon: { fontSize: 32, marginBottom: 12 },
  benefTitulo: { fontSize: 16, fontWeight: '800', color: DARK, marginBottom: 8 },
  benefDesc: { fontSize: 13, color: MUTED, lineHeight: 20 },

  // CTA
  ctaSection: {
    paddingVertical: 64, paddingHorizontal: 24, alignItems: 'center',
    backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER,
  },
  ctaTitle: { fontSize: 22, fontWeight: '800', color: DARK, textAlign: 'center', lineHeight: 32, maxWidth: 340 },
  ctaTitleWide: { fontSize: 30, maxWidth: 560, lineHeight: 42 },
  ctaSub: { fontSize: 14, color: MUTED, marginTop: 10, marginBottom: 28 },
  ctaBtn: { backgroundColor: GOLD, borderRadius: 14, paddingHorizontal: 36, paddingVertical: 18 },
  ctaBtnT: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Footer
  footer: { backgroundColor: DARK, paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center', gap: 6 },
  footerLogo: { fontSize: 20, fontWeight: '800', color: '#fff' },
  footerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  footerCopy: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 },
})

// Phone mockup styles
const m = StyleSheet.create({
  phone: {
    width: 220, height: 420, borderRadius: 32, backgroundColor: '#1a2e26',
    padding: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24,
    elevation: 12,
  },
  phoneScreen: { flex: 1, borderRadius: 26, backgroundColor: '#FAFAF8', overflow: 'hidden' },
  fakeHeader: { backgroundColor: HEADER_COLOR, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fakeHeaderT: { color: '#fff', fontSize: 13, fontWeight: '800' },
  fakeNotif: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.25)' },
  fakeCard: { margin: 10, backgroundColor: '#fff', borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0EDE8' },
  fakeAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1A6FD4', flexShrink: 0 },
  fakeLine: { backgroundColor: '#D0E8DA', borderRadius: 4 },
  fakeChip: { width: 56, height: 16, backgroundColor: HEADER_COLOR + '30', borderRadius: 8, marginTop: 4 },
  fakeFeed: { marginHorizontal: 10, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E0EDE8' },
  fakeFeedTop: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
})
