import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Linking, Platform, Alert,
  Modal, TextInput, KeyboardAvoidingView, Dimensions,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

const API_BASE = 'https://godenth-api-production.up.railway.app'
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mm = Math.floor(diff / 60000)
  if (mm < 1) return 'agora'
  if (mm < 60) return `${mm}m`
  const h = Math.floor(mm / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ─── Menu: Publicar ────────────────────────────────────────────────────────────
function PublicarMenu({ visible, onSelect, onClose }: {
  visible: boolean; onSelect: (tipo: ModalTipo) => void; onClose: () => void
}) {
  const opcoes: { key: ModalTipo; emoji: string; label: string }[] = [
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
      await api.post(`/pages/${pageId}/services`, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
      })
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
          <TextInput
            style={m.input}
            placeholder="Ex: Implante Dentário"
            placeholderTextColor={Colors.text3}
            value={titulo}
            onChangeText={setTitulo}
            autoFocus
          />
          <Text style={m.label}>Descrição</Text>
          <TextInput
            style={[m.input, m.textarea]}
            placeholder="Descreva brevemente o serviço…"
            placeholderTextColor={Colors.text3}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Salvar Serviço</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}>
            <Text style={m.cancelT}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Modal: Vaga ──────────────────────────────────────────────────────────────
function VagaModal({ visible, pageId, pageName, onClose, onCreated }: {
  visible: boolean; pageId: string; pageName: string; onClose: () => void; onCreated: () => void
}) {
  const [cargo, setCargo] = useState('')
  const [contrato, setContrato] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setCargo(''); setContrato(''); setCidade(''); setEstado(''); setDescricao('') }
  const close = () => { reset(); onClose() }

  const salvar = async () => {
    if (!cargo.trim()) return Alert.alert('Atenção', 'Informe o cargo.')
    if (!contrato) return Alert.alert('Atenção', 'Selecione o tipo de contrato.')
    setSaving(true)
    try {
      await api.post('/vagas', {
        page_id: parseInt(pageId),
        cargo: cargo.trim(),
        contrato,
        cidade: cidade.trim() || null,
        estado: estado.trim().toUpperCase().slice(0, 2) || null,
        descricao: descricao.trim() || null,
      })
      reset(); onCreated(); onClose()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar a vaga.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <ScrollView contentContainerStyle={m.sheetScroll} keyboardShouldPersistTaps="handled">
          <View style={m.handle} />
          <Text style={m.title}>📋 Vaga</Text>
          <Text style={m.subtitle}>Publicando por: {pageName}</Text>

          <Text style={m.label}>Cargo *</Text>
          <TextInput style={m.input} placeholder="Ex: Cirurgião-Dentista" placeholderTextColor={Colors.text3} value={cargo} onChangeText={setCargo} />

          <Text style={m.label}>Tipo de contrato *</Text>
          <View style={m.chips}>
            {TIPOS_CONTRATO.map(c => (
              <TouchableOpacity key={c} style={[m.chip, contrato === c && m.chipOn]} onPress={() => setContrato(c)}>
                <Text style={[m.chipT, contrato === c && m.chipTOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={m.label}>Cidade</Text>
          <TextInput style={m.input} placeholder="Ex: São Paulo" placeholderTextColor={Colors.text3} value={cidade} onChangeText={setCidade} />

          <Text style={m.label}>Estado (UF)</Text>
          <TextInput style={m.input} placeholder="Ex: SP" placeholderTextColor={Colors.text3} value={estado} onChangeText={setEstado} maxLength={2} autoCapitalize="characters" />

          <Text style={m.label}>Descrição</Text>
          <TextInput style={[m.input, m.textarea]} placeholder="Descreva os requisitos e responsabilidades…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />

          <TouchableOpacity style={[m.btn, saving && { opacity: 0.6 }]} onPress={salvar} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.btnT}>Publicar Vaga →</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={m.cancel} onPress={close}>
            <Text style={m.cancelT}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
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
  const { user } = useAuthStore()

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
  const [candidatandoId, setCandidatandoId] = useState<number | null>(null)

  const [showPublicarMenu, setShowPublicarMenu] = useState(false)
  const [showAddServico, setShowAddServico] = useState(false)
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null)

  const isOwner = user?.id === page?.user_id

  // ── Data loaders ──────────────────────────────────────────────────────────
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
    setLikeLoading(true)
    try {
      const res = await api.post(`/follows/${id}`)
      setLiked(res.data.following)
      setLikeCount(prev => res.data.following ? prev + 1 : Math.max(0, prev - 1))
    } catch {
      Alert.alert('Erro', 'Não foi possível processar.')
    } finally { setLikeLoading(false) }
  }

  const candidatar = async (vagaId: number) => {
    setCandidatandoId(vagaId)
    try {
      await api.post(`/vagas/${vagaId}/candidatar`, { respostas: [] })
      setCandidaturas(prev => new Set([...prev, vagaId]))
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível candidatar.')
    } finally { setCandidatandoId(null) }
  }

  const handlePickPortfolio = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar fotos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (result.canceled) return
    const asset = result.assets[0]
    setPortfolioUploading(true)
    try {
      const formData = new FormData()
      formData.append('imagem', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `portfolio_${Date.now()}.jpg`,
      } as any)
      await api.post(`/pages/${id}/portfolio/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      loadPortfolio()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível enviar a foto.')
    } finally { setPortfolioUploading(false) }
  }

  const handleDeleteServico = (serviceId: number) => {
    Alert.alert('Remover serviço', 'Tem certeza que deseja remover este serviço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/pages/${id}/services/${serviceId}`)
            setServicos(prev => prev.filter(sv => sv.id !== serviceId))
          } catch { Alert.alert('Erro', 'Não foi possível remover.') }
        },
      },
    ])
  }

  const handleDeletePortfolioItem = (itemId: number) => {
    Alert.alert('Remover foto', 'Tem certeza que deseja remover esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/pages/${id}/portfolio/${itemId}`)
            setPortfolio(prev => prev.filter(p => p.id !== itemId))
          } catch { Alert.alert('Erro', 'Não foi possível remover.') }
        },
      },
    ])
  }

  const openModal = (tipo: ModalTipo) => setModalTipo(tipo)
  const closeModal = () => setModalTipo(null)

  // ── Owner panel CTA per tab ───────────────────────────────────────────────
  const renderOwnerAction = () => {
    switch (aba) {
      case 'Sobre':
        return (
          <TouchableOpacity style={[s.ownerBtn, { backgroundColor: cor }]} onPress={() => router.push(`/editar-pagina/${id}` as any)}>
            <Text style={s.ownerBtnT}>✏️ Editar Informações</Text>
          </TouchableOpacity>
        )
      case 'Serviços':
        return (
          <TouchableOpacity style={[s.ownerBtn, { backgroundColor: cor }]} onPress={() => setShowAddServico(true)}>
            <Text style={s.ownerBtnT}>+ Adicionar Serviço</Text>
          </TouchableOpacity>
        )
      case 'Portfólio':
        return (
          <TouchableOpacity style={[s.ownerBtn, { backgroundColor: cor }]} onPress={handlePickPortfolio} disabled={portfolioUploading}>
            {portfolioUploading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.ownerBtnT}>📷 Adicionar Foto</Text>}
          </TouchableOpacity>
        )
      case 'Vagas':
        return (
          <TouchableOpacity style={[s.ownerBtn, { backgroundColor: cor }]} onPress={() => openModal('vaga')}>
            <Text style={s.ownerBtnT}>+ Nova Vaga</Text>
          </TouchableOpacity>
        )
      case 'Cursos/Eventos':
        return (
          <TouchableOpacity style={[s.ownerBtn, { backgroundColor: cor }]} onPress={() => setShowPublicarMenu(true)}>
            <Text style={s.ownerBtnT}>✏️ Publicar</Text>
          </TouchableOpacity>
        )
    }
  }

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  if (!page) return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 20 }}>Página não encontrada</Text>
      <TouchableOpacity style={s.btnBack} onPress={() => router.back()}>
        <Text style={s.btnBackT}>← Voltar</Text>
      </TouchableOpacity>
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
          <TouchableOpacity style={s.navSide} onPress={() => router.push(`/editar-pagina/${id}` as any)}>
            <Text style={s.navAction}>Editar</Text>
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
            <TouchableOpacity style={s.editBtn} onPress={() => router.push(`/editar-pagina/${id}` as any)}>
              <Text style={[s.editBtnT, { color: cor }]}>✏️ Editar página</Text>
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
            <Text style={[s.statN, { color: cor }]}>{portfolio.length > 0 ? portfolio.length : servicos.length > 0 ? servicos.length : '—'}</Text>
            <Text style={s.statL}>{portfolio.length > 0 ? 'Portfólio' : 'Serviços'}</Text>
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

        {/* ── Painel do dono ── */}
        {isOwner && (
          <View style={s.ownerPanel}>
            <Text style={s.ownerTitle}>Gerenciar página</Text>
            {renderOwnerAction()}
          </View>
        )}

        {/* ── Abas (scroll horizontal) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.abasScroll}
          contentContainerStyle={s.abas}
        >
          {ABAS.map(a => (
            <TouchableOpacity
              key={a}
              style={[s.aba, aba === a && { borderBottomColor: cor }]}
              onPress={() => setAba(a)}
            >
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
              <ServicoCard
                key={sv.id}
                servico={sv}
                isOwner={isOwner}
                cor={cor}
                onDelete={() => handleDeleteServico(sv.id)}
              />
            ))}
          </View>
        )}

        {/* ── Tab: Portfólio ── */}
        {aba === 'Portfólio' && (
          <View style={s.tab}>
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
                  <PortfolioItem
                    key={item.id}
                    item={item}
                    isOwner={isOwner}
                    onDelete={() => handleDeletePortfolioItem(item.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Tab: Vagas ── */}
        {aba === 'Vagas' && (
          <View style={s.tab}>
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
              <VagaCard
                key={vaga.id}
                vaga={vaga}
                cor={cor}
                jaCandidata={candidaturas.has(vaga.id)}
                loading={candidatandoId === vaga.id}
                onCandidatar={() => candidatar(vaga.id)}
                isOwner={isOwner}
              />
            ))}
          </View>
        )}

        {/* ── Tab: Cursos/Eventos ── */}
        {aba === 'Cursos/Eventos' && (
          <View style={s.tab}>
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

      {/* ── Menu Publicar ── */}
      <PublicarMenu
        visible={showPublicarMenu}
        onSelect={openModal}
        onClose={() => setShowPublicarMenu(false)}
      />

      {/* ── Modal: Adicionar Serviço ── */}
      <AddServicoModal
        visible={showAddServico}
        pageId={id}
        onClose={() => setShowAddServico(false)}
        onCreated={() => { setServicos([]); loadServicos() }}
      />

      {/* ── Modais de publicação ── */}
      <VagaModal
        visible={modalTipo === 'vaga'}
        pageId={id}
        pageName={page.nome}
        onClose={closeModal}
        onCreated={loadPage}
      />
      <CursoModal
        visible={modalTipo === 'curso'}
        pageId={id}
        onClose={closeModal}
        onCreated={() => { setPublicacoes([]); loadPublicacoes() }}
      />
      <TreinamentoModal
        visible={modalTipo === 'treinamento'}
        pageId={id}
        onClose={closeModal}
        onCreated={() => { setPublicacoes([]); loadPublicacoes() }}
      />
      <PalestraModal
        visible={modalTipo === 'palestra'}
        pageId={id}
        onClose={closeModal}
        onCreated={() => { setPublicacoes([]); loadPublicacoes() }}
      />
      <EventoModal
        visible={modalTipo === 'evento'}
        pageId={id}
        onClose={closeModal}
        onCreated={() => { setPublicacoes([]); loadPublicacoes() }}
      />
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

const TIPO_EMOJI: Record<string, string> = {
  curso: '🎓', treinamento: '🏋️', palestra: '🎤', evento: '🗓️',
}
const TIPO_LABEL_PUB: Record<string, string> = {
  curso: 'Curso', treinamento: 'Treinamento', palestra: 'Palestra', evento: 'Evento',
}

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
        <TouchableOpacity onPress={() => Linking.openURL(
          dados.link_inscricao.startsWith('http') ? dados.link_inscricao : `https://${dados.link_inscricao}`
        )}>
          <Text style={[s.linkInscricao, { color: cor }]}>🔗 Inscrever-se</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

function VagaCard({ vaga, cor, jaCandidata, loading, onCandidatar, isOwner }: any) {
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
        {(vaga.cidade || vaga.estado) && (
          <Text style={s.vagaLoc}>📍 {vaga.cidade}{vaga.estado ? ` · ${vaga.estado}` : ''}</Text>
        )}
      </View>
      {vaga.salario ? <Text style={s.vagaSalario}>{vaga.salario}</Text> : null}
      {vaga.descricao ? <Text style={s.vagaDesc}>{vaga.descricao}</Text> : null}
      {!isOwner && (
        <TouchableOpacity
          style={[s.candidatarBtn, jaCandidata ? s.candidatarBtnDone : { backgroundColor: cor }]}
          onPress={!jaCandidata ? onCandidatar : undefined}
          disabled={jaCandidata || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[s.candidatarBtnT, jaCandidata && { color: '#059669' }]}>
                {jaCandidata ? '✓ Candidatura enviada' : 'Candidatar-se →'}
              </Text>}
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
  navSide: { width: 56 },
  navBack: { fontSize: 24, color: '#fff', fontWeight: '700' },
  navTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#fff', textAlign: 'center' },
  navAction: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'right' },

  cover: { height: 130, overflow: 'hidden' },
  coverWatermark: { position: 'absolute', bottom: -8, left: 10, right: 10, fontSize: 52, fontWeight: '900', color: 'rgba(255,255,255,0.13)', letterSpacing: 3 },

  profileRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -36, marginBottom: 10 },
  logoWrap: { position: 'relative' },
  logo: { width: 72, height: 72, borderRadius: 18, borderWidth: 3, borderColor: '#fff' },
  logoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontSize: 28, fontWeight: '900' },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  verifiedT: { color: '#fff', fontSize: 10, fontWeight: '900' },

  editBtn: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: Colors.white, marginBottom: 4 },
  editBtnT: { fontSize: 13, fontWeight: '800' },
  likeBtn: { borderRadius: 100, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 4, minWidth: 110, alignItems: 'center' },
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

  ownerPanel: { backgroundColor: '#FFFBEA', borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#F5C800', paddingHorizontal: 16, paddingVertical: 14 },
  ownerTitle: { fontSize: 11, fontWeight: '800', color: '#A07800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  ownerBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ownerBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },

  abasScroll: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  abas: { flexDirection: 'row' },
  aba: { paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  abaT: { fontSize: 13, fontWeight: '700', color: Colors.text3, whiteSpace: 'nowrap' } as any,

  tab: { padding: 16, gap: 12, paddingBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  cardText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  infoRow: { fontSize: 13, color: Colors.text3, marginBottom: 6, fontWeight: '500' },
  infoVal: { fontWeight: '600', color: Colors.text },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 28, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', gap: 4 },
  emptyT: { fontSize: 14, fontWeight: '600', color: Colors.text3 },
  emptyBtn: { marginTop: 10, borderWidth: 1.5, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  emptyBtnT: { fontSize: 13, fontWeight: '700' },

  // Serviços
  servicoCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  servicoIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  servicoTitulo: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 3 },
  servicoDesc: { fontSize: 13, color: Colors.text3, lineHeight: 19 },
  deleteBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  deleteBtnT: { fontSize: 11, color: Colors.text3, fontWeight: '800' },

  // Portfólio
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  portfolioItem: { width: PORTFOLIO_SIZE, height: PORTFOLIO_SIZE, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.border, position: 'relative' },
  portfolioDeleteBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, width: 26, height: 26, justifyContent: 'center', alignItems: 'center' },
  portfolioDeleteBtnT: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // Posts/publicações
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

  // Vagas
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
})
