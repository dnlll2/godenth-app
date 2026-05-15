import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Platform, ScrollView, Modal,
} from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

// ── dados espelhados do cadastro ──────────────────────────────────────────────

const PROFISSOES: Record<string, { key: string; label: string }[]> = {
  clinico: [
    { key: 'cirurgiao_dentista', label: 'Cirurgião-Dentista' },
    { key: 'ortodontista', label: 'Ortodontista' },
    { key: 'implantodontista', label: 'Implantodontista' },
    { key: 'endodontista', label: 'Endodontista' },
    { key: 'periodontista', label: 'Periodontista' },
    { key: 'pediatra', label: 'Odontopediatra' },
    { key: 'cirurgiao_bmf', label: 'Cirurgião Bucomaxilofacial' },
    { key: 'protetico', label: 'Técnico em Prótese Dentária' },
  ],
  tecnico: [
    { key: 'tsb', label: 'Técnico em Saúde Bucal (TSB)' },
    { key: 'asb', label: 'Auxiliar em Saúde Bucal (ASB)' },
    { key: 'aux_protese', label: 'Auxiliar de Prótese Dentária' },
  ],
  comercial: [
    { key: 'gerente_comercial', label: 'Gerente Comercial' },
    { key: 'representante', label: 'Representante Comercial' },
    { key: 'recepcionista', label: 'Recepcionista / Secretária' },
    { key: 'crc', label: 'CRC / Call Center' },
    { key: 'consultor_vendas', label: 'Consultor de Vendas' },
  ],
  administrativo: [
    { key: 'gerente_adm', label: 'Gerente Administrativo' },
    { key: 'aux_adm', label: 'Auxiliar Administrativo' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'rh', label: 'RH / Recursos Humanos' },
    { key: 'contabilidade', label: 'Contabilidade' },
  ],
  marketing: [
    { key: 'marketing_digital', label: 'Marketing Digital' },
    { key: 'designer', label: 'Designer Gráfico / UI' },
    { key: 'filmmaker', label: 'Filmmaker / Videomaker' },
    { key: 'fotografo', label: 'Fotógrafo' },
    { key: 'social_media', label: 'Social Media' },
    { key: 'trafego', label: 'Gestor de Tráfego' },
  ],
  formacao: [
    { key: 'est_odonto', label: 'Estudante de Odontologia' },
    { key: 'est_protese', label: 'Estudante de Prótese Dentária' },
    { key: 'est_adm', label: 'Estudante de Administração' },
    { key: 'est_marketing', label: 'Estudante de Marketing' },
  ],
}

const CATEGORIAS: Record<string, { label: string; cor: string }> = {
  clinico:        { label: 'Clínico e Profissional Técnico', cor: '#00A880' },
  tecnico:        { label: 'Técnicos e Auxiliares',          cor: '#1A6FD4' },
  comercial:      { label: 'Comercial',                       cor: '#C49800' },
  administrativo: { label: 'Administrativo',                  cor: '#7B3FC4' },
  marketing:      { label: 'Marketing e Criação',             cor: '#D4186A' },
  formacao:       { label: 'Formação',                        cor: '#0891B2' },
}

const ESPECIALIDADES: Record<string, string[]> = {
  'Cirurgião-Dentista':           ['Estética (Facetas e Lentes)','Odontopediatria','Implantodontia','Ortodontia','Endodontia','Harmonização Orofacial (HOF)'],
  'Ortodontista':                 ['Ortodontia Fixa','Alinhadores Invisíveis','Contenção','Expansão Palatina'],
  'Implantodontista':             ['Implantes Unitários','Carga Imediata','Enxerto Ósseo','All-on-4 / All-on-6'],
  'Endodontista':                 ['Endodontia Mecanizada','Retratamento','Cirurgia Parendodôntica'],
  'Periodontista':                ['Raspagem e Alisamento','Cirurgia Periodontal','Regeneração Óssea'],
  'Odontopediatra':               ['Atendimento Infantil','Selantes','Ortodontia Preventiva'],
  'Cirurgião Bucomaxilofacial':   ['Cirurgia de Dentes do Siso','Implantes','Cirurgia Ortognática','Trauma Facial'],
  'Técnico em Prótese Dentária':  ['Gesso (Modelos e Troquéis)','Ceramista (Estratificação)','Cadista (Desenho Digital)','Resinas (Prótese Total/Parcial)','Metalurgia'],
  'Técnico em Saúde Bucal (TSB)': ['Auxílio em Cirurgia','Prevenção e Profilaxia','Radiologia'],
  'Auxiliar em Saúde Bucal (ASB)':['Auxílio em Cirurgia','Instrumentação','Organização de Consultório'],
  'Auxiliar de Prótese Dentária': ['Gesso','Acabamento e Polimento','Auxiliar de Cadista'],
  'Gerente Comercial':            ['Gestão de Equipe','Metas e KPIs','Negociação','Prospecção'],
  'Representante Comercial':      ['Prospecção','Negociação','Pós-venda','Demonstração de Produtos'],
  'Recepcionista / Secretária':   ['Agendamento','Atendimento ao Paciente','CRM','Faturamento'],
  'CRC / Call Center':            ['Atendimento','Retenção de Clientes','Scripts de Vendas'],
  'Consultor de Vendas':          ['Prospecção','Negociação','CRM','Fechamento de Contratos'],
  'Gerente Administrativo':       ['Gestão de Equipe','Processos','Indicadores','Planejamento'],
  'Auxiliar Administrativo':      ['Organização','Arquivo','Atendimento','Rotinas Administrativas'],
  'Financeiro':                   ['Contas a Pagar/Receber','Fluxo de Caixa','Conciliação','DRE'],
  'RH / Recursos Humanos':        ['Recrutamento','Treinamento','Folha de Pagamento','Gestão de Pessoas'],
  'Contabilidade':                ['Lançamentos','Obrigações Fiscais','Relatórios Contábeis'],
  'Marketing Digital':            ['Redes Sociais','Tráfego Pago','SEO','E-mail Marketing','Branding'],
  'Designer Gráfico / UI':        ['Identidade Visual','UI/UX','Motion Graphics','Edição de Imagens'],
  'Filmmaker / Videomaker':       ['Captação','Edição de Vídeo','Motion','Color Grading'],
  'Fotógrafo':                    ['Fotografia Clínica','Ensaios','Edição','Lightroom/Photoshop'],
  'Social Media':                 ['Criação de Conteúdo','Gestão de Perfis','Engajamento','Stories/Reels'],
  'Gestor de Tráfego':            ['Google Ads','Meta Ads','Analytics','Funil de Vendas'],
  'Estudante de Odontologia':     ['Anatomia','Bioquímica','Clínica Integrada'],
  'Estudante de Prótese Dentária':['Gesso','Resinas','Anatomia Dental'],
  'Estudante de Administração':   ['Gestão','Finanças','Marketing','RH'],
  'Estudante de Marketing':       ['Marketing Digital','Publicidade','Pesquisa de Mercado'],
}

const HABILIDADES: Record<string, Record<string, string[]>> = {
  'Cirurgião-Dentista': {
    'Operacional': ['Gestão de Agenda','Scanner 3D Intraoral','Moldagem (Alginato/Silicone)','Avaliação e Diagnóstico','Planejamento de Casos','Fotografia Clínica'],
    'Gestão':      ['Gerência Clínica','Liderança de Equipe','Reuniões de Alinhamento','Controle de Estoque','Auditoria de Prontuários'],
    'Vendas':      ['Conversão de Orçamentos','Explicação de Planos de Tratamento','Pós-atendimento (Fidelização)'],
  },
  'Técnico em Prótese Dentária': {
    'Prática':       ['Vazamento e Troquelagem de Gesso','Montagem em Articulador','Enceramento Diagnóstico','Estratificação de Cerâmica','Maquiagem e Glaze'],
    'Digital':       ['Desenho em Exocad (CAD)','Operação de Fresadoras (CAM)','Calibração de Impressora 3D','Sinterização de Zircônia'],
    'Relacionamento':['Discussão de Casos com Dentistas','Logística de Entrega','Conferência de O.S'],
  },
  'Técnico em Saúde Bucal (TSB)': {
    'Clínico':  ['Instrumentação Cirúrgica','Manipulação de Materiais','Esterilização (Autoclave)','Organização de Bancada','Auxílio em Quatro Mãos'],
    'Paciente': ['Acolhimento','Triagem Inicial','Instrução de Higiene Bucal','Suporte em Emergências'],
    'Suporte':  ['Limpeza e Desinfecção','Reposição de Descartáveis'],
  },
  'Auxiliar em Saúde Bucal (ASB)': {
    'Clínico':  ['Instrumentação Cirúrgica','Manipulação de Materiais','Esterilização (Autoclave)','Organização de Bancada','Auxílio em Quatro Mãos'],
    'Paciente': ['Acolhimento','Triagem Inicial','Instrução de Higiene Bucal','Suporte em Emergências'],
    'Suporte':  ['Limpeza e Desinfecção','Reposição de Descartáveis'],
  },
  'Auxiliar de Prótese Dentária': {
    'Clínico': ['Instrumentação Cirúrgica','Manipulação de Materiais','Esterilização (Autoclave)','Organização de Bancada'],
    'Suporte': ['Limpeza e Desinfecção','Reposição de Descartáveis'],
  },
  'Gerente Comercial': {
    'Estratégico': ['Análise de Metas','Relatórios de Vendas','Participação em Congressos/Eventos'],
    'Interno':     ['Atendimento via WhatsApp','Negociação de Prazos e Descontos','Recuperação de Clientes Inativos'],
  },
  'Representante Comercial': {
    'Externo':     ['Visitação a Clínicas','Prospecção de Novos Clientes','Demonstração de Equipamentos (Hand-on)'],
    'Interno':     ['Atendimento via WhatsApp','Negociação de Prazos e Descontos','Recuperação de Clientes Inativos'],
    'Estratégico': ['Análise de Metas','Relatórios de Vendas','Participação em Congressos/Eventos'],
  },
  'Consultor de Vendas': {
    'Externo':  ['Visitação a Clínicas','Prospecção de Novos Clientes','Demonstração de Equipamentos'],
    'Interno':  ['Atendimento via WhatsApp','Negociação','Recuperação de Clientes Inativos'],
  },
  'Recepcionista / Secretária': {
    'Front':      ['Recepção de Pacientes','Confirmação de Consultas','Atendimento Telefônico','Gestão de Conflitos na Espera'],
    'Financeiro': ['Emissão de Notas Fiscais','Cobrança de Inadimplentes','Fechamento de Caixa','Faturamento de Convênios'],
    'Processos':  ['Cadastro de Pacientes','Organização de Arquivos','Check-list de Manutenção'],
  },
  'Gerente Administrativo': {
    'Front':      ['Recepção de Pacientes','Confirmação de Consultas','Gestão de Conflitos'],
    'Financeiro': ['Emissão de Notas Fiscais','Cobrança de Inadimplentes','Fechamento de Caixa','Faturamento de Convênios'],
    'Processos':  ['Cadastro de Pacientes','Organização de Arquivos','Check-list de Manutenção'],
  },
  'Marketing Digital': {
    'Digital':  ['Gestão de Redes Sociais','Criação de Conteúdo (Posts/Stories)','Resposta a Comentários/Directs'],
    'Produção': ['Edição de Vídeos','Fotografia de Portfólio','Gestão de Tráfego Pago'],
  },
  'Designer Gráfico / UI': {
    'Digital':  ['Gestão de Redes Sociais','Criação de Conteúdo'],
    'Produção': ['Edição de Vídeos','Fotografia de Portfólio'],
  },
  'Filmmaker / Videomaker':  { 'Produção': ['Edição de Vídeos de Antes e Depois','Fotografia de Portfólio','Gestão de Tráfego Pago'] },
  'Social Media':            { 'Digital':  ['Gestão de Redes Sociais','Criação de Conteúdo (Posts/Stories)','Resposta a Comentários/Directs'] },
  'Gestor de Tráfego':       { 'Produção': ['Gestão de Tráfego Pago (Google/Meta)','Análise de Métricas','Criação de Campanhas'] },
  'Estudante de Odontologia': {
    'Acadêmico': ['Auxílio em Pesquisas','Organização de Eventos','Monitoria de Disciplinas'],
    'Prático':   ['Estágio Observacional','Instrumentação em Clínicas','Organização de Materiais'],
  },
  'Estudante de Prótese Dentária': {
    'Acadêmico': ['Auxílio em Pesquisas','Organização de Eventos'],
    'Prático':   ['Estágio Observacional','Organização de Materiais'],
  },
}

// opções de formação por profissão (espelha FORMACAO_POR_PROFISSAO do cadastro)
const FORMACAO_OPCOES: Record<string, string[]> = {
  'Cirurgião-Dentista':           ['Graduação em Odontologia','Implantodontia','Ortodontia','Endodontia','Periodontia','Odontopediatria','Estética','Cirurgia Oral','Prótese','HOF','Odontogeriatria'],
  'Ortodontista':                 ['Graduação em Odontologia','Ortodontia','Alinhadores Invisíveis'],
  'Implantodontista':             ['Graduação em Odontologia','Implantodontia','Enxerto Ósseo','All-on-4 / All-on-6'],
  'Endodontista':                 ['Graduação em Odontologia','Endodontia'],
  'Periodontista':                ['Graduação em Odontologia','Periodontia'],
  'Odontopediatra':               ['Graduação em Odontologia','Odontopediatria'],
  'Cirurgião Bucomaxilofacial':   ['Graduação em Odontologia','Cirurgia Oral','Cirurgia Ortognática'],
  'Técnico em Prótese Dentária':  ['Técnico em Prótese Dentária','CAD/CAM','Cerâmica','Zircônia','Impressão 3D','Overdenture'],
  'Técnico em Saúde Bucal (TSB)': ['Técnico em Saúde Bucal','Radiologia','Biossegurança','Atendimento ao Paciente'],
  'Auxiliar em Saúde Bucal (ASB)':['Auxiliar em Saúde Bucal','Biossegurança','Atendimento ao Paciente','Primeiros Socorros'],
  'Auxiliar de Prótese Dentária': ['Auxiliar de Prótese Dentária','Gesso','Acabamento','CAD/CAM Básico'],
  'Gerente Comercial':            ['Graduação em Administração','MBA em Vendas','MBA em Gestão','Liderança e Coaching'],
  'Representante Comercial':      ['Graduação em Administração','MBA em Vendas','Gestão Comercial'],
  'Recepcionista / Secretária':   ['Secretariado / Administração','Atendimento ao Cliente','CRM','Faturamento de Convênios'],
  'CRC / Call Center':            ['Curso de Atendimento ao Cliente','Scripts de Vendas','Retenção'],
  'Consultor de Vendas':          ['Graduação em Administração','MBA em Vendas','Gestão Comercial'],
  'Gerente Administrativo':       ['Graduação em Administração','MBA em Gestão','MBA em Saúde','Liderança'],
  'Auxiliar Administrativo':      ['Técnico em Administração','Excel Avançado','Rotinas Administrativas'],
  'Financeiro':                   ['Graduação em Ciências Contábeis','MBA em Finanças','Controladoria'],
  'RH / Recursos Humanos':        ['Graduação em RH / Psicologia','MBA em Gestão de Pessoas','Coaching'],
  'Contabilidade':                ['Graduação em Ciências Contábeis','MBA em Controladoria','Auditoria'],
  'Marketing Digital':            ['Graduação em Marketing','MBA em Marketing Digital','Growth Hacking'],
  'Designer Gráfico / UI':        ['Graduação em Design','UI/UX','Motion Graphics'],
  'Filmmaker / Videomaker':       ['Curso de Videomaking / Cinema','Color Grading','Motion','Drone'],
  'Fotógrafo':                    ['Curso de Fotografia','Fotografia Clínica','Lightroom','Photoshop'],
  'Social Media':                 ['Curso de Social Media / Marketing','Copywriting','Reels','Engajamento'],
  'Gestor de Tráfego':            ['Curso de Tráfego Pago','Google Ads','Meta Ads','Analytics'],
  'Estudante de Odontologia':     ['Graduação em Odontologia (em curso)'],
  'Estudante de Prótese Dentária':['Técnico em Prótese Dentária (em curso)'],
  'Estudante de Administração':   ['Graduação em Administração (em curso)'],
  'Estudante de Marketing':       ['Graduação em Marketing (em curso)'],
}

const DISPONIBILIDADES = [
  { key: '', label: 'Todos' },
  { key: 'disponivel', label: 'Disponível', cor: '#00A880' },
  { key: 'contratado', label: 'Contratado', cor: '#1A6FD4' },
  { key: 'freelancer', label: 'Freelancer', cor: '#C49800' },
  { key: 'parceria', label: 'Parcerias', cor: '#7B3FC4' },
  { key: 'explorando', label: 'Explorando', cor: '#7A9E8E' },
]

const DISP_COR: Record<string, string> = {
  disponivel: '#00A880', contratado: '#1A6FD4', freelancer: '#C49800',
  parceria: '#7B3FC4', explorando: '#7A9E8E',
}

// ── IBGEModal ─────────────────────────────────────────────────────────────────

function IBGEModal({ visible, title, data, onSelect, onClose, loading = false }: {
  visible: boolean; title: string; data: any[]; onSelect: (item: any) => void;
  onClose: () => void; loading?: boolean
}) {
  const [busca, setBusca] = useState('')
  const filtered = data.filter(d =>
    (d.nome || d.sigla || '').toLowerCase().includes(busca.toLowerCase())
  )
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.ibgeSheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          <TextInput style={s.sheetSearch} value={busca} onChangeText={setBusca}
            placeholder="Buscar..." placeholderTextColor="#A0B8AC" autoFocus />
          {loading
            ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
            : (
              <FlatList data={filtered} keyExtractor={item => String(item.id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.listItem} onPress={() => { setBusca(''); onSelect(item) }}>
                    <Text style={s.listItemT}>{item.nome}</Text>
                    {item.sigla ? <Text style={s.listItemSub}>{item.sigla}</Text> : null}
                  </TouchableOpacity>
                )} />
            )
          }
          <TouchableOpacity style={s.sheetClose} onPress={() => { setBusca(''); onClose() }}>
            <Text style={s.sheetCloseT}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── FilterModal ───────────────────────────────────────────────────────────────

type FilterState = {
  tipo: string; especialidade: string; habilidade: string; disponibilidade: string
  estadoSigla: string; estadoNome: string; cidade: string
  formacao: string; anos_min: string; anos_max: string
}

function FilterModal({ visible, initial, onApply, onClose }: {
  visible: boolean
  initial: FilterState
  onApply: (f: FilterState) => void
  onClose: () => void
}) {
  const [tipo, setTipo] = useState(initial.tipo)
  const [especialidade, setEspecialidade] = useState(initial.especialidade)
  const [habilidade, setHabilidade] = useState(initial.habilidade)
  const [disponibilidade, setDisponibilidade] = useState(initial.disponibilidade)
  const [estadoSigla, setEstadoSigla] = useState(initial.estadoSigla)
  const [estadoNome, setEstadoNome] = useState(initial.estadoNome)
  const [cidade, setCidade] = useState(initial.cidade)
  const [formacao, setFormacao] = useState(initial.formacao)
  const [anos_min, setAnosMin] = useState(initial.anos_min)
  const [anos_max, setAnosMax] = useState(initial.anos_max)

  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [estadoModal, setEstadoModal] = useState(false)
  const [cidadeModal, setCidadeModal] = useState(false)
  const [loadingCidades, setLoadingCidades] = useState(false)

  useEffect(() => {
    if (visible) {
      setTipo(initial.tipo); setEspecialidade(initial.especialidade)
      setHabilidade(initial.habilidade); setDisponibilidade(initial.disponibilidade)
      setEstadoSigla(initial.estadoSigla); setEstadoNome(initial.estadoNome); setCidade(initial.cidade)
      setFormacao(initial.formacao); setAnosMin(initial.anos_min); setAnosMax(initial.anos_max)
    }
  }, [visible])

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(r => r.json()).then(setEstados).catch(() => null)
  }, [])

  const loadCidades = async (sigla: string) => {
    setLoadingCidades(true)
    try {
      const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`)
      setCidades(await r.json())
    } catch { } finally { setLoadingCidades(false) }
  }

  const selectEstado = (est: any) => {
    setEstadoSigla(est.sigla); setEstadoNome(est.nome)
    setCidade(''); setCidades([]); setEstadoModal(false); loadCidades(est.sigla)
  }

  const clearEstado = () => { setEstadoSigla(''); setEstadoNome(''); setCidade(''); setCidades([]) }

  const selectTipo = (label: string) => {
    setTipo(label); setEspecialidade(''); setHabilidade(''); setFormacao('')
  }

  const espOptions = tipo ? (ESPECIALIDADES[tipo] || []) : []
  const habCats = tipo ? (HABILIDADES[tipo] || {}) : {}
  const formacaoOptions = tipo ? (FORMACAO_OPCOES[tipo] || []) : []
  const tipoColor = Object.values(CATEGORIAS).find(c =>
    Object.values(PROFISSOES).flat().some(p => p.label === tipo)
  )?.cor || Colors.primary

  const activeCount = [tipo, especialidade, habilidade, disponibilidade, estadoSigla, cidade, formacao, anos_min, anos_max].filter(Boolean).length

  const apply = () => onApply({ tipo, especialidade, habilidade, disponibilidade, estadoSigla, estadoNome, cidade, formacao, anos_min, anos_max })

  const clearAll = () => {
    setTipo(''); setEspecialidade(''); setHabilidade(''); setDisponibilidade('')
    setFormacao(''); setAnosMin(''); setAnosMax('')
    clearEstado()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.filterModalRoot}>
        {/* Header */}
        <View style={s.filterModalHeader}>
          <TouchableOpacity onPress={onClose} style={s.filterModalBack}>
            <Text style={s.filterModalBackT}>✕</Text>
          </TouchableOpacity>
          <Text style={s.filterModalTitle}>Filtros</Text>
          {activeCount > 0
            ? <TouchableOpacity onPress={clearAll}><Text style={s.filterModalClear}>Limpar</Text></TouchableOpacity>
            : <View style={{ width: 60 }} />
          }
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.filterModalScroll} keyboardShouldPersistTaps="handled">

          {/* Disponibilidade */}
          <Text style={s.secLabel}>Disponibilidade</Text>
          <View style={s.chipsRow}>
            {DISPONIBILIDADES.map(d => {
              const on = disponibilidade === d.key
              const cor = d.cor || Colors.text3
              return (
                <TouchableOpacity key={d.key}
                  style={[s.chip, on && { borderColor: cor, backgroundColor: cor + '18' }]}
                  onPress={() => setDisponibilidade(d.key)}>
                  <Text style={[s.chipT, on && { color: cor }]}>{d.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Localização */}
          <Text style={s.secLabel}>Localização</Text>
          <View style={s.selectorRow}>
            <TouchableOpacity style={[s.selector, { flex: 1 }]} onPress={() => setEstadoModal(true)}>
              <Text style={[s.selectorText, !estadoSigla && s.ph]} numberOfLines={1}>
                {estadoNome || 'Selecionar estado'}
              </Text>
              <Text style={s.selectorChevron}>›</Text>
            </TouchableOpacity>
            {estadoSigla ? <TouchableOpacity style={s.clearX} onPress={clearEstado}><Text style={s.clearXT}>×</Text></TouchableOpacity> : null}
          </View>
          <View style={[s.selectorRow, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[s.selector, { flex: 1 }, !estadoSigla && s.selectorDisabled]}
              onPress={() => estadoSigla && setCidadeModal(true)} disabled={!estadoSigla}>
              <Text style={[s.selectorText, !cidade && s.ph]} numberOfLines={1}>
                {cidade || (estadoSigla ? 'Selecionar município' : 'Selecione o estado primeiro')}
              </Text>
              {loadingCidades
                ? <ActivityIndicator size="small" color={Colors.text3} />
                : <Text style={s.selectorChevron}>›</Text>}
            </TouchableOpacity>
            {cidade ? <TouchableOpacity style={s.clearX} onPress={() => setCidade('')}><Text style={s.clearXT}>×</Text></TouchableOpacity> : null}
          </View>

          {/* Profissão */}
          <Text style={s.secLabel}>Profissão</Text>
          {Object.entries(CATEGORIAS).map(([catKey, cat]) => (
            <View key={catKey} style={s.catSection}>
              <View style={[s.catHeader, { borderLeftColor: cat.cor }]}>
                <Text style={[s.catHeaderT, { color: cat.cor }]}>{cat.label}</Text>
              </View>
              <View style={s.chipsRow}>
                {PROFISSOES[catKey].map(p => {
                  const on = tipo === p.label
                  return (
                    <TouchableOpacity key={p.key}
                      style={[s.chip, on && { borderColor: cat.cor, backgroundColor: cat.cor + '18' }]}
                      onPress={() => selectTipo(on ? '' : p.label)}>
                      <Text style={[s.chipT, on && { color: cat.cor, fontWeight: '800' }]}>
                        {on ? '✓ ' : ''}{p.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}

          {/* Especialidade */}
          {espOptions.length > 0 && (
            <>
              <Text style={s.secLabel}>Especialidade</Text>
              <Text style={s.secHint}>Selecione uma (opcional)</Text>
              <View style={s.chipsRow}>
                {espOptions.map(esp => {
                  const on = especialidade === esp
                  return (
                    <TouchableOpacity key={esp}
                      style={[s.chip, on && { borderColor: tipoColor, backgroundColor: tipoColor + '18' }]}
                      onPress={() => setEspecialidade(on ? '' : esp)}>
                      <Text style={[s.chipT, on && { color: tipoColor, fontWeight: '800' }]}>
                        {on ? '✓ ' : ''}{esp}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          )}

          {/* Habilidade */}
          {Object.keys(habCats).length > 0 && (
            <>
              <Text style={s.secLabel}>Habilidade</Text>
              <Text style={s.secHint}>Selecione uma (opcional)</Text>
              {Object.entries(habCats).map(([cat, items]) => (
                <View key={cat} style={s.habSection}>
                  <View style={s.habCatRow}>
                    <View style={[s.habDot, { backgroundColor: tipoColor }]} />
                    <Text style={[s.habCatT, { color: tipoColor }]}>{cat.toUpperCase()}</Text>
                  </View>
                  <View style={s.chipsRow}>
                    {items.map((hab: string) => {
                      const on = habilidade === hab
                      return (
                        <TouchableOpacity key={hab}
                          style={[s.chip, s.chipHab, on && { borderColor: tipoColor, backgroundColor: tipoColor + '18' }]}
                          onPress={() => setHabilidade(on ? '' : hab)}>
                          <Text style={[s.chipT, on && { color: tipoColor, fontWeight: '800' }]}>
                            {on ? '✓ ' : ''}{hab}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Formação Acadêmica — só aparece quando há tipo selecionado */}
          {formacaoOptions.length > 0 && (
            <>
              <Text style={s.secLabel}>Formação Acadêmica</Text>
              <Text style={s.secHint}>Selecione uma (opcional)</Text>
              <View style={s.chipsRow}>
                {formacaoOptions.map(f => {
                  const on = formacao === f
                  return (
                    <TouchableOpacity key={f}
                      style={[s.chip, on && { borderColor: tipoColor, backgroundColor: tipoColor + '18' }]}
                      onPress={() => setFormacao(on ? '' : f)}>
                      <Text style={[s.chipT, on && { color: tipoColor, fontWeight: '800' }]}>
                        {on ? '✓ ' : ''}{f}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          )}

          {tipo && espOptions.length === 0 && Object.keys(habCats).length === 0 && formacaoOptions.length === 0 && (
            <View style={s.emptyHint}>
              <Text style={s.emptyHintT}>Nenhum dado adicional para este cargo</Text>
            </View>
          )}

          {/* Anos de Experiência */}
          <Text style={s.secLabel}>Anos de Experiência</Text>
          <View style={s.anosRow}>
            <View style={s.anosField}>
              <Text style={s.anosLabel}>Mínimo</Text>
              <TextInput
                style={s.anosInput}
                value={anos_min}
                onChangeText={v => setAnosMin(v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={Colors.text3}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={s.anosSep}>
              <Text style={s.anosSepT}>—</Text>
            </View>
            <View style={s.anosField}>
              <Text style={s.anosLabel}>Máximo</Text>
              <TextInput
                style={s.anosInput}
                value={anos_max}
                onChangeText={v => setAnosMax(v.replace(/[^0-9]/g, ''))}
                placeholder="∞"
                placeholderTextColor={Colors.text3}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Footer */}
        <View style={s.filterModalFooter}>
          <TouchableOpacity style={s.applyBtn} onPress={apply}>
            <Text style={s.applyBtnT}>
              {activeCount > 0 ? `Buscar com ${activeCount} filtro${activeCount > 1 ? 's' : ''}` : 'Buscar'}
            </Text>
          </TouchableOpacity>
        </View>

        <IBGEModal visible={estadoModal} title="Selecionar Estado" data={estados}
          onSelect={selectEstado} onClose={() => setEstadoModal(false)} />
        <IBGEModal visible={cidadeModal} title="Selecionar Município" data={cidades}
          onSelect={(c: any) => { setCidade(c.nome); setCidadeModal(false) }}
          onClose={() => setCidadeModal(false)} loading={loadingCidades} />
      </View>
    </Modal>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

const EMPTY_FILTERS: FilterState = {
  tipo: '', especialidade: '', habilidade: '', disponibilidade: '',
  estadoSigla: '', estadoNome: '', cidade: '',
  formacao: '', anos_min: '', anos_max: '',
}

export default function Buscar() {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [filterModal, setFilterModal] = useState(false)

  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searched, setSearched] = useState(false)

  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== 'estadoNome').length

  const buildParams = (f: FilterState, p = 1) => {
    const params: Record<string, any> = { page: p, limit: 20 }
    if (q.trim()) params.q = q.trim()
    if (f.tipo) params.tipo = f.tipo
    if (f.cidade) params.cidade = f.cidade
    if (f.estadoSigla) params.estado = f.estadoSigla
    if (f.especialidade) params.especialidade = f.especialidade
    if (f.habilidade) params.habilidade = f.habilidade
    if (f.disponibilidade) params.disponibilidade = f.disponibilidade
    if (f.formacao) params.formacao = f.formacao
    if (f.anos_min) params.anos_min = f.anos_min
    if (f.anos_max) params.anos_max = f.anos_max
    return params
  }

  const search = async (overrideFilters?: FilterState) => {
    const f = overrideFilters ?? filters
    setLoading(true); setSearched(true); setPage(1)
    try {
      const res = await api.get('/users/search', { params: buildParams(f, 1) })
      setUsers(res.data.users || [])
      setHasMore(res.data.has_more || false)
    } catch (err) { console.log(err) }
    finally { setLoading(false) }
  }

  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    const next = page + 1
    try {
      const res = await api.get('/users/search', { params: buildParams(filters, next) })
      setUsers(prev => [...prev, ...(res.data.users || [])])
      setPage(next); setHasMore(res.data.has_more || false)
    } catch (err) { console.log(err) }
    finally { setLoadingMore(false) }
  }

  const applyFilters = (f: FilterState) => {
    setFilters(f); setFilterModal(false); search(f)
  }

  const anosLabel = (f: FilterState) => {
    if (f.anos_min && f.anos_max) return `${f.anos_min}–${f.anos_max} anos`
    if (f.anos_min) return `${f.anos_min}+ anos`
    if (f.anos_max) return `até ${f.anos_max} anos`
    return ''
  }

  const renderUser = ({ item }: any) => {
    const dispCor = item.disponibilidade ? DISP_COR[item.disponibilidade] : null
    return (
      <TouchableOpacity style={s.card} onPress={() => router.push(`/usuario/${item.id}` as any)} activeOpacity={0.8}>
        <View style={[s.av, { backgroundColor: Colors.primary }]}>
          <Text style={s.avT}>{item.nome?.charAt(0) || '?'}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.nome} numberOfLines={1}>{item.nome}</Text>
            {item.plano === 'premium' && <View style={s.planoBadge}><Text style={s.planoBadgeT}>PRO</Text></View>}
            {item.plano === 'black' && <View style={[s.planoBadge, { backgroundColor: Colors.gold + '22', borderColor: Colors.gold + '60' }]}><Text style={[s.planoBadgeT, { color: Colors.gold }]}>Admin</Text></View>}
          </View>
          <Text style={s.tipo} numberOfLines={1}>{item.tipo_profissional}</Text>
          {item.especialidade ? <Text style={s.esp} numberOfLines={1}>{item.especialidade}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {item.cidade ? <Text style={s.loc}>📍 {item.cidade}{item.estado ? ` · ${item.estado}` : ''}</Text> : null}
            {dispCor ? (
              <View style={[s.dispBadge, { backgroundColor: dispCor + '18', borderColor: dispCor + '50' }]}>
                <View style={[s.dispDot, { backgroundColor: dispCor }]} />
                <Text style={[s.dispBadgeT, { color: dispCor }]}>
                  {DISPONIBILIDADES.find(d => d.key === item.disponibilidade)?.label || item.disponibilidade}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={s.chevron}>›</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Buscar Profissionais</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Nome, especialidade, habilidade..."
            placeholderTextColor={Colors.text3}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => search()}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: Colors.text3, fontSize: 18, paddingHorizontal: 4 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[s.filterBtn, activeCount > 0 && s.filterBtnOn]} onPress={() => setFilterModal(true)}>
          <Text style={{ fontSize: 16 }}>⚙️</Text>
          {activeCount > 0 && (
            <View style={s.filterCount}>
              <Text style={s.filterCountT}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={s.searchBtn} onPress={() => search()}>
          <Text style={s.searchBtnT}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros ativos como tags */}
      {activeCount > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.activeFiltersBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 14, paddingVertical: 8 }}>
          {filters.tipo ? (
            <TouchableOpacity style={s.activeTag} onPress={() => applyFilters({ ...filters, tipo: '', especialidade: '', habilidade: '', formacao: '' })}>
              <Text style={s.activeTagT}>{filters.tipo} ×</Text>
            </TouchableOpacity>
          ) : null}
          {filters.especialidade ? (
            <TouchableOpacity style={s.activeTag} onPress={() => applyFilters({ ...filters, especialidade: '' })}>
              <Text style={s.activeTagT}>{filters.especialidade} ×</Text>
            </TouchableOpacity>
          ) : null}
          {filters.habilidade ? (
            <TouchableOpacity style={s.activeTag} onPress={() => applyFilters({ ...filters, habilidade: '' })}>
              <Text style={s.activeTagT}>{filters.habilidade} ×</Text>
            </TouchableOpacity>
          ) : null}
          {filters.formacao ? (
            <TouchableOpacity style={s.activeTag} onPress={() => applyFilters({ ...filters, formacao: '' })}>
              <Text style={s.activeTagT}>{filters.formacao} ×</Text>
            </TouchableOpacity>
          ) : null}
          {filters.disponibilidade ? (
            <TouchableOpacity style={s.activeTag} onPress={() => applyFilters({ ...filters, disponibilidade: '' })}>
              <Text style={s.activeTagT}>{DISPONIBILIDADES.find(d => d.key === filters.disponibilidade)?.label} ×</Text>
            </TouchableOpacity>
          ) : null}
          {filters.estadoNome ? (
            <TouchableOpacity style={s.activeTag} onPress={() => applyFilters({ ...filters, estadoSigla: '', estadoNome: '', cidade: '' })}>
              <Text style={s.activeTagT}>{filters.estadoNome} ×</Text>
            </TouchableOpacity>
          ) : null}
          {filters.cidade ? (
            <TouchableOpacity style={s.activeTag} onPress={() => applyFilters({ ...filters, cidade: '' })}>
              <Text style={s.activeTagT}>{filters.cidade} ×</Text>
            </TouchableOpacity>
          ) : null}
          {(filters.anos_min || filters.anos_max) ? (
            <TouchableOpacity style={s.activeTag} onPress={() => applyFilters({ ...filters, anos_min: '', anos_max: '' })}>
              <Text style={s.activeTagT}>{anosLabel(filters)} ×</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={s.clearAllTag} onPress={() => applyFilters(EMPTY_FILTERS)}>
            <Text style={s.clearAllTagT}>Limpar tudo</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
          renderItem={renderUser}
          contentContainerStyle={users.length === 0 ? s.emptyContainer : { paddingVertical: 8, paddingBottom: 40 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>{searched ? '🔍' : '👥'}</Text>
              <Text style={s.emptyTitle}>{searched ? 'Nenhum resultado' : 'Encontre profissionais'}</Text>
              <Text style={s.emptySub}>{searched ? 'Tente outros termos ou ajuste os filtros' : 'Busque por nome ou use os filtros para encontrar o profissional certo'}</Text>
            </View>
          }
        />
      )}

      <FilterModal
        visible={filterModal}
        initial={filters}
        onApply={applyFilters}
        onClose={() => setFilterModal(false)}
      />
    </View>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
    backgroundColor: Colors.primary2,
  },
  backBtn: { width: 40 },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: { fontSize: 15, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, height: 44 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtnOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  filterCount: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.primary, borderRadius: 10, width: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  filterCountT: { color: '#fff', fontSize: 10, fontWeight: '800' },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  searchBtnT: { color: '#fff', fontWeight: '800', fontSize: 14 },

  activeFiltersBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  activeTag: { backgroundColor: Colors.primary + '18', borderWidth: 1.5, borderColor: Colors.primary + '50', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  activeTagT: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  clearAllTag: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  clearAllTagT: { fontSize: 12, fontWeight: '700', color: Colors.text3 },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  av: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avT: { color: '#fff', fontWeight: '800', fontSize: 18 },
  nome: { fontSize: 15, fontWeight: '800', color: Colors.text, flex: 1 },
  tipo: { fontSize: 12, color: Colors.text2, fontWeight: '600' },
  esp: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  loc: { fontSize: 11, color: Colors.text3 },
  dispBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  dispDot: { width: 6, height: 6, borderRadius: 3 },
  dispBadgeT: { fontSize: 10, fontWeight: '700' },
  planoBadge: { backgroundColor: Colors.primary + '22', borderWidth: 1, borderColor: Colors.primary + '60', borderRadius: 100, paddingHorizontal: 7, paddingVertical: 2 },
  planoBadgeT: { fontSize: 9, fontWeight: '800', color: Colors.primary },
  chevron: { fontSize: 22, color: Colors.text3, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1 },
  emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },

  // FilterModal
  filterModalRoot: { flex: 1, backgroundColor: Colors.bg },
  filterModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterModalBack: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  filterModalBackT: { fontSize: 18, color: Colors.text2, fontWeight: '700' },
  filterModalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  filterModalClear: { fontSize: 13, fontWeight: '700', color: Colors.primary, width: 60, textAlign: 'right' },
  filterModalScroll: { padding: 16, paddingBottom: 8 },
  filterModalFooter: {
    backgroundColor: '#fff', padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  applyBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  applyBtnT: { color: '#fff', fontSize: 16, fontWeight: '800' },

  secLabel: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 },
  secHint: { fontSize: 12, color: Colors.text3, marginBottom: 10, marginTop: -6 },

  catSection: { marginBottom: 16 },
  catHeader: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10 },
  catHeaderT: { fontSize: 12, fontWeight: '800' },

  habSection: { marginBottom: 16 },
  habCatRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  habDot: { width: 6, height: 6, borderRadius: 3 },
  habCatT: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#fff' },
  chipHab: { backgroundColor: Colors.bg },
  chipT: { fontSize: 12, fontWeight: '600', color: Colors.text2 },

  emptyHint: { padding: 16, backgroundColor: '#fff', borderRadius: 12, marginTop: 8, alignItems: 'center' },
  emptyHintT: { fontSize: 13, color: Colors.text3, textAlign: 'center' },

  // Anos de experiência
  anosRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  anosField: { flex: 1 },
  anosLabel: { fontSize: 11, fontWeight: '700', color: Colors.text3, marginBottom: 6 },
  anosInput: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center',
  },
  anosSep: { paddingTop: 22 },
  anosSepT: { fontSize: 18, color: Colors.text3, fontWeight: '300' },

  // Seletores IBGE
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 13 },
  selectorDisabled: { opacity: 0.4 },
  selectorText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '600' },
  selectorChevron: { fontSize: 20, color: Colors.text3 },
  ph: { color: Colors.text3, fontWeight: '400' },
  clearX: { width: 42, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  clearXT: { fontSize: 18, color: Colors.text3, fontWeight: '700' },

  // IBGEModal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  ibgeSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '80%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  sheetSearch: { backgroundColor: Colors.bg, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.text, marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.bg },
  listItemT: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  listItemSub: { fontSize: 12, color: Colors.text3, fontWeight: '700' },
  sheetClose: { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, alignItems: 'center', marginVertical: 14 },
  sheetCloseT: { fontSize: 14, fontWeight: '800', color: Colors.text2 },
})
