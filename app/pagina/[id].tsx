import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Linking, Platform, Alert,
  Modal, TextInput, KeyboardAvoidingView, Dimensions,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

const API_BASE = 'https://godenth-api.onrender.com'
const SCREEN_W = Dimensions.get('window').width
const PORTFOLIO_SIZE = Math.floor((SCREEN_W - 32 - 8) / 3)

const CAT_COR: Record<string, string> = {
  clinica: Colors.clinica,
  laboratorio: Colors.laboratorio,
  fabricante: Colors.fabricante,
  ensino: Colors.ensino,
  marketing: Colors.marketing,
  gestao: Colors.gestao,
  servicos: Colors.servicos,
}

const CAT_LABEL: Record<string, string> = {
  clinica: 'Clínica Odontológica',
  laboratorio: 'Laboratório de Prótese',
  fabricante: 'Fabricante / Distribuidora',
  ensino: 'Instituição de Ensino',
  marketing: 'Marketing & Comunicação',
  gestao: 'Gestão & Consultoria',
  servicos: 'Serviços Profissionais',
}

const ABAS = ['Sobre', 'Serviços', 'Portfólio', 'Vagas', 'Cursos/Eventos']
const TIPOS_CONTRATO = ['CLT', 'PJ', 'Estágio', 'Freelancer']
const MODALIDADES_CURSO = ['Presencial', 'Online', 'Híbrido']
const TIPOS_EVENTO = ['Congresso', 'Feira', 'Simpósio', 'Outro']

type ModalTipo = 'vaga' | 'curso' | 'treinamento' | 'palestra' | 'evento' | null

function resolveUrl(url?: string | null) {
  if (!url) return null
  return url.startsWith('http') ? url : API_BASE + url
}

const maskDate = (val: string) => {
  const n = val.replace(/\D/g, '').slice(0, 8)
  if (n.length <= 2) return n
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`
}
const dateDisplayToIso = (display: string) => {
  const p = display.split('/')
  if (p.length !== 3 || p[2].length < 4) return ''
  return `${p[2]}-${p[1]}-${p[0]}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mm = Math.floor(diff / 60000)
  if (mm < 1) return 'agora'
  if (mm < 60) return `${mm}m`
  const h = Math.floor(mm / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ─── Menu: Engrenagem ─────────────────────────────────────────────────────────
function GearMenu({ visible, onClose, pageId, onEditar, onMetricas, onCandidatos, onInscritos, onExcluir }: {
  visible: boolean; onClose: () => void; pageId: string
  onEditar: () => void; onMetricas: () => void; onCandidatos: () => void
  onInscritos: () => void; onExcluir: () => void
}) {
  const opcoes = [
    { emoji: '✏️', label: 'Editar informações', action: onEditar, danger: false },
    { emoji: '📊', label: 'Métricas', action: onMetricas, danger: false },
    { emoji: '👥', label: 'Candidatos', action: onCandidatos, danger: false },
    { emoji: '🎓', label: 'Inscritos', action: onInscritos, danger: false },
    { emoji: '🗑️', label: 'Excluir página', action: onExcluir, danger: true },
  ]
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>Gerenciar página</Text>
          {opcoes.map((o, i) => (
            <TouchableOpacity
              key={i}
              style={[m.menuItem, i === opcoes.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => { onClose(); o.action() }}
            >
              <Text style={m.menuEmoji}>{o.emoji}</Text>
              <Text style={[m.menuLabel, o.danger && { color: '#EF4444' }]}>{o.label}</Text>
              {!o.danger && <Text style={m.menuArrow}>›</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

// ─── Modal: Métricas ──────────────────────────────────────────────────────────
function MetricasModal({ visible, onClose, metricas, loading }: {
  visible: boolean; onClose: () => void; metricas: any; loading: boolean
}) {
  const stats = metricas ? [
    { emoji: '❤️', label: 'Curtidas', value: metricas.curtidas },
    { emoji: '💼', label: 'Vagas abertas', value: metricas.vagas_abertas },
    { emoji: '👥', label: 'Candidatos', value: metricas.total_candidatos },
    { emoji: '📢', label: 'Publicações', value: metricas.publicacoes },
    { emoji: '🛠️', label: 'Serviços', value: metricas.servicos },
    { emoji: '🖼️', label: 'Portfólio', value: metricas.fotos_portfolio },
  ] : []

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>📊 Métricas</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 32 }} />
          ) : (
            <View style={m.metricsGrid}>
              {stats.map((st, i) => (
                <View key={i} style={m.metricCard}>
                  <Text style={m.metricEmoji}>{st.emoji}</Text>
                  <Text style={m.metricValue}>{st.value ?? '—'}</Text>
                  <Text style={m.metricLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity style={m.cancel} onPress={onClose}>
            <Text style={m.cancelT}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const STATUS_COR: Record<string, string> = { em_analise: '#C49800', aprovado: '#00A880', reprovado: '#EF4444', enviada: '#C49800' }
const STATUS_LABEL: Record<string, string> = { em_analise: 'Em análise', aprovado: '✓ Aprovado', reprovado: '✗ Reprovado', enviada: 'Em análise' }

// ─── Modal: Candidatos ────────────────────────────────────────────────────────
function CandidatosModal({ visible, onClose, pageId, candidatos: initialCandidatos, loading }: {
  visible: boolean; onClose: () => void; pageId: string; candidatos: any[]; loading: boolean
}) {
  const [candidatos, setCandidatos] = useState<any[]>(initialCandidatos)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => { setCandidatos(initialCandidatos) }, [initialCandidatos])

  const groupedByVaga: Record<string, any[]> = {}
  candidatos.forEach(c => {
    const key = `${c.vaga_id}|${c.cargo}`
    if (!groupedByVaga[key]) groupedByVaga[key] = []
    groupedByVaga[key].push(c)
  })

  const updateStatus = async (c: any, status: string) => {
    setUpdatingId(c.id)
    try {
      await api.put(`/vagas/${c.vaga_id}/candidaturas/${c.id}/status`, { status })
      setCandidatos(prev => prev.map(x => x.id === c.id ? { ...x, status } : x))
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível atualizar o status.')
    } finally { setUpdatingId(null) }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={fs.root}>
        <View style={fs.header}>
          <TouchableOpacity onPress={onClose} style={fs.closeBtn}>
            <Text style={fs.closeT}>←</Text>
          </TouchableOpacity>
          <Text style={fs.title}>👥 Candidatos</Text>
          <View style={{ width: 40 }} />
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : candidatos.length === 0 ? (
          <View style={fs.emptyWrap}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={fs.emptyT}>Nenhum candidato ainda</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {Object.entries(groupedByVaga).map(([key, cands]) => {
              const cargo = cands[0].cargo
              const contrato = cands[0].contrato
              return (
                <View key={key}>
                  <View style={fs.groupHeader}>
                    <Text style={fs.groupTitle}>{cargo}</Text>
                    {contrato && <View style={fs.tag}><Text style={fs.tagT}>{contrato}</Text></View>}
                    <Text style={fs.groupCount}>{cands.length} candidato{cands.length !== 1 ? 's' : ''}</Text>
                  </View>
                  {cands.map(c => {
                    const pct = c.porcentagem_compatibilidade ?? 0
                    const barCor = pct > 70 ? '#00A880' : pct >= 40 ? '#C49800' : '#EF4444'
                    const statusCor = STATUS_COR[c.status] || '#C49800'
                    const respostasTexto: string[] = c.respostas || []
                    const reqResp = c.respostas_requisitos || {}
                    const obrigResp: Array<{req: string; sim: boolean}> = reqResp.obrigatorios || []
                    const desejResp: Array<{req: string; sim: boolean}> = reqResp.desejaveis || []
                    const perguntas: string[] = c.perguntas || []
                    const hasRespostas = obrigResp.length > 0 || desejResp.length > 0 || respostasTexto.length > 0
                    const isExpanded = expandedId === c.id
                    return (
                      <View key={c.id} style={fs.itemCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={fs.itemNome}>{c.candidato_nome}</Text>
                            {c.tipo_profissional && <Text style={fs.itemSub}>{c.tipo_profissional}</Text>}
                            {(c.candidato_cidade || c.candidato_estado) && (
                              <Text style={fs.itemSub}>📍 {c.candidato_cidade}{c.candidato_estado ? ` · ${c.candidato_estado}` : ''}</Text>
                            )}
                          </View>
                          <View style={[fs.statusBadge, { backgroundColor: statusCor + '18', borderColor: statusCor + '50' }]}>
                            <Text style={[fs.statusBadgeT, { color: statusCor }]}>{STATUS_LABEL[c.status] || c.status}</Text>
                          </View>
                        </View>

                        {/* % declarada pelo candidato */}
                        <View style={{ gap: 3, marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#7A9E8E', textTransform: 'uppercase' }}>Declarado pelo candidato</Text>
                            <Text style={{ fontSize: 13, fontWeight: '900', color: barCor }}>{pct}%</Text>
                          </View>
                          <View style={{ height: 6, backgroundColor: '#EEF7F2', borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: barCor, borderRadius: 3 }} />
                          </View>
                        </View>

                        {/* Respostas expandíveis */}
                        {hasRespostas && (
                          <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : c.id)}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: isExpanded ? 8 : 0 }}>
                              {isExpanded ? '▲ Ocultar respostas' : '▼ Ver respostas declaradas'}
                            </Text>
                            {isExpanded && (
                              <View style={{ gap: 6 }}>
                                {obrigResp.map((item, i) => (
                                  <View key={i} style={fs.respostaCard}>
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#7A9E8E', textTransform: 'uppercase', marginBottom: 2 }}>Obrigatório</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Text style={[fs.respostaT, { flex: 1 }]}>{item.req}</Text>
                                      <Text style={{ fontSize: 13, fontWeight: '800', color: item.sim ? '#00A880' : '#EF4444' }}>
                                        {item.sim ? '✅ Sim' : '❌ Não'}
                                      </Text>
                                    </View>
                                  </View>
                                ))}
                                {desejResp.map((item, i) => (
                                  <View key={i} style={fs.respostaCard}>
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#7A9E8E', textTransform: 'uppercase', marginBottom: 2 }}>Desejável</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Text style={[fs.respostaT, { flex: 1 }]}>{item.req}</Text>
                                      <Text style={{ fontSize: 13, fontWeight: '800', color: item.sim ? '#1A6FD4' : '#AECEBE' }}>
                                        {item.sim ? '🔵 Sim' : '⬜ Não'}
                                      </Text>
                                    </View>
                                  </View>
                                ))}
                                {respostasTexto.map((r, i) => (
                                  <View key={i} style={fs.respostaCard}>
                                    {perguntas[i] && (
                                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#7A9E8E', marginBottom: 2 }}>
                                        {i + 1}. {perguntas[i]}
                                      </Text>
                                    )}
                                    <Text style={fs.respostaT}>{r}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </TouchableOpacity>
                        )}

                        {/* Botões de status */}
                        {updatingId === c.id ? (
                          <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: 8 }} />
                        ) : (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            {c.status !== 'aprovado' && (
                              <TouchableOpacity style={fs.btnAprovar} onPress={() => updateStatus(c, 'aprovado')}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#00A880' }}>✓ Aprovar</Text>
                              </TouchableOpacity>
                            )}
                            {c.status !== 'reprovado' && (
                              <TouchableOpacity style={fs.btnReprovar} onPress={() => updateStatus(c, 'reprovado')}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444' }}>✗ Reprovar</Text>
                              </TouchableOpacity>
                            )}
                            {c.status !== 'em_analise' && (
                              <TouchableOpacity style={fs.btnAnalise} onPress={() => updateStatus(c, 'em_analise')}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#C49800' }}>↩ Análise</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                        <Text style={fs.itemDate}>{timeAgo(c.created_at)}</Text>
                      </View>
                    )
                  })}
                </View>
              )
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  )
}

// ─── Modal: Inscritos ─────────────────────────────────────────────────────────
function InscritosModal({ visible, onClose, publicacoes, loading }: {
  visible: boolean; onClose: () => void; publicacoes: any[]; loading: boolean
}) {
  const TIPO_EMOJI: Record<string, string> = { curso: '🎓', treinamento: '🏋️', palestra: '🎤', evento: '🗓️' }
  const TIPO_LABEL: Record<string, string> = { curso: 'Curso', treinamento: 'Treinamento', palestra: 'Palestra', evento: 'Evento' }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={fs.root}>
        <View style={fs.header}>
          <TouchableOpacity onPress={onClose} style={fs.closeBtn}>
            <Text style={fs.closeT}>←</Text>
          </TouchableOpacity>
          <Text style={fs.title}>🎓 Inscritos</Text>
          <View style={{ width: 40 }} />
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : publicacoes.length === 0 ? (
          <View style={fs.emptyWrap}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={fs.emptyT}>Nenhum curso ou evento publicado</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            <View style={fs.infoBox}>
              <Text style={fs.infoBoxT}>As inscrições são feitas externamente pelo link de cada publicação. Acompanhe pelo seu sistema de inscrições.</Text>
            </View>
            {publicacoes.map(pub => {
              const dados = pub.dados || {}
              return (
                <View key={pub.id} style={fs.itemCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 16 }}>{TIPO_EMOJI[pub.tipo] || '📢'}</Text>
                    <Text style={fs.itemNome}>{pub.titulo}</Text>
                  </View>
                  <Text style={fs.itemSub}>{TIPO_LABEL[pub.tipo] || pub.tipo}</Text>
                  {dados.data && <Text style={fs.itemSub}>📅 {dados.data_inicio || dados.data}</Text>}
                  {dados.local && <Text style={fs.itemSub}>📍 {dados.local}</Text>}
                  {dados.link_inscricao && (
                    <TouchableOpacity onPress={() => Linking.openURL(
                      dados.link_inscricao.startsWith('http') ? dados.link_inscricao : `https://${dados.link_inscricao}`
                    )}>
                      <Text style={fs.link}>🔗 Ver inscrições</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={fs.itemDate}>{timeAgo(pub.created_at)}</Text>
                </View>
              )
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  )
}

// ─── Menu: Publicar ────────────────────────────────────────────────────────────
function PublicarMenu({ visible, onSelect, onClose }: {
  visible: boolean; onSelect: (tipo: ModalTipo) => void; onClose: () => void
}) {
  const opcoes: { key: ModalTipo; emoji: string; label: string }[] = [
    { key: 'vaga', emoji: '💼', label: 'Vaga' },
    { key: 'curso', emoji: '🎓', label: 'Curso' },
    { key: 'treinamento', emoji: '🏋️', label: 'Treinamento' },
    { key: 'palestra', emoji: '🎤', label: 'Palestra' },
    { key: 'evento', emoji: '🗓️', label: 'Evento' },
  ]
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>O que deseja publicar?</Text>
          {opcoes.map(o => (
            <TouchableOpacity
              key={o.key as string}
              style={m.menuItem}
              onPress={() => { onClose(); onSelect(o.key) }}
            >
              <Text style={m.menuEmoji}>{o.emoji}</Text>
              <Text style={m.menuLabel}>{o.label}</Text>
              <Text style={m.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

// ─── Modal: Adicionar Serviço ─────────────────────────────────────────────────
function AddServicoModal({ visible, pageId, onClose, onCreated }: {
  visible: boolean; pageId: string; onClose: () => void; onCreated: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setTitulo(''); setDescricao('') }
  const close = () => { reset(); onClose() }

  const salvar = async () => {
    if (!titulo.trim()) return Alert.alert('Atenção', 'Informe o nome do serviço.')
    setSaving(true)
    try {
      await api.post(`/pages/${pageId}/services`, { titulo: titulo.trim(), descricao: descricao.trim() || null })
      reset(); onCreated(); onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível salvar.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>🛠️ Adicionar Serviço</Text>
          <Text style={m.label}>Nome do serviço *</Text>
          <TextInput style={m.input} placeholder="Ex: Implante Dentário" placeholderTextColor={Colors.text3} value={titulo} onChangeText={setTitulo} autoFocus />
          <Text style={m.label}>Descrição</Text>
          <TextInput style={[m.input, m.textarea]} placeholder="Descreva brevemente o serviço…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} textAlignVertical="top" />
          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Salvar Serviço</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}><Text style={m.cancelT}>Cancelar</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const TIPOS_ABREV_VAGA: Record<string, string> = {
  'Cirurgião-Dentista': 'Dentista', 'Técnico em Prótese Dentária': 'Prótese',
  'Auxiliar de Saúde Bucal (ASB)': 'ASB', 'Técnico em Saúde Bucal (TSB)': 'TSB',
  Recepcionista: 'Recep.', Marketing: 'Mkt',
}

const CARGOS_VAGA = [
  'Cirurgião-Dentista', 'Técnico em Prótese Dentária', 'ASB', 'TSB',
  'Recepcionista', 'Auxiliar Administrativo', 'Marketing', 'Gestor Comercial', 'TI',
]

const CARGO_PARA_OPCAO: Record<string, string> = {
  'Cirurgião-Dentista': 'Cirurgião-Dentista',
  'Técnico em Prótese Dentária': 'Técnico em Prótese Dentária',
  'ASB': 'Auxiliar de Saúde Bucal (ASB)',
  'TSB': 'Técnico em Saúde Bucal (TSB)',
  'Recepcionista': 'Recepcionista',
  'Marketing': 'Marketing',
}

// ─── Modal IBGE (reutilizável dentro de VagaModal) ───────────────────────────
function VIBGEModal({ visible, title, data, onSelect, onClose, loading = false }: {
  visible: boolean; title: string; data: any[]; onSelect: (item: any) => void; onClose: () => void; loading?: boolean
}) {
  const [busca, setBusca] = useState('')
  const filtered = data.filter((d: any) =>
    (d.nome || d.sigla || '').toLowerCase().includes(busca.toLowerCase())
  )
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, { maxHeight: '80%' }]}>
          <View style={m.handle} />
          <Text style={m.title}>{title}</Text>
          <TextInput
            style={[m.input, { marginBottom: 8 }]}
            value={busca} onChangeText={setBusca}
            placeholder="Buscar..." placeholderTextColor={Colors.text3} autoFocus
          />
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border }}
                  onPress={() => { setBusca(''); onSelect(item) }}
                >
                  <Text style={{ fontSize: 15, color: Colors.text, fontWeight: '600' }}>{item.nome}</Text>
                  {item.sigla && <Text style={{ fontSize: 12, color: Colors.text3 }}>{item.sigla}</Text>}
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity
            style={{ backgroundColor: Colors.bg, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 }}
            onPress={onClose}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text2 }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─── Modal: Vaga (4 etapas) ───────────────────────────────────────────────────
function VagaModal({ visible, pageId, pageName, onClose, onCreated }: {
  visible: boolean; pageId: string; pageName: string; onClose: () => void; onCreated: () => void
}) {
  const [step, setStep] = useState(1)
  const [cargo, setCargo] = useState('')
  const [contrato, setContrato] = useState('')
  const [salarioMin, setSalarioMin] = useState('')
  const [salarioMax, setSalarioMax] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [prazo, setPrazo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [beneficios, setBeneficios] = useState('')
  const [opcoes, setOpcoes] = useState<any>({})
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [reqObrig, setReqObrig] = useState<string[]>([])
  const [reqDesej, setReqDesej] = useState<string[]>([])
  const [novoObrig, setNovoObrig] = useState('')
  const [novoDesej, setNovoDesej] = useState('')
  const [perguntas, setPerguntas] = useState<string[]>([])
  const [novaPergunta, setNovaPergunta] = useState('')
  const [saving, setSaving] = useState(false)
  const [cargoModal, setCargoModal] = useState(false)
  const [estadoModal, setEstadoModal] = useState(false)
  const [cidadeModal, setCidadeModal] = useState(false)
  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)

  useEffect(() => {
    if (!visible) return
    api.get('/vagas/opcoes').then(r => setOpcoes(r.data.opcoes || {})).catch(() => {})
    if (estados.length === 0) {
      fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(r => r.json()).then(setEstados).catch(() => {})
    }
  }, [visible])

  const reset = () => {
    setStep(1); setCargo(''); setContrato(''); setSalarioMin(''); setSalarioMax('')
    setCidade(''); setEstado(''); setPrazo(''); setDescricao(''); setBeneficios('')
    setTipoFiltro(''); setReqObrig([]); setReqDesej([])
    setNovoObrig(''); setNovoDesej(''); setPerguntas([]); setNovaPergunta('')
    setCidades([])
  }
  const close = () => { reset(); onClose() }

  const onSelectEstado = (e: any) => {
    setEstado(e.sigla)
    setCidade('')
    setCidades([])
    setEstadoModal(false)
    setLoadingCidades(true)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${e.sigla}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then(data => { setCidades(data); setLoadingCidades(false) })
      .catch(() => setLoadingCidades(false))
  }

  const getChipState = (c: string) => reqObrig.includes(c) ? 'obrig' : reqDesej.includes(c) ? 'desej' : 'none'
  const toggleChip = (c: string) => {
    const st = getChipState(c)
    if (st === 'none') setReqObrig([...reqObrig, c])
    else if (st === 'obrig') { setReqObrig(reqObrig.filter(x => x !== c)); setReqDesej([...reqDesej, c]) }
    else setReqDesej(reqDesej.filter(x => x !== c))
  }
  const addManual = (val: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const v = val.trim()
    if (v && !list.includes(v)) setList([...list, v])
    setInput('')
  }
  const addPergunta = () => { const v = novaPergunta.trim(); if (v) { setPerguntas([...perguntas, v]); setNovaPergunta('') } }

  const chipPool = tipoFiltro
    ? [...(opcoes[tipoFiltro]?.especialidades || []), ...(opcoes[tipoFiltro]?.habilidades || [])]
    : [...new Set(Object.values(opcoes).flatMap((o: any) => [...(o.especialidades || []), ...(o.habilidades || [])]) as string[])]

  const salvar = async () => {
    setSaving(true)
    try {
      await api.post('/vagas', {
        page_id: parseInt(pageId), cargo: cargo.trim(), contrato,
        salario_min: salarioMin ? parseInt(salarioMin) : null,
        salario_max: salarioMax ? parseInt(salarioMax) : null,
        cidade: cidade.trim() || null, estado: estado || null,
        prazo_candidatura: dateDisplayToIso(prazo) || null,
        descricao: descricao.trim() || null, beneficios: beneficios.trim() || null,
        requisitos_obrigatorios: reqObrig, requisitos_desejaveis: reqDesej, perguntas,
      })
      reset(); onCreated(); onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar a vaga.')
    } finally { setSaving(false) }
  }

  const stepLabels = ['Informações', 'Requisitos', 'Perguntas', 'Revisão']

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.sheetFull}>
          <View style={m.handle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <TouchableOpacity onPress={close}><Text style={{ fontSize: 18, color: '#7A9E8E', fontWeight: '700', width: 32 }}>✕</Text></TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={m.title}>📋 Nova Vaga</Text>
              <Text style={{ fontSize: 11, color: Colors.text3 }}>{stepLabels[step - 1]} · Etapa {step} de 4</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 5, alignSelf: 'center', marginBottom: 14 }}>
            {[1,2,3,4].map(n => (
              <View key={n} style={{ width: n === step ? 20 : 7, height: 7, borderRadius: 4, backgroundColor: n <= step ? Colors.primary : '#D0E8DA' }} />
            ))}
          </View>

          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={m.subtitle}>Publicando por: {pageName}</Text>
              <Text style={m.label}>Cargo *</Text>
              <TouchableOpacity style={[m.input, { justifyContent: 'center' }]} onPress={() => setCargoModal(true)}>
                <Text style={{ fontSize: 14, color: cargo ? Colors.text : Colors.text3 }}>{cargo || 'Selecionar cargo...'}</Text>
              </TouchableOpacity>
              <Text style={m.label}>Tipo de contrato *</Text>
              <View style={m.chips}>
                {TIPOS_CONTRATO.map(c => (
                  <TouchableOpacity key={c} style={[m.chip, contrato === c && m.chipOn]} onPress={() => setContrato(c)}>
                    <Text style={[m.chipT, contrato === c && m.chipTOn]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={m.label}>Faixa salarial (R$, opcional)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[m.input, { flex: 1 }]} placeholder="Mínimo" placeholderTextColor={Colors.text3} value={salarioMin} onChangeText={setSalarioMin} keyboardType="numeric" />
                <TextInput style={[m.input, { flex: 1 }]} placeholder="Máximo" placeholderTextColor={Colors.text3} value={salarioMax} onChangeText={setSalarioMax} keyboardType="numeric" />
              </View>
              <Text style={m.label}>Estado</Text>
              <TouchableOpacity style={[m.input, { justifyContent: 'center' }]} onPress={() => setEstadoModal(true)}>
                <Text style={{ fontSize: 14, color: estado ? Colors.text : Colors.text3 }}>
                  {estado ? (estados.find(e => e.sigla === estado)?.nome || estado) : 'Selecionar estado...'}
                </Text>
              </TouchableOpacity>
              <Text style={m.label}>Cidade</Text>
              <TouchableOpacity
                style={[m.input, { justifyContent: 'center', opacity: estado ? 1 : 0.4 }]}
                onPress={() => { if (estado) setCidadeModal(true) }}
              >
                <Text style={{ fontSize: 14, color: cidade ? Colors.text : Colors.text3 }}>
                  {cidade || (estado ? 'Selecionar cidade...' : 'Selecione o estado primeiro')}
                </Text>
              </TouchableOpacity>
              <Text style={m.label}>Prazo (opcional)</Text>
              <TextInput style={m.input} placeholder="DD/MM/AAAA" placeholderTextColor={Colors.text3} value={prazo} onChangeText={v => setPrazo(maskDate(v))} keyboardType="numeric" maxLength={10} />
              <Text style={m.label}>Descrição</Text>
              <TextInput style={[m.input, m.textarea]} placeholder="Descreva os requisitos…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} textAlignVertical="top" />
              <Text style={m.label}>Benefícios</Text>
              <TextInput style={m.input} placeholder="Ex: VR, VT, plano..." placeholderTextColor={Colors.text3} value={beneficios} onChangeText={setBeneficios} />
            </ScrollView>
          )}

          {step === 2 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 12, color: Colors.text3, marginBottom: 8 }}>🟢 Obrigatório · 🔵 Desejável · Toque para alternar</Text>
              <Text style={m.label}>Filtrar por profissão</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                  <TouchableOpacity style={[m.chip, !tipoFiltro && m.chipOn]} onPress={() => setTipoFiltro('')}>
                    <Text style={[m.chipT, !tipoFiltro && m.chipTOn]}>Todos</Text>
                  </TouchableOpacity>
                  {Object.keys(opcoes).map(t => (
                    <TouchableOpacity key={t} style={[m.chip, tipoFiltro === t && m.chipOn]} onPress={() => setTipoFiltro(t)}>
                      <Text style={[m.chipT, tipoFiltro === t && m.chipTOn]}>{TIPOS_ABREV_VAGA[t] || t.substring(0, 8)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={m.label}>Chips de requisitos</Text>
              <View style={m.chips}>
                {(chipPool as string[]).map((c, i) => {
                  const st = getChipState(c)
                  return (
                    <TouchableOpacity key={i} style={[m.chip,
                      st === 'obrig' && { backgroundColor: '#E6F5EE', borderColor: Colors.primary },
                      st === 'desej' && { backgroundColor: '#EBF2FC', borderColor: '#1A6FD4' },
                    ]} onPress={() => toggleChip(c)}>
                      <Text style={[m.chipT, st === 'obrig' && { color: Colors.primary, fontWeight: '800' }, st === 'desej' && { color: '#1A6FD4', fontWeight: '800' }]}>
                        {st === 'obrig' ? '🟢 ' : st === 'desej' ? '🔵 ' : ''}{c}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <Text style={m.label}>Adicionar obrigatório</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[m.input, { flex: 1 }]} value={novoObrig} onChangeText={setNovoObrig} placeholder="Digitar..." placeholderTextColor={Colors.text3} onSubmitEditing={() => addManual(novoObrig, reqObrig, setReqObrig, setNovoObrig)} returnKeyType="done" />
                <TouchableOpacity style={{ backgroundColor: Colors.primary, borderRadius: 10, width: 44, justifyContent: 'center', alignItems: 'center' }} onPress={() => addManual(novoObrig, reqObrig, setReqObrig, setNovoObrig)}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={m.label}>Adicionar desejável</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[m.input, { flex: 1 }]} value={novoDesej} onChangeText={setNovoDesej} placeholder="Digitar..." placeholderTextColor={Colors.text3} onSubmitEditing={() => addManual(novoDesej, reqDesej, setReqDesej, setNovoDesej)} returnKeyType="done" />
                <TouchableOpacity style={{ backgroundColor: '#1A6FD4', borderRadius: 10, width: 44, justifyContent: 'center', alignItems: 'center' }} onPress={() => addManual(novoDesej, reqDesej, setReqDesej, setNovoDesej)}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>+</Text>
                </TouchableOpacity>
              </View>
              {reqObrig.length > 0 && <><Text style={m.label}>🟢 Obrigatórios ({reqObrig.length})</Text>
                <View style={m.chips}>{reqObrig.map((r, i) => (
                  <TouchableOpacity key={i} style={[m.chip, { backgroundColor: '#E6F5EE', borderColor: Colors.primary }]} onPress={() => setReqObrig(reqObrig.filter(x => x !== r))}>
                    <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '700' }}>✓ {r} ✕</Text>
                  </TouchableOpacity>
                ))}</View></>}
              {reqDesej.length > 0 && <><Text style={m.label}>🔵 Desejáveis ({reqDesej.length})</Text>
                <View style={m.chips}>{reqDesej.map((r, i) => (
                  <TouchableOpacity key={i} style={[m.chip, { backgroundColor: '#EBF2FC', borderColor: '#1A6FD4' }]} onPress={() => setReqDesej(reqDesej.filter(x => x !== r))}>
                    <Text style={{ fontSize: 11, color: '#1A6FD4', fontWeight: '700' }}>✓ {r} ✕</Text>
                  </TouchableOpacity>
                ))}</View></>}
            </ScrollView>
          )}

          {step === 3 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 12, color: Colors.text3, marginBottom: 8 }}>Adicione perguntas que os candidatos devem responder.</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[m.input, { flex: 1 }]} value={novaPergunta} onChangeText={setNovaPergunta} placeholder="Adicionar pergunta..." placeholderTextColor={Colors.text3} onSubmitEditing={addPergunta} returnKeyType="done" />
                <TouchableOpacity style={{ backgroundColor: Colors.primary, borderRadius: 10, width: 44, justifyContent: 'center', alignItems: 'center' }} onPress={addPergunta}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>+</Text>
                </TouchableOpacity>
              </View>
              {perguntas.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ fontSize: 30, marginBottom: 8 }}>❓</Text>
                  <Text style={{ fontSize: 13, color: Colors.text3 }}>Nenhuma pergunta (opcional)</Text>
                </View>
              ) : perguntas.map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#D0E8DA', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary, width: 20 }}>{i + 1}.</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: Colors.text }}>{p}</Text>
                  <TouchableOpacity onPress={() => setPerguntas(perguntas.filter((_, j) => j !== i))}>
                    <Text style={{ fontSize: 15, color: '#EF4444', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {step === 4 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: Colors.text3, marginBottom: 12 }}>Revise e publique.</Text>
              {[
                { l: 'Cargo · Contrato', v: `${cargo} · ${contrato}` },
                salarioMin ? { l: 'Salário', v: `R$ ${salarioMin} – ${salarioMax || '?'}` } : null,
                cidade ? { l: 'Localização', v: `${cidade} · ${estado}` } : null,
                prazo ? { l: 'Prazo', v: prazo } : null,
              ].filter(Boolean).map((row: any, i) => (
                <View key={i} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#D0E8DA' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.text3, textTransform: 'uppercase' }}>{row.l}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 2 }}>{row.v}</Text>
                </View>
              ))}
              {reqObrig.length > 0 && <View style={{ backgroundColor: '#E6F5EE', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', marginBottom: 6 }}>Obrigatórios ({reqObrig.length})</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {reqObrig.map((r, i) => <View key={i} style={{ backgroundColor: '#fff', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: Colors.primary }}><Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '700' }}>{r}</Text></View>)}
                </View>
              </View>}
              {reqDesej.length > 0 && <View style={{ backgroundColor: '#EBF2FC', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#1A6FD4', textTransform: 'uppercase', marginBottom: 6 }}>Desejáveis ({reqDesej.length})</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {reqDesej.map((r, i) => <View key={i} style={{ backgroundColor: '#fff', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#1A6FD4' }}><Text style={{ fontSize: 11, color: '#1A6FD4', fontWeight: '700' }}>{r}</Text></View>)}
                </View>
              </View>}
              {perguntas.length > 0 && <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#D0E8DA' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.text3, textTransform: 'uppercase', marginBottom: 6 }}>Perguntas ({perguntas.length})</Text>
                {perguntas.map((p, i) => <Text key={i} style={{ fontSize: 13, color: Colors.text, marginBottom: 4 }}>{i + 1}. {p}</Text>)}
              </View>}
            </ScrollView>
          )}

          <View style={{ flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEF7F2', marginTop: 4 }}>
            {step > 1 ? (
              <TouchableOpacity style={{ flex: 1, borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 13, alignItems: 'center' }} onPress={() => setStep(step - 1)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text2 }}>← Anterior</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={{ flex: 1, borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 13, alignItems: 'center' }} onPress={close}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text3 }}>Cancelar</Text>
              </TouchableOpacity>
            )}
            {step < 4 ? (
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 13, alignItems: 'center' }}
                onPress={() => {
                  if (step === 1) {
                    if (!cargo) return Alert.alert('Atenção', 'Selecione o cargo.')
                    if (!contrato) return Alert.alert('Atenção', 'Selecione o tipo de contrato.')
                    setTipoFiltro(CARGO_PARA_OPCAO[cargo] || '')
                  }
                  setStep(step + 1)
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Próximo →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[{ flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 13, alignItems: 'center' }, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Publicar →</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Cargo picker ──────────────────────────────────────────── */}
        <Modal visible={cargoModal} transparent animationType="slide" onRequestClose={() => setCargoModal(false)}>
          <View style={m.overlay}>
            <View style={[m.sheet, { maxHeight: '70%' }]}>
              <View style={m.handle} />
              <Text style={m.title}>Cargo</Text>
              <FlatList
                data={CARGOS_VAGA}
                keyExtractor={item => item}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border }}
                    onPress={() => { setCargo(item); setCargoModal(false) }}
                  >
                    <Text style={{ fontSize: 15, color: Colors.text, fontWeight: '600' }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={{ backgroundColor: Colors.bg, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 }}
                onPress={() => setCargoModal(false)}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text2 }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── IBGE Estado ───────────────────────────────────────────── */}
        <VIBGEModal
          visible={estadoModal}
          title="Selecionar Estado"
          data={estados}
          onSelect={onSelectEstado}
          onClose={() => setEstadoModal(false)}
        />

        {/* ── IBGE Cidade ───────────────────────────────────────────── */}
        <VIBGEModal
          visible={cidadeModal}
          title="Selecionar Cidade"
          data={cidades}
          loading={loadingCidades}
          onSelect={c => { setCidade(c.nome); setCidadeModal(false) }}
          onClose={() => setCidadeModal(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Modal: Curso ─────────────────────────────────────────────────────────────
function CursoModal({ visible, pageId, onClose, onCreated }: {
  visible: boolean; pageId: string; onClose: () => void; onCreated: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [modalidade, setModalidade] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [linkInscricao, setLinkInscricao] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setTitulo(''); setModalidade(''); setCargaHoraria(''); setDataInicio(''); setLinkInscricao(''); setDescricao('') }
  const close = () => { reset(); onClose() }

  const salvar = async () => {
    if (!titulo.trim()) return Alert.alert('Atenção', 'Informe o título do curso.')
    setSaving(true)
    try {
      await api.post(`/pages/${pageId}/publicacoes`, {
        tipo: 'curso', titulo: titulo.trim(),
        dados: { modalidade: modalidade || null, carga_horaria: cargaHoraria.trim() || null, data_inicio: dataInicio.trim() || null, link_inscricao: linkInscricao.trim() || null, descricao: descricao.trim() || null },
      })
      reset(); onCreated(); onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <ScrollView contentContainerStyle={m.sheetScroll} keyboardShouldPersistTaps="handled">
          <View style={m.handle} />
          <Text style={m.title}>🎓 Curso</Text>
          <Text style={m.label}>Título *</Text>
          <TextInput style={m.input} placeholder="Ex: Implantodontia Avançada" placeholderTextColor={Colors.text3} value={titulo} onChangeText={setTitulo} />
          <Text style={m.label}>Modalidade</Text>
          <View style={m.chips}>
            {MODALIDADES_CURSO.map(c => (
              <TouchableOpacity key={c} style={[m.chip, modalidade === c && m.chipOn]} onPress={() => setModalidade(c)}>
                <Text style={[m.chipT, modalidade === c && m.chipTOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={m.label}>Carga horária</Text>
          <TextInput style={m.input} placeholder="Ex: 40h" placeholderTextColor={Colors.text3} value={cargaHoraria} onChangeText={setCargaHoraria} />
          <Text style={m.label}>Data de início</Text>
          <TextInput style={m.input} placeholder="Ex: 15/06/2025" placeholderTextColor={Colors.text3} value={dataInicio} onChangeText={setDataInicio} />
          <Text style={m.label}>Link de inscrição</Text>
          <TextInput style={m.input} placeholder="https://…" placeholderTextColor={Colors.text3} value={linkInscricao} onChangeText={setLinkInscricao} autoCapitalize="none" keyboardType="url" />
          <Text style={m.label}>Descrição</Text>
          <TextInput style={[m.input, m.textarea]} placeholder="Detalhes do curso…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Publicar Curso →</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}><Text style={m.cancelT}>Cancelar</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Modal: Treinamento ───────────────────────────────────────────────────────
function TreinamentoModal({ visible, pageId, onClose, onCreated }: {
  visible: boolean; pageId: string; onClose: () => void; onCreated: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [publicoAlvo, setPublicoAlvo] = useState('')
  const [data, setData] = useState('')
  const [local, setLocal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setTitulo(''); setPublicoAlvo(''); setData(''); setLocal(''); setDescricao('') }
  const close = () => { reset(); onClose() }

  const salvar = async () => {
    if (!titulo.trim()) return Alert.alert('Atenção', 'Informe o título.')
    setSaving(true)
    try {
      await api.post(`/pages/${pageId}/publicacoes`, {
        tipo: 'treinamento', titulo: titulo.trim(),
        dados: { publico_alvo: publicoAlvo.trim() || null, data: data.trim() || null, local: local.trim() || null, descricao: descricao.trim() || null },
      })
      reset(); onCreated(); onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <ScrollView contentContainerStyle={m.sheetScroll} keyboardShouldPersistTaps="handled">
          <View style={m.handle} />
          <Text style={m.title}>🏋️ Treinamento</Text>
          <Text style={m.label}>Título *</Text>
          <TextInput style={m.input} placeholder="Ex: Treinamento em Biossegurança" placeholderTextColor={Colors.text3} value={titulo} onChangeText={setTitulo} />
          <Text style={m.label}>Público-alvo</Text>
          <TextInput style={m.input} placeholder="Ex: Dentistas e auxiliares" placeholderTextColor={Colors.text3} value={publicoAlvo} onChangeText={setPublicoAlvo} />
          <Text style={m.label}>Data</Text>
          <TextInput style={m.input} placeholder="Ex: 20/06/2025" placeholderTextColor={Colors.text3} value={data} onChangeText={setData} />
          <Text style={m.label}>Local</Text>
          <TextInput style={m.input} placeholder="Ex: Online ou endereço" placeholderTextColor={Colors.text3} value={local} onChangeText={setLocal} />
          <Text style={m.label}>Descrição</Text>
          <TextInput style={[m.input, m.textarea]} placeholder="Detalhes do treinamento…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Publicar Treinamento →</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}><Text style={m.cancelT}>Cancelar</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Modal: Palestra ──────────────────────────────────────────────────────────
function PalestraModal({ visible, pageId, onClose, onCreated }: {
  visible: boolean; pageId: string; onClose: () => void; onCreated: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [palestrante, setPalestrante] = useState('')
  const [data, setData] = useState('')
  const [local, setLocal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setTitulo(''); setPalestrante(''); setData(''); setLocal(''); setDescricao('') }
  const close = () => { reset(); onClose() }

  const salvar = async () => {
    if (!titulo.trim()) return Alert.alert('Atenção', 'Informe o título.')
    setSaving(true)
    try {
      await api.post(`/pages/${pageId}/publicacoes`, {
        tipo: 'palestra', titulo: titulo.trim(),
        dados: { palestrante: palestrante.trim() || null, data: data.trim() || null, local: local.trim() || null, descricao: descricao.trim() || null },
      })
      reset(); onCreated(); onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <ScrollView contentContainerStyle={m.sheetScroll} keyboardShouldPersistTaps="handled">
          <View style={m.handle} />
          <Text style={m.title}>🎤 Palestra</Text>
          <Text style={m.label}>Título *</Text>
          <TextInput style={m.input} placeholder="Ex: Tendências em Odontologia Digital" placeholderTextColor={Colors.text3} value={titulo} onChangeText={setTitulo} />
          <Text style={m.label}>Palestrante</Text>
          <TextInput style={m.input} placeholder="Ex: Dr. João Silva" placeholderTextColor={Colors.text3} value={palestrante} onChangeText={setPalestrante} />
          <Text style={m.label}>Data</Text>
          <TextInput style={m.input} placeholder="Ex: 25/06/2025" placeholderTextColor={Colors.text3} value={data} onChangeText={setData} />
          <Text style={m.label}>Local</Text>
          <TextInput style={m.input} placeholder="Ex: Online ou endereço" placeholderTextColor={Colors.text3} value={local} onChangeText={setLocal} />
          <Text style={m.label}>Descrição</Text>
          <TextInput style={[m.input, m.textarea]} placeholder="Detalhes da palestra…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Publicar Palestra →</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}><Text style={m.cancelT}>Cancelar</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Modal: Evento ────────────────────────────────────────────────────────────
function EventoModal({ visible, pageId, onClose, onCreated }: {
  visible: boolean; pageId: string; onClose: () => void; onCreated: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [tipoEvento, setTipoEvento] = useState('')
  const [data, setData] = useState('')
  const [local, setLocal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setTitulo(''); setTipoEvento(''); setData(''); setLocal(''); setDescricao('') }
  const close = () => { reset(); onClose() }

  const salvar = async () => {
    if (!titulo.trim()) return Alert.alert('Atenção', 'Informe o título do evento.')
    setSaving(true)
    try {
      await api.post(`/pages/${pageId}/publicacoes`, {
        tipo: 'evento', titulo: titulo.trim(),
        dados: { tipo_evento: tipoEvento || null, data: data.trim() || null, local: local.trim() || null, descricao: descricao.trim() || null },
      })
      reset(); onCreated(); onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <ScrollView contentContainerStyle={m.sheetScroll} keyboardShouldPersistTaps="handled">
          <View style={m.handle} />
          <Text style={m.title}>🗓️ Evento</Text>
          <Text style={m.label}>Título *</Text>
          <TextInput style={m.input} placeholder="Ex: Congresso Nacional de Odontologia" placeholderTextColor={Colors.text3} value={titulo} onChangeText={setTitulo} />
          <Text style={m.label}>Tipo de evento</Text>
          <View style={m.chips}>
            {TIPOS_EVENTO.map(t => (
              <TouchableOpacity key={t} style={[m.chip, tipoEvento === t && m.chipOn]} onPress={() => setTipoEvento(t)}>
                <Text style={[m.chipT, tipoEvento === t && m.chipTOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={m.label}>Data</Text>
          <TextInput style={m.input} placeholder="Ex: 10/07/2025" placeholderTextColor={Colors.text3} value={data} onChangeText={setData} />
          <Text style={m.label}>Local</Text>
          <TextInput style={m.input} placeholder="Ex: Centro de Convenções de São Paulo" placeholderTextColor={Colors.text3} value={local} onChangeText={setLocal} />
          <Text style={m.label}>Descrição</Text>
          <TextInput style={[m.input, m.textarea]} placeholder="Detalhes do evento…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Publicar Evento →</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}><Text style={m.cancelT}>Cancelar</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function PaginaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user, isLoading: authLoading } = useAuthStore()

  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('Sobre')
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['Sobre', 'Vagas']))

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likeLoading, setLikeLoading] = useState(false)

  const [servicos, setServicos] = useState<any[]>([])
  const [servicosLoading, setServicosLoading] = useState(false)

  const [portfolio, setPortfolio] = useState<any[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioUploading, setPortfolioUploading] = useState(false)

  const [publicacoes, setPublicacoes] = useState<any[]>([])
  const [publicacoesLoading, setPublicacoesLoading] = useState(false)

  const [candidaturas, setCandidaturas] = useState<Set<number>>(new Set())
  const [candidatarVaga, setCandidatarVaga] = useState<any | null>(null)

  // Gear menu + sub-modals
  const [showGearMenu, setShowGearMenu] = useState(false)
  const [showMetricas, setShowMetricas] = useState(false)
  const [metricas, setMetricas] = useState<any>(null)
  const [metricasLoading, setMetricasLoading] = useState(false)
  const [showCandidatos, setShowCandidatos] = useState(false)
  const [candidatosData, setCandidatosData] = useState<any[]>([])
  const [candidatosLoading, setCandidatosLoading] = useState(false)
  const [showInscritos, setShowInscritos] = useState(false)

  // Content modals
  const [showPublicarMenu, setShowPublicarMenu] = useState(false)
  const [showAddServico, setShowAddServico] = useState(false)
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null)

  const isOwner = !authLoading && !!user && user.id === page?.user_id

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadPage = () => {
    setLoading(true)
    api.get(`/pages/${id}`)
      .then(r => {
        setPage(r.data)
        setLiked(r.data.is_liked)
        setLikeCount(r.data.curtidas || 0)
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar a página'))
      .finally(() => setLoading(false))
  }

  const loadServicos = () => {
    setServicosLoading(true)
    api.get(`/pages/${id}/services`)
      .then(r => setServicos(r.data.services || []))
      .catch(() => null)
      .finally(() => setServicosLoading(false))
  }

  const loadPortfolio = () => {
    setPortfolioLoading(true)
    api.get(`/pages/${id}/portfolio`)
      .then(r => setPortfolio(r.data.portfolio || []))
      .catch(() => null)
      .finally(() => setPortfolioLoading(false))
  }

  const loadPublicacoes = () => {
    setPublicacoesLoading(true)
    api.get(`/pages/${id}/publicacoes`)
      .then(r => setPublicacoes(r.data.publicacoes || []))
      .catch(() => null)
      .finally(() => setPublicacoesLoading(false))
  }

  const loadMetricas = () => {
    setMetricasLoading(true)
    api.get(`/pages/${id}/metrics`)
      .then(r => setMetricas(r.data))
      .catch(() => null)
      .finally(() => setMetricasLoading(false))
  }

  const loadCandidatos = () => {
    setCandidatosLoading(true)
    api.get(`/pages/${id}/candidatos`)
      .then(r => setCandidatosData(r.data.candidatos || []))
      .catch(() => null)
      .finally(() => setCandidatosLoading(false))
  }

  useEffect(() => { loadPage() }, [id])

  useEffect(() => {
    if (loadedTabs.has(aba)) return
    setLoadedTabs(prev => new Set([...prev, aba]))
    if (aba === 'Serviços') loadServicos()
    if (aba === 'Portfólio') loadPortfolio()
    if (aba === 'Cursos/Eventos') loadPublicacoes()
  }, [aba])

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleLike = async () => {
    if (!user) {
      Alert.alert('Faça login', 'Para curtir uma página, você precisa estar logado.')
      return
    }
    setLikeLoading(true)
    try {
      const res = await api.post(`/follows/${id}`)
      setLiked(res.data.following)
      setLikeCount(prev => res.data.following ? prev + 1 : Math.max(0, prev - 1))
    } catch {
      Alert.alert('Erro', 'Não foi possível processar.')
    } finally { setLikeLoading(false) }
  }

  const onCandidatou = (vagaId: number) => {
    setCandidaturas(prev => new Set([...prev, vagaId]))
    setCandidatarVaga(null)
  }

  const handlePickPortfolio = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1],
    })
    if (result.canceled) return
    const asset = result.assets[0]
    setPortfolioUploading(true)
    try {
      const formData = new FormData()
      formData.append('imagem', { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: asset.fileName || `portfolio_${Date.now()}.jpg` } as any)
      await api.post(`/pages/${id}/portfolio/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      loadPortfolio()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível enviar a foto.')
    } finally { setPortfolioUploading(false) }
  }

  const handleDeleteServico = (serviceId: number) => {
    Alert.alert('Remover serviço', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/pages/${id}/services/${serviceId}`)
          setServicos(prev => prev.filter(sv => sv.id !== serviceId))
        } catch { Alert.alert('Erro', 'Não foi possível remover.') }
      }},
    ])
  }

  const handleDeletePortfolioItem = (itemId: number) => {
    Alert.alert('Remover foto', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/pages/${id}/portfolio/${itemId}`)
          setPortfolio(prev => prev.filter(p => p.id !== itemId))
        } catch { Alert.alert('Erro', 'Não foi possível remover.') }
      }},
    ])
  }

  const handleDeletePage = () => {
    Alert.alert(
      'Excluir página',
      'Esta ação é permanente e irreversível. Todos os dados da página serão removidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/pages/${id}`)
            router.back()
          } catch (err: any) {
            Alert.alert('Erro', err.response?.data?.error || 'Não foi possível excluir.')
          }
        }},
      ]
    )
  }

  const openModal = (tipo: ModalTipo) => setModalTipo(tipo)
  const closeModal = () => setModalTipo(null)

  const openMetricas = () => { setShowMetricas(true); loadMetricas() }
  const openCandidatos = () => { setShowCandidatos(true); loadCandidatos() }
  const openInscritos = () => {
    setShowInscritos(true)
    if (!loadedTabs.has('Cursos/Eventos')) loadPublicacoes()
  }

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  if (!page) return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 20 }}>Página não encontrada</Text>
      <TouchableOpacity style={s.btnBack} onPress={() => router.back()}><Text style={s.btnBackT}>← Voltar</Text></TouchableOpacity>
    </View>
  )

  const cor = page.cor || CAT_COR[page.categoria] || Colors.primary
  const logoSrc = resolveUrl(page.logo_url)
  const coverSrc = resolveUrl(page.cover_url)
  const vagas: any[] = page.vagas || []

  return (
    <View style={s.root}>
      {/* ── Navbar ── */}
      <View style={[s.navBar, { backgroundColor: cor }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.navSide}>
          <Text style={s.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={s.navTitle} numberOfLines={1}>{page.nome}</Text>
        {isOwner ? (
          <TouchableOpacity style={s.navSide} onPress={() => setShowGearMenu(true)}>
            <Text style={s.gearBtn}>⚙️</Text>
          </TouchableOpacity>
        ) : <View style={s.navSide} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Cover + Logo ── */}
        <View style={[s.cover, { backgroundColor: cor }]}>
          {coverSrc ? (
            <Image source={{ uri: coverSrc }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={s.coverWatermark} numberOfLines={1} ellipsizeMode="clip">
              {(CAT_LABEL[page.categoria] || '').toUpperCase()}
            </Text>
          )}
        </View>

        <View style={s.profileRow}>
          <View style={s.logoWrap}>
            {logoSrc ? (
              <Image source={{ uri: logoSrc }} style={s.logo} resizeMode="cover" />
            ) : (
              <View style={[s.logo, s.logoPlaceholder, { backgroundColor: cor }]}>
                <Text style={s.logoLetter}>{page.nome?.charAt(0) || 'P'}</Text>
              </View>
            )}
            {page.verificada && (
              <View style={[s.verifiedBadge, { backgroundColor: cor }]}>
                <Text style={s.verifiedT}>✓</Text>
              </View>
            )}
          </View>

          {isOwner ? (
            <TouchableOpacity
              style={[s.likeBtn, { backgroundColor: cor }]}
              onPress={() => setShowPublicarMenu(true)}
            >
              <Text style={s.likeBtnT}>📢 Publicar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.likeBtn, liked ? s.likedBtn : { backgroundColor: cor }]}
              onPress={toggleLike}
              disabled={likeLoading}
            >
              {likeLoading
                ? <ActivityIndicator color={liked ? cor : '#fff'} size="small" />
                : <Text style={[s.likeBtnT, liked && { color: cor }]}>
                    {liked ? '❤️ Curtido' : '🤍 Curtir'}
                  </Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Info ── */}
        <View style={s.info}>
          <Text style={s.nome}>{page.nome}</Text>
          <Text style={[s.catLabel, { color: cor }]}>{CAT_LABEL[page.categoria] || page.categoria}</Text>
          {(page.cidade || page.estado) && (
            <Text style={s.loc}>📍 {page.cidade}{page.estado ? ` · ${page.estado}` : ''}</Text>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={[s.statN, { color: cor }]}>{likeCount}</Text>
            <Text style={s.statL}>Curtidas</Text>
          </View>
          <View style={[s.stat, s.statBorder]}>
            <Text style={[s.statN, { color: cor }]}>{vagas.length}</Text>
            <Text style={s.statL}>Vagas abertas</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statN, { color: cor }]}>{servicos.length || publicacoes.length || '—'}</Text>
            <Text style={s.statL}>{servicos.length > 0 ? 'Serviços' : 'Publicações'}</Text>
          </View>
        </View>

        {/* ── Contato ── */}
        {(page.telefone || page.site) && (
          <View style={s.contacts}>
            {page.telefone && (
              <TouchableOpacity style={[s.contactBtn, { borderColor: cor }]} onPress={() => Linking.openURL(`tel:${page.telefone}`)}>
                <Text style={[s.contactBtnT, { color: cor }]}>📞 Ligar</Text>
              </TouchableOpacity>
            )}
            {page.site && (
              <TouchableOpacity style={[s.contactBtn, { borderColor: cor }]} onPress={() => Linking.openURL(page.site.startsWith('http') ? page.site : `https://${page.site}`)}>
                <Text style={[s.contactBtnT, { color: cor }]}>🌐 Site</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Abas (scroll horizontal) ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.abasScroll} contentContainerStyle={s.abas}>
          {ABAS.map(a => (
            <TouchableOpacity key={a} style={[s.aba, aba === a && { borderBottomColor: cor }]} onPress={() => setAba(a)}>
              <Text style={[s.abaT, aba === a && { color: cor }]}>
                {a}{a === 'Vagas' && vagas.length > 0 ? ` (${vagas.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Tab: Sobre ── */}
        {aba === 'Sobre' && (
          <View style={s.tab}>
            {page.descricao ? (
              <View style={s.card}>
                <Text style={s.cardTitle}>📝 Sobre a empresa</Text>
                <Text style={s.cardText}>{page.descricao}</Text>
              </View>
            ) : null}
            <View style={s.card}>
              <Text style={s.cardTitle}>📋 Informações</Text>
              {page.cnpj ? <InfoRow label="CNPJ" value={page.cnpj} /> : null}
              {page.telefone ? <InfoRow label="Telefone" value={page.telefone} /> : null}
              {page.site ? <InfoRow label="Site" value={page.site} color={cor} /> : null}
              {page.cidade ? <InfoRow label="Cidade" value={`${page.cidade}${page.estado ? ` · ${page.estado}` : ''}`} /> : null}
              {!page.cnpj && !page.telefone && !page.site && !page.cidade && (
                <Text style={s.emptyT}>Nenhuma informação cadastrada</Text>
              )}
            </View>
          </View>
        )}

        {/* ── Tab: Serviços ── */}
        {aba === 'Serviços' && (
          <View style={s.tab}>
            {isOwner && servicos.length > 0 && (
              <TouchableOpacity style={[s.tabAddBtn, { borderColor: cor }]} onPress={() => setShowAddServico(true)}>
                <Text style={[s.tabAddBtnT, { color: cor }]}>+ Adicionar Serviço</Text>
              </TouchableOpacity>
            )}
            {servicosLoading ? (
              <ActivityIndicator color={cor} style={{ marginTop: 32 }} />
            ) : servicos.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🛠️</Text>
                <Text style={s.emptyT}>Nenhum serviço cadastrado</Text>
                {isOwner && (
                  <TouchableOpacity style={[s.emptyBtn, { borderColor: cor }]} onPress={() => setShowAddServico(true)}>
                    <Text style={[s.emptyBtnT, { color: cor }]}>+ Adicionar primeiro serviço</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : servicos.map(sv => (
              <ServicoCard key={sv.id} servico={sv} isOwner={isOwner} cor={cor} onDelete={() => handleDeleteServico(sv.id)} />
            ))}
          </View>
        )}

        {/* ── Tab: Portfólio ── */}
        {aba === 'Portfólio' && (
          <View style={s.tab}>
            {isOwner && portfolio.length > 0 && (
              <TouchableOpacity style={[s.tabAddBtn, { borderColor: cor }]} onPress={handlePickPortfolio} disabled={portfolioUploading}>
                {portfolioUploading
                  ? <ActivityIndicator color={cor} size="small" />
                  : <Text style={[s.tabAddBtnT, { color: cor }]}>📷 Adicionar Foto</Text>}
              </TouchableOpacity>
            )}
            {portfolioLoading ? (
              <ActivityIndicator color={cor} style={{ marginTop: 32 }} />
            ) : portfolio.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🖼️</Text>
                <Text style={s.emptyT}>Nenhum trabalho no portfólio</Text>
                {isOwner && (
                  <TouchableOpacity style={[s.emptyBtn, { borderColor: cor }]} onPress={handlePickPortfolio}>
                    <Text style={[s.emptyBtnT, { color: cor }]}>+ Adicionar primeira foto</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={s.portfolioGrid}>
                {portfolio.map(item => (
                  <PortfolioItem key={item.id} item={item} isOwner={isOwner} onDelete={() => handleDeletePortfolioItem(item.id)} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Tab: Vagas ── */}
        {aba === 'Vagas' && (
          <View style={s.tab}>
            {isOwner && vagas.length > 0 && (
              <TouchableOpacity style={[s.tabAddBtn, { borderColor: cor }]} onPress={() => openModal('vaga')}>
                <Text style={[s.tabAddBtnT, { color: cor }]}>+ Nova Vaga</Text>
              </TouchableOpacity>
            )}
            {vagas.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
                <Text style={s.emptyT}>Nenhuma vaga aberta no momento</Text>
                {isOwner && (
                  <TouchableOpacity style={[s.emptyBtn, { borderColor: cor }]} onPress={() => openModal('vaga')}>
                    <Text style={[s.emptyBtnT, { color: cor }]}>+ Publicar primeira vaga</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : vagas.map(vaga => (
              <VagaCard key={vaga.id} vaga={vaga} cor={cor} jaCandidata={candidaturas.has(vaga.id)} onCandidatar={() => setCandidatarVaga(vaga)} isOwner={isOwner} onVerCandidatos={openCandidatos} />
            ))}
          </View>
        )}

        {/* ── Tab: Cursos/Eventos ── */}
        {aba === 'Cursos/Eventos' && (
          <View style={s.tab}>
            {isOwner && publicacoes.length > 0 && (
              <TouchableOpacity style={[s.tabAddBtn, { borderColor: cor }]} onPress={() => setShowPublicarMenu(true)}>
                <Text style={[s.tabAddBtnT, { color: cor }]}>+ Publicar</Text>
              </TouchableOpacity>
            )}
            {publicacoesLoading ? (
              <ActivityIndicator color={cor} style={{ marginTop: 32 }} />
            ) : publicacoes.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🎓</Text>
                <Text style={s.emptyT}>Nenhum curso ou evento publicado</Text>
                {isOwner && (
                  <TouchableOpacity style={[s.emptyBtn, { borderColor: cor }]} onPress={() => setShowPublicarMenu(true)}>
                    <Text style={[s.emptyBtnT, { color: cor }]}>+ Publicar primeiro</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : publicacoes.map(pub => (
              <PublicacaoCard key={pub.id} pub={pub} pageLogo={logoSrc} pageName={page.nome} cor={cor} />
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Gear menu ── */}
      <GearMenu
        visible={showGearMenu}
        onClose={() => setShowGearMenu(false)}
        pageId={id}
        onEditar={() => router.push(`/editar-pagina/${id}` as any)}
        onMetricas={openMetricas}
        onCandidatos={openCandidatos}
        onInscritos={openInscritos}
        onExcluir={handleDeletePage}
      />

      {/* ── Métricas ── */}
      <MetricasModal
        visible={showMetricas}
        onClose={() => setShowMetricas(false)}
        metricas={metricas}
        loading={metricasLoading}
      />

      {/* ── Candidatos ── */}
      <CandidatosModal
        visible={showCandidatos}
        onClose={() => setShowCandidatos(false)}
        pageId={id as string}
        candidatos={candidatosData}
        loading={candidatosLoading}
      />

      {/* ── Inscritos ── */}
      <InscritosModal
        visible={showInscritos}
        onClose={() => setShowInscritos(false)}
        publicacoes={publicacoes}
        loading={publicacoesLoading}
      />

      {/* ── Candidatura ── */}
      <CandidatarFlowModal
        vaga={candidatarVaga}
        cor={cor}
        onClose={() => setCandidatarVaga(null)}
        onDone={onCandidatou}
      />

      {/* ── Menu Publicar ── */}
      <PublicarMenu visible={showPublicarMenu} onSelect={openModal} onClose={() => setShowPublicarMenu(false)} />

      {/* ── Modal: Adicionar Serviço ── */}
      <AddServicoModal
        visible={showAddServico}
        pageId={id}
        onClose={() => setShowAddServico(false)}
        onCreated={() => { setServicos([]); loadServicos() }}
      />

      {/* ── Modais de publicação ── */}
      <VagaModal visible={modalTipo === 'vaga'} pageId={id} pageName={page.nome} onClose={closeModal} onCreated={loadPage} />
      <CursoModal visible={modalTipo === 'curso'} pageId={id} onClose={closeModal} onCreated={() => { setPublicacoes([]); loadPublicacoes() }} />
      <TreinamentoModal visible={modalTipo === 'treinamento'} pageId={id} onClose={closeModal} onCreated={() => { setPublicacoes([]); loadPublicacoes() }} />
      <PalestraModal visible={modalTipo === 'palestra'} pageId={id} onClose={closeModal} onCreated={() => { setPublicacoes([]); loadPublicacoes() }} />
      <EventoModal visible={modalTipo === 'evento'} pageId={id} onClose={closeModal} onCreated={() => { setPublicacoes([]); loadPublicacoes() }} />
    </View>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Text style={s.infoRow}>
      {label}: <Text style={[s.infoVal, color ? { color } : {}]}>{value}</Text>
    </Text>
  )
}

function ServicoCard({ servico, isOwner, cor, onDelete }: any) {
  return (
    <View style={s.servicoCard}>
      <View style={[s.servicoIcon, { backgroundColor: cor + '18' }]}>
        <Text style={{ fontSize: 18 }}>🛠️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.servicoTitulo}>{servico.titulo}</Text>
        {servico.descricao ? <Text style={s.servicoDesc}>{servico.descricao}</Text> : null}
      </View>
      {isOwner && (
        <TouchableOpacity style={s.deleteBtn} onPress={onDelete}>
          <Text style={s.deleteBtnT}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

function PortfolioItem({ item, isOwner, onDelete }: any) {
  const src = resolveUrl(item.imagem_url)
  return (
    <View style={s.portfolioItem}>
      {src ? <Image source={{ uri: src }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      {isOwner && (
        <TouchableOpacity style={s.portfolioDeleteBtn} onPress={onDelete}>
          <Text style={s.portfolioDeleteBtnT}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const TIPO_EMOJI: Record<string, string> = { curso: '🎓', treinamento: '🏋️', palestra: '🎤', evento: '🗓️' }
const TIPO_LABEL_PUB: Record<string, string> = { curso: 'Curso', treinamento: 'Treinamento', palestra: 'Palestra', evento: 'Evento' }

function PublicacaoCard({ pub, pageLogo, pageName, cor }: any) {
  const emoji = TIPO_EMOJI[pub.tipo] || '📢'
  const label = TIPO_LABEL_PUB[pub.tipo] || pub.tipo
  const dados = pub.dados || {}
  const infos: string[] = []
  if (dados.modalidade) infos.push(dados.modalidade)
  if (dados.carga_horaria) infos.push(dados.carga_horaria)
  if (dados.data_inicio) infos.push(`Início: ${dados.data_inicio}`)
  if (dados.data) infos.push(dados.data)
  if (dados.local) infos.push(`📍 ${dados.local}`)
  if (dados.palestrante) infos.push(`Por: ${dados.palestrante}`)
  if (dados.publico_alvo) infos.push(`Para: ${dados.publico_alvo}`)
  if (dados.tipo_evento) infos.push(dados.tipo_evento)

  return (
    <View style={s.postCard}>
      <View style={s.postHeader}>
        {pageLogo ? (
          <Image source={{ uri: pageLogo }} style={s.postAvatar} resizeMode="cover" />
        ) : (
          <View style={[s.postAvatar, { backgroundColor: cor, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{pageName?.charAt(0)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.postAuthor}>{pageName}</Text>
          <Text style={s.postTime}>{timeAgo(pub.created_at)}</Text>
        </View>
        <View style={[s.tipoBadge, { backgroundColor: cor + '18' }]}>
          <Text style={[s.tipoBadgeT, { color: cor }]}>{emoji} {label}</Text>
        </View>
      </View>
      <Text style={s.pubTitulo}>{pub.titulo}</Text>
      {infos.length > 0 && <Text style={s.pubInfos}>{infos.join('  ·  ')}</Text>}
      {dados.descricao ? <Text style={s.postText}>{dados.descricao}</Text> : null}
      {dados.link_inscricao ? (
        <TouchableOpacity onPress={() => Linking.openURL(dados.link_inscricao.startsWith('http') ? dados.link_inscricao : `https://${dados.link_inscricao}`)}>
          <Text style={[s.linkInscricao, { color: cor }]}>🔗 Inscrever-se</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

// ─── Modal: Formulário de Candidatura ────────────────────────────────────────
function CandidatarFlowModal({ vaga, cor, onClose, onDone }: {
  vaga: any | null; cor: string; onClose: () => void; onDone: (vagaId: number) => void
}) {
  const [vagaFull, setVagaFull] = useState<any>(null)
  const [loadingFull, setLoadingFull] = useState(false)
  const [respostasObrig, setRespostasObrig] = useState<Record<number, boolean | null>>({})
  const [respostasDesej, setRespostasDesej] = useState<Record<number, boolean | null>>({})
  const [respostasTexto, setRespostasTexto] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!vaga) return
    setVagaFull(null)
    setRespostasObrig({})
    setRespostasDesej({})
    setLoadingFull(true)
    api.get(`/vagas/${vaga.id}`)
      .then(r => {
        setVagaFull(r.data)
        setRespostasTexto(new Array((r.data.perguntas || []).length).fill(''))
      })
      .catch(() => {})
      .finally(() => setLoadingFull(false))
  }, [vaga?.id])

  if (!vaga) return null

  const reqObrig: string[] = vagaFull?.requisitos_obrigatorios || []
  const reqDesej: string[] = vagaFull?.requisitos_desejaveis || []
  const perguntas: string[] = vagaFull?.perguntas || []

  const calcPct = () => {
    const obrigSim = reqObrig.filter((_, i) => respostasObrig[i] === true).length
    const desejSim = reqDesej.filter((_, i) => respostasDesej[i] === true).length
    const obrigScore = reqObrig.length > 0 ? (obrigSim / reqObrig.length) * 70 : 70
    const desejScore = reqDesej.length > 0 ? (desejSim / reqDesej.length) * 30 : 30
    return Math.round(obrigScore + desejScore)
  }

  const confirmar = async () => {
    const pct = calcPct()
    setSending(true)
    try {
      await api.post(`/vagas/${vaga.id}/candidatar`, {
        respostas: respostasTexto,
        porcentagem_compatibilidade: pct,
        respostas_requisitos: {
          obrigatorios: reqObrig.map((r, i) => ({ req: r, sim: respostasObrig[i] === true })),
          desejaveis: reqDesej.map((r, i) => ({ req: r, sim: respostasDesej[i] === true })),
        },
      })
      onDone(vaga.id)
      Alert.alert('✅ Candidatura enviada!', `Você declarou atender ${calcPct()}% dos requisitos.`)
    } catch (err: any) {
      Alert.alert('Aviso', err.response?.data?.error || 'Erro ao candidatar')
    } finally { setSending(false) }
  }

  const pct = vagaFull ? calcPct() : 0
  const barCor = pct > 70 ? '#00A880' : pct >= 40 ? '#C49800' : '#EF4444'

  return (
    <Modal visible={!!vaga} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 20, maxHeight: '90%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, color: '#7A9E8E', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A1C14' }}>Candidatura</Text>
            <View style={{ width: 32 }} />
          </View>
          {loadingFull ? (
            <ActivityIndicator color={cor} style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0A1C14', marginBottom: 16 }}>{vaga.cargo || vaga.titulo}</Text>

              {reqObrig.length > 0 && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0A1C14', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>🔴 Requisitos Obrigatórios</Text>
                  <Text style={{ fontSize: 11, color: '#7A9E8E', marginBottom: 10 }}>Peso: 70% da compatibilidade</Text>
                  {reqObrig.map((r, i) => (
                    <View key={i} style={{ backgroundColor: '#F8FCFA', borderWidth: 1, borderColor: '#D0E8DA', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0A1C14' }}>{r}</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={{ flex: 1, borderWidth: 1.5, borderColor: respostasObrig[i] === true ? '#00A880' : '#D0E8DA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: respostasObrig[i] === true ? '#00A880' : '#fff' }}
                          onPress={() => setRespostasObrig(prev => ({ ...prev, [i]: true }))}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: respostasObrig[i] === true ? '#fff' : '#3A6550' }}>Sim</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ flex: 1, borderWidth: 1.5, borderColor: respostasObrig[i] === false ? '#EF4444' : '#D0E8DA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: respostasObrig[i] === false ? '#EF4444' : '#fff' }}
                          onPress={() => setRespostasObrig(prev => ({ ...prev, [i]: false }))}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: respostasObrig[i] === false ? '#fff' : '#3A6550' }}>Não</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {reqDesej.length > 0 && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0A1C14', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 4 }}>🔵 Requisitos Desejáveis</Text>
                  <Text style={{ fontSize: 11, color: '#7A9E8E', marginBottom: 10 }}>Peso: 30% da compatibilidade</Text>
                  {reqDesej.map((r, i) => (
                    <View key={i} style={{ backgroundColor: '#F8FCFA', borderWidth: 1, borderColor: '#D0E8DA', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0A1C14' }}>{r}</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={{ flex: 1, borderWidth: 1.5, borderColor: respostasDesej[i] === true ? '#1A6FD4' : '#D0E8DA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: respostasDesej[i] === true ? '#1A6FD4' : '#fff' }}
                          onPress={() => setRespostasDesej(prev => ({ ...prev, [i]: true }))}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: respostasDesej[i] === true ? '#fff' : '#3A6550' }}>Sim</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ flex: 1, borderWidth: 1.5, borderColor: respostasDesej[i] === false ? '#EF4444' : '#D0E8DA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: respostasDesej[i] === false ? '#EF4444' : '#fff' }}
                          onPress={() => setRespostasDesej(prev => ({ ...prev, [i]: false }))}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: respostasDesej[i] === false ? '#fff' : '#3A6550' }}>Não</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {perguntas.length > 0 && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0A1C14', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 10 }}>❓ Perguntas do Recrutador</Text>
                  {perguntas.map((p, i) => (
                    <View key={i} style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0A1C14', marginBottom: 6 }}>{i + 1}. {p}</Text>
                      <TextInput
                        style={{ backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 13, fontSize: 14, color: '#0A1C14', minHeight: 70, textAlignVertical: 'top' }}
                        value={respostasTexto[i] || ''}
                        onChangeText={v => { const r = [...respostasTexto]; r[i] = v; setRespostasTexto(r) }}
                        placeholder="Sua resposta..."
                        placeholderTextColor="#A0B8AC"
                        multiline
                      />
                    </View>
                  ))}
                </>
              )}

              {/* % calculada ao vivo */}
              <View style={{ backgroundColor: '#EEF7F2', borderRadius: 12, padding: 14, marginTop: 20, borderWidth: 1, borderColor: '#D0E8DA' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', marginBottom: 10 }}>
                  Você atende {pct}% dos requisitos desta vaga
                </Text>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.6 }}>Compatibilidade</Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: barCor }}>{pct}%</Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: barCor, borderRadius: 4 }} />
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: '#7A9E8E', marginTop: 8, textAlign: 'center' }}>
                  Esta porcentagem será declarada ao recrutador
                </Text>
              </View>

              <TouchableOpacity
                style={{ backgroundColor: cor, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16, opacity: sending ? 0.7 : 1 }}
                onPress={confirmar}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Confirmar candidatura com {pct}% →</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

function VagaCard({ vaga, cor, jaCandidata, onCandidatar, isOwner, onVerCandidatos }: any) {
  return (
    <View style={s.vagaCard}>
      <View style={s.vagaTop}>
        <Text style={s.vagaTitulo} numberOfLines={1}>{vaga.cargo || vaga.titulo}</Text>
        {vaga.destaque && (
          <View style={[s.vagaDestaquePill, { backgroundColor: cor + '18' }]}>
            <Text style={[s.vagaDestaquePillT, { color: cor }]}>Destaque</Text>
          </View>
        )}
      </View>
      <View style={s.vagaMeta}>
        {vaga.contrato && <View style={s.vagaTag}><Text style={s.vagaTagT}>{vaga.contrato}</Text></View>}
        {(vaga.cidade || vaga.estado) && <Text style={s.vagaLoc}>📍 {vaga.cidade}{vaga.estado ? ` · ${vaga.estado}` : ''}</Text>}
      </View>
      {vaga.salario ? <Text style={s.vagaSalario}>{vaga.salario}</Text> : null}
      {vaga.descricao ? <Text style={s.vagaDesc}>{vaga.descricao}</Text> : null}
      {isOwner ? (
        <TouchableOpacity
          style={[s.candidatarBtn, { backgroundColor: cor + '18', borderWidth: 1, borderColor: cor + '50' }]}
          onPress={onVerCandidatos}
        >
          <Text style={[s.candidatarBtnT, { color: cor }]}>👥 Ver candidatos →</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[s.candidatarBtn, jaCandidata ? s.candidatarBtnDone : { backgroundColor: cor }]}
          onPress={!jaCandidata ? onCandidatar : undefined}
          disabled={jaCandidata}
        >
          <Text style={[s.candidatarBtnT, jaCandidata && { color: '#059669' }]}>
            {jaCandidata ? '✓ Candidatura enviada' : 'Candidatar-se →'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  btnBack: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  btnBackT: { color: '#fff', fontWeight: '800', fontSize: 14 },

  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, paddingTop: Platform.OS === 'ios' ? 52 : 14 },
  navSide: { width: 56, alignItems: 'flex-end' },
  navBack: { fontSize: 24, color: '#fff', fontWeight: '700' },
  navTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#fff', textAlign: 'center' },
  gearBtn: { fontSize: 22 },

  cover: { height: 130, overflow: 'hidden' },
  coverWatermark: { position: 'absolute', bottom: -8, left: 10, right: 10, fontSize: 52, fontWeight: '900', color: 'rgba(255,255,255,0.13)', letterSpacing: 3 },

  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -36, marginBottom: 10 },
  logoWrap: { position: 'relative' },
  logo: { width: 72, height: 72, borderRadius: 18, borderWidth: 3, borderColor: '#fff' },
  logoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontSize: 28, fontWeight: '900' },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  verifiedT: { color: '#fff', fontSize: 10, fontWeight: '900' },

  likeBtn: { borderRadius: 100, paddingHorizontal: 22, paddingVertical: 10, minWidth: 110, alignItems: 'center' },
  likedBtn: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  likeBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },

  info: { paddingHorizontal: 16, marginBottom: 10 },
  nome: { fontSize: 22, fontWeight: '900', color: Colors.text },
  catLabel: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  loc: { fontSize: 12, color: Colors.text3, marginTop: 3 },

  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  statN: { fontSize: 18, fontWeight: '800' },
  statL: { fontSize: 10, color: Colors.text3, marginTop: 2, fontWeight: '600' },

  contacts: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  contactBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5 },
  contactBtnT: { fontSize: 14, fontWeight: '800' },

  abasScroll: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  abas: { flexDirection: 'row' },
  aba: { paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  abaT: { fontSize: 13, fontWeight: '700', color: Colors.text3 } as any,

  tab: { padding: 16, gap: 12, paddingBottom: 20 },
  tabAddBtn: { alignSelf: 'flex-end', borderWidth: 1.5, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  tabAddBtnT: { fontSize: 13, fontWeight: '700' },

  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  cardText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  infoRow: { fontSize: 13, color: Colors.text3, marginBottom: 6, fontWeight: '500' },
  infoVal: { fontWeight: '600', color: Colors.text },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 28, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', gap: 4 },
  emptyT: { fontSize: 14, fontWeight: '600', color: Colors.text3 },
  emptyBtn: { marginTop: 10, borderWidth: 1.5, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  emptyBtnT: { fontSize: 13, fontWeight: '700' },

  servicoCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  servicoIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  servicoTitulo: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 3 },
  servicoDesc: { fontSize: 13, color: Colors.text3, lineHeight: 19 },
  deleteBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  deleteBtnT: { fontSize: 11, color: Colors.text3, fontWeight: '800' },

  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  portfolioItem: { width: PORTFOLIO_SIZE, height: PORTFOLIO_SIZE, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.border, position: 'relative' },
  portfolioDeleteBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, width: 26, height: 26, justifyContent: 'center', alignItems: 'center' },
  portfolioDeleteBtnT: { color: '#fff', fontSize: 11, fontWeight: '900' },

  postCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar: { width: 42, height: 42, borderRadius: 12 },
  postAuthor: { fontSize: 14, fontWeight: '800', color: Colors.text },
  postTime: { fontSize: 11, color: Colors.text3, marginTop: 1 },
  postText: { fontSize: 14, color: Colors.text, lineHeight: 22, marginTop: 8 },
  tipoBadge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  tipoBadgeT: { fontSize: 11, fontWeight: '700' },
  pubTitulo: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  pubInfos: { fontSize: 12, color: Colors.text3, marginBottom: 4 },
  linkInscricao: { fontSize: 13, fontWeight: '700', marginTop: 8 },

  vagaCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  vagaTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  vagaTitulo: { fontSize: 16, fontWeight: '800', color: Colors.text, flex: 1 },
  vagaDestaquePill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  vagaDestaquePillT: { fontSize: 11, fontWeight: '700' },
  vagaMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  vagaTag: { backgroundColor: Colors.bg, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  vagaTagT: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  vagaLoc: { fontSize: 12, color: Colors.text3, alignSelf: 'center' },
  vagaSalario: { fontSize: 13, fontWeight: '800', color: '#059669', marginBottom: 6 },
  vagaDesc: { fontSize: 13, color: Colors.text3, lineHeight: 20, marginBottom: 10 },
  candidatarBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  candidatarBtnDone: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#059669' },
  candidatarBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },
})

// ─── Styles dos modais ────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  sheetScroll: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: Colors.text3, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.text2, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 14, color: Colors.text, marginBottom: 4 },
  textarea: { height: 100, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipT: { fontSize: 13, fontWeight: '700', color: Colors.text2 },
  chipTOn: { color: '#fff' },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cancel: { borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelT: { fontSize: 14, fontWeight: '700', color: Colors.text3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuEmoji: { fontSize: 22, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  menuArrow: { fontSize: 22, color: Colors.text3 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 16 },
  metricCard: { width: '30%', flexGrow: 1, backgroundColor: Colors.bg, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  metricEmoji: { fontSize: 22, marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: '900', color: Colors.text },
  metricLabel: { fontSize: 10, color: Colors.text3, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  sheetFull: { backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 28, maxHeight: '94%' },
})

// ─── Styles full-screen modals ────────────────────────────────────────────────
const fs = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, paddingTop: Platform.OS === 'ios' ? 56 : 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { width: 40 },
  closeT: { fontSize: 22, color: Colors.text, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyT: { fontSize: 15, color: Colors.text3, fontWeight: '600' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  groupTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, flex: 1 },
  groupCount: { fontSize: 12, color: Colors.text3, fontWeight: '600' },
  tag: { backgroundColor: Colors.bg, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
  tagT: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  itemCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  itemNome: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  itemSub: { fontSize: 12, color: Colors.text3, marginBottom: 2 },
  itemDate: { fontSize: 11, color: Colors.text3, marginTop: 4 },
  infoBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  infoBoxT: { fontSize: 12, color: '#1E40AF', lineHeight: 18 },
  link: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 6 },
  statusBadge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, flexShrink: 1 },
  statusBadgeT: { fontSize: 11, fontWeight: '700' },
  respostaCard: { backgroundColor: Colors.bg, borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  respostaT: { fontSize: 13, color: Colors.text, lineHeight: 19 },
  btnAprovar: { backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#059669' },
  btnReprovar: { backgroundColor: '#FEF2F2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#EF4444' },
  btnAnalise: { backgroundColor: '#FFFBEB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#C49800' },
})
