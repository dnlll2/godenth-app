import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'

const FILTROS = ['Todos', '💼 Vagas', '🙋 Disponível', '🤝 Parcerias', '🔬 Serviços', '🎓 Cursos']

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState('Todos')
  const { user } = useAuthStore()

  const loadFeed = async () => {
    try {
      const res = await api.get('/posts')
      setPosts(res.data.posts || [])
    } catch (err) {
      console.log('Erro ao carregar feed:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadFeed() }, [])

  const renderPost = ({ item }: any) => (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: Colors.primary }]} />
      <View style={styles.cardBody}>
        <Text style={styles.postType}>{item.tipo_post?.toUpperCase()}</Text>
        <Text style={styles.postAuthor}>{item.page_nome || item.author_nome}</Text>
        <Text style={styles.postCity}>{item.cidade} · {item.estado}</Text>
        {item.data_json && (
          <View style={styles.postData}>
            {item.data_json.cargo && <Text style={styles.postTitle}>{item.data_json.cargo}</Text>}
            {item.data_json.salario && <Text style={styles.postSalary}>{item.data_json.salario}</Text>}
            {item.data_json.descricao && <Text style={styles.postDesc}>{item.data_json.descricao}</Text>}
          </View>
        )}
      </View>
    </View>
  )

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}><Text style={{ color: Colors.gold }}>Go</Text><Text style={{ color: Colors.primary }}>Denth</Text></Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/notificacoes')}><Text>🔔</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/perfil')}>
            <View style={[styles.avatar, { backgroundColor: Colors.dentista }]}><Text style={styles.avatarText}>{user?.nome?.charAt(0) || 'U'}</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      <FlatList
        data={FILTROS}
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtros}
        keyExtractor={i => i}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.filtro, filtro === item && styles.filtroOn]} onPress={() => setFiltro(item)}>
            <Text style={[styles.filtroText, filtro === item && styles.filtroTextOn]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id?.toString()}
        renderItem={renderPost}
        contentContainerStyle={posts.length === 0 ? styles.empty : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeed() }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Feed vazio por enquanto</Text>
            <Text style={styles.emptySub}>Publique algo ou siga páginas de empresa</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  filtros: { paddingHorizontal: 14, paddingVertical: 10, gap: 7, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtro: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  filtroOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  filtroTextOn: { color: '#fff' },
  list: { padding: 14, paddingBottom: 80, gap: 12 },
  empty: { flex: 1 },
  card: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  stripe: { height: 4 },
  cardBody: { padding: 14 },
  postType: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 1, marginBottom: 8 },
  postAuthor: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  postCity: { fontSize: 11, color: Colors.text3, marginBottom: 8 },
  postData: { gap: 3 },
  postTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  postSalary: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  postDesc: { fontSize: 13, color: Colors.text2, lineHeight: 20 },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
})
