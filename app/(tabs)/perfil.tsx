import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const ABAS = ['Sobre', 'Experiência', 'Formação', 'Habilidades']

export default function Perfil() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('Sobre')

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me')
      setProfile(res.data)
    } catch (err) { console.log(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProfile() }, [])

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00A880" /></View>

  const tipoCor = '#00A880'

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
        <Text style={styles.cardText}>{profile?.plano === 'gratuito' ? '🆓 Gratuito' : profile?.plano === 'premium' ? '⚡ Premium' : '⭐ Black'}</Text>
      </View>
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
          <TouchableOpacity style={styles.emptyCard}>
            <Text style={styles.emptyCardT}>+ Adicionar formação acadêmica</Text>
          </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity onPress={handleLogout}><Text style={styles.logout}>Sair</Text></TouchableOpacity>
      </View>

      <View style={styles.cover} />

      <View style={styles.avatarRow}>
        <View style={[styles.avatar, { backgroundColor: tipoCor }]}>
          <Text style={styles.avatarText}>{profile?.nome?.charAt(0) || 'U'}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
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
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  logout: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  cover: { height: 80, backgroundColor: '#007A6E' },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -28, marginBottom: 8 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  editBtn: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 7 },
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
})
