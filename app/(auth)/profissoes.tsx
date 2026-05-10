import { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

const PROFISSOES: any = {
  clinico: [
    { key: 'cirurgiao_dentista', label: 'Cirurgião-Dentista' },
    { key: 'ortodontista', label: 'Ortodontista' },
    { key: 'implantodontista', label: 'Implantodontista' },
    { key: 'endodontista', label: 'Endodontista' },
    { key: 'periodontista', label: 'Periodontista' },
    { key: 'pediatra', label: 'Odontopediatra' },
    { key: 'cirurgiao_bmf', label: 'Cirurgião Bucomaxilofacial' },
    { key: 'protetico', label: 'Técnico em Prótese Dentária' },
  ],
  tecnico: [
    { key: 'tsb', label: 'Técnico em Saúde Bucal (TSB)' },
    { key: 'asb', label: 'Auxiliar em Saúde Bucal (ASB)' },
    { key: 'aux_protese', label: 'Auxiliar de Prótese Dentária' },
  ],
  comercial: [
    { key: 'gerente_comercial', label: 'Gerente Comercial' },
    { key: 'representante', label: 'Representante Comercial' },
    { key: 'recepcionista', label: 'Recepcionista / Secretária' },
    { key: 'crc', label: 'CRC / Call Center' },
    { key: 'consultor_vendas', label: 'Consultor de Vendas' },
  ],
  administrativo: [
    { key: 'gerente_adm', label: 'Gerente Administrativo' },
    { key: 'aux_adm', label: 'Auxiliar Administrativo' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'rh', label: 'RH / Recursos Humanos' },
    { key: 'contabilidade', label: 'Contabilidade' },
  ],
  marketing: [
    { key: 'marketing_digital', label: 'Marketing Digital' },
    { key: 'designer', label: 'Designer Gráfico / UI' },
    { key: 'filmmaker', label: 'Filmmaker / Videomaker' },
    { key: 'fotografo', label: 'Fotógrafo' },
    { key: 'social_media', label: 'Social Media' },
    { key: 'trafego', label: 'Gestor de Tráfego' },
  ],
  formacao: [
    { key: 'est_odonto', label: 'Estudante de Odontologia' },
    { key: 'est_protese', label: 'Estudante de Prótese Dentária' },
    { key: 'est_adm', label: 'Estudante de Administração' },
    { key: 'est_marketing', label: 'Estudante de Marketing' },
  ],
}

const CATEGORIAS: any = {
  clinico: { label: 'Clínico e Profissional Técnico', cor: '#00A880' },
  tecnico: { label: 'Técnicos e Auxiliares', cor: '#1A6FD4' },
  comercial: { label: 'Comercial', cor: '#C49800' },
  administrativo: { label: 'Administrativo', cor: '#7B3FC4' },
  marketing: { label: 'Marketing e Criação', cor: '#D4186A' },
  formacao: { label: 'Formação', cor: '#0891B2' },
}

export default function Profissoes() {
  const { categoria } = useLocalSearchParams<{ categoria: string }>()
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [fase, setFase] = useState<'profissao' | 'mais_cargos'>('profissao')

  const fadeAnim = useRef(new Animated.Value(1)).current

  const cat = CATEGORIAS[categoria] || {}
  const lista = PROFISSOES[categoria] || []

  const toggle = (key: string) => {
    setSelecionadas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const avancar = () => {
    // Fade out
    Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
      setFase('mais_cargos')
      // Fade in
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    })
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

      <View style={styles.progressRow}>
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {fase === 'profissao' ? (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.step}>Passo 2 de 4</Text>
            <Text style={styles.title}>Qual é a sua{'\n'}profissão principal?</Text>
            <Text style={styles.sub}>
              Área: <Text style={{ color: cat.cor, fontWeight: '800' }}>{cat.label}</Text>
            </Text>

            <View style={styles.list}>
              {lista.map((p: any) => {
                const on = selecionadas.includes(p.key)
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.option, on && { borderColor: cat.cor, backgroundColor: cat.cor + '10' }]}
                    onPress={() => toggle(p.key)}
                  >
                    <Text style={[styles.optionLabel, on && { color: cat.cor }]}>{p.label}</Text>
                    {on && (
                      <View style={[styles.check, { backgroundColor: cat.cor }]}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity style={styles.outra}>
              <Text style={styles.outraT}>+ Minha profissão não está aqui</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.maisCargos}>
            <Text style={styles.maisCargosIcon}>💼</Text>
            <Text style={styles.maisCargosTitle}>Você tem mais{'\n'}algum cargo?</Text>
            <Text style={styles.maisCargosDesc}>Muitos profissionais atuam em mais de uma área</Text>

            <View style={styles.maisCargosOpts}>
              <TouchableOpacity
                style={styles.maisCargosBtn}
                onPress={() => router.push({ pathname: '/(auth)/cadastro', params: {} })}
              >
                <Text style={styles.maisCargosLabelBig}>✅ Sim</Text>
                <Text style={styles.maisCargosLabelSub}>Adicionar outro cargo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.maisCargosBtn, styles.maisCargoBtnOn]}
                onPress={() => router.push({
                  pathname: '/(auth)/cadastro3',
                  params: { categoria, profissoes: JSON.stringify(selecionadas) }
                })}
              >
                <Text style={[styles.maisCargosLabelBig, { color: '#fff' }]}>→ Não</Text>
                <Text style={[styles.maisCargosLabelSub, { color: 'rgba(255,255,255,0.8)' }]}>Continuar o cadastro</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      {fase === 'profissao' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, selecionadas.length === 0 && styles.btnOff]}
            disabled={selecionadas.length === 0}
            onPress={avancar}
          >
            <Text style={styles.btnT}>
              {selecionadas.length > 0
                ? `Continuar com ${selecionadas.length} selecionada${selecionadas.length > 1 ? 's' : ''} →`
                : 'Selecione ao menos uma'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E',
  },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontWeight: '800' },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007A6E' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#F5C800' },
  scroll: { padding: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 24, lineHeight: 22 },
  list: { gap: 10 },
  option: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 2, borderColor: '#D0E8DA',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  optionLabel: { fontSize: 15, fontWeight: '600', color: '#0A1C14', flex: 1 },
  check: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  outra: { marginTop: 16, alignItems: 'center', padding: 14 },
  outraT: { fontSize: 14, color: '#00A880', fontWeight: '700' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff: { backgroundColor: '#AECEBE' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  maisCargos: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  maisCargosIcon: { fontSize: 64, marginBottom: 20 },
  maisCargosTitle: { fontSize: 32, fontWeight: '800', color: '#0A1C14', textAlign: 'center', lineHeight: 40, marginBottom: 12 },
  maisCargosDesc: { fontSize: 14, color: '#7A9E8E', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  maisCargosOpts: { gap: 14, width: '100%' },
  maisCargosBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 2, borderColor: '#D0E8DA', alignItems: 'center',
  },
  maisCargoBtnOn: { backgroundColor: '#007A6E', borderColor: '#007A6E' },
  maisCargosLabelBig: { fontSize: 20, fontWeight: '800', color: '#0A1C14', marginBottom: 4 },
  maisCargosLabelSub: { fontSize: 13, color: '#7A9E8E' },
})
