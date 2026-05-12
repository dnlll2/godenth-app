import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Platform, ScrollView, Modal,
} from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

const TIPOS = [
  'Cirurgião-Dentista', 'Técnico em Prótese Dentária', 'Técnico em Saúde Bucal (TSB)',
  'Auxiliar em Saúde Bucal (ASB)', 'Auxiliar de Prótese Dentária', 'Recepcionista / Secretária',
  'Marketing Digital', 'Gerente Comercial', 'Estudante de Odontologia',
  'Estudante de Prótese Dentária',
]

const DISPONIBILIDADES = [
  { key: '', label: 'Todos' },
  { key: 'disponivel', label: 'Disponível' },
  { key: 'contratado', label: 'Contratado' },
  { key: 'freelancer', label: 'Freelancer' },
  { key: 'parceria', label: 'Parcerias' },
]

const DISP_COR: Record<string, string> = {
  disponivel: '#00A880', contratado: '#1A6FD4', freelancer: '#C49800',
  parceria: '#7B3FC4', explorando: '#7A9E8E',
}

// ── IBGEModal (mesmo padrão de editar-perfil) ─────────────────────────────────

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
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          <TextInput
            style={s.sheetSearch}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar..."
            placeholderTextColor="#A0B8AC"
            autoFocus
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
                  style={s.listItem}
                  onPress={() => { setBusca(''); onSelect(item) }}
                >
                  <Text style={s.listItemT}>{item.nome}</Text>
                  {item.sigla ? <Text style={s.listItemSub}>{item.sigla}</Text> : null}
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity style={s.sheetClose} onPress={() => { setBusca(''); onClose() }}>
            <Text style={s.sheetCloseT}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function Buscar() {
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')
  const [cidade, setCidade] = useState('')
  const [estadoSigla, setEstadoSigla] = useState('')
  const [estadoNome, setEstadoNome] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [habilidade, setHabilidade] = useState('')
  const [disponibilidade, setDisponibilidade] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [estadoModal, setEstadoModal] = useState(false)
  const [cidadeModal, setCidadeModal] = useState(false)
  const [loadingCidades, setLoadingCidades] = useState(false)

  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => { loadEstados() }, [])

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

  const selectEstado = (est: any) => {
    setEstadoSigla(est.sigla)
    setEstadoNome(est.nome)
    setCidade('')
    setCidades([])
    setEstadoModal(false)
    loadCidades(est.sigla)
  }

  const clearEstado = () => {
    setEstadoSigla('')
    setEstadoNome('')
    setCidade('')
    setCidades([])
  }

  const buildParams = (p = 1) => {
    const params: Record<string, any> = { page: p, limit: 20 }
    if (q.trim()) params.q = q.trim()
    if (tipo) params.tipo = tipo
    if (cidade) params.cidade = cidade
    if (estadoSigla) params.estado = estadoSigla
    if (especialidade.trim()) params.especialidade = especialidade.trim()
    if (habilidade.trim()) params.habilidade = habilidade.trim()
    if (disponibilidade) params.disponibilidade = disponibilidade
    return params
  }

  const search = async () => {
    setLoading(true)
    setSearched(true)
    setPage(1)
    try {
      const res = await api.get('/users/search', { params: buildParams(1) })
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
      const res = await api.get('/users/search', { params: buildParams(next) })
      setUsers(prev => [...prev, ...(res.data.users || [])])
      setPage(next)
      setHasMore(res.data.has_more || false)
    } catch (err) { console.log(err) }
    finally { setLoadingMore(false) }
  }

  const clearFilters = () => {
    setTipo(''); clearEstado()
    setEspecialidade(''); setHabilidade(''); setDisponibilidade('')
  }

  const activeFiltersCount = [tipo, cidade, estadoSigla, especialidade, habilidade, disponibilidade].filter(Boolean).length

  const renderUser = ({ item }: any) => {
    const dispCor = item.disponibilidade ? DISP_COR[item.disponibilidade] : null
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/usuario/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={[s.av, { backgroundColor: Colors.primary }]}>
          <Text style={s.avT}>{item.nome?.charAt(0) || '?'}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.nome} numberOfLines={1}>{item.nome}</Text>
            {item.plano === 'premium' && (
              <View style={s.planoBadge}><Text style={s.planoBadgeT}>PRO</Text></View>
            )}
            {item.plano === 'black' && (
              <View style={[s.planoBadge, { backgroundColor: Colors.gold + '22', borderColor: Colors.gold + '60' }]}>
                <Text style={[s.planoBadgeT, { color: Colors.gold }]}>BLACK</Text>
              </View>
            )}
          </View>
          <Text style={s.tipo} numberOfLines={1}>{item.tipo_profissional}</Text>
          {item.especialidade ? (
            <Text style={s.esp} numberOfLines={1}>{item.especialidade}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {item.cidade ? (
              <Text style={s.loc}>📍 {item.cidade}{item.estado ? ` · ${item.estado}` : ''}</Text>
            ) : null}
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
            onSubmitEditing={search}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: Colors.text3, fontSize: 18, paddingHorizontal: 4 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.filterBtn, showFilters && s.filterBtnOn]}
          onPress={() => setShowFilters(v => !v)}
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
          {activeFiltersCount > 0 && (
            <View style={s.filterCount}>
              <Text style={s.filterCountT}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={s.searchBtn} onPress={search}>
          <Text style={s.searchBtnT}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={s.filtersPanel}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Localização via IBGE */}
            <Text style={s.filterLabel}>Estado</Text>
            <View style={s.selectorRow}>
              <TouchableOpacity
                style={[s.selector, { flex: 1 }]}
                onPress={() => setEstadoModal(true)}
              >
                <Text style={[s.selectorText, !estadoSigla && s.ph]} numberOfLines={1}>
                  {estadoNome || 'Selecionar estado'}
                </Text>
                <Text style={s.selectorChevron}>›</Text>
              </TouchableOpacity>
              {estadoSigla ? (
                <TouchableOpacity style={s.clearSelector} onPress={clearEstado}>
                  <Text style={s.clearSelectorT}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={[s.filterLabel, { marginTop: 10 }]}>Município</Text>
            <View style={s.selectorRow}>
              <TouchableOpacity
                style={[s.selector, { flex: 1 }, !estadoSigla && s.selectorDisabled]}
                onPress={() => estadoSigla && setCidadeModal(true)}
                disabled={!estadoSigla}
              >
                <Text style={[s.selectorText, !cidade && s.ph]} numberOfLines={1}>
                  {cidade || (estadoSigla ? 'Selecionar município' : 'Selecione o estado primeiro')}
                </Text>
                {loadingCidades
                  ? <ActivityIndicator size="small" color={Colors.text3} />
                  : <Text style={s.selectorChevron}>›</Text>
                }
              </TouchableOpacity>
              {cidade ? (
                <TouchableOpacity style={s.clearSelector} onPress={() => setCidade('')}>
                  <Text style={s.clearSelectorT}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Especialidade e Habilidade */}
            <View style={[s.filterRow, { marginTop: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.filterLabel}>Especialidade</Text>
                <TextInput style={s.filterInput} value={especialidade} onChangeText={setEspecialidade}
                  placeholder="ex: Ortodontia" placeholderTextColor={Colors.text3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.filterLabel}>Habilidade</Text>
                <TextInput style={s.filterInput} value={habilidade} onChangeText={setHabilidade}
                  placeholder="ex: Invisalign" placeholderTextColor={Colors.text3} />
              </View>
            </View>

            <Text style={[s.filterLabel, { marginBottom: 8, marginTop: 4 }]}>Disponibilidade</Text>
            <View style={s.chipsRow}>
              {DISPONIBILIDADES.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[s.chip, disponibilidade === d.key && s.chipOn]}
                  onPress={() => setDisponibilidade(d.key)}
                >
                  <Text style={[s.chipT, disponibilidade === d.key && s.chipTOn]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.filterLabel, { marginBottom: 8, marginTop: 12 }]}>Tipo Profissional</Text>
            <View style={s.chipsRow}>
              <TouchableOpacity
                style={[s.chip, tipo === '' && s.chipOn]}
                onPress={() => setTipo('')}
              >
                <Text style={[s.chipT, tipo === '' && s.chipTOn]}>Todos</Text>
              </TouchableOpacity>
              {TIPOS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.chip, tipo === t && s.chipOn]}
                  onPress={() => setTipo(t)}
                >
                  <Text style={[s.chipT, tipo === t && s.chipTOn]} numberOfLines={1}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeFiltersCount > 0 && (
              <TouchableOpacity style={s.clearBtn} onPress={clearFilters}>
                <Text style={s.clearBtnT}>Limpar todos os filtros</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
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
          ListFooterComponent={loadingMore
            ? <ActivityIndicator color={Colors.primary} style={{ margin: 16 }} />
            : hasMore
              ? <TouchableOpacity style={s.loadMoreBtn} onPress={loadMore}><Text style={s.loadMoreT}>Carregar mais</Text></TouchableOpacity>
              : null
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>
                {searched ? '🔍' : '👥'}
              </Text>
              <Text style={s.emptyTitle}>
                {searched ? 'Nenhum resultado' : 'Encontre profissionais'}
              </Text>
              <Text style={s.emptySub}>
                {searched
                  ? 'Tente outros termos ou ajuste os filtros'
                  : 'Busque por nome, especialidade ou habilidade'}
              </Text>
            </View>
          }
        />
      )}

      {/* IBGE Modals */}
      <IBGEModal
        visible={estadoModal}
        title="Selecionar Estado"
        data={estados}
        onSelect={selectEstado}
        onClose={() => setEstadoModal(false)}
      />
      <IBGEModal
        visible={cidadeModal}
        title="Selecionar Município"
        data={cidades}
        onSelect={(cid: any) => { setCidade(cid.nome); setCidadeModal(false) }}
        onClose={() => setCidadeModal(false)}
        loading={loadingCidades}
      />
    </View>
  )
}

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

  filtersPanel: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 16, paddingTop: 14, maxHeight: 400,
  },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  filterLabel: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  filterInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: Colors.text,
    backgroundColor: Colors.bg,
  },

  // Seletores IBGE
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  selector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  selectorDisabled: { opacity: 0.45 },
  selectorText: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600' },
  selectorChevron: { fontSize: 20, color: Colors.text3 },
  ph: { color: Colors.text3, fontWeight: '400' },
  clearSelector: {
    width: 36, height: 42, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  clearSelectorT: { fontSize: 18, color: Colors.text3, fontWeight: '700' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bg },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  chipT: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  chipTOn: { color: Colors.primary },
  clearBtn: { marginTop: 14, padding: 10, alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  clearBtnT: { fontSize: 13, fontWeight: '700', color: Colors.text3 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
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
  loadMoreBtn: { margin: 16, padding: 14, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border },
  loadMoreT: { fontSize: 14, fontWeight: '700', color: Colors.text2 },

  // IBGEModal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '82%',
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  sheetSearch: {
    backgroundColor: Colors.bg, borderRadius: 12, padding: 12,
    fontSize: 15, color: Colors.text, marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.bg,
  },
  listItemT: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  listItemSub: { fontSize: 12, color: Colors.text3, fontWeight: '700' },
  sheetClose: { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, alignItems: 'center', marginVertical: 14 },
  sheetCloseT: { fontSize: 14, fontWeight: '800', color: Colors.text2 },
})
