import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList, ActivityIndicator, Alert,
  Switch, Image, Platform,
} from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
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

// ── helpers ─────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>
}

// ── sub-components ──────────────────────────────────────────────────────────

function IBGEModal({ visible, title, data, onSelect, onClose, loading = false }: any) {
  const [busca, setBusca] = useState('')
  const filtered = data.filter((d: any) =>
    (d.nome || d.sigla || '').toLowerCase().includes(busca.toLowerCase())
  )
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
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
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnT}>Fechar</Text>
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
        <View style={[s.sheet, { maxHeight: '50%' }]}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>{title}</Text>
          <FlatList data={data} keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.listItem} onPress={() => onSelect(item)}>
                <Text style={s.listItemT}>{item}</Text>
              </TouchableOpacity>
            )} />
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnT}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── main component ───────────────────────────────────────────────────────────

export default function EditarPerfil() {
  // profile state
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

  // IBGE
  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [estadoModal, setEstadoModal] = useState(false)
  const [cidadeModal, setCidadeModal] = useState(false)
  const [loadingCidades, setLoadingCidades] = useState(false)

  // formação modal
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

  // experiência modal
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

  useEffect(() => {
    loadProfile()
    loadEstados()
  }, [])

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
    } catch (err) { console.log(err) }
  }

  const loadCidades = async (sigla: string) => {
    setLoadingCidades(true)
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`)
      setCidades(await res.json())
    } catch (err) { console.log(err) }
    finally { setLoadingCidades(false) }
  }

  // ── avatar ────────────────────────────────────────────────────────────────

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria para trocar a foto.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled) return
    const uri = result.assets[0].uri
    setAvatarUri(uri)
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', { uri, type: 'image/jpeg', name: 'avatar.jpg' } as any)
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAvatarRemote(API_BASE + res.data.avatar_url)
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar a foto.')
      setAvatarUri(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── chips ─────────────────────────────────────────────────────────────────

  const profissoes = [tipoProf, ...cargosExtras.map((e: any) => e.label || e)].filter(Boolean)
  const espDisponiveis = [...new Set(profissoes.flatMap(p => ESPECIALIDADES[p] || []))]
  const habCategorias: Record<string, string[]> = {}
  profissoes.forEach(p => {
    Object.entries(HABILIDADES[p] || {}).forEach(([cat, items]: any) => {
      if (!habCategorias[cat]) habCategorias[cat] = []
      items.forEach((i: string) => { if (!habCategorias[cat].includes(i)) habCategorias[cat].push(i) })
    })
  })

  // ── formação ──────────────────────────────────────────────────────────────

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
  const removeFormacao = (id: any) => setFormacao(prev => prev.filter(f => f.id !== id))

  // ── experiência ───────────────────────────────────────────────────────────

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
  const removeExp = (id: any) => setExperiencia(prev => prev.filter(e => e.id !== id))

  // ── save ──────────────────────────────────────────────────────────────────

  const salvar = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'O nome é obrigatório.'); return }
    setSaving(true)
    try {
      await api.put('/users/me', {
        nome: nome.trim(), bio, cidade, estado,
        disponibilidade: disponibilidade || null,
        celular, data_nascimento: dataNascimento || null,
        privacidade, instagram,
        especialidades, habilidades, formacao, experiencia,
      })
      router.back()
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#00A880" size="large" /></View>

  const avatarSrc = avatarUri || avatarRemote

  return (
    <View style={s.container}>

      {/* ── header ─────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerSide}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar Perfil</Text>
        <View style={s.headerSide}>
          {saving
            ? <ActivityIndicator color="#F5C800" size="small" />
            : <TouchableOpacity onPress={salvar}><Text style={s.salvarText}>Salvar</Text></TouchableOpacity>
          }
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── 1. Foto de perfil ──────────────────────────────────────────── */}
        <View style={s.avatarSection}>
          <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} disabled={uploadingAvatar}>
            {avatarSrc
              ? <Image source={{ uri: avatarSrc }} style={s.avatarImg} />
              : <View style={s.avatarPlaceholder}><Text style={s.avatarInitial}>{nome.charAt(0) || '?'}</Text></View>
            }
            <View style={s.cameraIcon}>
              {uploadingAvatar ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 16 }}>📷</Text>}
            </View>
          </TouchableOpacity>
          <Text style={s.avatarHint}>Toque para trocar a foto</Text>
        </View>

        {/* ── 2. Informações Básicas ─────────────────────────────────────── */}
        <SectionTitle>Informações Básicas</SectionTitle>
        <View style={s.card}>
          <FieldLabel>Nome completo *</FieldLabel>
          <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor="#A0B8AC" />

          <FieldLabel>Data de nascimento</FieldLabel>
          <TextInput style={s.input} value={dataNascimento} onChangeText={setDataNascimento}
            placeholder="AAAA-MM-DD" placeholderTextColor="#A0B8AC" keyboardType="numbers-and-punctuation" />

          <FieldLabel>E-mail</FieldLabel>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="seu@email.com" placeholderTextColor="#A0B8AC" keyboardType="email-address" autoCapitalize="none" />

          <FieldLabel>Celular / WhatsApp</FieldLabel>
          <TextInput style={s.input} value={celular} onChangeText={setCelular}
            placeholder="(11) 99999-9999" placeholderTextColor="#A0B8AC" keyboardType="phone-pad" />
        </View>

        {/* ── 3. Privacidade ─────────────────────────────────────────────── */}
        <SectionTitle>Privacidade</SectionTitle>
        <View style={s.card}>
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Ocultar e-mail no perfil</Text>
              <Text style={s.toggleSub}>Apenas conexões podem ver</Text>
            </View>
            <Switch value={privacidade.ocultar_email} onValueChange={v => setPrivacidade(p => ({ ...p, ocultar_email: v }))}
              trackColor={{ false: '#D0E8DA', true: '#00A880' }} thumbColor="#fff" />
          </View>
          <View style={s.divider} />
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Ocultar celular no perfil</Text>
              <Text style={s.toggleSub}>Apenas conexões podem ver</Text>
            </View>
            <Switch value={privacidade.ocultar_celular} onValueChange={v => setPrivacidade(p => ({ ...p, ocultar_celular: v }))}
              trackColor={{ false: '#D0E8DA', true: '#00A880' }} thumbColor="#fff" />
          </View>
          <View style={s.divider} />
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Ocultar idade no perfil</Text>
              <Text style={s.toggleSub}>Data de nascimento não aparece</Text>
            </View>
            <Switch value={privacidade.ocultar_idade} onValueChange={v => setPrivacidade(p => ({ ...p, ocultar_idade: v }))}
              trackColor={{ false: '#D0E8DA', true: '#00A880' }} thumbColor="#fff" />
          </View>
        </View>

        {/* ── 4. Localização ─────────────────────────────────────────────── */}
        <SectionTitle>Localização</SectionTitle>
        <View style={s.card}>
          <FieldLabel>Estado</FieldLabel>
          <TouchableOpacity style={s.selector} onPress={() => setEstadoModal(true)}>
            <Text style={[s.selectorText, !estado && s.placeholder]}>{estado || 'Selecionar estado'}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <FieldLabel>Cidade</FieldLabel>
          <TouchableOpacity style={[s.selector, !estado && s.selectorDisabled]}
            onPress={() => { if (estado) setCidadeModal(true) }} disabled={!estado}>
            <Text style={[s.selectorText, !cidade && s.placeholder]}>{cidade || 'Selecionar cidade'}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── 5. Sobre ────────────────────────────────────────────────────── */}
        <SectionTitle>Sobre</SectionTitle>
        <View style={s.card}>
          <FieldLabel>Bio profissional</FieldLabel>
          <TextInput style={[s.input, s.inputMulti]} value={bio} onChangeText={setBio}
            placeholder="Apresente-se brevemente — aparece no topo do seu perfil..."
            placeholderTextColor="#A0B8AC" multiline numberOfLines={4} textAlignVertical="top" />
          <Text style={s.charCount}>{bio.length} / 500 caracteres</Text>
        </View>

        {/* ── 6. Disponibilidade ─────────────────────────────────────────── */}
        <SectionTitle>Disponibilidade</SectionTitle>
        <View style={s.card}>
          <View style={s.chipsWrap}>
            {DISPONIBILIDADE.map(d => (
              <TouchableOpacity key={d.key}
                style={[s.dispChip, disponibilidade === d.key && { backgroundColor: d.cor, borderColor: d.cor }]}
                onPress={() => setDisponibilidade(prev => prev === d.key ? '' : d.key)}>
                <Text style={[s.dispChipT, disponibilidade === d.key && { color: '#fff' }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 7. Formação Acadêmica ──────────────────────────────────────── */}
        <SectionTitle>Formação Acadêmica</SectionTitle>
        <View style={s.card}>
          {formacao.map((f, i) => (
            <View key={f.id} style={[s.entryRow, i > 0 && s.entryRowBorder]}>
              <View style={s.entryDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{f.curso}</Text>
                <Text style={s.entrySub}>{f.instituicao}{f.tipo ? ` · ${f.tipo}` : ''}</Text>
                {(f.ano_inicio || f.ano_conclusao) && (
                  <Text style={s.entryDate}>{f.ano_inicio || '?'} — {f.ano_conclusao || 'Em curso'}</Text>
                )}
              </View>
              <View style={s.entryActions}>
                <TouchableOpacity style={s.entryBtn} onPress={() => openEditFormacao(f)}>
                  <Text style={s.entryBtnT}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.entryBtn, s.entryBtnRed]} onPress={() => removeFormacao(f.id)}>
                  <Text style={[s.entryBtnT, { color: '#D4186A' }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={s.addBtn} onPress={openAddFormacao}>
            <Text style={s.addBtnT}>+ Adicionar formação</Text>
          </TouchableOpacity>
        </View>

        {/* ── 8. Experiência Profissional ────────────────────────────────── */}
        <SectionTitle>Experiência Profissional</SectionTitle>
        <View style={s.card}>
          {experiencia.map((e, i) => (
            <View key={e.id} style={[s.entryRow, i > 0 && s.entryRowBorder]}>
              <View style={[s.entryDot, { backgroundColor: '#1A6FD4' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{e.cargo}</Text>
                <Text style={s.entrySub}>{e.empresa}</Text>
                {(e.inicio || e.fim) && (
                  <Text style={s.entryDate}>{e.inicio || '?'} — {e.atual ? 'Atualmente' : (e.fim || '?')}</Text>
                )}
              </View>
              <View style={s.entryActions}>
                <TouchableOpacity style={s.entryBtn} onPress={() => openEditExp(e)}>
                  <Text style={s.entryBtnT}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.entryBtn, s.entryBtnRed]} onPress={() => removeExp(e.id)}>
                  <Text style={[s.entryBtnT, { color: '#D4186A' }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={s.addBtn} onPress={openAddExp}>
            <Text style={s.addBtnT}>+ Adicionar experiência</Text>
          </TouchableOpacity>
        </View>

        {/* ── 9. Especialidades ─────────────────────────────────────────── */}
        {espDisponiveis.length > 0 && (
          <>
            <SectionTitle>Especialidades</SectionTitle>
            <View style={s.card}>
              <View style={s.chipsWrap}>
                {espDisponiveis.map(esp => {
                  const on = especialidades.includes(esp)
                  return (
                    <TouchableOpacity key={esp} style={[s.chip, on && s.chipEspOn]}
                      onPress={() => setEspecialidades(prev => on ? prev.filter(e => e !== esp) : [...prev, esp])}>
                      <Text style={[s.chipT, on && s.chipTOn]}>{esp}</Text>
                      {on && <Text style={s.chipCheck}>✓</Text>}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </>
        )}

        {/* ── 10. Habilidades ───────────────────────────────────────────── */}
        {Object.keys(habCategorias).length > 0 && (
          <>
            <SectionTitle>Habilidades e Competências</SectionTitle>
            <View style={s.card}>
              {Object.entries(habCategorias).map(([cat, items]) => (
                <View key={cat} style={s.habSection}>
                  <Text style={s.habCat}>{cat}</Text>
                  <View style={s.chipsWrap}>
                    {items.map(hab => {
                      const on = habilidades.includes(hab)
                      return (
                        <TouchableOpacity key={hab} style={[s.chip, s.chipHab, on && s.chipHabOn]}
                          onPress={() => setHabilidades(prev => on ? prev.filter(h => h !== hab) : [...prev, hab])}>
                          <Text style={[s.chipT, on && s.chipTOn]}>{hab}</Text>
                          {on && <Text style={s.chipCheck}>✓</Text>}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── 11. Redes Sociais ─────────────────────────────────────────── */}
        <SectionTitle>Redes Sociais</SectionTitle>
        <View style={s.card}>
          <FieldLabel>Instagram</FieldLabel>
          <View style={s.socialRow}>
            <Text style={s.socialPrefix}>instagram.com/</Text>
            <TextInput style={[s.input, { flex: 1 }]} value={instagram} onChangeText={setInstagram}
              placeholder="seu_usuario" placeholderTextColor="#A0B8AC" autoCapitalize="none" />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── fixed save button ───────────────────────────────────────────── */}
      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={salvar} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnT}>Salvar alterações</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── IBGE modals ─────────────────────────────────────────────────── */}
      <IBGEModal visible={estadoModal} title="Selecionar Estado" data={estados}
        onSelect={(est: any) => { setEstado(est.sigla); setCidade(''); setCidades([]); setEstadoModal(false); loadCidades(est.sigla) }}
        onClose={() => setEstadoModal(false)} />
      <IBGEModal visible={cidadeModal} title="Selecionar Cidade" data={cidades}
        onSelect={(cid: any) => { setCidade(cid.nome); setCidadeModal(false) }}
        onClose={() => setCidadeModal(false)} loading={loadingCidades} />

      {/* ── formação modal ───────────────────────────────────────────────── */}
      <Modal visible={formacaoModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.sheet, { maxHeight: '90%' }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{editingFormacao ? 'Editar Formação' : 'Nova Formação'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <FieldLabel>Tipo</FieldLabel>
              <TouchableOpacity style={s.selector} onPress={() => setFTipoModal(true)}>
                <Text style={[s.selectorText, !fTipo && s.placeholder]}>{fTipo || 'Selecionar tipo'}</Text>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
              <FieldLabel>Instituição *</FieldLabel>
              <TextInput style={s.input} value={fInstituicao} onChangeText={setFInstituicao} placeholder="Nome da instituição" placeholderTextColor="#A0B8AC" />
              <FieldLabel>Curso / Área *</FieldLabel>
              <TextInput style={s.input} value={fCurso} onChangeText={setFCurso} placeholder="Ex: Odontologia" placeholderTextColor="#A0B8AC" />
              <View style={s.rowHalf}>
                <View style={{ flex: 1 }}>
                  <FieldLabel>Ano início</FieldLabel>
                  <TouchableOpacity style={s.selector} onPress={() => setFAnoInicioModal(true)}>
                    <Text style={[s.selectorText, !fAnoInicio && s.placeholder]}>{fAnoInicio || 'Ano'}</Text>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <FieldLabel>Ano conclusão</FieldLabel>
                  <TouchableOpacity style={s.selector} onPress={() => setFAnoConclusaoModal(true)}>
                    <Text style={[s.selectorText, !fAnoConclusao && s.placeholder]}>{fAnoConclusao || 'Ano'}</Text>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            <View style={s.modalActions}>
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

      {/* ── experiência modal ────────────────────────────────────────────── */}
      <Modal visible={expModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.sheet, { maxHeight: '90%' }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{editingExp ? 'Editar Experiência' : 'Nova Experiência'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <FieldLabel>Cargo *</FieldLabel>
              <TextInput style={s.input} value={eCargo} onChangeText={setECargo} placeholder="Ex: Cirurgião-Dentista" placeholderTextColor="#A0B8AC" />
              <FieldLabel>Empresa / Clínica *</FieldLabel>
              <TextInput style={s.input} value={eEmpresa} onChangeText={setEEmpresa} placeholder="Nome da empresa" placeholderTextColor="#A0B8AC" />
              <View style={s.rowHalf}>
                <View style={{ flex: 1 }}>
                  <FieldLabel>Início</FieldLabel>
                  <TouchableOpacity style={s.selector} onPress={() => setEInicioModal(true)}>
                    <Text style={[s.selectorText, !eInicio && s.placeholder]}>{eInicio || 'Ano'}</Text>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <FieldLabel>Fim</FieldLabel>
                  <TouchableOpacity style={[s.selector, eAtual && s.selectorDisabled]}
                    onPress={() => { if (!eAtual) setEFimModal(true) }} disabled={eAtual}>
                    <Text style={[s.selectorText, !eFim && s.placeholder]}>{eAtual ? 'Atualmente' : (eFim || 'Ano')}</Text>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>Trabalho aqui atualmente</Text>
                <Switch value={eAtual} onValueChange={v => { setEAtual(v); if (v) setEFim('') }}
                  trackColor={{ false: '#D0E8DA', true: '#00A880' }} thumbColor="#fff" />
              </View>
            </ScrollView>
            <View style={s.modalActions}>
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

      {/* ── picker modals ────────────────────────────────────────────────── */}
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
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  headerSide: { width: 70 },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  salvarText: { fontSize: 15, fontWeight: '800', color: '#F5C800', textAlign: 'right' },

  scroll: { paddingBottom: 20 },

  // avatar
  avatarSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#007A6E' },
  avatarWrap: { width: 96, height: 96, borderRadius: 48, position: 'relative' },
  avatarImg: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#00A880', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarInitial: { color: '#fff', fontSize: 36, fontWeight: '800' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5C800', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarHint: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 8, fontWeight: '600' },

  // section
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8, paddingHorizontal: 16 },

  // card
  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#D0E8DA', padding: 16, gap: 4 },

  // field
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#7A9E8E', marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 13, fontSize: 15, color: '#0A1C14' },
  inputMulti: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#A0B8AC', textAlign: 'right', marginTop: 2 },

  // selector
  selector: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  selectorDisabled: { opacity: 0.4 },
  selectorText: { fontSize: 15, color: '#0A1C14', flex: 1 },
  placeholder: { color: '#A0B8AC' },
  chevron: { fontSize: 20, color: '#7A9E8E', fontWeight: '700' },

  // toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#0A1C14' },
  toggleSub: { fontSize: 11, color: '#7A9E8E', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#EEF7F2', marginVertical: 4 },

  // chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dispChip: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 9 },
  dispChipT: { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  chip: { backgroundColor: '#EEF7F2', borderWidth: 2, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipEspOn: { backgroundColor: '#007A6E', borderColor: '#007A6E' },
  chipHab: { borderColor: '#BFD0E8', backgroundColor: '#F0F4FF' },
  chipHabOn: { backgroundColor: '#1A6FD4', borderColor: '#1A6FD4' },
  chipT: { fontSize: 12, fontWeight: '600', color: '#3A6550' },
  chipTOn: { color: '#fff' },
  chipCheck: { color: '#fff', fontSize: 10, fontWeight: '900' },

  // habilidades
  habSection: { marginBottom: 16 },
  habCat: { fontSize: 10, fontWeight: '800', color: '#1A6FD4', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  // entry list (formação / experiência)
  entryRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12 },
  entryRowBorder: { borderTopWidth: 1, borderTopColor: '#EEF7F2' },
  entryDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00A880', marginTop: 5, flexShrink: 0 },
  entryTitle: { fontSize: 14, fontWeight: '800', color: '#0A1C14', marginBottom: 2 },
  entrySub: { fontSize: 13, color: '#3A6550', marginBottom: 2 },
  entryDate: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  entryActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  entryBtn: { backgroundColor: '#EEF7F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  entryBtnRed: { backgroundColor: '#FFF0F5' },
  entryBtnT: { fontSize: 11, fontWeight: '700', color: '#007A6E' },
  addBtn: { marginTop: 8, borderWidth: 1.5, borderColor: '#00A880', borderStyle: 'dashed', borderRadius: 12, padding: 12, alignItems: 'center' },
  addBtnT: { fontSize: 14, fontWeight: '700', color: '#00A880' },

  // social
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  socialPrefix: { fontSize: 14, color: '#7A9E8E', fontWeight: '600', backgroundColor: '#EEF7F2', borderWidth: 1.5, borderRightWidth: 0, borderColor: '#D0E8DA', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 10, paddingVertical: 13 },

  // footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA', padding: 16 },
  saveBtn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnT: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '82%' },
  handle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0A1C14', marginBottom: 14 },
  searchInput: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 12, fontSize: 15, color: '#0A1C14', marginBottom: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' },
  listItemT: { fontSize: 15, color: '#0A1C14', fontWeight: '600' },
  listItemSub: { fontSize: 12, color: '#7A9E8E', fontWeight: '700' },
  closeBtn: { backgroundColor: '#EEF7F2', borderRadius: 12, padding: 14, alignItems: 'center', marginVertical: 14 },
  closeBtnT: { fontSize: 14, fontWeight: '800', color: '#3A6550' },
  rowHalf: { flexDirection: 'row', gap: 0 },
  modalActions: { flexDirection: 'row', gap: 12, paddingTop: 16, paddingBottom: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#EEF7F2', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnT: { fontSize: 14, fontWeight: '800', color: '#3A6550' },
  confirmBtn: { flex: 1, backgroundColor: '#007A6E', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmBtnT: { fontSize: 14, fontWeight: '800', color: '#fff' },
})
