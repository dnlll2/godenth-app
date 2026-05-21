import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

const ESPECIALIDADES: any = {
  'Cirurgião-Dentista': ['Estética','Odontopediatria','Implantodontia','Ortodontia','Endodontia','HOF','Periodontia','Cirurgia Oral','Prótese Dentária','Radiologia','Odontogeriatria','Pacientes Especiais','Saúde Coletiva','DTM e Dor Orofacial'],
  'Técnico em Prótese Dentária': ['Gesso e Modelagem','Ceramista','Cadista/CAD/CAM','Resinas e Acrílico','Metalurgia','Zircônia','Overdenture','Prótese sobre Implante','Aparelhos Ortodônticos','Placas Oclusais','Prótese Total','Prótese Parcial Removível','Prótese Fixa'],
  'Técnico em Saúde Bucal (TSB)': ['Auxílio em Cirurgia','Prevenção e Promoção de Saúde','Radiologia','Instrumentação Clínica','Atendimento a Pacientes Especiais'],
  'Auxiliar em Saúde Bucal (ASB)': ['Auxílio em Cirurgia','Instrumentação Clínica','Organização do Consultório','Esterilização e Biossegurança','Auxílio em Ortodontia','Auxílio em Implantodontia'],
  'Auxiliar de Prótese Dentária': ['Acabamento e Polimento','Trabalho com Gesso','Auxílio ao Cadista','Auxílio em Cerâmica'],
  'Gerente Comercial': ['Gestão de Equipe','Metas e KPIs','Negociação Estratégica','Prospecção B2B','Gestão de Carteira'],
  'Representante Comercial': ['Prospecção','Negociação e Fechamento','Pós-venda','Demonstração de Produtos','Relacionamento com Clínicas'],
  'Recepcionista / Secretária': ['Agendamento e Agenda Digital','Atendimento ao Paciente','CRM e Fidelização','Faturamento e Cobrança','Gestão de Prontuários'],
  'CRC / Call Center': ['Atendimento ao Cliente','Retenção de Pacientes','Scripts','Agendamento e Confirmação'],
  'Consultor de Vendas': ['Prospecção Ativa','Negociação','CRM','Fechamento de Contratos','Inside Sales'],
  'Gerente Administrativo': ['Gestão de Equipe','Processos e Protocolos','Indicadores e KPIs','Planejamento Operacional','Compliance em Saúde'],
  'Auxiliar Administrativo': ['Organização e Arquivo','Rotinas Administrativas','Suporte','Controle de Estoque'],
  'Financeiro': ['Contas a Pagar e Receber','Fluxo de Caixa','Conciliação Bancária','DRE','Faturamento'],
  'RH / Recursos Humanos': ['Recrutamento e Seleção','Treinamento e Desenvolvimento','Folha de Pagamento','Gestão de Pessoas','Cultura Organizacional'],
  'Contabilidade': ['Lançamentos','Obrigações Fiscais','Relatórios Contábeis'],
  'TI / Tecnologia': ['Suporte','Redes','Sistemas','Segurança da Informação'],
  'Marketing Digital': ['Redes Sociais','Tráfego Pago','SEO','E-mail Marketing','Branding'],
  'Designer Gráfico / UI': ['Identidade Visual','UI/UX','Motion Graphics','Edição de Imagens'],
  'Filmmaker / Videomaker': ['Captação','Edição de Vídeo','Motion','Color Grading'],
  'Fotógrafo': ['Fotografia Clínica','Ensaios','Edição','Lightroom/Photoshop'],
  'Social Media': ['Criação de Conteúdo','Gestão de Perfis','Engajamento','Stories/Reels'],
  'Gestor de Tráfego': ['Google Ads','Meta Ads','Analytics','Funil de Vendas'],
  'Copywriter': ['Copy para Redes Sociais','E-mail Marketing','Landing Pages','SEO'],
  'Estudante de Odontologia': ['Anatomia','Bioquímica','Clínica Integrada'],
  'Estudante de Prótese Dentária': ['Gesso','Resinas','Anatomia Dental'],
  'Estudante de Administração': ['Gestão','Finanças','Marketing','RH'],
  'Estudante de Marketing': ['Marketing Digital','Publicidade','Pesquisa de Mercado'],
}

export default function Especialidades() {
  const { cadastroData, setCadastroData } = useAuthStore()
  const [selecionadas, setSelecionadas] = useState<{ [key: string]: string[] }>({})

  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleTranslateY = useRef(new Animated.Value(24)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const contentTranslateY = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleTranslateY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(contentTranslateY, { toValue: 0, tension: 55, friction: 12, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  const todasProfissoes = [cadastroData.profissao, ...(cadastroData.extras || [])].filter(Boolean)

  const toggle = (profLabel: string, esp: string) => {
    setSelecionadas(prev => {
      const atual = prev[profLabel] || []
      return {
        ...prev,
        [profLabel]: atual.includes(esp) ? atual.filter(e => e !== esp) : [...atual, esp]
      }
    })
  }

  const totalSelecionadas = Object.values(selecionadas).flat().length

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.logo}><Text style={{ color: '#C49800' }}>Go</Text><Text style={{ color: '#fff' }}>Denth</Text></Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.progressRow}>
        {[1,2].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
        {[3,4,5,6,7].map(i => <View key={i} style={styles.bar} />)}
      </View>

      <Animated.View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}>
        <Text style={styles.step}>Passo 2 de 7</Text>
        <Text style={styles.title}>Suas especialidades</Text>
        <Text style={styles.sub}>Selecione o que você domina em cada área</Text>
      </Animated.View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {todasProfissoes.map((prof: any) => {
            const lista = ESPECIALIDADES[prof.label] || []
            if (lista.length === 0) return null
            const profSelecionadas = selecionadas[prof.label] || []

            return (
              <View key={prof.label} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: prof.cor || '#C49800' }]} />
                  <Text style={styles.sectionTitle}>{prof.label}</Text>
                  {profSelecionadas.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeT}>{profSelecionadas.length}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.chips}>
                  {lista.map((esp: string) => {
                    const on = profSelecionadas.includes(esp)
                    return (
                      <TouchableOpacity
                        key={esp}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => toggle(prof.label, esp)}
                      >
                        <Text style={[styles.chipT, on && styles.chipTOn]}>{esp}</Text>
                        {on && <Text style={styles.chipCheck}>✓</Text>}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )
          })}

          {todasProfissoes.every((p: any) => (ESPECIALIDADES[p.label] || []).length === 0) && (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 }}>Tudo certo!</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>Não há especialidades para seu cargo.</Text>
            </View>
          )}

          {totalSelecionadas > 0 && (
            <Text style={styles.count}>{totalSelecionadas} especialidade{totalSelecionadas > 1 ? 's' : ''} selecionada{totalSelecionadas > 1 ? 's' : ''}</Text>
          )}
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => {
          setCadastroData({ especialidades: Object.values(selecionadas).flat() })
          router.push('/(auth)/habilidades')
        }}>
          <Text style={styles.btnT}>{totalSelecionadas > 0 ? 'Continuar →' : 'Pular →'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c909b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1c909b' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontFamily: 'Poppins-ExtraBold' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1c909b' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#C49800' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#C49800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 4 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#fff', flex: 1 },
  countBadge: { borderRadius: 100, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#C49800' },
  countBadgeT: { color: '#fff', fontSize: 10, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { backgroundColor: 'rgba(196,152,0,0.85)', borderColor: '#C49800' },
  chipT: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  chipTOn: { color: '#fff', fontWeight: '800' },
  chipCheck: { color: '#fff', fontSize: 10, fontWeight: '900' },
  count: { marginTop: 16, fontSize: 13, color: '#C49800', fontWeight: '700', textAlign: 'center' },
  footer: { padding: 16, backgroundColor: '#1c909b' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
