import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const ESPECIALIDADES: any = {
  'Cirurgião-Dentista': [
    'Estética (Facetas e Lentes)',
    'Odontopediatria',
    'Implantodontia',
    'Ortodontia',
    'Endodontia',
    'Harmonização Orofacial (HOF)',
  ],
  'Técnico em Prótese Dentária': [
    'Gesso (Modelos e Troquéis)',
    'Ceramista (Estratificação)',
    'Cadista (Desenho Digital)',
    'Resinas (Prótese Total/Parcial)',
    'Metalurgia',
  ],
  'Técnico em Saúde Bucal (TSB)': [
    'Auxílio em Cirurgia',
    'Prevenção e Profilaxia',
    'Radiologia',
  ],
  'Auxiliar em Saúde Bucal (ASB)': [
    'Auxílio em Cirurgia',
    'Instrumentação',
    'Organização de Consultório',
  ],
  'Auxiliar de Prótese Dentária': [
    'Gesso',
    'Acabamento e Polimento',
    'Auxiliar de Cadista',
  ],
  'Gerente Comercial': ['Gestão de Equipe', 'Metas e KPIs', 'Negociação'],
  'Representante Comercial': ['Prospecção', 'Negociação', 'Pós-venda'],
  'Consultor de Vendas': ['Atendimento', 'Negociação', 'CRM'],
  'Gerente Administrativo': ['Gestão de Equipe', 'Processos', 'Indicadores'],
  'Financeiro': ['Contas a Pagar/Receber', 'Fluxo de Caixa', 'Conciliação'],
  'Recepcionista / Secretária': ['Agendamento', 'Atendimento ao Paciente', 'CRM'],
  'Marketing Digital': ['Redes Sociais', 'Tráfego Pago', 'SEO', 'E-mail Marketing'],
  'Designer Gráfico / UI': ['Identidade Visual', 'UI/UX', 'Motion Graphics'],
  'Filmmaker / Videomaker': ['Captação', 'Edição', 'Motion'],
  'Fotógrafo': ['Fotografia Clínica', 'Ensaios', 'Edição'],
  'Social Media': ['Criação de Conteúdo', 'Gestão de Perfis', 'Engajamento'],
  'Gestor de Tráfego': ['Google Ads', 'Meta Ads', 'Analytics'],
}

export default function Especialidades() {
  const params = useLocalSearchParams<{ profissao: string, extras: string, nome: string, email: string, senha: string, cidade: string, estado: string }>()
  const profissaoObj = JSON.parse(params.profissao || '{}')
  const extrasArr = JSON.parse(params.extras || '[]')
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  const todasProfissoes = [profissaoObj, ...extrasArr]
  const todasEspecialidades: string[] = []

  todasProfissoes.forEach((p: any) => {
    const lista = ESPECIALIDADES[p.label] || []
    lista.forEach((e: string) => {
      if (!todasEspecialidades.includes(e)) todasEspecialidades.push(e)
    })
  })

  const toggle = (esp: string) => {
    setSelecionadas(prev =>
      prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp]
    )
  }

  const finalizar = () => {
    router.push({
      pathname: '/(auth)/cadastro3',
      params: {
        profissao: params.profissao,
        extras: params.extras,
        especialidades: JSON.stringify(selecionadas),
      }
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
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 4 de 4</Text>
        <Text style={styles.title}>Quais são suas{'\n'}especialidades?</Text>
        <Text style={styles.sub}>Toque para selecionar — aparecem no seu perfil como currículo</Text>

        {todasEspecialidades.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhuma especialidade disponível para seu perfil</Text>
          </View>
        ) : (
          <View style={styles.chips}>
            {todasEspecialidades.map(esp => {
              const on = selecionadas.includes(esp)
              return (
                <TouchableOpacity
                  key={esp}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggle(esp)}
                >
                  <Text style={[styles.chipT, on && styles.chipTOn]}>{esp}</Text>
                  {on && <Text style={styles.chipCheck}>✓</Text>}
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {selecionadas.length > 0 && (
          <Text style={styles.count}>{selecionadas.length} especialidade{selecionadas.length > 1 ? 's' : ''} selecionada{selecionadas.length > 1 ? 's' : ''}</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={finalizar} disabled={loading}>
          <Text style={styles.btnT}>{loading ? 'Criando conta...' : selecionadas.length > 0 ? 'Criar minha conta →' : 'Pular e criar conta →'}</Text>
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
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 24, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { backgroundColor: '#007A6E', borderColor: '#007A6E' },
  chipT: { fontSize: 13, fontWeight: '600', color: '#3A6550' },
  chipTOn: { color: '#fff' },
  chipCheck: { color: '#fff', fontSize: 11, fontWeight: '900' },
  count: { marginTop: 20, fontSize: 13, color: '#00A880', fontWeight: '700', textAlign: 'center' },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#7A9E8E', textAlign: 'center' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
