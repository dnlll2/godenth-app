import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

const HABILIDADES: any = {
  'Cirurgião-Dentista': {
    'Operacional': ['Gestão de Agenda','Scanner 3D Intraoral','Moldagem (Alginato/Silicone)','Avaliação e Diagnóstico','Planejamento de Casos','Fotografia Clínica'],
    'Gestão': ['Gerência Clínica','Liderança de Equipe','Reuniões de Alinhamento','Controle de Estoque','Auditoria de Prontuários'],
    'Vendas': ['Conversão de Orçamentos','Explicação de Planos de Tratamento','Pós-atendimento (Fidelização)'],
  },
  'Técnico em Prótese Dentária': {
    'Prática': ['Vazamento e Troquelagem de Gesso','Montagem em Articulador','Enceramento Diagnóstico','Estratificação de Cerâmica','Maquiagem e Glaze'],
    'Digital': ['Desenho em Exocad (CAD)','Operação de Fresadoras (CAM)','Calibração de Impressora 3D','Sinterização de Zircônia'],
    'Relacionamento': ['Discussão de Casos com Dentistas','Logística de Entrega','Conferência de O.S'],
  },
  'Técnico em Saúde Bucal (TSB)': {
    'Clínico': ['Instrumentação Cirúrgica','Manipulação de Materiais','Esterilização (Autoclave)','Organização de Bancada','Auxílio em Quatro Mãos'],
    'Paciente': ['Acolhimento','Triagem Inicial','Instrução de Higiene Bucal','Suporte em Emergências'],
    'Suporte': ['Limpeza e Desinfecção','Reposição de Descartáveis'],
  },
  'Auxiliar em Saúde Bucal (ASB)': {
    'Clínico': ['Instrumentação Cirúrgica','Manipulação de Materiais','Esterilização (Autoclave)','Organização de Bancada','Auxílio em Quatro Mãos'],
    'Paciente': ['Acolhimento','Triagem Inicial','Instrução de Higiene Bucal','Suporte em Emergências'],
    'Suporte': ['Limpeza e Desinfecção','Reposição de Descartáveis'],
  },
  'Auxiliar de Prótese Dentária': {
    'Clínico': ['Instrumentação Cirúrgica','Manipulação de Materiais','Esterilização (Autoclave)','Organização de Bancada'],
    'Suporte': ['Limpeza e Desinfecção','Reposição de Descartáveis'],
  },
  'Gerente Comercial': {
    'Estratégico': ['Análise de Metas','Relatórios de Vendas','Participação em Congressos/Eventos'],
    'Interno': ['Atendimento via WhatsApp','Negociação de Prazos e Descontos','Recuperação de Clientes Inativos'],
  },
  'Representante Comercial': {
    'Externo': ['Visitação a Clínicas','Prospecção de Novos Clientes','Demonstração de Equipamentos (Hand-on)'],
    'Interno': ['Atendimento via WhatsApp','Negociação de Prazos e Descontos','Recuperação de Clientes Inativos'],
    'Estratégico': ['Análise de Metas','Relatórios de Vendas','Participação em Congressos/Eventos'],
  },
  'Consultor de Vendas': {
    'Externo': ['Visitação a Clínicas','Prospecção de Novos Clientes','Demonstração de Equipamentos'],
    'Interno': ['Atendimento via WhatsApp','Negociação','Recuperação de Clientes Inativos'],
  },
  'Recepcionista / Secretária': {
    'Front': ['Recepção de Pacientes','Confirmação de Consultas','Atendimento Telefônico','Gestão de Conflitos na Espera'],
    'Financeiro': ['Emissão de Notas Fiscais','Cobrança de Inadimplentes','Fechamento de Caixa','Faturamento de Convênios'],
    'Processos': ['Cadastro de Pacientes','Organização de Arquivos','Check-list de Manutenção'],
  },
  'Gerente Administrativo': {
    'Front': ['Recepção de Pacientes','Confirmação de Consultas','Gestão de Conflitos'],
    'Financeiro': ['Emissão de Notas Fiscais','Cobrança de Inadimplentes','Fechamento de Caixa','Faturamento de Convênios'],
    'Processos': ['Cadastro de Pacientes','Organização de Arquivos','Check-list de Manutenção'],
  },
  'Marketing Digital': {
    'Digital': ['Gestão de Redes Sociais','Criação de Conteúdo (Posts/Stories)','Resposta a Comentários/Directs'],
    'Produção': ['Edição de Vídeos','Fotografia de Portfólio','Gestão de Tráfego Pago'],
  },
  'Designer Gráfico / UI': {
    'Digital': ['Gestão de Redes Sociais','Criação de Conteúdo'],
    'Produção': ['Edição de Vídeos','Fotografia de Portfólio'],
  },
  'Filmmaker / Videomaker': {
    'Produção': ['Edição de Vídeos de Antes e Depois','Fotografia de Portfólio','Gestão de Tráfego Pago'],
  },
  'Social Media': {
    'Digital': ['Gestão de Redes Sociais','Criação de Conteúdo (Posts/Stories)','Resposta a Comentários/Directs'],
  },
  'Gestor de Tráfego': {
    'Produção': ['Gestão de Tráfego Pago (Google/Meta)','Análise de Métricas','Criação de Campanhas'],
  },
  'Estudante de Odontologia': {
    'Acadêmico': ['Auxílio em Pesquisas','Organização de Eventos','Monitoria de Disciplinas'],
    'Prático': ['Estágio Observacional','Instrumentação em Clínicas','Organização de Materiais'],
  },
  'Estudante de Prótese Dentária': {
    'Acadêmico': ['Auxílio em Pesquisas','Organização de Eventos'],
    'Prático': ['Estágio Observacional','Organização de Materiais'],
  },
}

export default function Habilidades() {
  const { cadastroData, setCadastroData } = useAuthStore()
  const todasProfissoes = [cadastroData.profissao, ...(cadastroData.extras || [])].filter(Boolean)
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

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

  // Monta categorias únicas de todas as profissões
  const categorias: any = {}
  todasProfissoes.forEach((p: any) => {
    const habs = HABILIDADES[p.label] || {}
    Object.entries(habs).forEach(([cat, items]: any) => {
      if (!categorias[cat]) categorias[cat] = []
      items.forEach((item: string) => {
        if (!categorias[cat].includes(item)) categorias[cat].push(item)
      })
    })
  })

  const toggle = (hab: string) => {
    setSelecionadas(prev =>
      prev.includes(hab) ? prev.filter(h => h !== hab) : [...prev, hab]
    )
  }

  const finalizar = () => {
    setCadastroData({ habilidades: selecionadas })
    router.push('/(auth)/sobre')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>
          <Text style={{ color: '#C49800' }}>Go</Text>
          <Text style={{ color: '#fff' }}>Denth</Text>
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.progressRow}>
        {[1,2,3,4,5,6].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
        <View style={styles.bar} />
      </View>

      <Animated.View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}>
        <Text style={styles.step}>Passo 6 de 7</Text>
        <Text style={styles.title}>Suas habilidades</Text>
        <Text style={styles.sub}>Selecione o que você domina — aparecem no seu currículo</Text>
      </Animated.View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {Object.entries(categorias).map(([cat, items]: any) => (
            <View key={cat} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{cat}</Text>
              </View>
              <View style={styles.chips}>
                {items.map((hab: string) => {
                  const on = selecionadas.includes(hab)
                  return (
                    <TouchableOpacity
                      key={hab}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => toggle(hab)}
                    >
                      <Text style={[styles.chipT, on && styles.chipTOn]}>{hab}</Text>
                      {on && <Text style={styles.chipCheck}>✓</Text>}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}

          {selecionadas.length > 0 && (
            <Text style={styles.count}>{selecionadas.length} habilidade{selecionadas.length > 1 ? 's' : ''} selecionada{selecionadas.length > 1 ? 's' : ''}</Text>
          )}
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={finalizar} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnT}>{selecionadas.length > 0 ? '🚀 Criar minha conta' : 'Pular e criar conta →'}</Text>
          }
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
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C49800' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#fff', flex: 1 },
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
