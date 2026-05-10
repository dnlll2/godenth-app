import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList, ActivityIndicator, Alert,
} from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'

const DISPONIBILIDADE = [
  { key: 'disponivel', label: 'Disponível', cor: '#00A880' },
  { key: 'contratado', label: 'Contratado', cor: '#1A6FD4' },
  { key: 'freelancer', label: 'Freelancer', cor: '#C49800' },
  { key: 'parceria', label: 'Parcerias', cor: '#7B3FC4' },
]

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
  'Filmmaker / Videomaker': {
    'Produção': ['Edição de Vídeos de Antes e Depois', 'Fotografia de Portfólio', 'Gestão de Tráfego Pago'],
  },
  'Social Media': {
    'Digital': ['Gestão de Redes Sociais', 'Criação de Conteúdo (Posts/Stories)', 'Resposta a Comentários/Directs'],
  },
  'Gestor de Tráfego': {
    'Produção': ['Gestão de Tráfego Pago (Google/Meta)', 'Análise de Métricas', 'Criação de Campanhas'],
  },
  'Estudante de Odontologia': {
    'Acadêmico': ['Auxílio em Pesquisas', 'Organização de Eventos', 'Monitoria de Disciplinas'],
    'Prático': ['Estágio Observacional', 'Instrumentação em Clínicas', 'Organização de Materiais'],
  },
  'Estudante de Prótese Dentária': {
    'Acadêmico': ['Auxílio em Pesquisas', 'Organização de Eventos'],
    'Prático': ['Estágio Observacional', 'Organização de Materiais'],
  },
}

export default function EditarPerfil() {
  const [profile, setProfile] = useState<any>(null)
  const [nome, setNome] = useState('')
  const [bio, setBio] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [disponibilidade, setDisponibilidade] = useState('')
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [habilidades, setHabilidades] = useState<string[]>([])

  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [estadoModal, setEstadoModal] = useState(false)
  const [cidadeModal, setCidadeModal] = useState(false)
  const [buscaEstado, setBuscaEstado] = useState('')
  const [buscaCidade, setBuscaCidade] = useState('')
  const [loadingCidades, setLoadingCidades] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
    loadEstados()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me')
      const p = res.data
      setProfile(p)
      setNome(p.nome || '')
      setBio(p.bio || '')
      setCidade(p.cidade || '')
      setEstado(p.estado || '')
      setDisponibilidade(p.disponibilidade || '')
      setEspecialidades(p.especialidades || [])
      setHabilidades(p.habilidades || [])
      if (p.estado) loadCidades(p.estado)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const loadEstados = async () => {
    try {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      const data = await res.json()
      setEstados(data)
    } catch (err) {
      console.log('IBGE estados:', err)
    }
  }

  const loadCidades = async (sigla: string) => {
    setLoadingCidades(true)
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`)
      const data = await res.json()
      setCidades(data)
    } catch (err) {
      console.log('IBGE cidades:', err)
    } finally {
      setLoadingCidades(false)
    }
  }

  const selectEstado = (est: any) => {
    setEstado(est.sigla)
    setCidade('')
    setCidades([])
    setEstadoModal(false)
    loadCidades(est.sigla)
  }

  const selectCidade = (cid: any) => {
    setCidade(cid.nome)
    setCidadeModal(false)
  }

  const profissoes = [
    profile?.tipo_profissional,
    ...(profile?.cargos_extras || []).map((e: any) => e.label || e),
  ].filter(Boolean)

  const espDisponiveis = [...new Set(profissoes.flatMap((p: string) => ESPECIALIDADES[p] || []))]

  const habCategorias: Record<string, string[]> = {}
  profissoes.forEach((p: string) => {
    const habs = HABILIDADES[p] || {}
    Object.entries(habs).forEach(([cat, items]: any) => {
      if (!habCategorias[cat]) habCategorias[cat] = []
      items.forEach((item: string) => {
        if (!habCategorias[cat].includes(item)) habCategorias[cat].push(item)
      })
    })
  })

  const toggleEsp = (esp: string) =>
    setEspecialidades(prev => prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp])

  const toggleHab = (hab: string) =>
    setHabilidades(prev => prev.includes(hab) ? prev.filter(h => h !== hab) : [...prev, hab])

  const salvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome é obrigatório.')
      return
    }
    setSaving(true)
    try {
      await api.put('/users/me', {
        nome: nome.trim(),
        bio: bio.trim(),
        cidade: cidade || null,
        estado: estado || null,
        disponibilidade: disponibilidade || null,
        especialidades,
        habilidades,
      })
      router.back()
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível salvar as alterações.')
    } finally {
      setSaving(false)
    }
  }

  const estadosFiltrados = estados.filter(e =>
    e.nome.toLowerCase().includes(buscaEstado.toLowerCase()) ||
    e.sigla.toLowerCase().includes(buscaEstado.toLowerCase())
  )

  const cidadesFiltradas = cidades.filter(c =>
    c.nome.toLowerCase().includes(buscaCidade.toLowerCase())
  )

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#00A880" size="large" /></View>
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity onPress={salvar} disabled={saving} style={styles.salvarBtn}>
          {saving
            ? <ActivityIndicator color="#F5C800" size="small" />
            : <Text style={styles.salvar}>Salvar</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>Informações Básicas</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome completo"
            placeholderTextColor="#A0B8AC"
          />
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Bio profissional</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={bio}
            onChangeText={setBio}
            placeholder="Conte um pouco sobre você..."
            placeholderTextColor="#A0B8AC"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.sectionLabel}>Localização</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Estado</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => { setBuscaEstado(''); setEstadoModal(true) }}
          >
            <Text style={[styles.selectorText, !estado && styles.placeholder]}>
              {estado || 'Selecionar estado'}
            </Text>
            <Text style={styles.selectorArrow}>›</Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Cidade</Text>
          <TouchableOpacity
            style={[styles.selector, !estado && styles.selectorDisabled]}
            onPress={() => { if (estado) { setBuscaCidade(''); setCidadeModal(true) } }}
            disabled={!estado}
          >
            <Text style={[styles.selectorText, !cidade && styles.placeholder]}>
              {cidade || 'Selecionar cidade'}
            </Text>
            <Text style={styles.selectorArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Disponibilidade</Text>
        <View style={styles.card}>
          <View style={styles.chipsWrap}>
            {DISPONIBILIDADE.map(d => (
              <TouchableOpacity
                key={d.key}
                style={[
                  styles.dispChip,
                  disponibilidade === d.key && { backgroundColor: d.cor, borderColor: d.cor },
                ]}
                onPress={() => setDisponibilidade(prev => prev === d.key ? '' : d.key)}
              >
                <Text style={[styles.dispChipT, disponibilidade === d.key && styles.dispChipTOn]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {espDisponiveis.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Especialidades</Text>
            <View style={styles.card}>
              <View style={styles.chipsWrap}>
                {espDisponiveis.map(esp => {
                  const on = especialidades.includes(esp)
                  return (
                    <TouchableOpacity
                      key={esp}
                      style={[styles.chip, on && styles.chipEspOn]}
                      onPress={() => toggleEsp(esp)}
                    >
                      <Text style={[styles.chipT, on && styles.chipTOn]}>{esp}</Text>
                      {on && <Text style={styles.chipCheck}>✓</Text>}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </>
        )}

        {Object.keys(habCategorias).length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Habilidades e Competências</Text>
            <View style={styles.card}>
              {Object.entries(habCategorias).map(([cat, items]) => (
                <View key={cat} style={styles.habSection}>
                  <Text style={styles.habCat}>{cat}</Text>
                  <View style={styles.chipsWrap}>
                    {items.map(hab => {
                      const on = habilidades.includes(hab)
                      return (
                        <TouchableOpacity
                          key={hab}
                          style={[styles.chip, styles.chipHab, on && styles.chipHabOn]}
                          onPress={() => toggleHab(hab)}
                        >
                          <Text style={[styles.chipT, on && styles.chipTOn]}>{hab}</Text>
                          {on && <Text style={styles.chipCheck}>✓</Text>}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      <Modal visible={estadoModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Selecionar Estado</Text>
            <TextInput
              style={styles.searchInput}
              value={buscaEstado}
              onChangeText={setBuscaEstado}
              placeholder="Buscar..."
              placeholderTextColor="#A0B8AC"
              autoFocus
            />
            <FlatList
              data={estadosFiltrados}
              keyExtractor={item => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem} onPress={() => selectEstado(item)}>
                  <Text style={styles.listItemT}>{item.nome}</Text>
                  <Text style={styles.listItemSub}>{item.sigla}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setEstadoModal(false)}>
              <Text style={styles.closeBtnT}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={cidadeModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Selecionar Cidade</Text>
            <TextInput
              style={styles.searchInput}
              value={buscaCidade}
              onChangeText={setBuscaCidade}
              placeholder="Buscar..."
              placeholderTextColor="#A0B8AC"
              autoFocus
            />
            {loadingCidades
              ? <ActivityIndicator color="#00A880" style={{ marginTop: 24 }} />
              : (
                <FlatList
                  data={cidadesFiltradas}
                  keyExtractor={item => item.id.toString()}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.listItem} onPress={() => selectCidade(item)}>
                      <Text style={styles.listItemT}>{item.nome}</Text>
                    </TouchableOpacity>
                  )}
                />
              )
            }
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCidadeModal(false)}>
              <Text style={styles.closeBtnT}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E',
  },
  back: { fontSize: 24, color: '#fff', fontWeight: '700', width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  salvarBtn: { width: 60, alignItems: 'flex-end' },
  salvar: { fontSize: 15, fontWeight: '800', color: '#F5C800' },
  scroll: { padding: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#3A6550',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, marginTop: 20,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#D0E8DA', padding: 16,
  },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#7A9E8E', marginBottom: 6 },
  input: {
    backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 12, padding: 13, fontSize: 15, color: '#0A1C14',
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  selector: {
    backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 12, paddingHorizontal: 13, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center',
  },
  selectorDisabled: { opacity: 0.45 },
  selectorText: { fontSize: 15, color: '#0A1C14', flex: 1 },
  placeholder: { color: '#A0B8AC' },
  selectorArrow: { fontSize: 20, color: '#7A9E8E', fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dispChip: {
    backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
  },
  dispChipT: { fontSize: 13, fontWeight: '700', color: '#3A6550' },
  dispChipTOn: { color: '#fff' },
  chip: {
    backgroundColor: '#EEF7F2', borderWidth: 2, borderColor: '#D0E8DA',
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  chipEspOn: { backgroundColor: '#007A6E', borderColor: '#007A6E' },
  chipHab: { borderColor: '#BFD0E8', backgroundColor: '#F0F4FF' },
  chipHabOn: { backgroundColor: '#1A6FD4', borderColor: '#1A6FD4' },
  chipT: { fontSize: 12, fontWeight: '600', color: '#3A6550' },
  chipTOn: { color: '#fff' },
  chipCheck: { color: '#fff', fontSize: 10, fontWeight: '900' },
  habSection: { marginBottom: 18 },
  habCat: {
    fontSize: 10, fontWeight: '800', color: '#1A6FD4',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '82%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0A1C14', marginBottom: 14 },
  searchInput: {
    backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 12, padding: 12, fontSize: 15, color: '#0A1C14', marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF7F2',
  },
  listItemT: { fontSize: 15, color: '#0A1C14', fontWeight: '600' },
  listItemSub: { fontSize: 12, color: '#7A9E8E', fontWeight: '700' },
  closeBtn: {
    backgroundColor: '#EEF7F2', borderRadius: 12, padding: 14,
    alignItems: 'center', marginVertical: 14,
  },
  closeBtnT: { fontSize: 14, fontWeight: '800', color: '#3A6550' },
})
