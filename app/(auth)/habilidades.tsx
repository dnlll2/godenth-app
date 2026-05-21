import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

const HABILIDADES: any = {
  'Cirurgião-Dentista': {
    'Operacional': ['Clareamento dental','Facetas e lentes de contato','Invisalign e alinhadores','Laser dental','Microscopia endodôntica','Cirurgia guiada','Enxerto ósseo','Carga imediata em implantes','Levantamento de seio maxilar','Scanner intraoral','Fotografia clínica'],
    'Gestão': ['Gestão de clínica','Precificação de procedimentos','Fidelização de pacientes','Gestão de equipe','Compliance e vigilância sanitária'],
    'Vendas': ['Apresentação de planos de tratamento','Negociação com convênios','Captação de pacientes','Atendimento humanizado'],
  },
  'Técnico em Prótese Dentária': {
    'Prática': ['Cerâmica feldspática','Cerâmica prensada (e.max)','Escultura em cera','Gesso tipo IV','Soldagem','Maquiagem dental','Moldagem e vazamento','Eletroerosão','Polimento e acabamento'],
    'Digital': ['Exocad','3Shape','Ceramill','Fresadora CNC','Impressora 3D','Scanner de bancada','PMMA fresado','Zircônia fresada'],
    'Relacionamento': ['Comunicação com dentista','Leitura de prescrição','Controle de qualidade','Prazos e entregas'],
  },
  'Técnico em Saúde Bucal (TSB)': {
    'Clínico': ['Radiografia intraoral e extraoral','Revelação de imagens','Polimento coronário','Aplicação de flúor e selante','Instrumentação cirúrgica'],
    'Paciente': ['Educação em saúde bucal','Triagem','Atendimento humanizado','Primeiros socorros'],
    'Suporte': ['Biossegurança avançada','Gestão de resíduos','Esterilização','Organização de consultório'],
  },
  'Auxiliar em Saúde Bucal (ASB)': {
    'Clínico': ['Instrumentação cirúrgica','Processamento de artigos críticos','Assepsia e antissepsia','Revelação de radiografias','Manipulação de materiais'],
    'Paciente': ['Atendimento ao paciente','Primeiros socorros','Recepção e acolhimento'],
    'Suporte': ['Moldagem e vazamento em gesso','Controle de estoque','Limpeza e organização','Preparo de bandejas'],
  },
  'Auxiliar de Prótese Dentária': {
    'Clínico': ['Acabamento e polimento','Gesso tipo II e III','Moldagem auxiliar','Vazamento de modelos'],
    'Suporte': ['Organização de bancada','Controle de materiais','CAD/CAM básico','Limpeza de equipamentos'],
  },
  'Gerente Comercial': {
    'Estratégico': ['Planejamento comercial','Análise de mercado','Gestão de funil','CRM avançado','Business Intelligence','Definição de metas'],
    'Interno': ['Treinamento de equipe','Gestão de metas','Feedback e coaching','Reuniões de resultado','Onboarding de vendedores'],
  },
  'Representante Comercial': {
    'Externo': ['Visita técnica a clínicas','Demonstração de equipamentos','Gestão de território','Prospecção presencial'],
    'Interno': ['CRM (Salesforce/RD Station/Pipedrive)','Relatórios de visita','Follow-up de propostas'],
    'Estratégico': ['Conhecimento em produtos odontológicos','Conhecimento em equipamentos','Análise de concorrência','Técnicas de negociação'],
  },
  'Consultor de Vendas': {
    'Externo': ['Prospecção ativa','Apresentação de soluções','Fechamento de vendas','Pós-venda básico'],
    'Interno': ['CRM','Scripts de vendas','E-mail de prospecção','WhatsApp Business comercial'],
  },
  'CRC / Call Center': {
    'Front': ['Atendimento telefônico','WhatsApp Business','Agendamento','Confirmação e lembretes'],
    'Processos': ['Scripts de atendimento','Retenção de pacientes','CRM básico','Registro de ocorrências','Pesquisa de satisfação'],
  },
  'Recepcionista / Secretária': {
    'Front': ['Atendimento presencial e telefônico','WhatsApp Business','Confirmação de consultas','Triagem','Gestão de filas'],
    'Financeiro': ['Emissão de notas fiscais','Controle de caixa','Cobrança','Convênios odontológicos','Conciliação de pagamentos'],
    'Processos': ['Software odontológico (Dental Office/iMedicina)','Prontuário eletrônico','Excel','Google Agenda','Arquivamento'],
  },
  'Gerente Administrativo': {
    'Front': ['Comunicação com equipe','Gestão de conflitos','Liderança situacional','Clima organizacional'],
    'Financeiro': ['DRE','Fluxo de caixa','Orçamentos','Relatórios gerenciais','Controle de custos'],
    'Processos': ['Mapeamento de processos','KPIs','Compliance em saúde','Vigilância sanitária','Gestão de contratos'],
  },
  'Auxiliar Administrativo': {
    'Front': ['Atendimento telefônico básico','Recebimento de documentos','Suporte à recepção'],
    'Processos': ['Excel básico e intermediário','Arquivo físico e digital','Rotinas administrativas','Controle de estoque','Emissão de notas','Lançamentos no sistema'],
  },
  'Financeiro': {
    'Financeiro': ['Fluxo de caixa','Contas a pagar/receber','Conciliação bancária','DRE','Excel Avançado','ERP (TOTVS/Omie/Conta Azul/SAP)','Faturamento de convênios'],
  },
  'RH / Recursos Humanos': {
    'Processos': ['Recrutamento e seleção','Folha de pagamento','eSocial','Avaliação de desempenho','Onboarding','Treinamento e desenvolvimento','Coaching','Gestão de benefícios'],
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
    router.push('/(auth)/academico')
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
        {[1,2,3].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
        {[4,5,6,7].map(i => <View key={i} style={styles.bar} />)}
      </View>

      <Animated.View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}>
        <Text style={styles.step}>Passo 3 de 7</Text>
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
            : <Text style={styles.btnT}>{selecionadas.length > 0 ? 'Continuar →' : 'Pular →'}</Text>
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
