import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const CONTRATOS = ['CLT', 'PJ', 'Freelancer', 'Estágio']

const CONTRATO_COR: Record<string, string> = {
  CLT: '#00A880', PJ: '#1A6FD4', Freelancer: '#C49800', Estágio: '#7B3FC4',
}

const STATUS_COR: Record<string, string> = {
  em_analise: '#C49800', aprovado: '#00A880', reprovado: '#EF4444', enviada: '#C49800',
}
const STATUS_LABEL: Record<string, string> = {
  em_analise: 'Em análise', aprovado: '✓ Aprovado', reprovado: '✗ Reprovado', enviada: 'Em análise',
}

const TIPOS_ABREV: Record<string, string> = {
  'Cirurgião-Dentista': 'Dentista',
  'Técnico em Prótese Dentária': 'Prótese',
  'Auxiliar de Saúde Bucal (ASB)': 'ASB',
  'Técnico em Saúde Bucal (TSB)': 'TSB',
  Recepcionista: 'Recep.',
  Marketing: 'Mkt',
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

// ─── Barra de compatibilidade ─────────────────────────────────────────────────
function CompatBar({ pct }: { pct: number }) {
  const cor = pct > 70 ? '#00A880' : pct >= 40 ? '#C49800' : '#EF4444'
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.6 }}>Compatibilidade</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: cor }}>{pct}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#EEF7F2', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: cor, borderRadius: 4 }} />
      </View>
    </View>
  )
}

// ─── IBGE Modal (reutilizável) ────────────────────────────────────────────────
function VIBGEModal({ visible, title, data, onSelect, onClose, loading = false }: {
  visible: boolean; title: string; data: any[]; onSelect: (item: any) => void; onClose: () => void; loading?: boolean
}) {
  const [busca, setBusca] = useState('')
  const filtered = data.filter((d: any) =>
    (d.nome || d.sigla || '').toLowerCase().includes(busca.toLowerCase())
  )
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cm.overlay}>
        <View style={[cm.sheet, { maxHeight: '80%' }]}>
          <View style={cm.handle} />
          <Text style={cm.title}>{title}</Text>
          <TextInput
            style={[cm.input, { marginBottom: 8 }]}
            value={busca} onChangeText={setBusca}
            placeholder="Buscar..." placeholderTextColor="#A0B8AC" autoFocus
          />
          {loading ? (
            <ActivityIndicator color="#00A880" style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' }}
                  onPress={() => { setBusca(''); onSelect(item) }}
                >
                  <Text style={{ fontSize: 15, color: '#0A1C14', fontWeight: '600' }}>{item.nome}</Text>
                  {item.sigla && <Text style={{ fontSize: 12, color: '#7A9E8E' }}>{item.sigla}</Text>}
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity
            style={{ backgroundColor: '#EEF7F2', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 }}
            onPress={onClose}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#3A6550' }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─── Modal: Criar Vaga (4 etapas) ─────────────────────────────────────────────
function CriarVagaModal({ visible, onClose, onCreated, myPages }: {
  visible: boolean; onClose: () => void; onCreated: () => void; myPages: any[]
}) {
  const [step, setStep] = useState(1)
  const [pageId, setPageId] = useState('')
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
    setStep(1); setPageId(''); setCargo(''); setContrato('')
    setSalarioMin(''); setSalarioMax(''); setCidade(''); setEstado(''); setPrazo('')
    setDescricao(''); setBeneficios('')
    setTipoFiltro(''); setReqObrig([]); setReqDesej([])
    setNovoObrig(''); setNovoDesej('')
    setPerguntas([]); setNovaPergunta('')
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
    if (st === 'none') { setReqObrig([...reqObrig, c]) }
    else if (st === 'obrig') { setReqObrig(reqObrig.filter(x => x !== c)); setReqDesej([...reqDesej, c]) }
    else { setReqDesej(reqDesej.filter(x => x !== c)) }
  }

  const addManual = (val: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const v = val.trim()
    if (v && !list.includes(v)) setList([...list, v])
    setInput('')
  }

  const addPergunta = () => {
    const v = novaPergunta.trim()
    if (v) { setPerguntas([...perguntas, v]); setNovaPergunta('') }
  }

  const chipPool = (() => {
    const all = tipoFiltro
      ? [...(opcoes[tipoFiltro]?.especialidades || []), ...(opcoes[tipoFiltro]?.habilidades || [])]
      : [...new Set(Object.values(opcoes).flatMap((o: any) => [...(o.especialidades || []), ...(o.habilidades || [])]) as string[])]
    return all as string[]
  })()

  const publish = async () => {
    setSaving(true)
    try {
      await api.post('/vagas', {
        page_id: parseInt(pageId), cargo: cargo.trim(), contrato,
        salario_min: salarioMin ? parseInt(salarioMin) : null,
        salario_max: salarioMax ? parseInt(salarioMax) : null,
        cidade: cidade.trim() || null,
        estado: estado || null,
        prazo_candidatura: dateDisplayToIso(prazo) || null,
        descricao: descricao.trim() || null,
        beneficios: beneficios.trim() || null,
        requisitos_obrigatorios: reqObrig,
        requisitos_desejaveis: reqDesej,
        perguntas,
      })
      reset(); onCreated()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar a vaga')
    } finally { setSaving(false) }
  }

  const stepLabels = ['Informações', 'Requisitos', 'Perguntas', 'Revisão']

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={cm.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={cm.sheet}>
          <View style={cm.handle} />
          {/* Header */}
          <View style={cm.header}>
            <TouchableOpacity onPress={close}><Text style={cm.close}>✕</Text></TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={cm.title}>Publicar Vaga</Text>
              <Text style={cm.stepIndicator}>{stepLabels[step - 1]} · Etapa {step} de 4</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Progress bar */}
          <View style={cm.progress}>
            {[1, 2, 3, 4].map(n => (
              <View key={n} style={[cm.progressDot, step >= n && cm.progressDotOn]} />
            ))}
          </View>

          {/* Step 1: Informações */}
          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={cm.label}>Página *</Text>
              {myPages.map(p => (
                <TouchableOpacity key={p.id} style={[cm.pageChip, pageId === String(p.id) && cm.pageChipOn]} onPress={() => setPageId(String(p.id))}>
                  <Text style={[cm.pageChipT, pageId === String(p.id) && { color: '#00A880', fontWeight: '800' }]}>{p.nome}</Text>
                </TouchableOpacity>
              ))}
              <Text style={cm.label}>Cargo *</Text>
              <TouchableOpacity style={[cm.input, { justifyContent: 'center' }]} onPress={() => setCargoModal(true)}>
                <Text style={{ fontSize: 14, color: cargo ? '#0A1C14' : '#A0B8AC' }}>{cargo || 'Selecionar cargo...'}</Text>
              </TouchableOpacity>
              <Text style={cm.label}>Tipo de Contrato *</Text>
              <View style={cm.chipRow}>
                {CONTRATOS.map(c => (
                  <TouchableOpacity key={c} style={[cm.chip, contrato === c && { backgroundColor: CONTRATO_COR[c] + '18', borderColor: CONTRATO_COR[c] }]} onPress={() => setContrato(c)}>
                    <Text style={[cm.chipT, contrato === c && { color: CONTRATO_COR[c], fontWeight: '800' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={cm.label}>Faixa salarial (R$, opcional)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[cm.input, { flex: 1 }]} value={salarioMin} onChangeText={setSalarioMin} placeholder="Mínimo" placeholderTextColor="#A0B8AC" keyboardType="numeric" />
                <TextInput style={[cm.input, { flex: 1 }]} value={salarioMax} onChangeText={setSalarioMax} placeholder="Máximo" placeholderTextColor="#A0B8AC" keyboardType="numeric" />
              </View>
              <Text style={cm.label}>Estado (opcional)</Text>
              <TouchableOpacity style={[cm.input, { justifyContent: 'center' }]} onPress={() => setEstadoModal(true)}>
                <Text style={{ fontSize: 14, color: estado ? '#0A1C14' : '#A0B8AC' }}>
                  {estado ? (estados.find(e => e.sigla === estado)?.nome || estado) : 'Selecionar estado...'}
                </Text>
              </TouchableOpacity>
              <Text style={cm.label}>Cidade (opcional)</Text>
              <TouchableOpacity
                style={[cm.input, { justifyContent: 'center', opacity: estado ? 1 : 0.4 }]}
                onPress={() => { if (estado) setCidadeModal(true) }}
              >
                <Text style={{ fontSize: 14, color: cidade ? '#0A1C14' : '#A0B8AC' }}>
                  {cidade || (estado ? 'Selecionar cidade...' : 'Selecione o estado primeiro')}
                </Text>
              </TouchableOpacity>
              <Text style={cm.label}>Prazo para candidatura (opcional)</Text>
              <TextInput style={cm.input} value={prazo} onChangeText={v => setPrazo(maskDate(v))} placeholder="DD/MM/AAAA" placeholderTextColor="#A0B8AC" keyboardType="numeric" maxLength={10} />
              <Text style={cm.label}>Descrição (opcional)</Text>
              <TextInput style={[cm.input, { height: 80, textAlignVertical: 'top' }]} value={descricao} onChangeText={setDescricao} placeholder="Descreva a vaga..." placeholderTextColor="#A0B8AC" multiline />
              <Text style={cm.label}>Benefícios (opcional)</Text>
              <TextInput style={cm.input} value={beneficios} onChangeText={setBeneficios} placeholder="Ex: VR, VT, Plano de saúde..." placeholderTextColor="#A0B8AC" />
              <View style={{ height: 16 }} />
            </ScrollView>
          )}

          {/* Step 2: Requisitos */}
          {step === 2 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={cm.stepHint}>🟢 Obrigatório · 🔵 Desejável · Toque nos chips para alternar</Text>

              <Text style={cm.label}>Filtrar por profissão</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                  <TouchableOpacity style={[cm.chip, !tipoFiltro && cm.chipOn]} onPress={() => setTipoFiltro('')}>
                    <Text style={[cm.chipT, !tipoFiltro && cm.chipTOn]}>Todos</Text>
                  </TouchableOpacity>
                  {Object.keys(opcoes).map(t => (
                    <TouchableOpacity key={t} style={[cm.chip, tipoFiltro === t && cm.chipOn]} onPress={() => setTipoFiltro(t)}>
                      <Text style={[cm.chipT, tipoFiltro === t && cm.chipTOn]}>{TIPOS_ABREV[t] || t.substring(0, 8)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={cm.label}>Chips de requisitos</Text>
              <View style={cm.chipRow}>
                {chipPool.map((c, i) => {
                  const st = getChipState(c)
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[cm.chip,
                        st === 'obrig' && { backgroundColor: '#E6F5EE', borderColor: '#00A880' },
                        st === 'desej' && { backgroundColor: '#EBF2FC', borderColor: '#1A6FD4' },
                      ]}
                      onPress={() => toggleChip(c)}
                    >
                      <Text style={[cm.chipT,
                        st === 'obrig' && { color: '#00A880', fontWeight: '800' },
                        st === 'desej' && { color: '#1A6FD4', fontWeight: '800' },
                      ]}>
                        {st === 'obrig' ? '🟢 ' : st === 'desej' ? '🔵 ' : ''}{c}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={cm.label}>Adicionar obrigatório manualmente</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[cm.input, { flex: 1 }]} value={novoObrig} onChangeText={setNovoObrig} placeholder="Digitar requisito..." placeholderTextColor="#A0B8AC" onSubmitEditing={() => addManual(novoObrig, reqObrig, setReqObrig, setNovoObrig)} returnKeyType="done" />
                <TouchableOpacity style={cm.addBtn} onPress={() => addManual(novoObrig, reqObrig, setReqObrig, setNovoObrig)}>
                  <Text style={cm.addBtnT}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={cm.label}>Adicionar desejável manualmente</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[cm.input, { flex: 1 }]} value={novoDesej} onChangeText={setNovoDesej} placeholder="Digitar requisito..." placeholderTextColor="#A0B8AC" onSubmitEditing={() => addManual(novoDesej, reqDesej, setReqDesej, setNovoDesej)} returnKeyType="done" />
                <TouchableOpacity style={[cm.addBtn, { backgroundColor: '#1A6FD4' }]} onPress={() => addManual(novoDesej, reqDesej, setReqDesej, setNovoDesej)}>
                  <Text style={cm.addBtnT}>+</Text>
                </TouchableOpacity>
              </View>

              {reqObrig.length > 0 && (
                <>
                  <Text style={cm.label}>Obrigatórios selecionados ({reqObrig.length})</Text>
                  <View style={cm.chipRow}>
                    {reqObrig.map((r, i) => (
                      <TouchableOpacity key={i} style={[cm.chip, { backgroundColor: '#E6F5EE', borderColor: '#00A880' }]} onPress={() => setReqObrig(reqObrig.filter(x => x !== r))}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#00A880' }}>✓ {r} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {reqDesej.length > 0 && (
                <>
                  <Text style={cm.label}>Desejáveis selecionados ({reqDesej.length})</Text>
                  <View style={cm.chipRow}>
                    {reqDesej.map((r, i) => (
                      <TouchableOpacity key={i} style={[cm.chip, { backgroundColor: '#EBF2FC', borderColor: '#1A6FD4' }]} onPress={() => setReqDesej(reqDesej.filter(x => x !== r))}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A6FD4' }}>✓ {r} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <View style={{ height: 16 }} />
            </ScrollView>
          )}

          {/* Step 3: Perguntas */}
          {step === 3 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={cm.stepHint}>Adicione perguntas que os candidatos devem responder ao se candidatar.</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TextInput
                  style={[cm.input, { flex: 1 }]}
                  value={novaPergunta}
                  onChangeText={setNovaPergunta}
                  placeholder="Digite uma pergunta..."
                  placeholderTextColor="#A0B8AC"
                  onSubmitEditing={addPergunta}
                  returnKeyType="done"
                />
                <TouchableOpacity style={cm.addBtn} onPress={addPergunta}>
                  <Text style={cm.addBtnT}>+</Text>
                </TouchableOpacity>
              </View>
              {perguntas.length === 0 ? (
                <View style={cm.emptyPergs}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>❓</Text>
                  <Text style={{ fontSize: 14, color: '#7A9E8E', textAlign: 'center' }}>Nenhuma pergunta adicionada. As perguntas são opcionais.</Text>
                </View>
              ) : (
                perguntas.map((p, i) => (
                  <View key={i} style={cm.perguntaRow}>
                    <Text style={cm.perguntaNum}>{i + 1}.</Text>
                    <Text style={cm.perguntaT}>{p}</Text>
                    <TouchableOpacity onPress={() => setPerguntas(perguntas.filter((_, j) => j !== i))}>
                      <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '700' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <View style={{ height: 16 }} />
            </ScrollView>
          )}

          {/* Step 4: Revisão */}
          {step === 4 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={cm.stepHint}>Revise as informações antes de publicar.</Text>
              <View style={cm.reviewCard}>
                <Text style={cm.reviewLabel}>Página</Text>
                <Text style={cm.reviewValue}>{myPages.find(p => String(p.id) === pageId)?.nome || pageId}</Text>
              </View>
              <View style={cm.reviewCard}>
                <Text style={cm.reviewLabel}>Cargo · Contrato</Text>
                <Text style={cm.reviewValue}>{cargo} · {contrato}</Text>
              </View>
              {(salarioMin || salarioMax) && (
                <View style={cm.reviewCard}>
                  <Text style={cm.reviewLabel}>Salário</Text>
                  <Text style={cm.reviewValue}>R$ {salarioMin || '?'} – R$ {salarioMax || '?'}</Text>
                </View>
              )}
              {(cidade || estado) && (
                <View style={cm.reviewCard}>
                  <Text style={cm.reviewLabel}>Localização</Text>
                  <Text style={cm.reviewValue}>{[cidade, estado].filter(Boolean).join(', ')}</Text>
                </View>
              )}
              {prazo && (
                <View style={cm.reviewCard}>
                  <Text style={cm.reviewLabel}>Prazo</Text>
                  <Text style={cm.reviewValue}>{prazo}</Text>
                </View>
              )}
              {reqObrig.length > 0 && (
                <View style={cm.reviewCard}>
                  <Text style={cm.reviewLabel}>Obrigatórios ({reqObrig.length})</Text>
                  <View style={cm.chipRow}>
                    {reqObrig.map((r, i) => (
                      <View key={i} style={[cm.chip, { backgroundColor: '#E6F5EE', borderColor: '#00A880' }]}>
                        <Text style={{ fontSize: 11, color: '#00A880', fontWeight: '700' }}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {reqDesej.length > 0 && (
                <View style={cm.reviewCard}>
                  <Text style={cm.reviewLabel}>Desejáveis ({reqDesej.length})</Text>
                  <View style={cm.chipRow}>
                    {reqDesej.map((r, i) => (
                      <View key={i} style={[cm.chip, { backgroundColor: '#EBF2FC', borderColor: '#1A6FD4' }]}>
                        <Text style={{ fontSize: 11, color: '#1A6FD4', fontWeight: '700' }}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {perguntas.length > 0 && (
                <View style={cm.reviewCard}>
                  <Text style={cm.reviewLabel}>Perguntas ({perguntas.length})</Text>
                  {perguntas.map((p, i) => (
                    <Text key={i} style={cm.reviewValue}>{i + 1}. {p}</Text>
                  ))}
                </View>
              )}
              <View style={{ height: 16 }} />
            </ScrollView>
          )}

          {/* Navigation */}
          <View style={cm.navRow}>
            {step > 1 ? (
              <TouchableOpacity style={cm.navBtn} onPress={() => setStep(step - 1)}>
                <Text style={cm.navBtnT}>← Anterior</Text>
              </TouchableOpacity>
            ) : <View style={{ flex: 1 }} />}

            {step < 4 ? (
              <TouchableOpacity
                style={[cm.navBtnPrimary, step === 1 && (!pageId || !cargo || !contrato) && cm.saveBtnOff]}
                onPress={() => {
                  if (step === 1) {
                    if (!pageId) return Alert.alert('Atenção', 'Selecione uma página')
                    if (!cargo) return Alert.alert('Atenção', 'Selecione o cargo')
                    if (!contrato) return Alert.alert('Atenção', 'Selecione o tipo de contrato')
                    setTipoFiltro(CARGO_PARA_OPCAO[cargo] || '')
                  }
                  setStep(step + 1)
                }}
              >
                <Text style={cm.saveBtnT}>Próximo →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[cm.navBtnPrimary, saving && { opacity: 0.7 }]}
                onPress={publish}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cm.saveBtnT}>Publicar →</Text>}
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* ── Cargo picker ──────────────────────────────────────────── */}
        <Modal visible={cargoModal} transparent animationType="slide" onRequestClose={() => setCargoModal(false)}>
          <View style={cm.overlay}>
            <View style={[cm.sheet, { maxHeight: '70%' }]}>
              <View style={cm.handle} />
              <Text style={cm.title}>Cargo</Text>
              <FlatList
                data={CARGOS_VAGA}
                keyExtractor={item => item}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' }}
                    onPress={() => { setCargo(item); setCargoModal(false) }}
                  >
                    <Text style={{ fontSize: 15, color: '#0A1C14', fontWeight: '600' }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#EEF7F2', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 }}
                onPress={() => setCargoModal(false)}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#3A6550' }}>Fechar</Text>
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
      </View>
    </Modal>
  )
}

// ─── Modal: Detalhe da Vaga ───────────────────────────────────────────────────
function VagaDetalheModal({ vaga, isOwner, onClose, onCandidatou }: {
  vaga: any | null; isOwner: boolean; onClose: () => void; onCandidatou: () => void
}) {
  const [vagaFull, setVagaFull] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [step, setStep] = useState<'detail' | 'apply'>('detail')
  const [respostasObrig, setRespostasObrig] = useState<Record<number, boolean | null>>({})
  const [respostasDesej, setRespostasDesej] = useState<Record<number, boolean | null>>({})
  const [respostasTexto, setRespostasTexto] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [candidatou, setCandidatou] = useState(false)

  useEffect(() => {
    if (!vaga) return
    setStep('detail')
    setCandidatou(false)
    setVagaFull(null)
    setRespostasObrig({})
    setRespostasDesej({})
    setRespostasTexto([])
    setLoadingDetail(true)
    api.get(`/vagas/${vaga.id}`)
      .then(r => {
        console.log('[VagaDetalhe] vagaFull carregado:', JSON.stringify({
          id: r.data.id,
          requisitos_obrigatorios: r.data.requisitos_obrigatorios,
          requisitos_desejaveis: r.data.requisitos_desejaveis,
          perguntas: r.data.perguntas,
        }))
        setVagaFull(r.data)
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }, [vaga?.id])

  if (!vaga) return null

  const cor = CONTRATO_COR[vaga.contrato] || '#00A880'
  const perguntas: string[] = vagaFull?.perguntas || []
  const reqObrig: string[] = vagaFull?.requisitos_obrigatorios || []
  const reqDesej: string[] = vagaFull?.requisitos_desejaveis || []
  const jaCandidatou = !!(vagaFull?.minha_candidatura)
  const statusAtual = vagaFull?.minha_candidatura?.status

  const calcPct = () => {
    const obrigSim = reqObrig.filter((_, i) => respostasObrig[i] === true).length
    const desejSim = reqDesej.filter((_, i) => respostasDesej[i] === true).length
    const obrigScore = reqObrig.length > 0 ? (obrigSim / reqObrig.length) * 70 : 70
    const desejScore = reqDesej.length > 0 ? (desejSim / reqDesej.length) * 30 : 30
    return Math.round(obrigScore + desejScore)
  }

  const goToApply = () => {
    console.log('[CandidatarFlow] goToApply chamado', {
      reqObrig,
      reqDesej,
      perguntas,
      vagaFull: !!vagaFull,
    })
    if (reqObrig.length === 0 && reqDesej.length === 0 && perguntas.length === 0) {
      Alert.alert(
        'Confirmar candidatura',
        'Esta vaga não possui requisitos específicos — deseja confirmar sua candidatura?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: confirmar },
        ]
      )
      return
    }
    setRespostasObrig({})
    setRespostasDesej({})
    setRespostasTexto(new Array(perguntas.length).fill(''))
    setStep('apply')
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
      setCandidatou(true)
      setStep('detail')
      onCandidatou()
      Alert.alert('✅ Candidatura enviada!', `Você declarou atender ${pct}% dos requisitos desta vaga.`)
    } catch (err: any) {
      Alert.alert('Aviso', err.response?.data?.error || 'Erro ao candidatar')
    } finally { setSending(false) }
  }

  return (
    <Modal visible={!!vaga} transparent animationType="slide" onRequestClose={() => { if (step === 'apply') setStep('detail'); else onClose() }}>
      <View style={dm.overlay}>
        <View style={dm.sheet}>
          <View style={dm.handle} />

          {/* Header */}
          <View style={dm.header}>
            <TouchableOpacity onPress={() => { if (step === 'apply') setStep('detail'); else onClose() }} style={dm.closeBtn}>
              <Text style={dm.closeT}>{step === 'apply' ? '←' : '✕'}</Text>
            </TouchableOpacity>
            <View style={[dm.badge, { backgroundColor: cor + '18', borderColor: cor + '55' }]}>
              <Text style={[dm.badgeT, { color: cor }]}>{vaga.contrato}</Text>
            </View>
          </View>

          {loadingDetail ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator color={cor} size="large" />
            </View>
          ) : step === 'detail' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dm.scroll}>
              {/* Cargo e empresa */}
              <Text style={dm.cargo}>{vaga.cargo}</Text>
              <TouchableOpacity onPress={() => { onClose(); router.push(`/pagina/${vaga.page_id}` as any) }}>
                <Text style={[dm.empresa, { color: cor }]}>{vaga.empresa_nome} →</Text>
              </TouchableOpacity>
              {(vaga.cidade || vaga.estado) && (
                <Text style={dm.loc}>📍 {[vaga.cidade, vaga.estado].filter(Boolean).join(', ')}</Text>
              )}

              {/* Status candidatura atual */}
              {(jaCandidatou || candidatou) && (
                <View style={[dm.statusCard, { borderColor: STATUS_COR[statusAtual || 'em_analise'] + '40' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', marginBottom: 4 }}>Sua candidatura</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[dm.statusBadge, { color: STATUS_COR[statusAtual || 'em_analise'], backgroundColor: STATUS_COR[statusAtual || 'em_analise'] + '15' }]}>
                      {STATUS_LABEL[statusAtual || 'em_analise']}
                    </Text>
                    {vagaFull?.minha_candidatura?.porcentagem_compatibilidade != null && (
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#00A880' }}>
                        {vagaFull.minha_candidatura.porcentagem_compatibilidade}%
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Detalhes */}
              {(vagaFull?.salario_min || vagaFull?.salario_max) && (
                <View style={dm.row}>
                  <Text style={dm.rowLabel}>💰 Salário</Text>
                  <Text style={dm.rowValue}>R$ {vagaFull.salario_min?.toLocaleString('pt-BR') || '?'} – R$ {vagaFull.salario_max?.toLocaleString('pt-BR') || '?'}</Text>
                </View>
              )}
              {vaga.salario && !vagaFull?.salario_min && (
                <View style={dm.row}>
                  <Text style={dm.rowLabel}>💰 Salário</Text>
                  <Text style={dm.rowValue}>{vaga.salario}</Text>
                </View>
              )}
              {vaga.especialidade && (
                <View style={dm.row}>
                  <Text style={dm.rowLabel}>⭐ Especialidade</Text>
                  <Text style={dm.rowValue}>{vaga.especialidade}</Text>
                </View>
              )}
              {vagaFull?.prazo_candidatura && (
                <View style={dm.row}>
                  <Text style={dm.rowLabel}>📅 Prazo</Text>
                  <Text style={dm.rowValue}>{new Date(vagaFull.prazo_candidatura).toLocaleDateString('pt-BR')}</Text>
                </View>
              )}

              {/* Requisitos */}
              {reqObrig.length > 0 && (
                <View style={[dm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <Text style={dm.rowLabel}>🔴 Requisitos Obrigatórios</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {reqObrig.map((r, i) => (
                      <View key={i} style={[dm.reqChip, { backgroundColor: '#E6F5EE', borderColor: '#00A88060' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#00A880' }}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {reqDesej.length > 0 && (
                <View style={[dm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <Text style={dm.rowLabel}>🔵 Requisitos Desejáveis</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {reqDesej.map((r, i) => (
                      <View key={i} style={[dm.reqChip, { backgroundColor: '#EBF2FC', borderColor: '#1A6FD460' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#1A6FD4' }}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {vagaFull?.beneficios && (
                <View style={[dm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={dm.rowLabel}>🎁 Benefícios</Text>
                  <Text style={dm.rowValue}>{vagaFull.beneficios}</Text>
                </View>
              )}
              {vagaFull?.descricao && (
                <View style={[dm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={dm.rowLabel}>📋 Descrição</Text>
                  <Text style={dm.rowValue}>{vagaFull.descricao}</Text>
                </View>
              )}
              {vagaFull?.empresa_desc && (
                <View style={[dm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={dm.rowLabel}>🏢 Sobre a empresa</Text>
                  <Text style={dm.rowValue}>{vagaFull.empresa_desc}</Text>
                </View>
              )}
              {(reqObrig.length > 0 || reqDesej.length > 0 || perguntas.length > 0) && !jaCandidatou && !candidatou && (
                <View style={dm.row}>
                  <Text style={dm.rowLabel}>📝 Formulário</Text>
                  <Text style={dm.rowValue}>
                    {[
                      reqObrig.length > 0 && `${reqObrig.length} obrigatório${reqObrig.length !== 1 ? 's' : ''}`,
                      reqDesej.length > 0 && `${reqDesej.length} desejável${reqDesej.length !== 1 ? 'is' : ''}`,
                      perguntas.length > 0 && `${perguntas.length} pergunta${perguntas.length !== 1 ? 's' : ''}`,
                    ].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              )}

              <Text style={dm.data}>Publicada em {new Date(vaga.created_at).toLocaleDateString('pt-BR')}</Text>
            </ScrollView>
          ) : (
            // Step: apply - Sim/Não + perguntas + barra de %
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dm.scroll} keyboardShouldPersistTaps="handled">
              <Text style={dm.cargo}>{vaga.cargo}</Text>
              <Text style={[dm.empresa, { color: cor, marginBottom: 16 }]}>{vaga.empresa_nome}</Text>

              {reqObrig.length > 0 && (
                <>
                  <Text style={ap.sectionTitle}>🔴 Requisitos Obrigatórios</Text>
                  <Text style={ap.sectionHint}>Peso: 70% da compatibilidade</Text>
                  {reqObrig.map((r, i) => (
                    <View key={i} style={ap.reqRow}>
                      <Text style={ap.reqText}>{r}</Text>
                      <View style={ap.simnaoRow}>
                        <TouchableOpacity
                          style={[ap.simBtn, respostasObrig[i] === true && ap.simBtnOn]}
                          onPress={() => setRespostasObrig(prev => ({ ...prev, [i]: true }))}
                        >
                          <Text style={[ap.simnaoT, respostasObrig[i] === true && ap.simTOn]}>Sim</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[ap.naoBtn, respostasObrig[i] === false && ap.naoBtnOn]}
                          onPress={() => setRespostasObrig(prev => ({ ...prev, [i]: false }))}
                        >
                          <Text style={[ap.simnaoT, respostasObrig[i] === false && ap.naoTOn]}>Não</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {reqDesej.length > 0 && (
                <>
                  <Text style={[ap.sectionTitle, { marginTop: 20 }]}>🔵 Requisitos Desejáveis</Text>
                  <Text style={ap.sectionHint}>Peso: 30% da compatibilidade</Text>
                  {reqDesej.map((r, i) => (
                    <View key={i} style={ap.reqRow}>
                      <Text style={ap.reqText}>{r}</Text>
                      <View style={ap.simnaoRow}>
                        <TouchableOpacity
                          style={[ap.simBtn, respostasDesej[i] === true && ap.simBtnOn]}
                          onPress={() => setRespostasDesej(prev => ({ ...prev, [i]: true }))}
                        >
                          <Text style={[ap.simnaoT, respostasDesej[i] === true && ap.simTOn]}>Sim</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[ap.naoBtn, respostasDesej[i] === false && ap.naoBtnOn]}
                          onPress={() => setRespostasDesej(prev => ({ ...prev, [i]: false }))}
                        >
                          <Text style={[ap.simnaoT, respostasDesej[i] === false && ap.naoTOn]}>Não</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {perguntas.length > 0 && (
                <>
                  <Text style={[ap.sectionTitle, { marginTop: 20 }]}>❓ Perguntas do Recrutador</Text>
                  {perguntas.map((p, i) => (
                    <View key={i} style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0A1C14', marginBottom: 6 }}>{i + 1}. {p}</Text>
                      <TextInput
                        style={cm.input}
                        value={respostasTexto[i] || ''}
                        onChangeText={v => { const r = [...respostasTexto]; r[i] = v; setRespostasTexto(r) }}
                        placeholder="Sua resposta..."
                        placeholderTextColor="#A0B8AC"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  ))}
                </>
              )}

              {/* Barra de % calculada ao vivo */}
              <View style={[dm.compatCard, { marginTop: 20 }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', marginBottom: 10 }}>
                  Você atende {calcPct()}% dos requisitos desta vaga
                </Text>
                <CompatBar pct={calcPct()} />
                <Text style={{ fontSize: 11, color: '#7A9E8E', marginTop: 8, textAlign: 'center' }}>
                  Esta porcentagem será declarada ao recrutador
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Botão */}
          {!loadingDetail && (
            isOwner ? (
              <View style={dm.ownerNote}><Text style={dm.ownerNoteT}>Você é o dono desta vaga</Text></View>
            ) : candidatou || jaCandidatou ? (
              <View style={[dm.candidatarBtn, { backgroundColor: '#059669' }]}>
                <Text style={dm.candidatarBtnT}>✓ Candidatura enviada!</Text>
              </View>
            ) : step === 'detail' ? (
              <TouchableOpacity style={[dm.candidatarBtn, { backgroundColor: '#1c909b' }]} onPress={goToApply} disabled={!vagaFull}>
                <Text style={dm.candidatarBtnT}>Candidatar-se →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[dm.candidatarBtn, { backgroundColor: '#1c909b' }, sending && { opacity: 0.7 }]}
                onPress={confirmar}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={dm.candidatarBtnT}>Confirmar candidatura com {calcPct()}% →</Text>}
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </Modal>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function Vagas() {
  const [vagas, setVagas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [myPages, setMyPages] = useState<any[]>([])
  const [criarModal, setCriarModal] = useState(false)
  const [selectedVaga, setSelectedVaga] = useState<any | null>(null)
  const { user } = useAuthStore()

  const loadVagas = async () => {
    try {
      const params: any = {}
      if (filtro) params.contrato = filtro
      if (busca) params.cargo = busca
      const [vagasRes, pagesRes] = await Promise.all([
        api.get('/vagas', { params }),
        api.get('/pages/my').catch(() => ({ data: { pages: [] } })),
      ])
      setVagas(vagasRes.data.vagas || [])
      setMyPages(pagesRes.data.pages || [])
    } catch (err) { console.log(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useFocusEffect(useCallback(() => { setLoading(true); loadVagas() }, [filtro, busca]))

  const isOwnerOf = (vaga: any) => myPages.some(p => p.id === vaga.page_id)

  const renderVaga = ({ item }: any) => {
    const cor = CONTRATO_COR[item.contrato] || '#00A880'
    return (
      <TouchableOpacity style={s.card} onPress={() => setSelectedVaga(item)} activeOpacity={0.88}>
        <View style={[s.stripe, { backgroundColor: cor }]} />
        <View style={s.cardBody}>
          <View style={s.topRow}>
            <View style={[s.logoCircle, { backgroundColor: cor + '20' }]}>
              <Text style={[s.logoT, { color: cor }]}>{(item.empresa_nome || 'E').charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cargo}>{item.cargo}</Text>
              <Text style={s.empresa}>{item.empresa_nome}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: cor + '18', borderColor: cor + '60' }]}>
              <Text style={[s.badgeT, { color: cor }]}>{item.contrato}</Text>
            </View>
          </View>
          {item.especialidade ? <Text style={s.esp}>{item.especialidade}</Text> : null}
          {(item.requisitos_obrigatorios?.length > 0) && (
            <Text style={s.reqs}>🔴 {item.requisitos_obrigatorios.slice(0, 3).join(' · ')}{item.requisitos_obrigatorios.length > 3 ? '...' : ''}</Text>
          )}
          <View style={s.infoRow}>
            {(item.cidade || item.estado) && (
              <Text style={s.info}>📍 {[item.cidade, item.estado].filter(Boolean).join(', ')}</Text>
            )}
            {item.salario_min ? <Text style={s.info}>💰 R$ {item.salario_min?.toLocaleString('pt-BR')}{item.salario_max ? ` – ${item.salario_max?.toLocaleString('pt-BR')}` : '+'}</Text>
              : item.salario ? <Text style={s.info}>💰 {item.salario}</Text> : null}
          </View>
          <View style={s.footer}>
            <Text style={s.data}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
            <Text style={[s.verDetalhes, { color: cor }]}>Ver detalhes →</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#EEF7F2' }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Vagas</Text>
        {myPages.length > 0 ? (
          <TouchableOpacity style={s.headerBtn} onPress={() => setCriarModal(true)}>
            <Text style={s.headerBtnT}>+ Publicar</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 70 }} />}
      </View>

      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          placeholder="🔍  Buscar cargo..."
          placeholderTextColor="#A0B8AC"
          value={busca}
          onChangeText={setBusca}
          onSubmitEditing={loadVagas}
          returnKeyType="search"
        />
      </View>

      <View style={s.filtroRow}>
        {['', ...CONTRATOS].map(c => (
          <TouchableOpacity
            key={c || 'todos'}
            style={[s.filtro, filtro === c && s.filtroOn, filtro === c && c ? { backgroundColor: CONTRATO_COR[c], borderColor: CONTRATO_COR[c] } : undefined]}
            onPress={() => setFiltro(c)}
          >
            <Text style={[s.filtroT, filtro === c && s.filtroTOn]}>{c || 'Todos'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00A880" />
        </View>
      ) : (
        <FlatList
          data={vagas}
          keyExtractor={item => String(item.id)}
          renderItem={renderVaga}
          contentContainerStyle={vagas.length === 0 ? { flex: 1 } : { padding: 14, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVagas() }} tintColor="#00A880" />}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💼</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 6 }}>Nenhuma vaga no momento</Text>
              <Text style={{ fontSize: 14, color: '#7A9E8E', textAlign: 'center', paddingHorizontal: 24 }}>
                {myPages.length > 0 ? 'Seja o primeiro a publicar uma vaga.' : 'Crie uma página de empresa para publicar vagas.'}
              </Text>
            </View>
          }
        />
      )}

      <CriarVagaModal
        visible={criarModal}
        onClose={() => setCriarModal(false)}
        onCreated={() => { setCriarModal(false); setLoading(true); loadVagas() }}
        myPages={myPages}
      />

      <VagaDetalheModal
        vaga={selectedVaga}
        isOwner={selectedVaga ? isOwnerOf(selectedVaga) : false}
        onClose={() => setSelectedVaga(null)}
        onCandidatou={() => {}}
      />
    </View>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1c909b' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700', width: 32 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  headerBtnT: { color: '#fff', fontWeight: '800', fontSize: 13 },
  searchRow: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  searchInput: { backgroundColor: '#EEF7F2', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0A1C14' },
  filtroRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  filtro: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  filtroOn: { backgroundColor: '#00A880', borderColor: '#00A880' },
  filtroT: { fontSize: 12, fontWeight: '700', color: '#3A6550' },
  filtroTOn: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#D0E8DA', flexDirection: 'row' },
  stripe: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  logoCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  logoT: { fontSize: 18, fontWeight: '800' },
  cargo: { fontSize: 15, fontWeight: '800', color: '#0A1C14' },
  empresa: { fontSize: 12, color: '#3A6550', marginTop: 1 },
  badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  badgeT: { fontSize: 10, fontWeight: '800' },
  esp: { fontSize: 12, color: '#3A6550', fontWeight: '600', marginBottom: 4 },
  reqs: { fontSize: 11, color: '#7A9E8E', marginBottom: 6 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 },
  info: { fontSize: 12, color: '#7A9E8E' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEF7F2', marginTop: 4 },
  data: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  verDetalhes: { fontSize: 12, fontWeight: '800' },
})

const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 20, maxHeight: '90%' },
  handle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  closeBtn: { padding: 4 },
  closeT: { fontSize: 18, color: '#7A9E8E', fontWeight: '700' },
  badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  badgeT: { fontSize: 12, fontWeight: '800' },
  scroll: { paddingBottom: 16 },
  cargo: { fontSize: 22, fontWeight: '900', color: '#0A1C14', marginBottom: 4 },
  empresa: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  loc: { fontSize: 13, color: '#7A9E8E', marginBottom: 16 },
  compatCard: { backgroundColor: '#EEF7F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#D0E8DA' },
  compatItem: { fontSize: 12, fontWeight: '600', color: '#00A880' },
  compatItemFalta: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  compatItemDesej: { fontSize: 12, fontWeight: '600', color: '#1A6FD4' },
  statusCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1.5 },
  statusBadge: { fontSize: 13, fontWeight: '800', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEF7F2', gap: 12 },
  rowLabel: { fontSize: 12, fontWeight: '800', color: '#7A9E8E', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#0A1C14', flex: 1, textAlign: 'left' },
  reqChip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  data: { fontSize: 12, color: '#AECEBE', marginTop: 16, textAlign: 'center' },
  candidatarBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  candidatarBtnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  ownerNote: { backgroundColor: '#EEF7F2', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  ownerNoteT: { fontSize: 14, fontWeight: '700', color: '#7A9E8E' },
})

const ap = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#0A1C14', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  sectionHint: { fontSize: 11, color: '#7A9E8E', marginBottom: 10 },
  reqRow: { backgroundColor: '#F8FCFA', borderWidth: 1, borderColor: '#D0E8DA', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  reqText: { fontSize: 13, fontWeight: '600', color: '#0A1C14', lineHeight: 18 },
  simnaoRow: { flexDirection: 'row', gap: 8 },
  simBtn: { flex: 1, borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  simBtnOn: { backgroundColor: '#00A880', borderColor: '#00A880' },
  naoBtn: { flex: 1, borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  naoBtnOn: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  simnaoT: { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  simTOn: { color: '#fff' },
  naoTOn: { color: '#fff' },
})

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#EEF7F2', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 12, maxHeight: '94%', paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  handle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  close: { fontSize: 20, color: '#7A9E8E', fontWeight: '700', width: 36 },
  title: { fontSize: 17, fontWeight: '800', color: '#0A1C14' },
  stepIndicator: { fontSize: 11, color: '#7A9E8E', fontWeight: '600', marginTop: 2 },
  progress: { flexDirection: 'row', gap: 6, alignSelf: 'center', marginBottom: 14 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0E8DA' },
  progressDotOn: { backgroundColor: '#00A880', width: 24 },
  label: { fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
  stepHint: { fontSize: 12, color: '#7A9E8E', marginTop: 4, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 13, fontSize: 14, color: '#0A1C14', marginBottom: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: '#00A880', borderColor: '#00A880' },
  chipT: { fontSize: 13, fontWeight: '600', color: '#3A6550' },
  chipTOn: { color: '#fff', fontWeight: '800' },
  pageChip: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  pageChipOn: { borderColor: '#00A880', backgroundColor: '#E6F5EE' },
  pageChipT: { fontSize: 14, color: '#3A6550' },
  addBtn: { backgroundColor: '#00A880', borderRadius: 12, width: 48, justifyContent: 'center', alignItems: 'center' },
  addBtnT: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptyPergs: { alignItems: 'center', paddingVertical: 32 },
  perguntaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#D0E8DA' },
  perguntaNum: { fontSize: 14, fontWeight: '800', color: '#00A880', width: 20 },
  perguntaT: { flex: 1, fontSize: 13, color: '#0A1C14', lineHeight: 20 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#D0E8DA', gap: 6 },
  reviewLabel: { fontSize: 10, fontWeight: '800', color: '#7A9E8E', textTransform: 'uppercase', letterSpacing: 0.8 },
  reviewValue: { fontSize: 14, fontWeight: '600', color: '#0A1C14' },
  saveBtn: { backgroundColor: '#00A880', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnOff: { backgroundColor: '#AECEBE' },
  saveBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },
  navRow: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#D0E8DA', marginTop: 4 },
  navBtn: { flex: 1, borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 13, alignItems: 'center', backgroundColor: '#fff' },
  navBtnT: { fontSize: 14, fontWeight: '700', color: '#3A6550' },
  navBtnPrimary: { flex: 1, backgroundColor: '#00A880', borderRadius: 12, padding: 13, alignItems: 'center' },
})
