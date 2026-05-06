import { useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

export default function Buscar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const [users, pages, vagas] = await Promise.all([
        api.get(`/users/search?q=${query}`),
        api.get(`/pages/search?q=${query}`),
        api.get(`/vagas?cargo=${query}`),
      ])
      const combined = [
        ...users.data.users.map((u: any) => ({ ...u, _type: 'profissional' })),
        ...pages.data.pages.map((p: any) => ({ ...p, _type: 'empresa' })),
        ...vagas.data.vagas.map((v: any) => ({ ...v, _type: 'vaga' })),
      ]
      setResults(combined)
    } catch (err) {
      console.log('Erro busca:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: item._type === 'profissional' ? Colors.dentista : Colors.primary }]}>
        <Text style={styles.avatarText}>{item._type === 'vaga' ? '💼' : (item.nome?.charAt(0) || '?')}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.nome || item.cargo}</Text>
        <Text style={styles.sub}>
          {item._type === 'profissional' ? `${item.tipo_profissional} · ${item.cidade}` :
           item._type === 'empresa' ? `${item.categoria} · ${item.cidade}` :
           `${item.contrato} · ${item.salario}`}
        </Text>
        <Text style={[styles.badge, { color: item._type === 'vaga' ? Colors.gold : Colors.primary }]}>
          {item._type === 'profissional' ? '👤 Profissional' : item._type === 'empresa' ? '🏢 Empresa' : '💼 Vaga'}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, color: Colors.text3 }}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Dentista, protético, clínica, vaga…"
            placeholderTextColor={Colors.text3}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={search} style={styles.searchBtn}>
              <Text style={styles.searchBtnText}>Buscar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />}

      {searched && !loading && (
        <Text style={styles.count}>{results.length} resultados para "{query}"</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, i) => `${item._type}-${item.id}-${i}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !searched ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>Busque profissionais,{'\n'}empresas ou vagas</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border2, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10 },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  count: { fontSize: 13, fontWeight: '700', color: Colors.text2, paddingHorizontal: 14, paddingTop: 12 },
  list: { padding: 14, gap: 10, paddingBottom: 80 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  sub: { fontSize: 11, color: Colors.text3, marginBottom: 4 },
  badge: { fontSize: 10, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text2, textAlign: 'center', lineHeight: 24 },
})
