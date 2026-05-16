import { useCallback, useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, Modal, TextInput, Platform } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { PlanColors } from '../../constants/colors'

const API_BASE = 'https://godenth-api-production.up.railway.app'

const ABAS = ['Sobre', 'Experiência', 'Formação', 'Habilidades', 'Portfólio']

const TIPO_CORES: Record<string, string> = {
  'Cirurgião-Dentista': '#1A6FD4',
  'Técnico em Prótese Dentária': '#7B3FC4',
  'Técnico em Saúde Bucal (TSB)': '#0891B2',
  'Auxiliar em Saúde Bucal (ASB)': '#0891B2',
  'Auxiliar de Prótese Dentária': '#7B3FC4',
  'Gerente Comercial': '#334155',
  'Representante Comercial': '#D4600A',
  'Recepcionista / Secretária': '#00A880',
  'CRC / Call Center': '#00A880',
  'Consultor de Vendas': '#D4600A',
  'Gerente Administrativo': '#334155',
  'Auxiliar Administrativo': '#334155',
  'Financeiro': '#334155',
  'RH / Recursos Humanos': '#334155',
  'Contabilidade': '#334155',
  'Marketing Digital': '#D4186A',
  'Designer Gráfico / UI': '#D4186A',
  'Filmmaker / Videomaker': '#D4186A',
  'Fotógrafo': '#D4186A',
  'Social Media': '#D4186A',
  'Gestor de Tráfego': '#D4186A',
  'Estudante de Odontologia': '#1A6FD4',
  'Estudante de Prótese Dentária': '#7B3FC4',
  'Estudante de Administração': '#334155',
  'Estudante de Marketing': '#D4186A',
}

export default function Perfil() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('Sobre')
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [addTitulo, setAddTitulo] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addUri, setAddUri] = useState<string | null>(null)
  const [addSaving, setAddSaving] = useState(false)
  const [myPages, setMyPages] = useState<any[]>([])
  const [pagesLoaded, setPagesLoaded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me')
      setProfile(res.data)
    } catch (err) { console.log(err) }
    finally { setLoading(false) }
  }

  useFocusEffect(useCallback(() => {
    loadProfile()
    api.get('/pages/my')
      .then(r => { setMyPages(r.data.pages || []); setPagesLoaded(true) })
      .catch(() => setPagesLoaded(true))
  }, []))

  useEffect(() => {
    if (aba === 'Portfólio' && user?.id && portfolio.length === 0) {
      setPortfolioLoading(true)
      api.get(`/portfolio/${user.id}`)
        .then(r => setPortfolio(r.data.portfolio || []))
        .catch(() => null)
        .finally(() => setPortfolioLoading(false))
    }
  }, [aba, user?.id])

  const pickPortfolioImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true, quality: 0.75,
    })
    if (!result.canceled) setAddUri(result.assets[0].uri)
  }

  const savePortfolioItem = async () => {
    if (!addTitulo.trim()) return Alert.alert('Atenção', 'O título é obrigatório')
    if (!addUri) return Alert.alert('Atenção', 'Selecione uma imagem')
    setAddSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', { uri: addUri, type: 'image/jpeg', name: 'portfolio.jpg' } as any)
      const upRes = await api.post('/portfolio/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const res = await api.post('/portfolio', {
        titulo: addTitulo.trim(), descricao: addDesc.trim(),
        tipo: 'foto', url: upRes.data.url,
      })
      setPortfolio(prev => [res.data.item, ...prev])
      setAddModal(false); setAddTitulo(''); setAddDesc(''); setAddUri(null)
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível salvar')
    } finally { setAddSaving(false) }
  }

  const deletePortfolioItem = (id: number) => {
    Alert.alert('Remover item', 'Deseja remover este item do portfólio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          await api.delete(`/portfolio/${id}`).catch(() => null)
          setPortfolio(prev => prev.filter(i => i.id !== id))
        },
      },
    ])
  }

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  const handleVerOnboarding = async () => {
    await AsyncStorage.removeItem('godenth_onboarding_seen')
    router.replace('/onboarding')
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00A880" /></View>

  const tipoCor = TIPO_CORES[profile?.tipo_profissional] || '#007A6E'

  const renderSobre = () => (
    <View style={styles.tabContent}>
      {profile?.bio ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Resumo</Text>
          <Text style={styles.cardText}>{profile.bio}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.emptyCard}>
          <Text style={styles.emptyCardT}>+ Adicionar resumo profissional</Text>
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Localização</Text>
        <Text style={styles.cardText}>{profile?.cidade || 'Não informada'}{profile?.estado ? ` · ${profile.estado}` : ''}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💼 Plano</Text>
        <Text style={[styles.cardText, { color: PlanColors[profile?.plano as keyof typeof PlanColors] || '#7A9E8E', fontWeight: '700' }]}>
          {profile?.plano === 'gratuito' ? '🆓 Gratuito' : profile?.plano === 'premium' ? '⚡ Premium' : 'Administrador'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🏢 Minhas páginas</Text>
          <TouchableOpacity onPress={() => router.push('/criar-pagina' as any)}>
            <Text style={styles.cardAction}>+ Criar</Text>
          </TouchableOpacity>
        </View>
        {!pagesLoaded ? (
          <ActivityIndicator color="#00A880" size="small" />
        ) : myPages.length === 0 ? (
          <TouchableOpacity onPress={() => router.push('/criar-pagina' as any)}>
            <Text style={styles.emptyCardT}>Crie uma página para sua empresa →</Text>
          </TouchableOpacity>
        ) : myPages.map(p => (
          <TouchableOpacity key={p.id} style={styles.pageRow} onPress={() => router.push(`/pagina/${p.id}` as any)}>
            <View style={[styles.pageInitial, { backgroundColor: p.cor || '#00A880' }]}>
              <Text style={styles.pageInitialT}>{p.nome?.charAt(0) || 'P'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageNome} numberOfLines={1}>{p.nome}</Text>
              <Text style={styles.pageCat}>{p.categoria}</Text>
            </View>
            <Text style={styles.pageArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {profile?.plano === 'black' && (
        <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/admin' as any)}>
          <Text style={styles.adminBtnT}>⚙️ Administração</Text>
        </TouchableOpacity>
      )}

      {/* TEMP: botão de teste do onboarding */}
      <TouchableOpacity style={styles.debugBtn} onPress={handleVerOnboarding}>
        <Text style={styles.debugBtnT}>🎬 Ver Onboarding</Text>
      </TouchableOpacity>
    </View>
  )

  const renderExperiencia = () => {
    const extras = profile?.cargos_extras || []
    const especialidades = profile?.especialidades || []

    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Cargo Principal</Text>
          <Text style={styles.cardValue}>{profile?.tipo_profissional}</Text>
        </View>

        {extras.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>➕ Cargos Adicionais</Text>
            {extras.map((e: any, i: number) => (
              <Text key={i} style={styles.cardItem}>• {e.label || e}</Text>
            ))}
          </View>
        )}

        {especialidades.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ Especialidades</Text>
            <View style={styles.chips}>
              {especialidades.map((esp: string, i: number) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipT}>{esp}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {especialidades.length === 0 && extras.length === 0 && (
          <TouchableOpacity style={styles.emptyCard}>
            <Text style={styles.emptyCardT}>+ Adicionar experiência</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderFormacao = () => {
    const academico = profile?.academico || {}
    const hasFormacao = Object.keys(academico).length > 0

    return (
      <View style={styles.tabContent}>
        {hasFormacao ? (
          Object.entries(academico).map(([prof, dados]: any) => (
            <View key={prof} style={styles.card}>
              <Text style={styles.cardTitle}>{prof}</Text>
              {dados.temGraduacao && (
                <View style={styles.formacaoItem}>
                  <Text style={styles.formacaoTipo}>📚 Graduação</Text>
                  <Text style={styles.formacaoNome}>{dados.graduacaoInst || 'Instituição não informada'}</Text>
                  {dados.graduacaoAno && <Text style={styles.formacaoAno}>{dados.graduacaoAno}</Text>}
                </View>
              )}
              {(dados.posGraduacoes || []).map((pos: any, i: number) => (
                <View key={i} style={styles.formacaoItem}>
                  <Text style={styles.formacaoTipo}>🎓 {pos.titulo}</Text>
                  <Text style={styles.formacaoNome}>{pos.instituicao || 'Instituição não informada'}</Text>
                  {pos.ano && <Text style={styles.formacaoAno}>{pos.ano}</Text>}
                </View>
              ))}
              {(dados.cursosExtras || []).map((curso: any, i: number) => (
                <View key={i} style={styles.formacaoItem}>
                  <Text style={styles.formacaoTipo}>➕ {curso.titulo}</Text>
                  <Text style={styles.formacaoNome}>{curso.instituicao || 'Instituição não informada'}</Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/(tabs)/editar-perfil')}>
            <Text style={styles.emptyCardT}>+ Adicionar formação acadêmica</Text>
          </TouchableOpacity>
        )}

        {(profile?.experiencia || []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💼 Experiência Profissional</Text>
            {(profile?.experiencia || []).map((e: any, i: number) => (
              <View key={e.id || i} style={styles.formacaoItem}>
                <Text style={[styles.formacaoTipo, { color: '#1A6FD4' }]}>{e.cargo}</Text>
                <Text style={styles.formacaoNome}>{e.empresa}</Text>
                {(e.inicio || e.fim) && <Text style={styles.formacaoAno}>{e.inicio || '?'} — {e.atual ? 'Atualmente' : (e.fim || '?')}</Text>}
              </View>
            ))}
          </View>
        )}

        {(profile?.formacao || []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎓 Formação Acadêmica</Text>
            {(profile?.formacao || []).map((f: any, i: number) => (
              <View key={f.id || i} style={styles.formacaoItem}>
                <Text style={styles.formacaoTipo}>{f.tipo ? `${f.tipo} · ` : ''}{f.curso}</Text>
                <Text style={styles.formacaoNome}>{f.instituicao}</Text>
                {(f.ano_inicio || f.ano_conclusao) && <Text style={styles.formacaoAno}>{f.ano_inicio || '?'} — {f.ano_conclusao || 'Em curso'}</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderHabilidades = () => {
    const habilidades = profile?.habilidades || []

    return (
      <View style={styles.tabContent}>
        {habilidades.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛠️ Habilidades e Competências</Text>
            <View style={styles.chips}>
              {habilidades.map((hab: string, i: number) => (
                <View key={i} style={[styles.chip, styles.chipHab]}>
                  <Text style={styles.chipT}>{hab}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.emptyCard}>
            <Text style={styles.emptyCardT}>+ Adicionar habilidades</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderPortfolio = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addPortBtn} onPress={() => setAddModal(true)}>
        <Text style={styles.addPortBtnT}>+ Adicionar ao portfólio</Text>
      </TouchableOpacity>
      {portfolioLoading ? (
        <ActivityIndicator color="#00A880" style={{ marginTop: 24 }} />
      ) : portfolio.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🖼️</Text>
          <Text style={styles.emptyCardT}>Nenhum item no portfólio ainda</Text>
        </View>
      ) : (
        <View style={styles.portGrid}>
          {portfolio.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.portCard}
              onLongPress={() => deletePortfolioItem(item.id)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: item.url.startsWith('http') ? item.url : API_BASE + item.url }}
                style={styles.portImg}
                resizeMode="cover"
              />
              <View style={styles.portInfo}>
                <Text style={styles.portTitulo} numberOfLines={1}>{item.titulo}</Text>
                {item.descricao ? <Text style={styles.portDesc} numberOfLines={2}>{item.descricao}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Modal de adicionar */}
      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.portOverlay}>
          <View style={styles.portSheet}>
            <View style={styles.portHandle} />
            <Text style={styles.portSheetTitle}>Adicionar ao portfólio</Text>
            <TouchableOpacity style={styles.portPickBtn} onPress={pickPortfolioImage}>
              {addUri
                ? <Image source={{ uri: addUri }} style={styles.portPickPreview} resizeMode="cover" />
                : <Text style={styles.portPickBtnT}>📷 Selecionar imagem</Text>}
            </TouchableOpacity>
            <TextInput
              style={styles.portInput}
              placeholder="Título *"
              placeholderTextColor="#A0B8AC"
              value={addTitulo}
              onChangeText={setAddTitulo}
              maxLength={100}
            />
            <TextInput
              style={[styles.portInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Descrição (opcional)"
              placeholderTextColor="#A0B8AC"
              value={addDesc}
              onChangeText={setAddDesc}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.portSaveBtn, addSaving && { opacity: 0.6 }]}
              onPress={savePortfolioItem}
              disabled={addSaving}
            >
              {addSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.portSaveBtnT}>Salvar →</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.portCancelBtn} onPress={() => { setAddModal(false); setAddTitulo(''); setAddDesc(''); setAddUri(null) }}>
              <Text style={styles.portCancelBtnT}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: tipoCor }]}>
        <TouchableOpacity style={styles.navSide} onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={[styles.navSide, { alignItems: 'flex-end' }]} onPress={() => setShowMenu(true)}>
          <Text style={styles.hamburger}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* ── Menu lateral ── */}
      <Modal visible={showMenu} transparent animationType="slide" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={styles.menuSheet}>
            <View style={styles.menuHandle} />
            <Text style={styles.menuTitle}>Menu</Text>
            {[
              { emoji: '⚙️', label: 'Configurações', onPress: () => { setShowMenu(false); router.push('/configuracoes' as any) } },
              { emoji: '🔔', label: 'Notificações',  onPress: () => { setShowMenu(false); router.push('/notificacoes' as any) } },
              { emoji: '📊', label: 'Minha conta',   onPress: () => { setShowMenu(false); router.push('/minha-conta' as any) } },
              { emoji: '🚪', label: 'Sair',          onPress: () => { setShowMenu(false); handleLogout() }, danger: true },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.onPress}
              >
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
                <Text style={[styles.menuLabel, (item as any).danger && { color: '#EF4444' }]}>{item.label}</Text>
                {!(item as any).danger && <Text style={styles.menuArrow}>›</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={[styles.cover, { backgroundColor: tipoCor }]}>
        <Text style={styles.coverWatermark} numberOfLines={1} ellipsizeMode="clip">
          {(profile?.tipo_profissional || '').toUpperCase()}
        </Text>
      </View>

      <View style={styles.avatarRow}>
        {profile?.avatar_url
          ? <Image source={{ uri: profile.avatar_url.startsWith('http') ? profile.avatar_url : API_BASE + profile.avatar_url }} style={styles.avatarImg} />
          : <View style={[styles.avatar, { backgroundColor: tipoCor }]}><Text style={styles.avatarText}>{profile?.nome?.charAt(0) || 'U'}</Text></View>
        }
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/(tabs)/editar-perfil')}>
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.nome}>{profile?.nome}</Text>
        <Text style={styles.cargo}>{profile?.tipo_profissional}</Text>
        {profile?.cidade ? <Text style={styles.loc}>📍 {profile.cidade}{profile.estado ? ` · ${profile.estado}` : ''}</Text> : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statN}>0</Text><Text style={styles.statL}>Conexões</Text></View>
        <View style={styles.stat}><Text style={styles.statN}>{(profile?.especialidades || []).length}</Text><Text style={styles.statL}>Especialidades</Text></View>
        <View style={styles.stat}><Text style={styles.statN}>{(profile?.habilidades || []).length}</Text><Text style={styles.statL}>Habilidades</Text></View>
      </View>

      <View style={styles.abas}>
        {ABAS.map(a => (
          <TouchableOpacity key={a} style={[styles.aba, aba === a && styles.abaOn]} onPress={() => setAba(a)}>
            <Text style={[styles.abaT, aba === a && styles.abaTOn]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {aba === 'Sobre' && renderSobre()}
        {aba === 'Experiência' && renderExperiencia()}
        {aba === 'Formação' && renderFormacao()}
        {aba === 'Habilidades' && renderHabilidades()}
        {aba === 'Portfólio' && renderPortfolio()}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  navSide: { width: 60 },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  hamburger: { fontSize: 22, color: '#fff', fontWeight: '700' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  menuHandle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  menuTitle: { fontSize: 18, fontWeight: '900', color: '#0A1C14', marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EEF7F2' },
  menuEmoji: { fontSize: 22, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0A1C14' },
  menuArrow: { fontSize: 22, color: '#7A9E8E' },
  cover: { height: 100, overflow: 'hidden' },
  coverWatermark: { position: 'absolute', bottom: -8, left: 10, right: 10, fontSize: 58, fontWeight: '900', color: 'rgba(255,255,255,0.13)', letterSpacing: 3 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -30, marginBottom: 8 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#fff' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  editBtn: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 7, alignSelf: 'flex-end' },
  editBtnText: { fontSize: 13, fontWeight: '800', color: '#00A880' },
  info: { paddingHorizontal: 16, marginBottom: 8 },
  nome: { fontSize: 20, fontWeight: '800', color: '#0A1C14' },
  cargo: { fontSize: 13, color: '#3A6550', marginTop: 2 },
  loc: { fontSize: 12, color: '#7A9E8E', marginTop: 2 },
  stats: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D0E8DA', marginBottom: 0 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: '#D0E8DA' },
  statN: { fontSize: 18, fontWeight: '800', color: '#00A880' },
  statL: { fontSize: 10, color: '#7A9E8E', marginTop: 2, fontWeight: '600' },
  abas: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  aba: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  abaOn: { borderBottomColor: '#00A880' },
  abaT: { fontSize: 12, fontWeight: '700', color: '#7A9E8E' },
  abaTOn: { color: '#00A880' },
  tabContent: { padding: 16, gap: 12, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#D0E8DA' },
  cardTitle: { fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  cardText: { fontSize: 14, color: '#0A1C14', lineHeight: 22 },
  cardValue: { fontSize: 16, fontWeight: '700', color: '#0A1C14' },
  cardItem: { fontSize: 14, color: '#0A1C14', marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { backgroundColor: 'rgba(0,168,128,0.1)', borderWidth: 1, borderColor: 'rgba(0,168,128,0.3)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  chipHab: { backgroundColor: 'rgba(26,111,212,0.1)', borderColor: 'rgba(26,111,212,0.3)' },
  chipT: { fontSize: 12, fontWeight: '600', color: '#00A880' },
  formacaoItem: { borderLeftWidth: 2, borderLeftColor: '#D0E8DA', paddingLeft: 12, marginBottom: 12 },
  formacaoTipo: { fontSize: 11, fontWeight: '800', color: '#00A880', marginBottom: 2 },
  formacaoNome: { fontSize: 13, fontWeight: '600', color: '#0A1C14' },
  formacaoAno: { fontSize: 11, color: '#7A9E8E', marginTop: 2 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, borderWidth: 2, borderColor: '#D0E8DA', borderStyle: 'dashed', alignItems: 'center' },
  emptyCardT: { fontSize: 14, fontWeight: '700', color: '#00A880' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardAction: { fontSize: 13, fontWeight: '800', color: '#00A880' },
  pageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEF7F2' },
  pageInitial: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  pageInitialT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  pageNome: { fontSize: 13, fontWeight: '700', color: '#0A1C14' },
  pageCat: { fontSize: 11, color: '#7A9E8E', marginTop: 1 },
  pageArrow: { fontSize: 20, color: '#D0E8DA', fontWeight: '300' },
  adminBtn: { backgroundColor: '#0A1C14', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#C49800' },
  adminBtnT: { fontSize: 14, fontWeight: '800', color: '#C49800' },
  debugBtn: { backgroundColor: '#EEF7F2', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#00A880', borderStyle: 'dashed' },
  debugBtnT: { fontSize: 13, fontWeight: '700', color: '#00A880' },
  // portfolio
  addPortBtn: { backgroundColor: '#00A880', borderRadius: 12, padding: 13, alignItems: 'center', marginBottom: 12 },
  addPortBtnT: { color: '#fff', fontWeight: '800', fontSize: 14 },
  portGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  portCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#D0E8DA' },
  portImg: { width: '100%', height: 120 },
  portInfo: { padding: 8 },
  portTitulo: { fontSize: 12, fontWeight: '800', color: '#0A1C14' },
  portDesc: { fontSize: 11, color: '#7A9E8E', marginTop: 2 },
  portOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  portSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  portHandle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  portSheetTitle: { fontSize: 18, fontWeight: '800', color: '#0A1C14', marginBottom: 16 },
  portPickBtn: { backgroundColor: '#EEF7F2', borderWidth: 2, borderColor: '#D0E8DA', borderStyle: 'dashed', borderRadius: 12, height: 130, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  portPickBtnT: { fontSize: 14, fontWeight: '700', color: '#00A880' },
  portPickPreview: { width: '100%', height: 130 },
  portInput: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 10, padding: 12, fontSize: 14, color: '#0A1C14', marginBottom: 10 },
  portSaveBtn: { backgroundColor: '#00A880', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  portSaveBtnT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  portCancelBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  portCancelBtnT: { fontSize: 14, fontWeight: '700', color: '#7A9E8E' },
})
