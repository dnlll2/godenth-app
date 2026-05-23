import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Image, Platform, Linking,
  Modal, Alert, TextInput,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const API_BASE = 'https://godenth-api.onrender.com'
const PRIMARY  = '#1c909b'
const GOLD     = '#C49800'

function absUrl(url?: string | null) {
  if (!url) return null
  if (url.startsWith('https://')) return url
  if (url.startsWith('http://'))  return url.replace('http://', 'https://')
  if (url.startsWith('/'))        return API_BASE + url
  return `${API_BASE}/uploads/${url}`
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

const IB = { stroke: '#fff', strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function SearchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx="10.5" cy="10.5" r="6.5" {...IB} />
      <Line x1="15.5" y1="15.5" x2="21" y2="21" {...IB} />
    </Svg>
  )
}

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M10,7 C10,5.3 14,5.3 14,7" {...IB} />
      <Path d="M5,17 C5,12 7.5,8 12,8 C16.5,8 19,12 19,17 L20,19 L4,19 Z" {...IB} />
      <Path d="M10,19 C10,20.7 14,20.7 14,19" {...IB} />
    </Svg>
  )
}

function PlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Line x1="12" y1="5" x2="12" y2="19" {...IB} />
      <Line x1="5"  y1="12" x2="19" y2="12" {...IB} />
    </Svg>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function calcularPerfilPct(user: any): number {
  if (!user) return 0
  const checks = [
    !!user.avatar_url,
    !!user.bio?.trim(),
    !!user.cidade,
    !!user.estado,
    !!(user.especialidades?.length),
    !!(user.habilidades?.length),
    !!user.celular,
    !!(user.formacao?.length),
    !!(user.experiencia?.length),
  ]
  return Math.round(checks.filter(Boolean).length / checks.length * 100)
}

function calcularCompatAvancado(user: any, vaga: any): number {
  let score = 0
  const vagaEstado = (vaga.estado || vaga.empresa_estado || '').toLowerCase().trim()
  const vagaCidade = (vaga.cidade || vaga.empresa_cidade || '').toLowerCase().trim()
  if (!vagaEstado) {
    score += 20
  } else if (user?.estado && user.estado.toLowerCase().trim() === vagaEstado) {
    score += 10
    if (vagaCidade && user?.cidade && user.cidade.toLowerCase().trim() === vagaCidade) score += 10
  }
  const reqObrig: string[] = vaga.requisitos_obrigatorios || []
  const reqDesej: string[] = vaga.requisitos_desejaveis  || []
  const userCaps = [
    ...(user?.especialidades || []),
    ...(user?.habilidades    || []),
    ...((user?.cargos_extras || []).map((c: any) => typeof c === 'string' ? c : c.cargo || '')),
    user?.tipo_profissional || '',
  ].map((c: string) => c.toLowerCase().trim()).filter(Boolean)
  const n = (s: string) => s.toLowerCase().trim()
  score += reqObrig.length ? (reqObrig.filter(r => userCaps.includes(n(r))).length / reqObrig.length) * 40 : 40
  score += reqDesej.length ? (reqDesej.filter(r => userCaps.includes(n(r))).length / reqDesej.length) * 20 : 20
  if (user?.formacao?.length)    score += 10
  if (user?.experiencia?.length) score += 10
  return Math.min(100, Math.round(score))
}

function tempoRelativo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'agora'
  if (diff < 3600)   return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400)  return `há ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'ontem'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function isVendaGroup(grupo: any): boolean {
  const text = `${grupo.nome} ${grupo.descricao} ${grupo.categoria}`.toLowerCase()
  return ['venda', 'vend', 'equipament', 'insumo', 'material', 'produto', 'compra', 'loja'].some(k => text.includes(k))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const CONTRATO_COR: Record<string, string> = {
  CLT: '#00A880', PJ: '#1A6FD4', Freelancer: GOLD, 'Estágio': '#7B3FC4',
}

const TIPOS_META: Record<string, { emoji: string; label: string; cor: string }> = {
  parceria:     { emoji: '🤝', label: 'Parceria',     cor: '#7B3FC4' },
  vaga:         { emoji: '💼', label: 'Vaga',          cor: GOLD      },
  ajuda:        { emoji: '🆘', label: 'Ajuda',         cor: '#E53935' },
  dica_clinica: { emoji: '💡', label: 'Dica Clínica',  cor: '#00A880' },
  caso_clinico: { emoji: '🦷', label: 'Caso Clínico',  cor: '#1A6FD4' },
  oportunidade: { emoji: '🚀', label: 'Oportunidade',  cor: GOLD      },
  pergunta:     { emoji: '❓', label: 'Pergunta',       cor: '#7B3FC4' },
  noticia:      { emoji: '📰', label: 'Notícia',        cor: '#D4600A' },
  humor:        { emoji: '😄', label: 'Humor',          cor: '#D4186A' },
}

const TIPO_CURSO_META: Record<string, { emoji: string; cor: string }> = {
  curso:       { emoji: '🎓', cor: '#1A6FD4' },
  treinamento: { emoji: '🏋️', cor: '#7B3FC4' },
  palestra:    { emoji: '🎤', cor: PRIMARY   },
  evento:      { emoji: '🗓️', cor: GOLD      },
}

const CAT_META: Record<string, { label: string; cor: string }> = {
  clinica:     { label: 'Clínica Odontológica',      cor: '#00A880' },
  laboratorio: { label: 'Laboratório de Prótese',     cor: '#7B3FC4' },
  fabricante:  { label: 'Fabricante / Distribuidora', cor: '#D4600A' },
  ensino:      { label: 'Instituição de Ensino',      cor: '#0891B2' },
  marketing:   { label: 'Marketing & Comunicação',    cor: '#D4186A' },
  gestao:      { label: 'Gestão & Consultoria',       cor: '#334155' },
  servicos:    { label: 'Serviços Profissionais',     cor: '#334155' },
}

const STATUS_COR: Record<string, string> = {
  em_analise: '#C49800', aprovado: '#00A880', reprovado: '#EF4444',
}
const STATUS_LABEL: Record<string, string> = {
  em_analise: 'Em análise', aprovado: '✓ Aprovado', reprovado: '✗ Reprovado',
}

// Calcula compatibilidade real: requisitos da vaga vs perfil do usuário.
// Retorna null quando o perfil não tem dados suficientes.
function calcCompatPerfil(user: any, vaga: any): number | null {
  const userCaps = [
    ...(user?.especialidades || []),
    ...(user?.habilidades    || []),
    ...((user?.cargos_extras || []).map((c: any) => typeof c === 'string' ? c : c.cargo || '')),
    user?.tipo_profissional || '',
  ].map((c: string) => c.toLowerCase().trim()).filter(Boolean)

  if (userCaps.length === 0) return null

  const reqObrig: string[] = Array.isArray(vaga?.requisitos_obrigatorios) ? vaga.requisitos_obrigatorios : []
  const reqDesej: string[] = Array.isArray(vaga?.requisitos_desejaveis)   ? vaga.requisitos_desejaveis   : []
  const n = (s: string) => s.toLowerCase().trim()

  if (reqObrig.length === 0 && reqDesej.length === 0) return 100

  const obrigScore = reqObrig.length > 0
    ? (reqObrig.filter(r => userCaps.includes(n(r))).length / reqObrig.length) * 70
    : 70
  const desejScore = reqDesej.length > 0
    ? (reqDesej.filter(r => userCaps.includes(n(r))).length / reqDesej.length) * 30
    : 30

  return Math.round(obrigScore + desejScore)
}

// ── CompatBar (feed modal) ────────────────────────────────────────────────────

function CompatBarFeed({ pct }: { pct: number }) {
  const cor = pct > 70 ? '#00A880' : pct >= 40 ? '#C49800' : '#EF4444'
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.6 }}>Compatibilidade</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: cor }}>{pct}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#EEF7F2', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.min(100, pct)}%` as any, backgroundColor: cor, borderRadius: 4 }} />
      </View>
    </View>
  )
}

// ── Modal de detalhe/candidatura de vaga (feed local) ─────────────────────────

function FeedVagaModal({ vagaId, isOwner, user, onClose }: {
  vagaId: number | null; isOwner: boolean; user: any; onClose: () => void
}) {
  const [vagaFull, setVagaFull]           = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [step, setStep]                   = useState<'detail' | 'apply'>('detail')
  const [respostasObrig, setRespostasObrig] = useState<Record<number, boolean>>({})
  const [respostasDesej, setRespostasDesej] = useState<Record<number, boolean>>({})
  const [respostasTexto, setRespostasTexto] = useState<string[]>([])
  const [sending, setSending]             = useState(false)
  const [candidatou, setCandidatou]       = useState(false)

  useEffect(() => {
    if (!vagaId) return
    setStep('detail'); setCandidatou(false); setVagaFull(null)
    setRespostasObrig({}); setRespostasDesej({}); setRespostasTexto([])
    setLoadingDetail(true)
    api.get(`/vagas/${vagaId}`)
      .then(r => setVagaFull(r.data))
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }, [vagaId])

  const perguntas: string[] = vagaFull?.perguntas || []
  const reqObrig: string[]  = vagaFull?.requisitos_obrigatorios || []
  const reqDesej: string[]  = vagaFull?.requisitos_desejaveis || []
  const jaCandidatou        = !!(vagaFull?.minha_candidatura)
  const statusAtual         = vagaFull?.minha_candidatura?.status
  const cor                 = CONTRATO_COR[vagaFull?.contrato] || '#00A880'

  const calcPct = () => {
    const obrigSim  = reqObrig.filter((_, i) => respostasObrig[i] === true).length
    const desejSim  = reqDesej.filter((_, i) => respostasDesej[i] === true).length
    const obrigScore = reqObrig.length > 0 ? (obrigSim / reqObrig.length) * 70 : 70
    const desejScore = reqDesej.length > 0 ? (desejSim / reqDesej.length) * 30 : 30
    return Math.round(obrigScore + desejScore)
  }

  const goToApply = () => {
    if (reqObrig.length === 0 && reqDesej.length === 0 && perguntas.length === 0) {
      Alert.alert('Confirmar candidatura', 'Esta vaga não possui requisitos — deseja confirmar?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: confirmar },
      ])
      return
    }
    setRespostasObrig({}); setRespostasDesej({})
    setRespostasTexto(new Array(perguntas.length).fill(''))
    setStep('apply')
  }

  const confirmar = async () => {
    const pct = calcPct()
    setSending(true)
    try {
      await api.post(`/vagas/${vagaId}/candidatar`, {
        respostas: respostasTexto,
        porcentagem_compatibilidade: pct,
        respostas_requisitos: {
          obrigatorios: reqObrig.map((r, i) => ({ req: r, sim: respostasObrig[i] === true })),
          desejaveis:   reqDesej.map((r, i) => ({ req: r, sim: respostasDesej[i] === true })),
        },
      })
      setCandidatou(true); setStep('detail')
      Alert.alert('✅ Candidatura enviada!', `Você declarou atender ${pct}% dos requisitos desta vaga.`)
    } catch (err: any) {
      Alert.alert('Aviso', err.response?.data?.error || 'Erro ao candidatar')
    } finally { setSending(false) }
  }

  return (
    <Modal visible={!!vagaId} transparent animationType="slide"
      onRequestClose={() => step === 'apply' ? setStep('detail') : onClose()}>
      <View style={fm.overlay}>
        <View style={fm.sheet}>
          <View style={fm.handle} />

          {/* Header */}
          <View style={fm.header}>
            <TouchableOpacity onPress={() => step === 'apply' ? setStep('detail') : onClose()} style={fm.closeBtn}>
              <Text style={fm.closeT}>{step === 'apply' ? '←' : '✕'}</Text>
            </TouchableOpacity>
            {vagaFull && (
              <View style={[fm.badge, { backgroundColor: cor + '18', borderColor: cor + '55' }]}>
                <Text style={[fm.badgeT, { color: cor }]}>{vagaFull.contrato}</Text>
              </View>
            )}
          </View>

          {loadingDetail ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator color={PRIMARY} size="large" />
            </View>
          ) : !vagaFull ? null : step === 'detail' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={fm.scroll}>
              <Text style={fm.cargo}>{vagaFull.cargo}</Text>
              <TouchableOpacity onPress={() => { onClose(); router.push(`/pagina/${vagaFull.page_id}` as any) }}>
                <Text style={[fm.empresa, { color: cor }]}>{vagaFull.empresa_nome} →</Text>
              </TouchableOpacity>
              {(vagaFull.cidade || vagaFull.estado) ? (
                <Text style={fm.loc}>📍 {[vagaFull.cidade, vagaFull.estado].filter(Boolean).join(', ')}</Text>
              ) : null}

              {/* Compatibilidade com perfil */}
              {(() => {
                const compat = calcCompatPerfil(user, vagaFull)
                if (compat != null) {
                  const barCor = compat >= 70 ? '#00A880' : compat >= 40 ? '#C49800' : '#EF4444'
                  return (
                    <View style={fm.compatCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                          Compatibilidade com seu perfil
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: barCor }}>{compat}%</Text>
                      </View>
                      <CompatBarFeed pct={compat} />
                    </View>
                  )
                }
                return (
                  <TouchableOpacity
                    style={[fm.compatCard, { alignItems: 'center' }]}
                    onPress={() => { onClose(); router.push('/(tabs)/editar-perfil' as any) }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 12, color: '#7A9E8E', fontWeight: '600', textAlign: 'center' }}>
                      Complete seu perfil para ver compatibilidade →
                    </Text>
                  </TouchableOpacity>
                )
              })()}

              {(jaCandidatou || candidatou) && (
                <View style={[fm.statusCard, { borderColor: STATUS_COR[statusAtual || 'em_analise'] + '40' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', marginBottom: 4 }}>Sua candidatura</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[fm.statusBadge, { color: STATUS_COR[statusAtual || 'em_analise'], backgroundColor: STATUS_COR[statusAtual || 'em_analise'] + '15' }]}>
                      {STATUS_LABEL[statusAtual || 'em_analise']}
                    </Text>
                    {vagaFull.minha_candidatura?.porcentagem_compatibilidade != null && (
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#00A880' }}>
                        {vagaFull.minha_candidatura.porcentagem_compatibilidade}%
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {(vagaFull.salario_min || vagaFull.salario_max) ? (
                <View style={fm.row}>
                  <Text style={fm.rowLabel}>💰 Salário</Text>
                  <Text style={fm.rowValue}>R$ {Number(vagaFull.salario_min).toLocaleString('pt-BR')} – R$ {Number(vagaFull.salario_max).toLocaleString('pt-BR')}</Text>
                </View>
              ) : vagaFull.salario ? (
                <View style={fm.row}>
                  <Text style={fm.rowLabel}>💰 Salário</Text>
                  <Text style={fm.rowValue}>{vagaFull.salario}</Text>
                </View>
              ) : null}

              {reqObrig.length > 0 && (
                <View style={[fm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <Text style={fm.rowLabel}>🔴 Requisitos Obrigatórios</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {reqObrig.map((r, i) => (
                      <View key={i} style={[fm.reqChip, { backgroundColor: '#E6F5EE', borderColor: '#00A88060' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#00A880' }}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {reqDesej.length > 0 && (
                <View style={[fm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <Text style={fm.rowLabel}>🔵 Requisitos Desejáveis</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {reqDesej.map((r, i) => (
                      <View key={i} style={[fm.reqChip, { backgroundColor: '#EBF2FC', borderColor: '#1A6FD460' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#1A6FD4' }}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {vagaFull.beneficios ? (
                <View style={[fm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={fm.rowLabel}>🎁 Benefícios</Text>
                  <Text style={fm.rowValue}>{vagaFull.beneficios}</Text>
                </View>
              ) : null}
              {vagaFull.descricao ? (
                <View style={[fm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={fm.rowLabel}>📋 Descrição</Text>
                  <Text style={fm.rowValue}>{vagaFull.descricao}</Text>
                </View>
              ) : null}
              {vagaFull.empresa_desc ? (
                <View style={[fm.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={fm.rowLabel}>🏢 Sobre a empresa</Text>
                  <Text style={fm.rowValue}>{vagaFull.empresa_desc}</Text>
                </View>
              ) : null}
              <Text style={fm.data}>Publicada em {new Date(vagaFull.created_at).toLocaleDateString('pt-BR')}</Text>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={fm.scroll} keyboardShouldPersistTaps="handled">
              <Text style={fm.cargo}>{vagaFull.cargo}</Text>
              <Text style={[fm.empresa, { color: cor, marginBottom: 16 }]}>{vagaFull.empresa_nome}</Text>

              {reqObrig.length > 0 && (
                <>
                  <Text style={fap.sectionTitle}>🔴 Requisitos Obrigatórios</Text>
                  <Text style={fap.sectionHint}>Peso: 70% da compatibilidade</Text>
                  {reqObrig.map((r, i) => (
                    <View key={i} style={fap.reqRow}>
                      <Text style={fap.reqText}>{r}</Text>
                      <View style={fap.simnaoRow}>
                        <TouchableOpacity style={[fap.simBtn, respostasObrig[i] === true  && fap.simBtnOn]} onPress={() => setRespostasObrig(p => ({ ...p, [i]: true }))}>
                          <Text style={[fap.simnaoT, respostasObrig[i] === true  && fap.simTOn]}>Sim</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[fap.naoBtn, respostasObrig[i] === false && fap.naoBtnOn]} onPress={() => setRespostasObrig(p => ({ ...p, [i]: false }))}>
                          <Text style={[fap.simnaoT, respostasObrig[i] === false && fap.naoTOn]}>Não</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {reqDesej.length > 0 && (
                <>
                  <Text style={[fap.sectionTitle, { marginTop: 20 }]}>🔵 Requisitos Desejáveis</Text>
                  <Text style={fap.sectionHint}>Peso: 30% da compatibilidade</Text>
                  {reqDesej.map((r, i) => (
                    <View key={i} style={fap.reqRow}>
                      <Text style={fap.reqText}>{r}</Text>
                      <View style={fap.simnaoRow}>
                        <TouchableOpacity style={[fap.simBtn, respostasDesej[i] === true  && fap.simBtnOn]} onPress={() => setRespostasDesej(p => ({ ...p, [i]: true }))}>
                          <Text style={[fap.simnaoT, respostasDesej[i] === true  && fap.simTOn]}>Sim</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[fap.naoBtn, respostasDesej[i] === false && fap.naoBtnOn]} onPress={() => setRespostasDesej(p => ({ ...p, [i]: false }))}>
                          <Text style={[fap.simnaoT, respostasDesej[i] === false && fap.naoTOn]}>Não</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {perguntas.length > 0 && (
                <>
                  <Text style={[fap.sectionTitle, { marginTop: 20 }]}>❓ Perguntas do Recrutador</Text>
                  {perguntas.map((p, i) => (
                    <View key={i} style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0A1C14', marginBottom: 6 }}>{i + 1}. {p}</Text>
                      <TextInput
                        style={fap.input}
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

              <View style={[fm.compatCard, { marginTop: 20 }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', marginBottom: 10 }}>
                  Você atende {calcPct()}% dos requisitos desta vaga
                </Text>
                <CompatBarFeed pct={calcPct()} />
                <Text style={{ fontSize: 11, color: '#7A9E8E', marginTop: 8, textAlign: 'center' }}>
                  Esta porcentagem será declarada ao recrutador
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Botão fixo */}
          {!loadingDetail && vagaFull && (
            isOwner ? (
              <View style={fm.ownerNote}><Text style={fm.ownerNoteT}>Você é o dono desta vaga</Text></View>
            ) : candidatou || jaCandidatou ? (
              <View style={[fm.candidatarBtn, { backgroundColor: '#059669' }]}>
                <Text style={fm.candidatarBtnT}>✓ Candidatura enviada!</Text>
              </View>
            ) : step === 'detail' ? (
              <TouchableOpacity style={[fm.candidatarBtn, { backgroundColor: '#1c909b' }]} onPress={goToApply}>
                <Text style={fm.candidatarBtnT}>Candidatar-se →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[fm.candidatarBtn, { backgroundColor: '#1c909b' }, sending && { opacity: 0.7 }]}
                onPress={confirmar}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={fm.candidatarBtnT}>Confirmar candidatura com {calcPct()}% →</Text>}
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </Modal>
  )
}

// ── Card: Vaga (compatibilidade) ──────────────────────────────────────────────

function VagaCard({ vaga, user, onVerVaga }: { vaga: any; user: any; onVerVaga?: () => void }) {
  const cargo    = vaga.cargo    || vaga.data_json?.cargo
  const contrato = vaga.contrato || vaga.data_json?.contrato
  const cCor     = CONTRATO_COR[contrato] || '#7A9E8E'
  const loc      = [vaga.cidade || vaga.empresa_cidade, vaga.estado || vaga.empresa_estado].filter(Boolean).join(' · ')
  const logoUrl  = vaga.logo_url
    ? (absUrl(vaga.logo_url)!)
    : null
  const salMin   = vaga.salario_min ?? vaga.data_json?.salario_min
  const salMax   = vaga.salario_max ?? vaga.data_json?.salario_max
  const salario  = salMin
    ? `R$ ${Number(salMin).toLocaleString('pt-BR')}${salMax ? ` – ${Number(salMax).toLocaleString('pt-BR')}` : ''}`
    : null

  return (
    <View style={s.vagaCard}>
      <View style={s.vagaTop}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
          onPress={() => vaga.page_id && router.push(`/pagina/${vaga.page_id}` as any)}
          activeOpacity={vaga.page_id ? 0.72 : 1}
          disabled={!vaga.page_id}
        >
          {logoUrl
            ? <Image source={{ uri: logoUrl }} style={s.vagaLogo} />
            : <View style={[s.vagaLogo, s.vagaLogoFb]}>
                <Text style={s.vagaLogoFbT}>{(vaga.empresa_nome || vaga.page_nome || '?').charAt(0)}</Text>
              </View>
          }
          <View style={{ flex: 1 }}>
            <Text style={s.vagaEmpresa} numberOfLines={1}>{vaga.empresa_nome || vaga.page_nome}</Text>
            <Text style={s.vagaCargo}   numberOfLines={2}>{cargo}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={s.chips}>
        {contrato ? (
          <View style={[s.chip, { borderColor: cCor + '70', backgroundColor: cCor + '14' }]}>
            <Text style={[s.chipT, { color: cCor }]}>{contrato}</Text>
          </View>
        ) : null}
        {loc     ? <View style={s.chip}><Text style={s.chipT}>📍 {loc}</Text></View>     : null}
        {salario ? <View style={s.chip}><Text style={s.chipT}>{salario}</Text></View> : null}
      </View>
      <TouchableOpacity
        style={[s.actionBtn, { backgroundColor: PRIMARY }]}
        onPress={() => onVerVaga ? onVerVaga() : router.push('/(tabs)/vagas' as any)}
        activeOpacity={0.8}
      >
        <Text style={s.actionBtnT}>Ver vaga →</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Card: Vaga de interesse (por data) ────────────────────────────────────────

function VagaInteresseCard({ vaga, user, onVerVaga }: { vaga: any; user: any; onVerVaga?: () => void }) {
  const cCor    = CONTRATO_COR[vaga.contrato] || '#7A9E8E'
  const loc     = [vaga.cidade || vaga.empresa_cidade, vaga.estado || vaga.empresa_estado].filter(Boolean).join(' · ')
  const logoUrl = vaga.logo_url
    ? (absUrl(vaga.logo_url)!)
    : null

  return (
    <View style={s.vagaCard}>
      <View style={s.vagaTop}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
          onPress={() => vaga.page_id && router.push(`/pagina/${vaga.page_id}` as any)}
          activeOpacity={vaga.page_id ? 0.72 : 1}
          disabled={!vaga.page_id}
        >
          {logoUrl
            ? <Image source={{ uri: logoUrl }} style={s.vagaLogo} />
            : <View style={[s.vagaLogo, s.vagaLogoFb]}>
                <Text style={s.vagaLogoFbT}>{(vaga.empresa_nome || '?').charAt(0)}</Text>
              </View>
          }
          <View style={{ flex: 1 }}>
            <Text style={s.vagaEmpresa} numberOfLines={1}>{vaga.empresa_nome}</Text>
            <Text style={s.vagaCargo}   numberOfLines={2}>{vaga.cargo}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={s.chips}>
        {vaga.contrato ? (
          <View style={[s.chip, { borderColor: cCor + '70', backgroundColor: cCor + '14' }]}>
            <Text style={[s.chipT, { color: cCor }]}>{vaga.contrato}</Text>
          </View>
        ) : null}
        {loc ? <View style={s.chip}><Text style={s.chipT}>📍 {loc}</Text></View> : null}
      </View>
      <TouchableOpacity
        style={[s.actionBtn, { backgroundColor: '#475569' }]}
        onPress={() => onVerVaga ? onVerVaga() : router.push('/(tabs)/vagas' as any)}
        activeOpacity={0.8}
      >
        <Text style={s.actionBtnT}>Ver vaga →</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Card: Post (recentes / feed geral) ────────────────────────────────────────

function RecentPostCard({ post }: { post: any }) {
  const meta      = TIPOS_META[post.tipo_post] || { emoji: '📋', label: post.tipo_post, cor: PRIMARY }
  const avatarUrl = post.author_avatar
    ? (absUrl(post.author_avatar)!)
    : null
  const nome  = post.page_nome || post.author_nome || 'Usuário'
  const texto = post.data_json?.texto || post.data_json?.descricao
  const sub   = post.data_json?.subcategoria
  const loc   = [post.data_json?.cidade, post.data_json?.estado].filter(Boolean).join(' · ')

  return (
    <View style={[s.recentCard, { borderLeftColor: meta.cor }]}>
      <View style={s.recentTop}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
          onPress={() => {
            if (post.page_id) router.push(`/pagina/${post.page_id}` as any)
            else if (post.author_id) router.push(`/usuario/${post.author_id}` as any)
          }}
          activeOpacity={0.75}
        >
          {avatarUrl
            ? <Image source={{ uri: avatarUrl }} style={s.recentAv} />
            : <View style={[s.recentAv, { backgroundColor: meta.cor + '30', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: meta.cor, fontWeight: '800', fontSize: 13 }}>{nome.charAt(0)}</Text>
              </View>
          }
          <View style={{ flex: 1 }}>
            <Text style={s.recentNome}  numberOfLines={1}>{nome}</Text>
            {post.tipo_profissional
              ? <Text style={s.recentCargo} numberOfLines={1}>{post.tipo_profissional}</Text>
              : null}
            {loc ? <Text style={s.recentLoc}>{loc}</Text> : null}
          </View>
        </TouchableOpacity>
        <View style={[s.recentBadge, { backgroundColor: meta.cor + '18', borderColor: meta.cor + '50' }]}>
          <Text style={[s.recentBadgeT, { color: meta.cor }]}>{meta.emoji} {meta.label.toUpperCase()}</Text>
        </View>
      </View>
      {sub   ? <Text style={s.recentSub}>{sub}</Text>   : null}
      {texto ? <Text style={s.recentTexto} numberOfLines={4}>{texto}</Text> : null}
      <Text style={s.recentTempo}>{tempoRelativo(post.created_at)}</Text>
    </View>
  )
}

// ── Card: Produto (marketplace) ───────────────────────────────────────────────

function ProdutoCard({ post, grupoNome }: { post: any; grupoNome: string }) {
  const imgUrl = absUrl(post.imagem_url)
  const avatarUrl = post.author_avatar
    ? (absUrl(post.author_avatar)!)
    : null

  return (
    <View style={s.prodCard}>
      {imgUrl ? <Image source={{ uri: imgUrl }} style={s.prodImg} resizeMode="cover" /> : null}
      <View style={s.prodBody}>
        <View style={s.prodTop}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
            onPress={() => post.author_id && router.push(`/usuario/${post.author_id}` as any)}
            activeOpacity={0.75}
          >
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.prodAv} />
              : <View style={[s.prodAv, { backgroundColor: PRIMARY + '30', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: PRIMARY, fontWeight: '800', fontSize: 12 }}>{(post.author_nome || 'U').charAt(0)}</Text>
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.prodAutorNome} numberOfLines={1}>{post.author_nome || 'Usuário'}</Text>
              {post.author_tipo ? <Text style={s.prodAutorTipo} numberOfLines={1}>{post.author_tipo}</Text> : null}
            </View>
          </TouchableOpacity>
          <View style={s.prodGrupoBadge}>
            <Text style={s.prodGrupoBadgeT} numberOfLines={1}>{grupoNome}</Text>
          </View>
        </View>
        {post.texto ? <Text style={s.prodTexto} numberOfLines={5}>{post.texto}</Text> : null}
        <View style={s.prodFooter}>
          <Text style={s.prodTempo}>{tempoRelativo(post.created_at)}</Text>
          <TouchableOpacity
            style={s.contatoBtn}
            onPress={() => post.author_id && router.push(`/usuario/${post.author_id}` as any)}
            activeOpacity={0.8}
          >
            <Text style={s.contatoBtnT}>Contatar →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// ── Card: Curso / Evento ──────────────────────────────────────────────────────

function CursoCard({ pub, pageNome, pageLogo }: { pub: any; pageNome: string; pageLogo: string | null }) {
  const meta    = TIPO_CURSO_META[pub.tipo] || { emoji: '📋', cor: PRIMARY }
  const dados   = pub.dados || {}
  const logoUrl = absUrl(pageLogo)

  return (
    <View style={s.cursoCard}>
      <View style={s.cursoTop}>
        {logoUrl
          ? <Image source={{ uri: logoUrl }} style={s.cursoLogo} />
          : <View style={[s.cursoLogo, { backgroundColor: meta.cor + '25', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
            </View>
        }
        <View style={{ flex: 1 }}>
          <Text style={s.cursoPageNome} numberOfLines={1}>{pageNome}</Text>
          <Text style={s.cursoTitulo}   numberOfLines={2}>{pub.titulo}</Text>
        </View>
        <View style={[s.cursoBadge, { backgroundColor: meta.cor + '18', borderColor: meta.cor + '50' }]}>
          <Text style={[s.cursoBadgeT, { color: meta.cor }]}>{meta.emoji} {pub.tipo?.toUpperCase()}</Text>
        </View>
      </View>
      {dados.descricao ? <Text style={s.cursoDesc} numberOfLines={3}>{dados.descricao}</Text> : null}
      <View style={s.cursoPills}>
        {dados.modalidade    ? <View style={s.cursoPill}><Text style={s.cursoPillT}>{dados.modalidade}</Text></View>    : null}
        {dados.carga_horaria ? <View style={s.cursoPill}><Text style={s.cursoPillT}>⏱ {dados.carga_horaria}</Text></View> : null}
        {dados.data_inicio   ? <View style={s.cursoPill}><Text style={s.cursoPillT}>📅 {dados.data_inicio}</Text></View>  : null}
        {dados.data          ? <View style={s.cursoPill}><Text style={s.cursoPillT}>📅 {dados.data}</Text></View>         : null}
        {dados.local         ? <View style={s.cursoPill}><Text style={s.cursoPillT}>📍 {dados.local}</Text></View>        : null}
      </View>
      {dados.link_inscricao ? (
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: meta.cor }]}
          onPress={() => Linking.openURL(dados.link_inscricao).catch(() => null)}
          activeOpacity={0.8}
        >
          <Text style={s.actionBtnT}>Inscrever-se →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

// ── Card: Página de empresa ───────────────────────────────────────────────────

function PaginaCard({ page, curtido, curtindo, onCurtir }: {
  page: any; curtido: boolean; curtindo: boolean; onCurtir: () => void
}) {
  const logoUrl = absUrl(page.logo_url)
  const cat   = CAT_META[page.categoria] || { label: page.categoria || 'Empresa', cor: PRIMARY }
  const count = page.curtidas ?? page.followers_count ?? 0

  return (
    <View style={s.paginaCard}>
      <TouchableOpacity
        style={s.paginaMain}
        onPress={() => router.push(`/pagina/${page.id}` as any)}
        activeOpacity={0.78}
      >
        {logoUrl
          ? <Image source={{ uri: logoUrl }} style={s.paginaLogo} />
          : <View style={[s.paginaLogo, s.paginaLogoFb]}>
              <Text style={s.paginaLogoFbT}>{(page.nome || '?').charAt(0)}</Text>
            </View>
        }
        <View style={{ flex: 1 }}>
          <Text style={s.paginaNome} numberOfLines={1}>{page.nome}</Text>
          <View style={[s.catBadge, { backgroundColor: cat.cor + '18', borderColor: cat.cor + '50' }]}>
            <Text style={[s.catBadgeT, { color: cat.cor }]}>{cat.label}</Text>
          </View>
          {page.descricao ? (
            <Text style={s.paginaDesc} numberOfLines={2} ellipsizeMode="tail">{page.descricao}</Text>
          ) : null}
          {count > 0 ? <Text style={s.paginaCurtidas}>{count} {count === 1 ? 'curtida' : 'curtidas'}</Text> : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.curtirBtn, curtido ? s.curtirBtnOn : null]}
        onPress={onCurtir}
        disabled={curtindo}
        activeOpacity={0.8}
      >
        {curtindo
          ? <ActivityIndicator color={curtido ? PRIMARY : '#fff'} size="small" />
          : <Text style={[s.curtirBtnT, curtido && { color: PRIMARY }]}>
              {curtido ? '❤️ Curtido' : '🤍 Curtir'}
            </Text>
        }
      </TouchableOpacity>
    </View>
  )
}

// ── Card: Grupo ───────────────────────────────────────────────────────────────

const GRUPO_CAT: Record<string, { label: string; cor: string }> = {
  protese:      { label: 'Prótese Dentária', cor: '#7B3FC4' },
  odontologia:  { label: 'Odontologia',      cor: '#00A880' },
  clinica:      { label: 'Clínica',          cor: '#1A6FD4' },
  laboratorio:  { label: 'Laboratório',      cor: '#D4600A' },
  educacao:     { label: 'Educação',         cor: '#C49800' },
}

const GRUPO_FILTROS: { key: string; label: string }[] = [
  { key: 'todos',       label: 'Todos'       },
  { key: 'protese',     label: 'Prótese'     },
  { key: 'odontologia', label: 'Odontologia' },
  { key: 'clinica',     label: 'Clínica'     },
  { key: 'laboratorio', label: 'Laboratório' },
  { key: 'educacao',    label: 'Educação'    },
]

function GrupoCard({ grupo }: { grupo: any }) {
  const cat = GRUPO_CAT[grupo.categoria] || { label: grupo.categoria || 'Geral', cor: PRIMARY }

  return (
    <TouchableOpacity
      style={s.grupoCard}
      onPress={() => router.push(`/grupo/${grupo.id}` as any)}
      activeOpacity={0.82}
    >
      <View style={s.grupoTop}>
        <View style={[s.grupoIconBg, { backgroundColor: cat.cor + '22' }]}>
          <Text style={s.grupoIconT}>{grupo.icone || '💬'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.grupoNome} numberOfLines={1}>{grupo.nome}</Text>
          <View style={[s.grupoCat, { backgroundColor: cat.cor + '18', borderColor: cat.cor + '50' }]}>
            <Text style={[s.grupoCatT, { color: cat.cor }]}>{cat.label}</Text>
          </View>
        </View>
        {grupo.is_member ? (
          <View style={s.grupoMembroBadge}>
            <Text style={s.grupoMembroBadgeT}>Membro</Text>
          </View>
        ) : null}
      </View>
      {grupo.descricao ? (
        <Text style={s.grupoDesc} numberOfLines={2}>{grupo.descricao}</Text>
      ) : null}
      <View style={s.grupoFooter}>
        <Text style={s.grupoMeta}>
          {grupo.total_membros ?? 0} membros · {grupo.total_posts ?? 0} posts
        </Text>
        <View style={[s.grupoBtn, { backgroundColor: grupo.is_member ? '#475569' : PRIMARY }]}>
          <Text style={s.grupoBtnT}>{grupo.is_member ? 'Ver grupo →' : 'Entrar →'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Aba = 'vagas' | 'interesse' | 'recentes' | 'marketplace' | 'cursos' | 'feed_geral' | 'paginas' | 'grupos'

const ABAS: { key: Aba; label: string }[] = [
  { key: 'vagas',       label: 'Vagas para mim'     },
  { key: 'interesse',   label: 'Talvez te interesse' },
  { key: 'recentes',    label: 'Recentes'            },
  { key: 'marketplace', label: 'Marketplace'         },
  { key: 'cursos',      label: 'Cursos e Eventos'    },
  { key: 'feed_geral',  label: 'Feed geral'          },
  { key: 'paginas',     label: 'Páginas'             },
  { key: 'grupos',      label: 'Grupos'              },
]

const EMPTY_DATA: Record<Aba, any[]> = {
  vagas: [], interesse: [], recentes: [], marketplace: [], cursos: [], feed_geral: [], paginas: [], grupos: [],
}

const SETE_DIAS = 7 * 24 * 60 * 60 * 1000

const EMPTY_META: Record<Aba, { icon: string; title: string; sub: string }> = {
  vagas:       { icon: '💼', title: 'Nenhuma vaga encontrada',       sub: 'Novas oportunidades aparecerão aqui conforme publicadas' },
  interesse:   { icon: '🔍', title: 'Nenhuma vaga no momento',        sub: 'Vagas de áreas relacionadas aparecerão aqui' },
  recentes:    { icon: '📋', title: 'Nada nos últimos 7 dias',         sub: 'As publicações recentes da rede aparecerão aqui' },
  marketplace: { icon: '🛒', title: 'Marketplace em breve',           sub: 'Posts de grupos de venda de equipamentos e insumos aparecerão aqui' },
  cursos:      { icon: '🎓', title: 'Nenhum curso ou evento',          sub: 'Cursos, treinamentos e eventos das empresas aparecerão aqui' },
  feed_geral:  { icon: '📰', title: 'Nenhuma publicação ainda',        sub: 'O feed da comunidade aparecerá aqui' },
  paginas:     { icon: '🏢', title: 'Nenhuma página encontrada',       sub: 'Páginas de clínicas e empresas do setor aparecerão aqui' },
  grupos:      { icon: '💬', title: 'Nenhum grupo encontrado',          sub: 'Grupos de discussão aparecerão aqui' },
}

export default function Painel() {
  const { user } = useAuthStore()
  const [aba, setAba]               = useState<Aba>('vagas')
  const [allData, setAllData]       = useState<Record<Aba, any[]>>(EMPTY_DATA)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [curtidos, setCurtidos]     = useState<Record<number, boolean>>({})
  const [curtindo, setCurtindo]     = useState<Record<number, boolean>>({})
  const [feedVagaId, setFeedVagaId]         = useState<number | null>(null)
  const [feedVagaIsOwner, setFeedVagaIsOwner] = useState(false)
  const [grupoFiltro, setGrupoFiltro]       = useState('todos')
  const abaRef = useRef<Aba>('vagas')

  const avatarUrl = absUrl(user?.avatar_url)
  const perfilPct = calcularPerfilPct(user)

  const loadData = useCallback(async (tab: Aba, isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      let items: any[] = []

      if (tab === 'vagas') {
        const res = await api.get('/vagas/para-mim')
        items = res.data.vagas || []

      } else if (tab === 'interesse') {
        const res = await api.get('/vagas/talvez-interesse')
        items = res.data.vagas || []

      } else if (tab === 'recentes') {
        const res = await api.get('/posts')
        const cutoff = Date.now() - SETE_DIAS
        items = (res.data.posts || [])
          .filter((p: any) => new Date(p.created_at).getTime() >= cutoff)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      } else if (tab === 'marketplace') {
        const gruposRes = await api.get('/grupos')
        const vendas = (gruposRes.data || []).filter(isVendaGroup)
        const postsArrays = await Promise.all(
          vendas.map((g: any) =>
            api.get(`/grupos/${g.id}/posts`)
              .then(r => (r.data || []).map((p: any) => ({ post: p, grupoNome: g.nome })))
              .catch(() => [] as any[])
          )
        )
        items = postsArrays.flat()
          .sort((a: any, b: any) => new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime())

      } else if (tab === 'grupos') {
        const res = await api.get('/grupos')
        items = res.data || []

      } else if (tab === 'cursos') {
        const res = await api.get('/publicacoes/cursos-eventos')
        items = (res.data.publicacoes || []).map((pub: any) => ({
          ...pub,
          _pageNome: pub.page_nome,
          _pageLogo: pub.page_logo,
        }))

      } else if (tab === 'feed_geral') {
        const res = await api.get('/posts')
        items = (res.data.posts || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      } else if (tab === 'paginas') {
        const res = await api.get('/pages')
        const list: any[] = res.data.pages || res.data || []
        items = list
        const estado: Record<number, boolean> = {}
        list.forEach((p: any) => { if (p.is_liked != null) estado[p.id] = !!p.is_liked })
        setCurtidos(prev => ({ ...estado, ...prev }))
      }

      setAllData(prev => ({ ...prev, [tab]: items }))
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  const loadNotifCount = useCallback(() => {
    api.get('/notifications?limit=1')
      .then(r => setUnreadCount(r.data.unread || 0))
      .catch(() => null)
  }, [])

  useFocusEffect(useCallback(() => {
    loadNotifCount()
    setLoading(true)
    loadData(abaRef.current)
  }, [loadData, loadNotifCount]))

  const switchAba = (tab: Aba) => {
    setAba(tab)
    abaRef.current = tab
    setLoading(true)
    loadData(tab)
  }

  const handleCurtir = async (pageId: number) => {
    if (!user) { router.push('/(auth)/login' as any); return }
    setCurtindo(prev => ({ ...prev, [pageId]: true }))
    try {
      const res = await api.post(`/follows/${pageId}`)
      const following: boolean = res.data.following ?? !curtidos[pageId]
      setCurtidos(prev => ({ ...prev, [pageId]: following }))
      setAllData(prev => ({
        ...prev,
        paginas: prev.paginas.map((p: any) =>
          p.id === pageId ? { ...p, curtidas: (p.curtidas ?? 0) + (following ? 1 : -1) } : p
        ),
      }))
    } catch {}
    finally {
      setCurtindo(prev => ({ ...prev, [pageId]: false }))
    }
  }

  const items = allData[aba]
  const emptyMeta = EMPTY_META[aba]

  return (
    <View style={{ flex: 1, backgroundColor: '#E0E0E0' }}>

      {/* ── App Header ── */}
      <View style={s.header}>
        <Text style={s.logo}>
          <Text style={{ color: '#F5C800' }}>Go</Text>
          <Text style={{ color: '#fff' }}>Denth</Text>
        </Text>
        <View style={s.headerIcons}>
          <TouchableOpacity style={s.ico} onPress={() => router.push('/(tabs)/publicar' as any)}>
            <PlusIcon />
          </TouchableOpacity>
          <TouchableOpacity style={s.ico} onPress={() => router.push('/(tabs)/buscar' as any)}>
            <SearchIcon />
          </TouchableOpacity>
          <TouchableOpacity style={s.ico} onPress={() => router.push('/(tabs)/notificacoes' as any)}>
            <BellIcon />
            {unreadCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeT}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil' as any)}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.uav} />
              : <View style={s.uav}><Text style={s.uavt}>{user?.nome?.charAt(0) || 'U'}</Text></View>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Email verification banner ── */}
      {!user?.email_verificado && (
        <TouchableOpacity style={s.verifBanner} onPress={() => router.push('/configuracoes' as any)} activeOpacity={0.85}>
          <Text style={s.verifBannerT}>Verifique seu email para garantir o acesso completo</Text>
          <Text style={s.verifBannerLink}>Verificar →</Text>
        </TouchableOpacity>
      )}

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1 }}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(abaRef.current, true) }}
            tintColor={PRIMARY}
          />
        }
      >
        {/* [0] Profile card */}
        <View style={{ paddingTop: 14 }}>
          <View style={s.profileCard}>
            <TouchableOpacity
              style={s.profileLeft}
              onPress={() => router.push('/(tabs)/perfil' as any)}
              activeOpacity={0.78}
            >
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={s.profileAv} />
                : <View style={[s.profileAv, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 22 }}>{user?.nome?.charAt(0) || 'U'}</Text>
                  </View>
              }
              <View style={{ flex: 1 }}>
                <Text style={s.profileNome} numberOfLines={1}>{user?.nome || 'Usuário'}</Text>
                {user?.tipo_profissional
                  ? <Text style={s.profileCargo} numberOfLines={1}>{user.tipo_profissional}</Text>
                  : null}
                {(user?.cidade || user?.estado)
                  ? <Text style={s.profileLoc}>📍 {[user?.cidade, user?.estado].filter(Boolean).join(', ')}</Text>
                  : null}
              </View>
            </TouchableOpacity>
            {perfilPct < 100 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/editar-perfil' as any)} activeOpacity={0.78}>
                <View style={s.profilePctRow}>
                  <View style={s.profilePctBar}>
                    <View style={[s.profilePctFill, { width: `${perfilPct}%` as any }]} />
                  </View>
                  <Text style={s.profilePctTxt}>{perfilPct}%</Text>
                </View>
                <Text style={s.profileCompleteLink}>Completar perfil →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* [1] Aba bar — sticky */}
        <View style={s.abaBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.abaScroll}>
            {ABAS.map(a => (
              <TouchableOpacity
                key={a.key}
                style={[s.abaBtn, aba === a.key && s.abaBtnOn]}
                onPress={() => switchAba(a.key)}
                activeOpacity={0.78}
              >
                <Text style={[s.abaBtnT, aba === a.key && s.abaBtnTOn]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* [2] Tab content */}
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          {loading ? (
            <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
          ) : aba === 'grupos' ? (() => {
            const filtrados = grupoFiltro === 'todos'
              ? items
              : items.filter((g: any) => g.categoria === grupoFiltro)
            return (
              <View style={{ gap: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                  {GRUPO_FILTROS.map(f => (
                    <TouchableOpacity
                      key={f.key}
                      style={[s.grupoChip, grupoFiltro === f.key && s.grupoChipOn]}
                      onPress={() => setGrupoFiltro(f.key)}
                      activeOpacity={0.78}
                    >
                      <Text style={[s.grupoChipT, grupoFiltro === f.key && s.grupoChipTOn]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {filtrados.length === 0 ? (
                  <EmptyState icon="💬" title="Nenhum grupo nessa categoria" sub="Tente outro filtro" />
                ) : (
                  filtrados.map((grupo: any) => <GrupoCard key={grupo.id} grupo={grupo} />)
                )}
              </View>
            )
          })() : items.length === 0 ? (
            <EmptyState icon={emptyMeta.icon} title={emptyMeta.title} sub={emptyMeta.sub} />
          ) : aba === 'vagas' ? (
            <View style={{ gap: 12 }}>
              {items.map(v => (
                <VagaCard
                  key={v.id}
                  vaga={v}
                  user={user}
                  onVerVaga={() => {
                    setFeedVagaIsOwner(false)
                    setFeedVagaId(v.id)
                  }}
                />
              ))}
            </View>
          ) : aba === 'interesse' ? (
            <View style={{ gap: 12 }}>
              {items.map(v => (
                <VagaInteresseCard
                  key={v.id}
                  vaga={v}
                  user={user}
                  onVerVaga={() => {
                    setFeedVagaIsOwner(false)
                    setFeedVagaId(v.id)
                  }}
                />
              ))}
            </View>
          ) : aba === 'recentes' || aba === 'feed_geral' ? (
            <View style={{ gap: 12 }}>
              {items.map(p =>
                p.source_type === 'vaga' || p.tipo_post === 'vaga'
                  ? <VagaCard
                      key={`${p.source_type}-${p.id}`}
                      vaga={p}
                      user={user}
                      onVerVaga={p.source_type === 'vaga'
                        ? () => { setFeedVagaIsOwner(false); setFeedVagaId(p.id) }
                        : p.page_id ? () => router.push(`/pagina/${p.page_id}` as any) : undefined
                      }
                    />
                  : <RecentPostCard key={`post-${p.id}`} post={p} />
              )}
            </View>
          ) : aba === 'marketplace' ? (
            <View style={{ gap: 12 }}>
              {items.map(({ post, grupoNome }: any, i: number) => (
                <ProdutoCard key={post.id ?? i} post={post} grupoNome={grupoNome} />
              ))}
            </View>
          ) : aba === 'cursos' ? (
            <View style={{ gap: 12 }}>
              {items.map((pub: any, i: number) => (
                <CursoCard key={pub.id ?? i} pub={pub} pageNome={pub._pageNome} pageLogo={pub._pageLogo} />
              ))}
            </View>
          ) : aba === 'paginas' ? (
            <View style={{ gap: 12 }}>
              {items.map((page: any) => (
                <PaginaCard
                  key={page.id}
                  page={page}
                  curtido={!!curtidos[page.id]}
                  curtindo={!!curtindo[page.id]}
                  onCurtir={() => handleCurtir(page.id)}
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* ── Modal de vaga (feed geral) ── */}
      <FeedVagaModal
        vagaId={feedVagaId}
        isOwner={feedVagaIsOwner}
        user={user}
        onClose={() => setFeedVagaId(null)}
      />

      {/* ── FAB publicar (feed geral) ── */}
      {aba === 'feed_geral' && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => router.push('/(tabs)/publicar' as any)}
          activeOpacity={0.85}
        >
          <Text style={s.fabT}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: PRIMARY,
  },
  logo: { fontSize: 26, fontFamily: 'Poppins-ExtraBold', letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ico: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: -3, right: -3, backgroundColor: '#E53935',
    borderRadius: 9, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: PRIMARY,
  },
  notifBadgeT: { color: '#fff', fontSize: 9, fontWeight: '800' },
  uav: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A6FD4', justifyContent: 'center', alignItems: 'center' },
  uavt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  verifBanner: {
    backgroundColor: '#FFF3E0', borderBottomWidth: 1, borderBottomColor: '#FFCC80',
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  verifBannerT: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17, fontWeight: '600' },
  verifBannerLink: { fontSize: 12, color: '#E65100', fontWeight: '800', flexShrink: 0 },

  profileCard: {
    backgroundColor: '#fff', padding: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D0E8DA', gap: 12,
  },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAv: { width: 54, height: 54, borderRadius: 27, flexShrink: 0 },
  profileNome: { fontSize: 16, fontWeight: '800', color: '#0A1C14' },
  profileCargo: { fontSize: 12, color: PRIMARY, fontWeight: '600', marginTop: 2 },
  profileLoc: { fontSize: 12, color: '#7A9E8E', marginTop: 2 },
  profilePctRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profilePctBar: { flex: 1, height: 5, backgroundColor: '#E0F0EC', borderRadius: 3, overflow: 'hidden' },
  profilePctFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 3 },
  profilePctTxt: { fontSize: 12, fontWeight: '800', color: PRIMARY, width: 34, textAlign: 'right' },
  profileCompleteLink: { fontSize: 12, fontWeight: '700', color: GOLD, marginTop: 4 },

  abaBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#D0E8DA', marginTop: 12 },
  abaScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  abaBtn: {
    backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
  },
  abaBtnOn: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  abaBtnT: { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  abaBtnTOn: { color: '#fff' },

  // Vaga card (shared by VagaCard and VagaInteresseCard)
  vagaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', gap: 10 },
  vagaTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vagaLogo: { width: 40, height: 40, borderRadius: 10, flexShrink: 0 },
  vagaLogoFb: { backgroundColor: '#D0E8DA', justifyContent: 'center', alignItems: 'center' },
  vagaLogoFbT: { fontSize: 16, fontWeight: '800', color: '#3A6550' },
  vagaEmpresa: { fontSize: 12, fontWeight: '700', color: '#3A6550' },
  vagaCargo: { fontSize: 15, fontWeight: '800', color: '#0A1C14', marginTop: 2, lineHeight: 20 },
  pctCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  pctBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0, alignItems: 'center' },
  pctT: { fontSize: 12, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4 },
  chipT: { fontSize: 11, fontWeight: '700', color: '#3A6550' },
  compatBar: { height: 5, backgroundColor: '#EEF7F2', borderRadius: 3, overflow: 'hidden' },
  compatFill: { height: '100%', borderRadius: 3 },
  actionBtn: { borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  actionBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Recent / feed geral post card
  recentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', borderLeftWidth: 4, gap: 8 },
  recentTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  recentAv: { width: 38, height: 38, borderRadius: 19, flexShrink: 0 },
  recentNome: { fontSize: 13, fontWeight: '800', color: '#0A1C14' },
  recentCargo: { fontSize: 11, color: PRIMARY, fontWeight: '600', marginTop: 1 },
  recentLoc: { fontSize: 11, color: '#7A9E8E', marginTop: 1 },
  recentBadge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  recentBadgeT: { fontSize: 9, fontWeight: '800' },
  recentSub: { fontSize: 12, fontWeight: '700', color: '#0A1C14' },
  recentTexto: { fontSize: 13, color: '#4A7060', lineHeight: 18 },
  recentTempo: { fontSize: 11, color: '#A0B8AC', fontWeight: '600' },

  // Produto card (marketplace)
  prodCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#D0E8DA', overflow: 'hidden' },
  prodImg: { width: '100%', height: 200 },
  prodBody: { padding: 14, gap: 10 },
  prodTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prodAv: { width: 36, height: 36, borderRadius: 18, flexShrink: 0 },
  prodAutorNome: { fontSize: 13, fontWeight: '800', color: '#0A1C14' },
  prodAutorTipo: { fontSize: 11, color: PRIMARY, fontWeight: '600', marginTop: 1 },
  prodGrupoBadge: { backgroundColor: PRIMARY + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 120 },
  prodGrupoBadgeT: { fontSize: 10, fontWeight: '700', color: PRIMARY },
  prodTexto: { fontSize: 14, color: '#2A4030', lineHeight: 20 },
  prodFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEF7F2' },
  prodTempo: { fontSize: 11, color: '#A0B8AC', fontWeight: '600' },
  contatoBtn: { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  contatoBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Curso card
  cursoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', gap: 10 },
  cursoTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cursoLogo: { width: 44, height: 44, borderRadius: 10, flexShrink: 0 },
  cursoPageNome: { fontSize: 11, fontWeight: '700', color: '#7A9E8E' },
  cursoTitulo: { fontSize: 15, fontWeight: '800', color: '#0A1C14', marginTop: 2, lineHeight: 20 },
  cursoBadge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  cursoBadgeT: { fontSize: 9, fontWeight: '800' },
  cursoDesc: { fontSize: 13, color: '#4A7060', lineHeight: 18 },
  cursoPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cursoPill: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  cursoPillT: { fontSize: 11, fontWeight: '600', color: '#555' },

  // Página card
  paginaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', gap: 12 },
  paginaMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paginaLogo: { width: 52, height: 52, borderRadius: 12, flexShrink: 0 },
  paginaLogoFb: { backgroundColor: '#D0E8DA', justifyContent: 'center', alignItems: 'center' },
  paginaLogoFbT: { fontSize: 20, fontWeight: '800', color: '#3A6550' },
  paginaNome: { fontSize: 15, fontWeight: '800', color: '#0A1C14', marginBottom: 6, lineHeight: 20 },
  catBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 },
  catBadgeT: { fontSize: 10, fontWeight: '800' },
  paginaDesc: { fontSize: 12, color: '#4A7060', lineHeight: 17, marginTop: 4 },
  paginaCurtidas: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  curtirBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  curtirBtnOn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA' },
  curtirBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // FAB
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  fabT: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34, marginTop: -2 },

  empty: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#7A9E8E', textAlign: 'center', lineHeight: 19 },

  // Grupo filter chips
  grupoChip:   { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  grupoChipOn: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  grupoChipT:  { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  grupoChipTOn:{ color: '#fff' },

  // Grupo card
  grupoCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', gap: 10 },
  grupoTop:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grupoIconBg:      { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  grupoIconT:       { fontSize: 22 },
  grupoNome:        { fontSize: 14, fontWeight: '800', color: '#0A1C14', marginBottom: 5 },
  grupoCat:         { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 3 },
  grupoCatT:        { fontSize: 10, fontWeight: '800' },
  grupoMembroBadge: { backgroundColor: '#E8F5EE', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  grupoMembroBadgeT:{ fontSize: 10, fontWeight: '800', color: '#00A880' },
  grupoDesc:        { fontSize: 12, color: '#4A7060', lineHeight: 17 },
  grupoFooter:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEF7F2' },
  grupoMeta:        { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  grupoBtn:         { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  grupoBtnT:        { color: '#fff', fontSize: 12, fontWeight: '800' },
})

// ── Styles: FeedVagaModal ─────────────────────────────────────────────────────

const fm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 20, maxHeight: '90%' },
  handle:       { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  closeBtn:     { padding: 4 },
  closeT:       { fontSize: 18, color: '#7A9E8E', fontWeight: '700' },
  badge:        { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  badgeT:       { fontSize: 12, fontWeight: '800' },
  scroll:       { paddingBottom: 16 },
  cargo:        { fontSize: 22, fontWeight: '900', color: '#0A1C14', marginBottom: 4 },
  empresa:      { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  loc:          { fontSize: 13, color: '#7A9E8E', marginBottom: 16 },
  compatCard:   { backgroundColor: '#EEF7F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#D0E8DA' },
  statusCard:   { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1.5 },
  statusBadge:  { fontSize: 13, fontWeight: '800', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden' as const },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEF7F2', gap: 12 },
  rowLabel:     { fontSize: 12, fontWeight: '800', color: '#7A9E8E', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue:     { fontSize: 14, fontWeight: '600', color: '#0A1C14', flex: 1, textAlign: 'right' },
  reqChip:      { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  data:         { fontSize: 12, color: '#AECEBE', marginTop: 16, textAlign: 'center' },
  candidatarBtn:  { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  candidatarBtnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
  ownerNote:    { backgroundColor: '#EEF7F2', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  ownerNoteT:   { fontSize: 14, fontWeight: '700', color: '#7A9E8E' },
})

const fap = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#0A1C14', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  sectionHint:  { fontSize: 11, color: '#7A9E8E', marginBottom: 10 },
  reqRow:       { backgroundColor: '#F8FCFA', borderWidth: 1, borderColor: '#D0E8DA', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  reqText:      { fontSize: 13, fontWeight: '600', color: '#0A1C14', lineHeight: 18 },
  simnaoRow:    { flexDirection: 'row', gap: 8 },
  simBtn:       { flex: 1, borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  simBtnOn:     { backgroundColor: '#00A880', borderColor: '#00A880' },
  naoBtn:       { flex: 1, borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  naoBtnOn:     { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  simnaoT:      { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  simTOn:       { color: '#fff' },
  naoTOn:       { color: '#fff' },
  input:        { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 13, fontSize: 14, color: '#0A1C14', marginBottom: 2 },
})
