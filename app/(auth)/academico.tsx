import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

const FORMACAO_POR_PROFISSAO: any = {
  'Cirurgião-Dentista': {
    tipo: 'superior',
    graduacao: 'Graduação em Odontologia',
    posGraduacoes: ['Implantodontia','Ortodontia','Endodontia','Periodontia','Odontopediatria','Estética','Cirurgia Oral','Prótese','HOF','Odontogeriatria'],
  },
  'Técnico em Prótese Dentária': {
    tipo: 'tecnico',
    cursoTecnico: 'Técnico em Prótese Dentária',
    cursosExtras: ['CAD/CAM','Cerâmica','Zircônia','Impressão 3D','Overdenture'],
  },
  'Técnico em Saúde Bucal (TSB)': {
    tipo: 'tecnico',
    cursoTecnico: 'Técnico em Saúde Bucal',
    cursosExtras: ['Radiologia','Biossegurança','Atendimento ao Paciente'],
  },
  'Auxiliar em Saúde Bucal (ASB)': {
    tipo: 'tecnico',
    cursoTecnico: 'Auxiliar em Saúde Bucal',
    cursosExtras: ['Biossegurança','Atendimento ao Paciente','Primeiros Socorros'],
  },
  'Auxiliar de Prótese Dentária': {
    tipo: 'tecnico',
    cursoTecnico: 'Auxiliar de Prótese Dentária',
    cursosExtras: ['Gesso','Acabamento','CAD/CAM Básico'],
  },
  'Gerente Comercial': { tipo: 'superior', graduacao: 'Graduação em Administração / Gestão Comercial', posGraduacoes: ['MBA em Vendas','MBA em Gestão','Liderança e Coaching'] },
  'Representante Comercial': { tipo: 'superior', graduacao: 'Graduação em Administração / Farmácia / Odontologia', posGraduacoes: ['MBA em Vendas','Gestão Comercial'] },
  'Recepcionista / Secretária': { tipo: 'tecnico', cursoTecnico: 'Secretariado / Administração', cursosExtras: ['Atendimento ao Cliente','CRM','Faturamento de Convênios'] },
  'CRC / Call Center': { tipo: 'tecnico', cursoTecnico: 'Curso de Atendimento ao Cliente', cursosExtras: ['Scripts de Vendas','Retenção'] },
  'Consultor de Vendas': { tipo: 'superior', graduacao: 'Graduação em Administração / Farmácia', posGraduacoes: ['MBA em Vendas','Gestão Comercial'] },
  'Gerente Administrativo': { tipo: 'superior', graduacao: 'Graduação em Administração', posGraduacoes: ['MBA em Gestão','MBA em Saúde','Liderança'] },
  'Auxiliar Administrativo': { tipo: 'tecnico', cursoTecnico: 'Técnico em Administração', cursosExtras: ['Excel Avançado','Rotinas Administrativas'] },
  'Financeiro': { tipo: 'superior', graduacao: 'Graduação em Ciências Contábeis / Administração', posGraduacoes: ['MBA em Finanças','Controladoria'] },
  'RH / Recursos Humanos': { tipo: 'superior', graduacao: 'Graduação em RH / Psicologia / Administração', posGraduacoes: ['MBA em Gestão de Pessoas','Coaching'] },
  'Contabilidade': { tipo: 'superior', graduacao: 'Graduação em Ciências Contábeis', posGraduacoes: ['MBA em Controladoria','Auditoria'] },
  'TI / Tecnologia': { tipo: 'superior', graduacao: 'Graduação em TI / Sistemas', posGraduacoes: ['MBA em TI','Segurança da Informação'] },
  'Marketing Digital': { tipo: 'superior', graduacao: 'Graduação em Marketing / Publicidade', posGraduacoes: ['MBA em Marketing Digital','Growth Hacking'] },
  'Designer Gráfico / UI': { tipo: 'superior', graduacao: 'Graduação em Design', posGraduacoes: ['UI/UX','Motion Graphics'] },
  'Filmmaker / Videomaker': { tipo: 'tecnico', cursoTecnico: 'Curso de Videomaking / Cinema', cursosExtras: ['Color Grading','Motion','Drone'] },
  'Fotógrafo': { tipo: 'tecnico', cursoTecnico: 'Curso de Fotografia', cursosExtras: ['Fotografia Clínica','Lightroom','Photoshop'] },
  'Social Media': { tipo: 'tecnico', cursoTecnico: 'Curso de Social Media / Marketing', cursosExtras: ['Copywriting','Reels','Engajamento'] },
  'Gestor de Tráfego': { tipo: 'tecnico', cursoTecnico: 'Curso de Tráfego Pago', cursosExtras: ['Google Ads','Meta Ads','Analytics'] },
  'Copywriter': { tipo: 'tecnico', cursoTecnico: 'Curso de Copywriting', cursosExtras: ['SEO','E-mail Marketing','Storytelling'] },
  'Estudante de Odontologia': { tipo: 'superior', graduacao: 'Graduação em Odontologia (em curso)', posGraduacoes: [] },
  'Estudante de Prótese Dentária': { tipo: 'tecnico', cursoTecnico: 'Técnico em Prótese Dentária (em curso)', cursosExtras: [] },
  'Estudante de Administração': { tipo: 'superior', graduacao: 'Graduação em Administração (em curso)', posGraduacoes: [] },
  'Estudante de Marketing': { tipo: 'superior', graduacao: 'Graduação em Marketing (em curso)', posGraduacoes: [] },
}

const ANOS = Array.from({ length: 40 }, (_, i) => (new Date().getFullYear() - i).toString())

export default function Academico() {
  const { cadastroData, setCadastroData } = useAuthStore()
  const todasProfissoes = [cadastroData.profissao, ...(cadastroData.extras || [])].filter(Boolean)

  const [formacoes, setFormacoes] = useState<{ [key: string]: any }>({})
  const [modalAno, setModalAno] = useState<{ prof: string, campo: string, idx?: number } | null>(null)
  const [modalPos, setModalPos] = useState<{ prof: string, lista: string[] } | null>(null)

  const updateFormacao = (profLabel: string, campo: string, valor: any) => {
    setFormacoes(prev => ({
      ...prev,
      [profLabel]: { ...(prev[profLabel] || {}), [campo]: valor }
    }))
  }

  const addPos = (profLabel: string, pos: string) => {
    setFormacoes(prev => {
      const atual = prev[profLabel]?.posGraduacoes || []
      if (atual.some((p: any) => p.titulo === pos)) return prev
      return {
        ...prev,
        [profLabel]: {
          ...(prev[profLabel] || {}),
          posGraduacoes: [...atual, { titulo: pos, instituicao: '', ano: '' }]
        }
      }
    })
    setModalPos(null)
  }

  const removePos = (profLabel: string, idx: number) => {
    setFormacoes(prev => ({
      ...prev,
      [profLabel]: {
        ...(prev[profLabel] || {}),
        posGraduacoes: (prev[profLabel]?.posGraduacoes || []).filter((_: any, i: number) => i !== idx)
      }
    }))
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.logo}><Text style={{ color: '#F5C800' }}>Go</Text><Text style={{ color: '#fff' }}>Denth</Text></Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.progressRow}>
        {[1,2,3,4,5].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
        {[6,7].map(i => <View key={i} style={styles.bar} />)}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 5 de 7</Text>
        <Text style={styles.title}>Formação{'\n'}Acadêmica</Text>
        <Text style={styles.sub}>Preencha sua formação para cada área de atuação</Text>

        {todasProfissoes.map((prof: any) => {
          const config = FORMACAO_POR_PROFISSAO[prof.label]
          if (!config) return null
          const f = formacoes[prof.label] || {}

          return (
            <View key={prof.label} style={styles.section}>
              <View style={[styles.sectionHeader, { borderLeftColor: prof.cor || '#00A880' }]}>
                <Text style={[styles.sectionTitle, { color: prof.cor || '#00A880' }]}>{prof.label}</Text>
              </View>

              {config.tipo === 'superior' ? (
                <>
                  <Text style={styles.subLabel}>📚 Graduação</Text>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{config.graduacao}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nome da instituição"
                      placeholderTextColor="#AECEBE"
                      value={f.graduacaoInst || ''}
                      onChangeText={v => updateFormacao(prof.label, 'graduacaoInst', v)}
                    />
                    <TouchableOpacity style={styles.select} onPress={() => setModalAno({ prof: prof.label, campo: 'graduacaoAno' })}>
                      <Text style={[styles.selectText, !f.graduacaoAno && { color: '#AECEBE' }]}>{f.graduacaoAno || 'Ano de conclusão'}</Text>
                      <Text style={{ color: '#7A9E8E' }}>˅</Text>
                    </TouchableOpacity>
                  </View>

                  {config.posGraduacoes.length > 0 && (
                    <>
                      <Text style={styles.subLabel}>🎓 Pós-graduação</Text>
                      {(f.posGraduacoes || []).map((pos: any, idx: number) => (
                        <View key={idx} style={styles.card}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={styles.cardTitle}>{pos.titulo}</Text>
                            <TouchableOpacity onPress={() => removePos(prof.label, idx)}>
                              <Text style={{ color: '#7A9E8E', fontSize: 16 }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                          <TextInput
                            style={styles.input}
                            placeholder="Nome da instituição"
                            placeholderTextColor="#AECEBE"
                            value={pos.instituicao}
                            onChangeText={v => {
                              const novas = [...(f.posGraduacoes || [])]
                              novas[idx] = { ...novas[idx], instituicao: v }
                              updateFormacao(prof.label, 'posGraduacoes', novas)
                            }}
                          />
                          <TouchableOpacity style={styles.select} onPress={() => setModalAno({ prof: prof.label, campo: 'posAno', idx })}>
                            <Text style={[styles.selectText, !pos.ano && { color: '#AECEBE' }]}>{pos.ano || 'Ano de conclusão'}</Text>
                            <Text style={{ color: '#7A9E8E' }}>˅</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addBtn} onPress={() => setModalPos({ prof: prof.label, lista: config.posGraduacoes })}>
                        <Text style={styles.addBtnT}>+ Adicionar pós-graduação</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.subLabel}>📋 Curso Técnico</Text>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{config.cursoTecnico}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nome da instituição"
                      placeholderTextColor="#AECEBE"
                      value={f.tecnicoInst || ''}
                      onChangeText={v => updateFormacao(prof.label, 'tecnicoInst', v)}
                    />
                    <TouchableOpacity style={styles.select} onPress={() => setModalAno({ prof: prof.label, campo: 'tecnicoAno' })}>
                      <Text style={[styles.selectText, !f.tecnicoAno && { color: '#AECEBE' }]}>{f.tecnicoAno || 'Ano de conclusão'}</Text>
                      <Text style={{ color: '#7A9E8E' }}>˅</Text>
                    </TouchableOpacity>
                  </View>

                  {config.cursosExtras.length > 0 && (
                    <>
                      <Text style={styles.subLabel}>➕ Cursos Extras</Text>
                      {(f.cursosExtras || []).map((curso: any, idx: number) => (
                        <View key={idx} style={styles.card}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={styles.cardTitle}>{curso.titulo}</Text>
                            <TouchableOpacity onPress={() => {
                              const novas = (f.cursosExtras || []).filter((_: any, i: number) => i !== idx)
                              updateFormacao(prof.label, 'cursosExtras', novas)
                            }}>
                              <Text style={{ color: '#7A9E8E', fontSize: 16 }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                          <TextInput
                            style={styles.input}
                            placeholder="Nome da instituição"
                            placeholderTextColor="#AECEBE"
                            value={curso.instituicao}
                            onChangeText={v => {
                              const novas = [...(f.cursosExtras || [])]
                              novas[idx] = { ...novas[idx], instituicao: v }
                              updateFormacao(prof.label, 'cursosExtras', novas)
                            }}
                          />
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addBtn} onPress={() => setModalPos({ prof: prof.label, lista: config.cursosExtras })}>
                        <Text style={styles.addBtnT}>+ Adicionar curso extra</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>
          )
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => {
          setCadastroData({ academico: formacoes })
          router.push('/(auth)/habilidades')
        }}>
          <Text style={styles.btnT}>Continuar →</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!modalAno} animationType="slide" transparent onRequestClose={() => setModalAno(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ano de conclusão</Text>
              <TouchableOpacity onPress={() => setModalAno(null)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <FlatList
              data={['Em andamento', ...ANOS]}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => {
                  if (!modalAno) return
                  if (modalAno.campo === 'posAno' && modalAno.idx !== undefined) {
                    const novas = [...(formacoes[modalAno.prof]?.posGraduacoes || [])]
                    novas[modalAno.idx] = { ...novas[modalAno.idx], ano: item }
                    updateFormacao(modalAno.prof, 'posGraduacoes', novas)
                  } else {
                    updateFormacao(modalAno.prof, modalAno.campo, item)
                  }
                  setModalAno(null)
                }}>
                  <Text style={styles.modalItemLabel}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={!!modalPos} animationType="slide" transparent onRequestClose={() => setModalPos(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar</Text>
              <TouchableOpacity onPress={() => setModalPos(null)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <FlatList
              data={modalPos?.lista || []}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => {
                  if (!modalPos) return
                  const campo = FORMACAO_POR_PROFISSAO[modalPos.prof]?.tipo === 'superior' ? 'posGraduacoes' : 'cursosExtras'
                  if (campo === 'posGraduacoes') {
                    addPos(modalPos.prof, item)
                  } else {
                    const atual = formacoes[modalPos.prof]?.cursosExtras || []
                    updateFormacao(modalPos.prof, 'cursosExtras', [...atual, { titulo: item, instituicao: '' }])
                    setModalPos(null)
                  }
                }}>
                  <Text style={styles.modalItemLabel}>{item}</Text>
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
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007A6E' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#F5C800' },
  scroll: { padding: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 20 },
  section: { marginBottom: 28 },
  sectionHeader: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  subLabel: { fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#0A1C14', marginBottom: 10 },
  input: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 10, padding: 12, fontSize: 14, color: '#0A1C14', marginBottom: 10 },
  select: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 14, color: '#0A1C14', flex: 1 },
  addBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 2, borderColor: '#00A880', alignItems: 'center', borderStyle: 'dashed' },
  addBtnT: { fontSize: 13, fontWeight: '700', color: '#00A880' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0A1C14', flex: 1, textAlign: 'center' },
  modalClose: { fontSize: 20, color: '#7A9E8E' },
  modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' },
  modalItemLabel: { fontSize: 15, color: '#0A1C14' },
})
