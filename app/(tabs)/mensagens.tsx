import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function Mensagens() {
  const [convs, setConvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/messages')
      setConvs(res.data.conversations || [])
    } catch (err) { console.log(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Mensagens</Text>
        <TouchableOpacity style={s.newBtn} onPress={() => router.push('/(tabs)/buscar')}>
          <Text style={s.newBtnT}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={convs}
        keyExtractor={item => item.conv_id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load() }}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => {
          const isUnread = !item.read_at
          return (
            <TouchableOpacity
              style={[s.item, isUnread && s.itemUnread]}
              onPress={() => router.push(`/chat/${item.other_id}` as any)}
              activeOpacity={0.75}
            >
              <View style={[s.av, { backgroundColor: Colors.dentista }]}>
                <Text style={s.avT}>{item.other_nome?.charAt(0) || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={[s.nome, isUnread && s.nomeUnread]} numberOfLines={1}>{item.other_nome}</Text>
                  <Text style={s.time}>{timeAgo(item.created_at)}</Text>
                </View>
                <Text style={[s.preview, isUnread && s.previewUnread]} numberOfLines={1}>{item.conteudo}</Text>
                {item.tipo_profissional ? <Text style={s.tipo} numberOfLines={1}>{item.tipo_profissional}</Text> : null}
              </View>
              {isUnread && <View style={s.unreadDot} />}
            </TouchableOpacity>
          )
        }}
        contentContainerStyle={convs.length === 0 ? s.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>💬</Text>
            <Text style={s.emptyTitle}>Nenhuma mensagem</Text>
            <Text style={s.emptySub}>Visite o perfil de um profissional e inicie uma conversa</Text>
            <TouchableOpacity style={s.buscarBtn} onPress={() => router.push('/(tabs)/buscar')}>
              <Text style={s.buscarBtnT}>Buscar profissionais →</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  newBtn: { backgroundColor: Colors.primary, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  newBtnT: { color: '#fff', fontSize: 13, fontWeight: '800' },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemUnread: { backgroundColor: '#FAFFFE' },
  av: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avT: { color: '#fff', fontWeight: '800', fontSize: 18 },
  nome: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  nomeUnread: { fontWeight: '800' },
  time: { fontSize: 11, color: Colors.text3, fontWeight: '600' },
  preview: { fontSize: 13, color: Colors.text3, lineHeight: 18 },
  previewUnread: { color: Colors.text2, fontWeight: '600' },
  tipo: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, flexShrink: 0 },
  emptyContainer: { flex: 1 },
  emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  buscarBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  buscarBtnT: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
