import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vaga', label: 'Vagas' },
  { key: 'disponibilidade', label: 'Disponivel' },
  { key: 'parceria', label: 'Parcerias' },
]

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const { user } = useAuthStore()

  const loadFeed = async () => {
    try {
      const params = filtro !== 'todos' ? '?tipo_post=' + filtro : ''
      const res = await api.get('/posts' + params)
      setPosts(res.data.posts || [])
    } catch (err) {
      console.log('Erro:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { setLoading(true); loadFeed() }, [filtro]))

  const getCor = (tipo: string) => {
    if (tipo === 'vaga') return '#C49800'
    if (tipo === 'parceria') return '#7B3FC4'
    return '#00A880'
  }

  const renderPost = ({ item }: any) => {
    const cor = getCor(item.tipo_post)
    const nome = item.page_nome || item.author_nome || 'Usuario'
    return (
      <View style={styles.card}>
        <View style={[styles.stripe, { backgroundColor: cor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <View style={[styles.av, { backgroundColor: cor }]}>
              <Text style={styles.avt}>{nome.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nome}>{nome}</Text>
              <Text style={styles.loc}>{item.cidade} · {item.estado}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: cor + '20', borderColor: cor + '60' }]}>
              <Text style={[styles.badgeT, { color: cor }]}>{item.tipo_post?.toUpperCase()}</Text>
            </View>
          </View>
          {item.data_json?.especialidade ? <Text style={styles.esp}>{item.data_json.especialidade}</Text> : null}
          {item.data_json?.descricao ? <Text style={styles.desc}>{item.data_json.descricao}</Text> : null}
          <View style={styles.footer}>
            <Text style={styles.data}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: cor }]}>
              <Text style={styles.btnT}>{item.tipo_post === 'vaga' ? 'Candidatar' : 'Contato'} →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#EEF7F2' }}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={{ color: '#F5C800' }}>Go</Text>
          <Text style={{ color: '#ffffff' }}>Denth</Text>
        </Text>
        <View style={styles.icons}>
          <TouchableOpacity style={styles.ico} onPress={() => router.push('/(tabs)/publicar')}>
            <Text style={{ fontSize: 18 }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ico} onPress={() => router.push('/(tabs)/buscar')}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ico} onPress={() => router.push('/(tabs)/notificacoes')}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
            <View style={styles.uav}>
              <Text style={styles.uavt}>{user?.nome?.charAt(0) || 'U'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtrosRow}>
        {FILTROS.map(f => (
          <TouchableOpacity key={f.key} style={[styles.filtro, filtro === f.key && styles.filtroOn]} onPress={() => setFiltro(f.key)}>
            <Text style={[styles.filtroT, filtro === f.key && styles.filtroTOn]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00A880" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id?.toString()}
          renderItem={renderPost}
          contentContainerStyle={posts.length === 0 ? { flex: 1 } : { padding: 14, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeed() }} tintColor="#00A880" />}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 8 }}>Feed vazio</Text>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#00A880' }]} onPress={() => router.push('/(tabs)/publicar')}>
                <Text style={styles.btnT}>+ Publicar agora</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#007A6E' },
  logo: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ico: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  uav: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A6FD4', justifyContent: 'center', alignItems: 'center' },
  uavt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  filtrosRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#D0E8DA', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filtro: { backgroundColor: '#EEF7F2', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 7 },
  filtroOn: { backgroundColor: '#00A880', borderColor: '#00A880' },
  filtroT: { fontSize: 12, fontWeight: '700', color: '#3A6550' },
  filtroTOn: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#D0E8DA', flexDirection: 'row' },
  stripe: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  av: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  nome: { fontSize: 14, fontWeight: '800', color: '#0A1C14' },
  loc: { fontSize: 11, color: '#7A9E8E', marginTop: 1 },
  badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  badgeT: { fontSize: 9, fontWeight: '800' },
  esp: { fontSize: 13, fontWeight: '700', color: '#0A1C14', marginBottom: 5 },
  desc: { fontSize: 13, color: '#4A7060', lineHeight: 19, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEF7F2' },
  data: { fontSize: 11, color: '#7A9E8E', fontWeight: '600' },
  btn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  btnT: { color: '#fff', fontSize: 12, fontWeight: '800' },
})
