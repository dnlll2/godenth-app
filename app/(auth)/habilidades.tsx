import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
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
  const { cadastroData } = useAuthStore()
  const todasProfissoes = [cadastroData.profissao, ...(cadastroData.extras || [])].filter(Boolean)
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

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
  })
      await login(params.email as string, params.senha as string)
      router.push({ pathname: '/(auth)/sobre', params: { ...params, habilidades: JSON.stringify(selecionadas) } })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
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
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 6 de 6</Text>
        <Text style={styles.title}>Suas habilidades{'\n'}e competências</Text>
        <Text style={styles.sub}>Selecione o que você domina — aparecem no seu currículo</Text>

        {Object.entries(categorias).map(([cat, items]: any) => (
          <View key={cat} style={styles.section}>
            <Text style={styles.sectionTitle}>{cat}</Text>
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
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontWeight: '800' },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007A6E' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#F5C800' },
  scroll: { padding: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 20, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { backgroundColor: '#007A6E', borderColor: '#007A6E' },
  chipT: { fontSize: 12, fontWeight: '600', color: '#3A6550' },
  chipTOn: { color: '#fff' },
  chipCheck: { color: '#fff', fontSize: 10, fontWeight: '900' },
  count: { marginTop: 16, fontSize: 13, color: '#00A880', fontWeight: '700', textAlign: 'center' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
