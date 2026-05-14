import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const API_BASE = 'https://godenth-api-production.up.railway.app'

const CONTRATOS = ['CLT', 'PJ', 'Freelancer', 'Estágio']

const CONTRATO_COR: Record<string, string> = {
  CLT: '#00A880',
  PJ: '#1A6FD4',
  Freelancer: '#C49800',
  Estágio: '#7B3FC4',
}

function CriarVagaModal({ visible, onClose, onCreated, myPages }: {
  visible: boolean; onClose: () => void; onCreated: () => void; myPages: any[]
}) {
  const [pageId, setPageId] = useState('')
  const [cargo, setCargo] = useState('')
  const [contrato, setContrato] = useState('')
  const [salario, setSalario] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [beneficios, setBeneficios] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setPageId(''); setCargo(''); setContrato(''); setSalario(''); setEspecialidade(''); setBeneficios('') }
  const close = () => { reset(); onClose() }

  const save = async () => {
    if (!pageId) return Alert.alert('Atenção', 'Selecione uma página')
    if (!cargo.trim()) return Alert.alert('Atenção', 'Informe o cargo')
    if (!contrato) return Alert.alert('Atenção', 'Selecione o tipo de contrato')
    setSaving(true)
    try {
      await api.post('/vagas', {
        page_id: parseInt(pageId),
        cargo: cargo.trim(),
        contrato,
        salario: salario.trim() || null,
        especialidade: especialidade.trim() || null,
        beneficios: beneficios.trim() || null,
      })
      reset()
      onCreated()
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar a vaga')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={cm.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={cm.sheet}>
          <View style={cm.handle} />
          <View style={cm.header}>
            <TouchableOpacity onPress={close}><Text style={cm.close}>✕</Text></TouchableOpacity>
            <Text style={cm.title}>Publicar Vaga</Text>
            <TouchableOpacity
              style={[cm.saveBtn, (!pageId || !cargo || !contrato) && cm.saveBtnOff]}
              onPress={save}
              disabled={!pageId || !cargo || !contrato || saving}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cm.saveBtnT}>Publicar</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={cm.label}>Página *</Text>
            {myPages.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[cm.pageChip, pageId === String(p.id) && cm.pageChipOn]}
                onPress={() => setPageId(String(p.id))}
              >
                <Text style={[cm.pageChipT, pageId === String(p.id) && { color: '#00A880', fontWeight: '800' }]}>{p.nome}</Text>
              </TouchableOpacity>
            ))}

            <Text style={cm.label}>Cargo *</Text>
            <TextInput style={cm.input} value={cargo} onChangeText={setCargo} placeholder="Ex: Cirurgião-Dentista" placeholderTextColor="#A0B8AC" />

            <Text style={cm.label}>Tipo de Contrato *</Text>
            <View style={cm.chipRow}>
              {CONTRATOS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[cm.chip, contrato === c && { backgroundColor: CONTRATO_COR[c] + '18', borderColor: CONTRATO_COR[c] }]}
                  onPress={() => setContrato(c)}
                >
                  <Text style={[cm.chipT, contrato === c && { color: CONTRATO_COR[c], fontWeight: '800' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={cm.label}>Salário (opcional)</Text>
            <TextInput style={cm.input} value={salario} onChangeText={setSalario} placeholder="Ex: R$ 3.000 a R$ 5.000" placeholderTextColor="#A0B8AC" />

            <Text style={cm.label}>Especialidade (opcional)</Text>
            <TextInput style={cm.input} value={especialidade} onChangeText={setEspecialidade} placeholder="Ex: Implantodontia" placeholderTextColor="#A0B8AC" />

            <Text style={cm.label}>Benefícios (opcional)</Text>
            <TextInput style={cm.input} value={beneficios} onChangeText={setBeneficios} placeholder="Ex: Vale-refeição, plano de saúde..." placeholderTextColor="#A0B8AC" multiline numberOfLines={3} textAlignVertical="top" />
            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export default function Vagas() {
  const [vagas, setVagas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [myPages, setMyPages] = useState<any[]>([])
  const [criarModal, setCriarModal] = useState(false)
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

  const candidatar = async (vagaId: number) => {
    try {
      await api.post(`/vagas/${vagaId}/candidatar`, { respostas: [] })
      Alert.alert('✅ Candidatura enviada!', 'Sua candidatura foi registrada com sucesso.')
    } catch (err: any) {
      Alert.alert('Aviso', err.response?.data?.error || 'Erro ao candidatar')
    }
  }

  const renderVaga = ({ item }: any) => {
    const cor = CONTRATO_COR[item.contrato] || '#00A880'
    const isOwner = myPages.some(p => p.id === item.page_id)

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/pagina/${item.page_id}` as any)}
        activeOpacity={0.88}
      >
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

          <View style={s.infoRow}>
            {(item.cidade || item.estado) && (
              <Text style={s.info}>📍 {[item.cidade, item.estado].filter(Boolean).join(', ')}</Text>
            )}
            {item.salario ? <Text style={s.info}>💰 {item.salario}</Text> : null}
          </View>

          {item.beneficios ? <Text style={s.beneficios}>{item.beneficios}</Text> : null}

          <View style={s.footer}>
            <Text style={s.data}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
            {!isOwner && (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: cor }]}
                onPress={() => candidatar(item.id)}
              >
                <Text style={s.btnT}>Candidatar →</Text>
              </TouchableOpacity>
            )}
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
            style={[s.filtro, filtro === c && s.filtroOn, filtro === c && c && { backgroundColor: CONTRATO_COR[c], borderColor: CONTRATO_COR[c] }]}
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
    </View>
  )
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
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
  esp: { fontSize: 12, color: '#3A6550', fontWeight: '600', marginBottom: 8 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 },
  info: { fontSize: 12, color: '#7A9E8E' },
  beneficios: { fontSize: 12, color: '#7A9E8E', fontStyle: 'italic', marginBottom: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEF7F2', marginTop: 4 },
  data: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  btn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  btnT: { color: '#fff', fontSize: 12, fontWeight: '800' },
})

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#EEF7F2', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 12, maxHeight: '92%', paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  handle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  close: { fontSize: 20, color: '#7A9E8E', fontWeight: '700', width: 36 },
  title: { fontSize: 17, fontWeight: '800', color: '#0A1C14' },
  saveBtn: { backgroundColor: '#00A880', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnOff: { backgroundColor: '#AECEBE' },
  saveBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 13, fontSize: 14, color: '#0A1C14', marginBottom: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  chipT: { fontSize: 13, fontWeight: '600', color: '#3A6550' },
  pageChip: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  pageChipOn: { borderColor: '#00A880', backgroundColor: '#E6F5EE' },
  pageChipT: { fontSize: 14, color: '#3A6550' },
})
