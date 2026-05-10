import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

const CURSOS_POR_PROFISSAO: any = {
  'Cirurgião-Dentista': [
    'Graduação em Odontologia',
    'Pós-graduação em Implantodontia',
    'Pós-graduação em Ortodontia',
    'Pós-graduação em Endodontia',
    'Pós-graduação em Periodontia',
    'Pós-graduação em Odontopediatria',
    'Pós-graduação em Estética',
    'Pós-graduação em Cirurgia Oral',
    'Pós-graduação em Prótese',
    'Pós-graduação em HOF',
    'Outro',
  ],
  'Técnico em Prótese Dentária': [
    'Curso Técnico em Prótese Dentária',
    'Especialização em CAD/CAM',
    'Especialização em Cerâmica',
    'Outro',
  ],
  'Técnico em Saúde Bucal (TSB)': [
    'Curso Técnico em Saúde Bucal',
    'Especialização em Radiologia',
    'Outro',
  ],
  'Auxiliar em Saúde Bucal (ASB)': [
    'Curso de Auxiliar em Saúde Bucal',
    'Outro',
  ],
  'Auxiliar de Prótese Dentária': [
    'Curso de Auxiliar de Prótese Dentária',
    'Outro',
  ],
  'Gerente Comercial': [
    'Graduação em Administração',
    'Graduação em Gestão Comercial',
    'MBA em Vendas',
    'Outro',
  ],
  'Representante Comercial': [
    'Graduação em Administração',
    'Curso de Representação Comercial',
    'Outro',
  ],
  'Consultor de Vendas': [
    'Graduação em Administração',
    'Curso de Vendas',
    'Outro',
  ],
  'Recepcionista / Secretária': [
    'Curso de Recepcionista',
    'Curso de Secretariado',
    'Outro',
  ],
  'CRC / Call Center': [
    'Curso de Atendimento ao Cliente',
    'Outro',
  ],
  'Gerente Administrativo': [
    'Graduação em Administração',
    'MBA em Gestão',
    'Outro',
  ],
  'Auxiliar Administrativo': [
    'Curso Técnico em Administração',
    'Graduação em Administração',
    'Outro',
  ],
  'Financeiro': [
    'Graduação em Ciências Contábeis',
    'Graduação em Administração',
    'MBA em Finanças',
    'Outro',
  ],
  'RH / Recursos Humanos': [
    'Graduação em RH',
    'Graduação em Psicologia',
    'MBA em Gestão de Pessoas',
    'Outro',
  ],
  'Contabilidade': [
    'Graduação em Ciências Contábeis',
    'Outro',
  ],
  'Marketing Digital': [
    'Graduação em Marketing',
    'Graduação em Publicidade',
    'Curso de Marketing Digital',
    'Outro',
  ],
  'Designer Gráfico / UI': [
    'Graduação em Design',
    'Curso de Design Gráfico',
    'Curso de UI/UX',
    'Outro',
  ],
  'Filmmaker / Videomaker': [
    'Graduação em Cinema',
    'Curso de Videomaking',
    'Outro',
  ],
  'Fotógrafo': [
    'Curso de Fotografia',
    'Outro',
  ],
  'Social Media': [
    'Graduação em Marketing',
    'Curso de Social Media',
    'Outro',
  ],
  'Gestor de Tráfego': [
    'Curso de Tráfego Pago',
    'Certificação Google Ads',
    'Certificação Meta Ads',
    'Outro',
  ],
  'Copywriter': [
    'Curso de Copywriting',
    'Graduação em Letras',
    'Outro',
  ],
  'Estudante de Odontologia': [
    'Graduação em Odontologia (em curso)',
    'Outro',
  ],
  'Estudante de Prótese Dentária': [
    'Curso Técnico em Prótese Dentária (em curso)',
    'Outro',
  ],
  'Estudante de Administração': [
    'Graduação em Administração (em curso)',
    'Outro',
  ],
  'Estudante de Marketing': [
    'Graduação em Marketing (em curso)',
    'Outro',
  ],
}

const ANOS = Array.from({ length: 40 }, (_, i) => (new Date().getFullYear() - i).toString())

export default function Academico() {
  const params = useLocalSearchParams()
  const profissaoObj = JSON.parse((params.profissao as string) || '{}')
  const extrasArr = JSON.parse((params.extras as string) || '[]')
  const todasProfissoes = [profissaoObj, ...extrasArr]
  
  const CURSOS = Array.from(new Set(
    todasProfissoes.flatMap((p: any) => CURSOS_POR_PROFISSAO[p.label] || [])
  ))

  const [formacoes, setFormacoes] = useState<any[]>([])
  const [curso, setCurso] = useState('')
  const [instituicao, setInstituicao] = useState('')
  const [ano, setAno] = useState('')
  const [modalCurso, setModalCurso] = useState(false)
  const [modalAno, setModalAno] = useState(false)

  const adicionar = () => {
    if (!curso || !instituicao) return
    setFormacoes(prev => [...prev, { curso, instituicao, ano }])
    setCurso('')
    setInstituicao('')
    setAno('')
  }

  const remover = (i: number) => {
    setFormacoes(prev => prev.filter((_, j) => j !== i))
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
        <View style={styles.bar} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 5 de 6</Text>
        <Text style={styles.title}>Sua formação{'\n'}acadêmica</Text>
        <Text style={styles.sub}>Adicione sua graduação, pós ou cursos relevantes</Text>

        {formacoes.map((f, i) => (
          <View key={i} style={styles.formacaoCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formacaoCurso}>{f.curso}</Text>
              <Text style={styles.formacaoInst}>{f.instituicao}{f.ano ? ' · ' + f.ano : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => remover(i)}>
              <Text style={styles.formacaoRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.form}>
          <Text style={styles.formTitle}>+ Adicionar formação</Text>

          <Text style={styles.label}>Curso *</Text>
          <TouchableOpacity style={styles.select} onPress={() => setModalCurso(true)}>
            <Text style={[styles.selectText, !curso && { color: '#AECEBE' }]}>
              {curso || 'Selecione o curso...'}
            </Text>
            <Text style={{ color: '#7A9E8E', fontSize: 18 }}>˅</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Instituição *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome da faculdade ou escola"
            placeholderTextColor="#AECEBE"
            value={instituicao}
            onChangeText={setInstituicao}
          />

          <Text style={styles.label}>Ano de conclusão</Text>
          <TouchableOpacity style={styles.select} onPress={() => setModalAno(true)}>
            <Text style={[styles.selectText, !ano && { color: '#AECEBE' }]}>
              {ano || 'Selecione o ano...'}
            </Text>
            <Text style={{ color: '#7A9E8E', fontSize: 18 }}>˅</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addBtn, (!curso || !instituicao) && styles.addBtnOff]}
            disabled={!curso || !instituicao}
            onPress={adicionar}
          >
            <Text style={styles.addBtnT}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push({
            pathname: '/(auth)/habilidades',
            params: { ...params, academico: JSON.stringify(formacoes) }
          })}
        >
          <Text style={styles.btnT}>
            {formacoes.length > 0 ? `Continuar com ${formacoes.length} formação${formacoes.length > 1 ? 'ões' : ''} →` : 'Pular →'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalCurso} animationType="slide" transparent onRequestClose={() => setModalCurso(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o curso</Text>
              <TouchableOpacity onPress={() => setModalCurso(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURSOS}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, curso === item && styles.modalItemOn]}
                  onPress={() => { setCurso(item); setModalCurso(false) }}
                >
                  <Text style={[styles.modalItemLabel, curso === item && { color: '#00A880', fontWeight: '800' }]}>{item}</Text>
                  {curso === item && <Text style={{ color: '#00A880' }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={modalAno} animationType="slide" transparent onRequestClose={() => setModalAno(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ano de conclusão</Text>
              <TouchableOpacity onPress={() => setModalAno(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={ANOS}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, ano === item && styles.modalItemOn]}
                  onPress={() => { setAno(item); setModalAno(false) }}
                >
                  <Text style={[styles.modalItemLabel, ano === item && { color: '#00A880', fontWeight: '800' }]}>{item}</Text>
                  {ano === item && <Text style={{ color: '#00A880' }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 20 },
  formacaoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#00A880', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  formacaoCurso: { fontSize: 14, fontWeight: '800', color: '#0A1C14' },
  formacaoInst: { fontSize: 12, color: '#7A9E8E', marginTop: 2 },
  formacaoRemove: { fontSize: 18, color: '#7A9E8E' },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#D0E8DA', marginTop: 8 },
  formTitle: { fontSize: 14, fontWeight: '800', color: '#00A880', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#3A6550', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 14, fontSize: 15, color: '#0A1C14', marginBottom: 14 },
  select: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  selectText: { fontSize: 15, color: '#0A1C14', flex: 1 },
  addBtn: { backgroundColor: '#007A6E', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  addBtnOff: { backgroundColor: '#AECEBE' },
  addBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0A1C14', flex: 1, textAlign: 'center' },
  modalClose: { fontSize: 20, color: '#7A9E8E' },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' },
  modalItemOn: { backgroundColor: 'rgba(0,168,128,0.06)' },
  modalItemLabel: { fontSize: 15, color: '#0A1C14', flex: 1 },
})
