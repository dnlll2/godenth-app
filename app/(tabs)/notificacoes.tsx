import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

export default function Notificacoes() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications || [])
    } catch (err) { console.log(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const markRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`)
    load()
  }

  const markAll = async () => {
    await api.put('/notifications/all/read')
    load()
  }

  useEffect(() => { load() }, [])

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notificações</Text>
          <Text style={styles.sub}>{notifications.filter((n: any) => !n.read_at).length} não lidas</Text>
        </View>
        <TouchableOpacity style={styles.markBtn} onPress={markAll}>
          <Text style={styles.markBtnText}>✓ Marcar lidas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={Colors.primary} />}
        renderItem={({ item }: any) => (
          <TouchableOpacity style={[styles.item, !item.read_at && styles.itemUnread]} onPress={() => markRead(item.id)}>
            {!item.read_at && <View style={styles.unreadBar} />}
            <View style={styles.itemIcon}><Text style={{ fontSize: 20 }}>🔔</Text></View>
            <View style={styles.itemBody}>
              <Text style={styles.itemTipo}>{item.tipo}</Text>
              <Text style={styles.itemTime}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={notifications.length === 0 ? styles.empty : {}}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>🔔</Text>
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  markBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  markBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative' },
  itemUnread: { backgroundColor: '#FAFFFE' },
  unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: Colors.primary },
  itemIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  itemBody: { flex: 1 },
  itemTipo: { fontSize: 13, fontWeight: '700', color: Colors.text },
  itemTime: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  empty: { flex: 1 },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text2 },
})
