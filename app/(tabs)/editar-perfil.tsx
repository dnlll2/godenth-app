import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList, ActivityIndicator, Alert,
  Switch, Image, Platform,
} from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import api from '../../services/api'

const API_BASE = 'https://godenth-api-production.up.railway.app'

const DISPONIBILIDADE = [
  { key: 'disponivel', label: 'Disponível', cor: '#00A880' },
  { key: 'contratado', label: 'Contratado', cor: '#1A6FD4' },
  { key: 'freelancer', label: 'Freelancer', cor: '#C49800' },
  { key: 'parceria', label: 'Parcerias', cor: '#7B3FC4' },
]

const TIPOS_FORMACAO = ['Graduação', 'Pós-graduação', 'Especialização', 'MBA', 'Mestrado', 'Doutorado', 'Curso Técnico', 'Curso Livre']

const ESPECIALIDADES: Record<string, string[]> = {
  'Cirurgião-Dentista': ['Estética (Facetas e Lentes)', 'Odontopediatria', 'Implantodontia', 'Ortodontia', 'Endodontia', 'Harmonização Orofacial (HOF)'],
  'Técnico em Prótese Dentária': ['Gesso (Modelos e Troquéis)', 'Ceramista (Estratificação)', 'Cadista (Desenho Digital)', 'Resinas (Prótese Total/Parcial)', 'Metalurgia'],
  'Técnico em Saúde Bucal (TSB)': ['Auxílio em Cirurgia', 'Prevenção e Profilaxia', 'Radiologia'],
  'Auxiliar em Saúde Bucal (ASB)': ['Auxílio em Cirurgia', 'Instrumentação', 'Organização de Consultório'],
  'Auxiliar de Prótese Dentária': ['Gesso', 'Acabamento e Polimento', 'Auxiliar de Cadista'],
  'Gerente Comercial': ['Gestão de Equipe', 'Metas e KPIs', 'Negociação', 'Prospecção'],
  'Representante Comercial': ['Prospecção', 'Negociação', 'Pós-venda', 'Demonstração de Produtos'],
  'Recepcionista / Secretária': ['Agendamento', 'Atendimento ao Paciente', 'CRM', 'Faturamento'],
  'CRC / Call Center': ['Atendimento', 'Retenção de Clientes', 'Scripts de Vendas'],
  'Consultor de Vendas': ['Prospecção', 'Negociação', 'CRM', 'Fechamento de Contratos'],
  'Gerente Administrativo': ['Gestão de Equipe', 'Processos', 'Indicadores', 'Planejamento'],
  'Auxiliar Administrativo': ['Organização', 'Arquivo', 'Atendimento', 'Rotinas Administrativas'],
  'Financeiro': ['Contas a Pagar/Receber', 'Fluxo de Caixa', 'Conciliação', 'DRE'],
  'RH / Recursos Humanos': ['Recrutamento', 'Treinamento', 'Folha de Pagamento', 'Gestão de Pessoas'],
  'Contabilidade': ['Lançamentos', 'Obrigações Fiscais', 'Relatórios Contábeis'],
  'Marketing Digital': ['Redes Sociais', 'Tráfego Pago', 'SEO', 'E-mail Marketing', 'Branding'],
  'Designer Gráfico / UI': ['Identidade Visual', 'UI/UX', 'Motion Graphics', 'Edição de Imagens'],
  'Filmmaker / Videomaker': ['Captação', 'Edição de Vídeo', 'Motion', 'Color Grading'],
  'Fotógrafo': ['Fotografia Clínica', 'Ensaios', 'Edição', 'Lightroom/Photoshop'],
  'Social Media': ['Criação de Conteúdo', 'Gestão de Perfis', 'Engajamento', 'Stories/Reels'],
  'Gestor de Tráfego': ['Google Ads', 'Meta Ads', 'Analytics', 'Funil de Vendas'],
  'Estudante de Odontologia': ['Anatomia', 'Bioquímica', 'Clínica Integrada'],
  'Estudante de Prótese Dentária': ['Gesso', 'Resinas', 'Anatomia Dental'],
  'Estudante de Administração': ['Gestão', 'Finanças', 'Marketing', 'RH'],
  'Estudante de Marketing': ['Marketing Digital', 'Publicidade', 'Pesquisa de Mercado'],
}

const HABILIDADES: Record<string, Record<string, string[]>> = {
  'Cirurgião-Dentista': {
    'Operacional': ['Gestão de Agenda', 'Scanner 3D Intraoral', 'Moldagem (Alginato/Silicone)', 'Avaliação e Diagnóstico', 'Planejamento de Casos', 'Fotografia Clínica'],
    'Gestão': ['Gerência Clínica', 'Liderança de Equipe', 'Reuniões de Alinhamento', 'Controle de Estoque', 'Auditoria de Prontuários'],
    'Vendas': ['Conversão de Orçamentos', 'Explicação de Planos de Tratamento', 'Pós-atendimento (Fidelização)'],
  },
  'Técnico em Prótese Dentária': {
    'Prática': ['Vazamento e Troquelagem de Gesso', 'Montagem em Articulador', 'Enceramento Diagnóstico', 'Estratificação de Cerâmica', 'Maquiagem e Glaze'],
    'Digital': ['Desenho em Exocad (CAD)', 'Operação de Fresadoras (CAM)', 'Calibração de Impressora 3D', 'Sinterização de Zircônia'],
    'Relacionamento': ['Discussão de Casos com Dentistas', 'Logística de Entrega', 'Conferência de O.S'],
  },
  'Técnico em Saúde Bucal (TSB)': {
    'Clínico': ['Instrumentação Cirúrgica', 'Manipulação de Materiais', 'Esterilização (Autoclave)', 'Organização de Bancada', 'Auxílio em Quatro Mãos'],
    'Paciente': ['Acolhimento', 'Triagem Inicial', 'Instrução de Higiene Bucal', 'Suporte em Emergências'],
    'Suporte': ['Limpeza e Desinfecção', 'Reposição de Descartáveis'],
  },
  'Auxiliar em Saúde Bucal (ASB)': {
    'Clínico': ['Instrumentação Cirúrgica', 'Manipulação de Materiais', 'Esterilização (Autoclave)', 'Organização de Bancada', 'Auxílio em Quatro Mãos'],
    'Paciente': ['Acolhimento', 'Triagem Inicial', 'Instrução de Higiene Bucal', 'Suporte em Emergências'],
    'Suporte': ['Limpeza e Desinfecção', 'Reposição de Descartáveis'],
  },
  'Auxiliar de Prótese Dentária': {
    'Clínico': ['Instrumentação Cirúrgica', 'Manipulação de Materiais', 'Esterilização (Autoclave)', 'Organização de Bancada'],
    'Suporte': ['Limpeza e Desinfecção', 'Reposição de Descartáveis'],
  },
  'Gerente Comercial': {
    'Estratégico': ['Análise de Metas', 'Relatórios de Vendas', 'Participação em Congressos/Eventos'],
    'Interno': ['Atendimento via WhatsApp', 'Negociação de Prazos e Descontos', 'Recuperação de Clientes Inativos'],
  },
  'Representante Comercial': {
    'Externo': ['Visitação a Clínicas', 'Prospecção de Novos Clientes', 'Demonstração de Equipamentos (Hand-on)'],
    'Interno': ['Atendimento via WhatsApp', 'Negociação de Prazos e Descontos', 'Recuperação de Clientes Inativos'],
    'Estratégico': ['Análise de Metas', 'Relatórios de Vendas', 'Participação em Congressos/Eventos'],
  },
  'Consultor de Vendas': {
    'Externo': ['Visitação a Clínicas', 'Prospecção de Novos Clientes', 'Demonstração de Equipamentos'],
    'Interno': ['Atendimento via WhatsApp', 'Negociação', 'Recuperação de Clientes Inativos'],
  },
  'Recepcionista / Secretária': {
    'Front': ['Recepção de Pacientes', 'Confirmação de Consultas', 'Atendimento Telefônico', 'Gestão de Conflitos na Espera'],
    'Financeiro': ['Emissão de Notas Fiscais', 'Cobrança de Inadimplentes', 'Fechamento de Caixa', 'Faturamento de Convênios'],
    'Processos': ['Cadastro de Pacientes', 'Organização de Arquivos', 'Check-list de Manutenção'],
  },
  'Gerente Administrativo': {
    'Front': ['Recepção de Pacientes', 'Confirmação de Consultas', 'Gestão de Conflitos'],
    'Financeiro': ['Emissão de Notas Fiscais', 'Cobrança de Inadimplentes', 'Fechamento de Caixa', 'Faturamento de Convênios'],
    'Processos': ['Cadastro de Pacientes', 'Organização de Arquivos', 'Check-list de Manutenção'],
  },
  'Marketing Digital': {
    'Digital': ['Gestão de Redes Sociais', 'Criação de Conteúdo (Posts/Stories)', 'Resposta a Comentários/Directs'],
    'Produção': ['Edição de Vídeos', 'Fotografia de Portfólio', 'Gestão de Tráfego Pago'],
  },
  'Designer Gráfico / UI': {
    'Digital': ['Gestão de Redes Sociais', 'Criação de Conteúdo'],
    'Produção': ['Edição de Vídeos', 'Fotografia de Portfólio'],
  },
  'Filmmaker / Videomaker': { 'Produção': ['Edição de Vídeos de Antes e Depois', 'Fotografia de Portfólio', 'Gestão de Tráfego Pago'] },
  'Social Media': { 'Digital': ['Gestão de Redes Sociais', 'Criação de Conteúdo (Posts/Stories)', 'Resposta a Comentários/Directs'] },
  'Gestor de Tráfego': { 'Produção': ['Gestão de Tráfego Pago (Google/Meta)', 'Análise de Métricas', 'Criação de Campanhas'] },
  'Estudante de Odontologia': {
    'Acadêmico': ['Auxílio em Pesquisas', 'Organização de Eventos', 'Monitoria de Disciplinas'],
    'Prático': ['Estágio Observacional', 'Instrumentação em Clínicas', 'Organização de Materiais'],
  },
  'Estudante de Prótese Dentária': {
    'Acadêmico': ['Auxílio em Pesquisas', 'Organização de Eventos'],
    'Prático': ['Estágio Observacional', 'Organização de Materiais'],
  },
}

const ANOS = Array.from({ length: 60 }, (_, i) => String(new Date().getFullYear() - i))

// ── sub-components ────────────────────────────────────────────────────────────

function IBGEModal({ visible, title, data, onSelect, onClose, loading = false }: any) {
  const [busca, setBusca] = useState('')
  const filtered = data.filter((d: any) =>
    (d.nome || d.sigla || '').toLowerCase().includes(busca.toLowerCase())
  )
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          <TextInput style={s.searchInput} value={busca} onChangeText={setBusca}
            placeholder="Buscar..." placeholderTextColor="#A0B8AC" autoFocus />
          {loading
            ? <ActivityIndicator color="#00A880" style={{ marginTop: 24 }} />
            : (
              <FlatList data={filtered} keyExtractor={item => String(item.id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.listItem} onPress={() => { setBusca(''); onSelect(item) }}>
                    <Text style={s.listItemT}>{item.nome}</Text>
                    {item.sigla && <Text style={s.listItemSub}>{item.sigla}</Text>}
                  </TouchableOpacity>
                )} />
            )
          }
          <TouchableOpacity style={s.sheetClose} onPress={onClose}>
            <Text style={s.sheetCloseT}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

function PickerModal({ visible, title, data, onSelect, onClose }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={[s.sheet, { maxHeight: '55%' }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          <FlatList data={data} keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.listItem} onPress={() => onSelect(item)}>
                <Text style={s.listItemT}>{item}</Text>
              </TouchableOpacity>
            )} />
          <TouchableOpacity style={s.sheetClose} onPress={onClose}>
            <Text style={s.sheetCloseT}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function EditarPerfil() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [avatarRemote, setAvatarRemote] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [email, setEmail] = useState('')
  const [celular, setCelular] = useState('')
  const [privacidade, setPrivacidade] = useState({ ocultar_email: false, ocultar_celular: false, ocultar_idade: false })
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [bio, setBio] = useState('')
  const [disponibilidade, setDisponibilidade] = useState('')
  const [formacao, setFormacao] = useState<any[]>([])
  const [experiencia, setExperiencia] = useState<any[]>([])
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [habilidades, setHabilidades] = useState<string[]>([])
  const [instagram, setInstagram] = useState('')
  const [tipoProf, setTipoProf] = useState('')
  const [cargosExtras, setCargosExtras] = useState<any[]>([])

  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [estadoModal, setEstadoModal] = useState(false)
  const [cidadeModal, setCidadeModal] = useState(false)
  const [loadingCidades, setLoadingCidades] = useState(false)

  const [formacaoModal, setFormacaoModal] = useState(false)
  const [editingFormacao, setEditingFormacao] = useState<any>(null)
  const [fTipo, setFTipo] = useState('')
  const [fInstituicao, setFInstituicao] = useState('')
  const [fCurso, setFCurso] = useState('')
  const [fAnoInicio, setFAnoInicio] = useState('')
  const [fAnoConclusao, setFAnoConclusao] = useState('')
  const [fTipoModal, setFTipoModal] = useState(false)
  const [fAnoInicioModal, setFAnoInicioModal] = useState(false)
  const [fAnoConclusaoModal, setFAnoConclusaoModal] = useState(false)

  const [expModal, setExpModal] = useState(false)
  const [editingExp, setEditingExp] = useState<any>(null)
  const [eCargo, setECargo] = useState('')
  const [eEmpresa, setEEmpresa] = useState('')
  const [eInicioModal, setEInicioModal] = useState(false)
  const [eFimModal, setEFimModal] = useState(false)
  const [eInicio, setEInicio] = useState('')
  const [eFim, setEFim] = useState('')
  const [eAtual, setEAtual] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => { loadProfile(); loadEstados() }, [])

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me')
      const p = res.data
      setNome(p.nome || '')
      setEmail(p.email || '')
      setCelular(p.celular || '')
      setDataNascimento(p.data_nascimento ? p.data_nascimento.split('T')[0] : '')
      setPrivacidade(p.privacidade || { ocultar_email: false, ocultar_celular: false, ocultar_idade: false })
      setCidade(p.cidade || '')
      setEstado(p.estado || '')
      setBio(p.bio || '')
      setDisponibilidade(p.disponibilidade || '')
      setFormacao(p.formacao || [])
      setExperiencia(p.experiencia || [])
      setEspecialidades(p.especialidades || [])
      setHabilidades(p.habilidades || [])
      setInstagram(p.instagram || '')
      setTipoProf(p.tipo_profissional || '')
      setCargosExtras(p.cargos_extras || [])
      if (p.avatar_url) setAvatarRemote(p.avatar_url.startsWith('http') ? p.avatar_url : API_BASE + p.avatar_url)
      if (p.estado) loadCidades(p.estado)
    } catch (err) { console.log(err) }
    finally { setLoading(false) }
  }

  const loadEstados = async () => {
    try {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      setEstados(await res.json())
    } catch { }
  }

  const loadCidades = async (sigla: string) => {
    setLoadingCidades(true)
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`)
      setCidades(await res.json())
    } catch { }
    finally { setLoadingCidades(false) }
  }

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (result.canceled) return
    const uri = result.assets[0].uri
    setAvatarUri(uri)
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('avatar', { uri, type: 'image/jpeg', name: 'avatar.jpg' } as any)
      const res = await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAvatarRemote(API_BASE + res.data.avatar_url)
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a foto.')
      setAvatarUri(null)
    } finally { setUploadingAvatar(false) }
  }

  const profissoes = [tipoProf, ...cargosExtras.map((e: any) => e.label || e)].filter(Boolean)
  const espDisponiveis = [...new Set(profissoes.flatMap(p => ESPECIALIDADES[p] || []))]
  const habCategorias: Record<string, string[]> = {}
  profissoes.forEach(p => {
    Object.entries(HABILIDADES[p] || {}).forEach(([cat, items]: any) => {
      if (!habCategorias[cat]) habCategorias[cat] = []
      items.forEach((i: string) => { if (!habCategorias[cat].includes(i)) habCategorias[cat].push(i) })
    })
  })

  const openAddFormacao = () => {
    setEditingFormacao(null); setFTipo(''); setFInstituicao(''); setFCurso(''); setFAnoInicio(''); setFAnoConclusao('')
    setFormacaoModal(true)
  }
  const openEditFormacao = (item: any) => {
    setEditingFormacao(item); setFTipo(item.tipo || ''); setFInstituicao(item.instituicao || '')
    setFCurso(item.curso || ''); setFAnoInicio(item.ano_inicio || ''); setFAnoConclusao(item.ano_conclusao || '')
    setFormacaoModal(true)
  }
  const saveFormacao = () => {
    if (!fInstituicao.trim() || !fCurso.trim()) { Alert.alert('Atenção', 'Preencha instituição e curso.'); return }
    const entry = { id: editingFormacao?.id || Date.now(), tipo: fTipo, instituicao: fInstituicao.trim(), curso: fCurso.trim(), ano_inicio: fAnoInicio, ano_conclusao: fAnoConclusao }
    setFormacao(prev => editingFormacao ? prev.map(f => f.id === editingFormacao.id ? entry : f) : [...prev, entry])
    setFormacaoModal(false)
  }
  const removeFormacao = (id: any) => {
    Alert.alert('Remover formação', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setFormacao(prev => prev.filter(f => f.id !== id)) },
    ])
  }

  const openAddExp = () => {
    setEditingExp(null); setECargo(''); setEEmpresa(''); setEInicio(''); setEFim(''); setEAtual(false)
    setExpModal(true)
  }
  const openEditExp = (item: any) => {
    setEditingExp(item); setECargo(item.cargo || ''); setEEmpresa(item.empresa || '')
    setEInicio(item.inicio || ''); setEFim(item.fim || ''); setEAtual(item.atual || false)
    setExpModal(true)
  }
  const saveExp = () => {
    if (!eCargo.trim() || !eEmpresa.trim()) { Alert.alert('Atenção', 'Preencha cargo e empresa.'); return }
    const entry = { id: editingExp?.id || Date.now(), cargo: eCargo.trim(), empresa: eEmpresa.trim(), inicio: eInicio, fim: eAtual ? 'Atual' : eFim, atual: eAtual }
    setExperiencia(prev => editingExp ? prev.map(e => e.id === editingExp.id ? entry : e) : [...prev, entry])
    setExpModal(false)
  }
  const removeExp = (id: any) => {
    Alert.alert('Remover experiência', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setExperiencia(prev => prev.filter(e => e.id !== id)) },
    ])
  }

  const salvar = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'O nome é obrigatório.'); return }
    setSaving(true)

    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 20000)

    try {
      await api.put('/users/me', {
        nome: nome.trim(), bio, cidade, estado,
        disponibilidade: disponibilidade || null,
        celular, data_nascimento: dataNascimento || null,
        privacidade, instagram,
        especialidades, habilidades, formacao, experiencia,
      }, { signal: controller.signal })

      router.back()
    } catch (err: any) {
      if (controller.signal.aborted) {
        Alert.alert('Tempo esgotado', 'O servidor demorou para responder. Verifique sua conexão e tente novamente.')
      } else if (!err.response) {
        Alert.alert('Sem conexão', 'Não foi possível conectar ao servidor. Verifique sua internet.')
      } else {
        Alert.alert('Erro ao salvar', err.response.data?.error || 'Não foi possível salvar o perfil.')
      }
    } finally {
      clearTimeout(tid)
      setSaving(false)
    }
  }

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color="#00A880" size="large" />
      <Text style={s.loadingText}>Carregando perfil...</Text>
    </View>
  )

  const avatarSrc = avatarUri || avatarRemote

  return (
    <View style={s.root}>

      {/* ── HEADER GRADIENT ──────────────────────────────────────────────── */}
      <LinearGradient colors={['#007A6E', '#004D44']} style={s.headerGrad}>
        <View style={s.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerSide}>
            <Text style={s.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Editar Perfil</Text>
          <View style={[s.headerSide, { alignItems: 'flex-end' }]}>
            {saving
              ? <ActivityIndicator color="#F5C800" size="small" />
              : <TouchableOpacity onPress={salvar}><Text style={s.saveTextBtn}>Salvar</Text></TouchableOpacity>
            }
          </View>
        </View>

        {/* ── AVATAR ───────────────────────────────────────────────────── */}
        <View style={s.avatarArea}>
          <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} disabled={uploadingAvatar}>
            {avatarSrc
              ? <Image source={{ uri: avatarSrc }} style={s.avatarImg} />
              : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarInitial}>{nome.charAt(0).toUpperCase() || '?'}</Text>
                </View>
              )
            }
            <View style={s.cameraBadge}>
              {uploadingAvatar
                ? <ActivityIndicator color="#007A6E" size="small" />
                : <Text style={{ fontSize: 13 }}>📷</Text>
              }
            </View>
          </TouchableOpacity>
          <Text style={s.avatarName}>{nome || 'Seu nome'}</Text>
          <Text style={s.avatarHint}>Toque na foto para alterar</Text>
        </View>
      </LinearGradient>

      {/* ── SCROLL ───────────────────────────────────────────────────────── */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* 2. Informações Básicas */}
        <Text style={s.sectionLabel}>Informações Básicas</Text>
        <View style={s.card}>
          <Text style={s.fieldLbl}>Nome completo *</Text>
          <TextInput style={s.input} value={nome} onChangeText={setNome}
            placeholder="Seu nome completo" placeholderTextColor="#A0B8AC" />

          <Text style={s.fieldLbl}>Data de nascimento</Text>
          <TextInput style={s.input} value={dataNascimento} onChangeText={setDataNascimento}
            placeholder="AAAA-MM-DD" placeholderTextColor="#A0B8AC" keyboardType="numbers-and-punctuation" />

          <Text style={s.fieldLbl}>E-mail <Text style={s.readOnlyTag}>(não editável)</Text></Text>
          <View style={[s.input, s.inputReadOnly]}>
            <Text style={s.inputReadOnlyT}>{email || '—'}</Text>
          </View>

          <Text style={s.fieldLbl}>Celular / WhatsApp</Text>
          <TextInput style={s.input} value={celular} onChangeText={setCelular}
            placeholder="(11) 99999-9999" placeholderTextColor="#A0B8AC" keyboardType="phone-pad" />
        </View>

        {/* 3. Privacidade */}
        <Text style={s.sectionLabel}>Privacidade</Text>
        <View style={s.card}>
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Ocultar e-mail no perfil</Text>
              <Text style={s.toggleSub}>Apenas conexões podem ver</Text>
            </View>
            <Switch value={privacidade.ocultar_email}
              onValueChange={v => setPrivacidade(p => ({ ...p, ocultar_email: v }))}
              trackColor={{ false: '#D0E8DA', true: '#00A880' }} thumbColor="#fff" />
          </View>
          <View style={s.cardDivider} />
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Ocultar celular no perfil</Text>
              <Text style={s.toggleSub}>Apenas conexões podem ver</Text>
            </View>
            <Switch value={privacidade.ocultar_celular}
              onValueChange={v => setPrivacidade(p => ({ ...p, ocultar_celular: v }))}
              trackColor={{ false: '#D0E8DA', true: '#00A880' }} thumbColor="#fff" />
          </View>
          <View style={s.cardDivider} />
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Ocultar idade no perfil</Text>
              <Text style={s.toggleSub}>Data de nascimento não aparece</Text>
            </View>
            <Switch value={privacidade.ocultar_idade}
              onValueChange={v => setPrivacidade(p => ({ ...p, ocultar_idade: v }))}
              trackColor={{ false: '#D0E8DA', true: '#00A880' }} thumbColor="#fff" />
          </View>
        </View>

        {/* 4. Localização */}
        <Text style={s.sectionLabel}>Localização</Text>
        <View style={s.card}>
          <Text style={s.fieldLbl}>Estado</Text>
          <TouchableOpacity style={s.selector} onPress={() => setEstadoModal(true)}>
            <Text style={[s.selectorText, !estado && s.ph]}>{estado || 'Selecionar estado'}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <Text style={s.fieldLbl}>Cidade</Text>
          <TouchableOpacity style={[s.selector, !estado && s.selectorOff]}
            onPress={() => estado && setCidadeModal(true)} disabled={!estado}>
            <Text style={[s.selectorText, !cidade && s.ph]}>{cidade || 'Selecionar cidade'}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Sobre */}
        <Text style={s.sectionLabel}>Sobre</Text>
        <View style={s.card}>
          <Text style={s.fieldLbl}>Bio profissional</Text>
          <TextInput style={[s.input, s.inputArea]} value={bio}
            onChangeText={t => t.length <= 500 && setBio(t)}
            placeholder="Apresente-se brevemente — aparece no topo do seu perfil..."
            placeholderTextColor="#A0B8AC" multiline numberOfLines={4} textAlignVertical="top" />
          <Text style={[s.charCount, bio.length >= 450 && { color: '#D4186A' }]}>{bio.length}/500</Text>
        </View>

        {/* 6. Disponibilidade */}
        <Text style={s.sectionLabel}>Disponibilidade</Text>
        <View style={s.card}>
          <View style={s.chipsWrap}>
            {DISPONIBILIDADE.map(d => {
              const on = disponibilidade === d.key
              return (
                <TouchableOpacity key={d.key}
                  style={[s.dispChip, on && { backgroundColor: d.cor, borderColor: d.cor }]}
                  onPress={() => setDisponibilidade(prev => prev === d.key ? '' : d.key)}>
                  <Text style={[s.dispChipT, on && { color: '#fff' }]}>
                    {on ? '✓ ' : ''}{d.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* 7. Formação Acadêmica */}
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Formação Acadêmica</Text>
          <TouchableOpacity style={s.sectionAddBtn} onPress={openAddFormacao}>
            <Text style={s.sectionAddBtnT}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          {formacao.length === 0
            ? (
              <TouchableOpacity style={s.emptyState} onPress={openAddFormacao}>
                <Text style={s.emptyStateIcon}>🎓</Text>
                <Text style={s.emptyStateTitle}>Nenhuma formação adicionada</Text>
                <Text style={s.emptyStateSub}>Adicione graduações, cursos e especializações</Text>
                <View style={s.emptyStateBtn}><Text style={s.emptyStateBtnT}>+ Adicionar formação</Text></View>
              </TouchableOpacity>
            )
            : (
              <>
                {formacao.map((f, i) => (
                  <View key={f.id} style={[s.entryItem, i > 0 && s.entryBorder]}>
                    <View style={[s.entryIconCircle, { backgroundColor: '#EEF7F2' }]}>
                      <Text style={s.entryIconEmoji}>🎓</Text>
                    </View>
                    <View style={s.entryContent}>
                      <Text style={s.entryTitle}>{f.curso}</Text>
                      <Text style={s.entrySub}>{f.instituicao}{f.tipo ? ` · ${f.tipo}` : ''}</Text>
                      {(f.ano_inicio || f.ano_conclusao) && (
                        <Text style={s.entryDate}>{f.ano_inicio || '?'} – {f.ano_conclusao || 'Em curso'}</Text>
                      )}
                    </View>
                    <View style={s.entryActions}>
                      <TouchableOpacity style={s.entryEditBtn} onPress={() => openEditFormacao(f)}>
                        <Text style={s.entryEditBtnT}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.entryRemoveBtn} onPress={() => removeFormacao(f.id)}>
                        <Text style={s.entryRemoveBtnT}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={s.addMoreBtn} onPress={openAddFormacao}>
                  <Text style={s.addMoreBtnT}>+ Adicionar outra formação</Text>
                </TouchableOpacity>
              </>
            )
          }
        </View>

        {/* 8. Experiência Profissional */}
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Experiência Profissional</Text>
          <TouchableOpacity style={s.sectionAddBtn} onPress={openAddExp}>
            <Text style={s.sectionAddBtnT}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          {experiencia.length === 0
            ? (
              <TouchableOpacity style={s.emptyState} onPress={openAddExp}>
                <Text style={s.emptyStateIcon}>💼</Text>
                <Text style={s.emptyStateTitle}>Nenhuma experiência adicionada</Text>
                <Text style={s.emptyStateSub}>Mostre sua trajetória profissional</Text>
                <View style={s.emptyStateBtn}><Text style={s.emptyStateBtnT}>+ Adicionar experiência</Text></View>
              </TouchableOpacity>
            )
            : (
              <>
                {experiencia.map((e, i) => (
                  <View key={e.id} style={[s.entryItem, i > 0 && s.entryBorder]}>
                    <View style={[s.entryIconCircle, { backgroundColor: '#EEF3FC' }]}>
                      <Text style={s.entryIconEmoji}>💼</Text>
                    </View>
                    <View style={s.entryContent}>
                      <Text style={s.entryTitle}>{e.cargo}</Text>
                      <Text style={s.entrySub}>{e.empresa}</Text>
                      {(e.inicio || e.fim) && (
                        <Text style={s.entryDate}>{e.inicio || '?'} – {e.atual ? 'Atualmente' : (e.fim || '?')}</Text>
                      )}
                    </View>
                    <View style={s.entryActions}>
                      <TouchableOpacity style={s.entryEditBtn} onPress={() => openEditExp(e)}>
                        <Text style={s.entryEditBtnT}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.entryRemoveBtn} onPress={() => removeExp(e.id)}>
                        <Text style={s.entryRemoveBtnT}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={s.addMoreBtn} onPress={openAddExp}>
                  <Text style={s.addMoreBtnT}>+ Adicionar outra experiência</Text>
                </TouchableOpacity>
              </>
            )
          }
        </View>

        {/* 9. Especialidades */}
        {espDisponiveis.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Especialidades</Text>
            <View style={s.card}>
              <Text style={s.chipHint}>Selecione as que se aplicam ao seu perfil</Text>
              <View style={s.chipsWrap}>
                {espDisponiveis.map(esp => {
                  const on = especialidades.includes(esp)
                  return (
                    <TouchableOpacity key={esp} style={[s.chip, on && s.chipEspOn]}
                      onPress={() => setEspecialidades(prev => on ? prev.filter(e => e !== esp) : [...prev, esp])}>
                      <Text style={[s.chipT, on && s.chipTOn]}>{on ? '✓ ' : ''}{esp}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </>
        )}

        {/* 10. Habilidades */}
        {Object.keys(habCategorias).length > 0 && (
          <>
            <Text style={s.sectionLabel}>Habilidades e Competências</Text>
            <View style={s.card}>
              {Object.entries(habCategorias).map(([cat, items]) => (
                <View key={cat} style={s.habSection}>
                  <View style={s.habCatRow}>
                    <View style={s.habCatDot} />
                    <Text style={s.habCat}>{cat}</Text>
                    <Text style={s.habCatCount}>
                      {items.filter(h => habilidades.includes(h)).length}/{items.length}
                    </Text>
                  </View>
                  <View style={s.chipsWrap}>
                    {items.map(hab => {
                      const on = habilidades.includes(hab)
                      return (
                        <TouchableOpacity key={hab} style={[s.chip, s.chipHab, on && s.chipHabOn]}
                          onPress={() => setHabilidades(prev => on ? prev.filter(h => h !== hab) : [...prev, hab])}>
                          <Text style={[s.chipT, on && s.chipTOn]}>{on ? '✓ ' : ''}{hab}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 11. Redes Sociais */}
        <Text style={s.sectionLabel}>Redes Sociais</Text>
        <View style={s.card}>
          <Text style={s.fieldLbl}>Instagram</Text>
          <View style={s.prefixRow}>
            <View style={s.prefixBox}>
              <Text style={s.prefixText}>instagram.com/</Text>
            </View>
            <TextInput
              style={[s.input, s.prefixInput]}
              value={instagram}
              onChangeText={setInstagram}
              placeholder="seu_usuario"
              placeholderTextColor="#A0B8AC"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={salvar} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnT}>Salvar alterações</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── IBGE MODALS ──────────────────────────────────────────────────── */}
      <IBGEModal visible={estadoModal} title="Selecionar Estado" data={estados}
        onSelect={(est: any) => { setEstado(est.sigla); setCidade(''); setCidades([]); setEstadoModal(false); loadCidades(est.sigla) }}
        onClose={() => setEstadoModal(false)} />
      <IBGEModal visible={cidadeModal} title="Selecionar Cidade" data={cidades}
        onSelect={(cid: any) => { setCidade(cid.nome); setCidadeModal(false) }}
        onClose={() => setCidadeModal(false)} loading={loadingCidades} />

      {/* ── FORMAÇÃO MODAL ───────────────────────────────────────────────── */}
      <Modal visible={formacaoModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.sheet, { maxHeight: '92%' }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editingFormacao ? 'Editar Formação' : 'Nova Formação'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={s.fieldLbl}>Tipo</Text>
              <TouchableOpacity style={s.selector} onPress={() => setFTipoModal(true)}>
                <Text style={[s.selectorText, !fTipo && s.ph]}>{fTipo || 'Selecionar tipo'}</Text>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>

              <Text style={s.fieldLbl}>Instituição *</Text>
              <TextInput style={s.input} value={fInstituicao} onChangeText={setFInstituicao}
                placeholder="Ex: Universidade de São Paulo" placeholderTextColor="#A0B8AC" />

              <Text style={s.fieldLbl}>Curso / Área *</Text>
              <TextInput style={s.input} value={fCurso} onChangeText={setFCurso}
                placeholder="Ex: Odontologia" placeholderTextColor="#A0B8AC" />

              <View style={s.rowHalf}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLbl}>Ano início</Text>
                  <TouchableOpacity style={s.selector} onPress={() => setFAnoInicioModal(true)}>
                    <Text style={[s.selectorText, !fAnoInicio && s.ph]}>{fAnoInicio || 'Ano'}</Text>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLbl}>Ano conclusão</Text>
                  <TouchableOpacity style={s.selector} onPress={() => setFAnoConclusaoModal(true)}>
                    <Text style={[s.selectorText, !fAnoConclusao && s.ph]}>{fAnoConclusao || 'Ano'}</Text>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setFormacaoModal(false)}>
                <Text style={s.cancelBtnT}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveFormacao}>
                <Text style={s.confirmBtnT}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── EXPERIÊNCIA MODAL ────────────────────────────────────────────── */}
      <Modal visible={expModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.sheet, { maxHeight: '92%' }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editingExp ? 'Editar Experiência' : 'Nova Experiência'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={s.fieldLbl}>Cargo *</Text>
              <TextInput style={s.input} value={eCargo} onChangeText={setECargo}
                placeholder="Ex: Cirurgião-Dentista" placeholderTextColor="#A0B8AC" />

              <Text style={s.fieldLbl}>Empresa / Clínica *</Text>
              <TextInput style={s.input} value={eEmpresa} onChangeText={setEEmpresa}
                placeholder="Nome da empresa ou clínica" placeholderTextColor="#A0B8AC" />

              <View style={s.rowHalf}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLbl}>Início</Text>
                  <TouchableOpacity style={s.selector} onPress={() => setEInicioModal(true)}>
                    <Text style={[s.selectorText, !eInicio && s.ph]}>{eInicio || 'Ano'}</Text>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLbl}>Fim</Text>
                  <TouchableOpacity style={[s.selector, eAtual && s.selectorOff]}
                    onPress={() => { if (!eAtual) setEFimModal(true) }} disabled={eAtual}>
                    <Text style={[s.selectorText, !eFim && s.ph]}>
                      {eAtual ? 'Atualmente' : (eFim || 'Ano')}
                    </Text>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[s.toggleRow, { marginTop: 8 }]}>
                <View style={s.toggleInfo}>
                  <Text style={s.toggleLabel}>Trabalho aqui atualmente</Text>
                </View>
                <Switch value={eAtual} onValueChange={v => { setEAtual(v); if (v) setEFim('') }}
                  trackColor={{ false: '#D0E8DA', true: '#00A880' }} thumbColor="#fff" />
              </View>
            </ScrollView>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setExpModal(false)}>
                <Text style={s.cancelBtnT}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveExp}>
                <Text style={s.confirmBtnT}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── PICKER MODALS ────────────────────────────────────────────────── */}
      <PickerModal visible={fTipoModal} title="Tipo de Formação" data={TIPOS_FORMACAO}
        onSelect={(v: string) => { setFTipo(v); setFTipoModal(false) }} onClose={() => setFTipoModal(false)} />
      <PickerModal visible={fAnoInicioModal} title="Ano de Início" data={ANOS}
        onSelect={(v: string) => { setFAnoInicio(v); setFAnoInicioModal(false) }} onClose={() => setFAnoInicioModal(false)} />
      <PickerModal visible={fAnoConclusaoModal} title="Ano de Conclusão" data={ANOS}
        onSelect={(v: string) => { setFAnoConclusao(v); setFAnoConclusaoModal(false) }} onClose={() => setFAnoConclusaoModal(false)} />
      <PickerModal visible={eInicioModal} title="Ano de Início" data={ANOS}
        onSelect={(v: string) => { setEInicio(v); setEInicioModal(false) }} onClose={() => setEInicioModal(false)} />
      <PickerModal visible={eFimModal} title="Ano de Fim" data={ANOS}
        onSelect={(v: string) => { setEFim(v); setEFimModal(false) }} onClose={() => setEFimModal(false)} />
    </View>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F5F4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F5F4', gap: 12 },
  loadingText: { fontSize: 14, color: '#7A9E8E', fontWeight: '600' },

  // Header gradient
  headerGrad: { paddingTop: Platform.OS === 'ios' ? 52 : 28 },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4 },
  headerSide: { width: 70 },
  backBtn: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#fff' },
  saveTextBtn: { fontSize: 15, fontWeight: '800', color: '#F5C800' },

  // Avatar
  avatarArea: { alignItems: 'center', paddingVertical: 20, paddingBottom: 28 },
  avatarWrap: { width: 104, height: 104, borderRadius: 52, position: 'relative' },
  avatarImg: { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  avatarPlaceholder: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#00A880', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: '800' },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5C800', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#fff' },
  avatarName: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12, letterSpacing: 0.2 },
  avatarHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, fontWeight: '500' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 6, paddingBottom: 16 },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#007A6E', textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  sectionAddBtn: { backgroundColor: '#E3F4EE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 14 },
  sectionAddBtnT: { fontSize: 12, fontWeight: '800', color: '#007A6E' },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#006A5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDivider: { height: 1, backgroundColor: '#F2F5F4', marginVertical: 6 },

  // Fields
  fieldLbl: { fontSize: 11, fontWeight: '700', color: '#7A9E8E', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#F2F5F4', borderRadius: 12, padding: 14, fontSize: 15, color: '#0A1C14' },
  inputArea: { height: 120, textAlignVertical: 'top' },
  inputReadOnly: { justifyContent: 'center' },
  inputReadOnlyT: { fontSize: 15, color: '#A0B8AC' },
  readOnlyTag: { fontSize: 10, color: '#A0B8AC', fontWeight: '500', textTransform: 'none' },
  charCount: { fontSize: 11, color: '#A0B8AC', textAlign: 'right', marginTop: 4 },

  // Selector
  selector: { backgroundColor: '#F2F5F4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  selectorOff: { opacity: 0.38 },
  selectorText: { fontSize: 15, color: '#0A1C14', flex: 1 },
  ph: { color: '#A0B8AC' },
  chevron: { fontSize: 22, color: '#A0B8AC', fontWeight: '300' },

  // Toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#0A1C14' },
  toggleSub: { fontSize: 11, color: '#7A9E8E', marginTop: 2 },

  // Chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chipHint: { fontSize: 12, color: '#7A9E8E', marginBottom: 12 },
  dispChip: { borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FBF9' },
  dispChipT: { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  chip: { borderWidth: 1.5, borderColor: '#C8E0D4', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F4F9F6' },
  chipEspOn: { backgroundColor: '#007A6E', borderColor: '#007A6E' },
  chipHab: { borderColor: '#BDD2E8', backgroundColor: '#EFF4FC' },
  chipHabOn: { backgroundColor: '#1A6FD4', borderColor: '#1A6FD4' },
  chipT: { fontSize: 12, fontWeight: '600', color: '#3A6550' },
  chipTOn: { color: '#fff' },

  // Habilidades
  habSection: { marginBottom: 20 },
  habCatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  habCatDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1A6FD4' },
  habCat: { fontSize: 11, fontWeight: '800', color: '#1A6FD4', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  habCatCount: { fontSize: 11, fontWeight: '700', color: '#A0B8AC' },

  // Entry items (formação / experiência)
  entryItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 12 },
  entryBorder: { borderTopWidth: 1, borderTopColor: '#F2F5F4' },
  entryIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  entryIconEmoji: { fontSize: 22 },
  entryContent: { flex: 1 },
  entryTitle: { fontSize: 14, fontWeight: '800', color: '#0A1C14', marginBottom: 2 },
  entrySub: { fontSize: 13, color: '#3A6550', marginBottom: 2 },
  entryDate: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  entryActions: { flexDirection: 'column', gap: 6, alignItems: 'center', flexShrink: 0 },
  entryEditBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EEF7F2', justifyContent: 'center', alignItems: 'center' },
  entryEditBtnT: { fontSize: 14 },
  entryRemoveBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF0F5', justifyContent: 'center', alignItems: 'center' },
  entryRemoveBtnT: { fontSize: 12, color: '#D4186A', fontWeight: '900' },
  addMoreBtn: { marginTop: 14, borderWidth: 1.5, borderColor: '#00A880', borderStyle: 'dashed', borderRadius: 12, padding: 12, alignItems: 'center' },
  addMoreBtnT: { fontSize: 13, fontWeight: '700', color: '#00A880' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyStateIcon: { fontSize: 40, marginBottom: 10 },
  emptyStateTitle: { fontSize: 15, fontWeight: '700', color: '#3A6550', marginBottom: 4 },
  emptyStateSub: { fontSize: 12, color: '#A0B8AC', marginBottom: 16, textAlign: 'center' },
  emptyStateBtn: { backgroundColor: '#E3F4EE', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9 },
  emptyStateBtnT: { fontSize: 13, fontWeight: '800', color: '#007A6E' },

  // Social prefix
  prefixRow: { flexDirection: 'row', alignItems: 'stretch' },
  prefixBox: { backgroundColor: '#E3F4EE', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 10, justifyContent: 'center' },
  prefixText: { fontSize: 13, fontWeight: '600', color: '#007A6E' },
  prefixInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },

  // Footer
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: '#E8F0EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnT: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '82%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0A1C14', marginBottom: 16 },
  searchInput: { backgroundColor: '#F2F5F4', borderRadius: 12, padding: 12, fontSize: 15, color: '#0A1C14', marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F5F4' },
  listItemT: { fontSize: 15, color: '#0A1C14', fontWeight: '600' },
  listItemSub: { fontSize: 12, color: '#7A9E8E', fontWeight: '700' },
  sheetClose: { backgroundColor: '#F2F5F4', borderRadius: 12, padding: 14, alignItems: 'center', marginVertical: 14 },
  sheetCloseT: { fontSize: 14, fontWeight: '800', color: '#3A6550' },
  rowHalf: { flexDirection: 'row' },
  modalBtns: { flexDirection: 'row', gap: 12, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 8 },
  cancelBtn: { flex: 1, backgroundColor: '#F2F5F4', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnT: { fontSize: 14, fontWeight: '800', color: '#3A6550' },
  confirmBtn: { flex: 1, backgroundColor: '#007A6E', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmBtnT: { fontSize: 14, fontWeight: '800', color: '#fff' },
})
