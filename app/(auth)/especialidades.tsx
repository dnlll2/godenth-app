import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

const ESPECIALIDADES: any = {
  'Cirurgião-Dentista': ['Estética (Facetas e Lentes)','Odontopediatria','Implantodontia','Ortodontia','Endodontia','Harmonização Orofacial (HOF)'],
  'Técnico em Prótese Dentária': ['Gesso (Modelos e Troquéis)','Ceramista (Estratificação)','Cadista (Desenho Digital)','Resinas (Prótese Total/Parcial)','Metalurgia'],
  'Técnico em Saúde Bucal (TSB)': ['Auxílio em Cirurgia','Prevenção e Profilaxia','Radiologia'],
  'Auxiliar em Saúde Bucal (ASB)': ['Auxílio em Cirurgia','Instrumentação','Organização de Consultório'],
  'Auxiliar de Prótese Dentária': ['Gesso','Acabamento e Polimento','Auxiliar de Cadista'],
  'Gerente Comercial': ['Gestão de Equipe','Metas e KPIs','Negociação','Prospecção'],
  'Representante Comercial': ['Prospecção','Negociação','Pós-venda','Demonstração de Produtos'],
  'Recepcionista / Secretária': ['Agendamento','Atendimento ao Paciente','CRM','Faturamento'],
  'CRC / Call Center': ['Atendimento','Retenção de Clientes','Scripts de Vendas'],
  'Consultor de Vendas': ['Prospecção','Negociação','CRM','Fechamento de Contratos'],
  'Gerente Administrativo': ['Gestão de Equipe','Processos','Indicadores','Planejamento'],
  'Auxiliar Administrativo': ['Organização','Arquivo','Atendimento','Rotinas Administrativas'],
  'Financeiro': ['Contas a Pagar/Receber','Fluxo de Caixa','Conciliação','DRE'],
  'RH / Recursos Humanos': ['Recrutamento','Treinamento','Folha de Pagamento','Gestão de Pessoas'],
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
        <Text style={styles.logo}><Text style={{ color: '#F5C800' }}>Go</Text><Text style={{ color: '#fff' }}>Denth</Text></Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.progressRow}>
        {[1,2,3,4].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
        {[5,6,7].map(i => <View key={i} style={styles.bar} />)}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 4 de 7</Text>
        <Text style={styles.title}>Suas{'\n'}especialidades</Text>
        <Text style={styles.sub}>Selecione o que você domina em cada área</Text>

        {todasProfissoes.map((prof: any) => {
          const lista = ESPECIALIDADES[prof.label] || []
          if (lista.length === 0) return null
          const profSelecionadas = selecionadas[prof.label] || []

          return (
            <View key={prof.label} style={styles.section}>
              <View style={[styles.sectionHeader, { borderLeftColor: prof.cor || '#00A880' }]}>
                <Text style={[styles.sectionTitle, { color: prof.cor || '#00A880' }]}>{prof.label}</Text>
                {profSelecionadas.length > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: prof.cor || '#00A880' }]}>
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
                      style={[styles.chip, on && { backgroundColor: prof.cor || '#00A880', borderColor: prof.cor || '#00A880' }]}
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
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A1C14', marginBottom: 6 }}>Tudo certo!</Text>
            <Text style={{ fontSize: 13, color: '#7A9E8E', textAlign: 'center' }}>Não há especialidades para seu cargo.</Text>
          </View>
        )}

        {totalSelecionadas > 0 && (
          <Text style={styles.count}>{totalSelecionadas} especialidade{totalSelecionadas > 1 ? 's' : ''} selecionada{totalSelecionadas > 1 ? 's' : ''}</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => {
          setCadastroData({ especialidades: Object.values(selecionadas).flat() })
          router.push('/(auth)/academico')
        }}>
          <Text style={styles.btnT}>{totalSelecionadas > 0 ? 'Continuar →' : 'Pular →'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontFamily: 'Poppins-ExtraBold' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007A6E' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#F5C800' },
  scroll: { padding: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  countBadge: { borderRadius: 100, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  countBadgeT: { color: '#fff', fontSize: 10, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipT: { fontSize: 12, fontWeight: '600', color: '#3A6550' },
  chipTOn: { color: '#fff' },
  chipCheck: { color: '#fff', fontSize: 10, fontWeight: '900' },
  count: { marginTop: 16, fontSize: 13, color: '#00A880', fontWeight: '700', textAlign: 'center' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
