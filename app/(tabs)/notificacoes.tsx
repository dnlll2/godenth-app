import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Platform, Alert,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

type NotifTipo =
  | 'conexao_solicitada' | 'conexao_aceita'
  | 'nova_mensagem' | 'novo_seguidor' | 'solicitacao_servico'

const NOTIF_META: Record<NotifTipo | string, { icon: string; cor: string; titulo: (p: any) => string; sub?: (p: any) => string }> = {
  conexao_solicitada: {
    icon: '🤝', cor: '#1A6FD4',
    titulo: p => `${p.sender_nome || 'Alguém'} quer se conectar com você`,
    sub: p => p.sender_tipo || '',
  },
  conexao_aceita: {
    icon: '✅', cor: Colors.primary,
    titulo: p => `${p.accepter_nome || 'Alguém'} aceitou sua conexão`,
    sub: p => p.accepter_tipo || '',
  },
  nova_mensagem: {
    icon: '💬', cor: '#7B3FC4',
    titulo: p => `Nova mensagem de ${p.sender_nome || 'alguém'}`,
    sub: p => p.preview || '',
  },
  novo_seguidor: {
    icon: '👁', cor: '#D4600A',
    titulo: p => `${p.follower_nome || 'Alguém'} começou a seguir ${p.page_nome || 'sua página'}`,
    sub: () => '',
  },
  solicitacao_servico: {
    icon: '🛠️', cor: '#D4186A',
    titulo: p => `${p.solicitante_nome || 'Alguém'} solicitou ${p.servico_nome || 'um serviço'}`,
    sub: () => '',
  },
}

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

export default function Notificacoes() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connLoading, setConnLoading] = useState<Record<number, boolean>>({})

  const load = async () => {
    try {
      const [nRes, pRes] = await Promise.all([
        api.get('/notifications?limit=30'),
        api.get('/connections/pending'),
      ])
      setNotifs(nRes.data.notifications || [])
      setUnread(nRes.data.unread || 0)
      setPending(pRes.data.pending || [])
    } catch (err) { console.log(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const markRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`).catch(() => null)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const markAll = async () => {
    await api.put('/notifications/all/read').catch(() => null)
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    setUnread(0)
  }

  const deleteNotif = async (id: number) => {
    await api.delete(`/notifications/${id}`).catch(() => null)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const acceptConn = async (connId: number) => {
    setConnLoading(prev => ({ ...prev, [connId]: true }))
    try {
      await api.put(`/connections/${connId}/accept`)
      setPending(prev => prev.filter(p => p.id !== connId))
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível aceitar')
    } finally {
      setConnLoading(prev => ({ ...prev, [connId]: false }))
    }
  }

  const declineConn = async (connId: number) => {
    setConnLoading(prev => ({ ...prev, [connId]: true }))
    try {
      await api.delete(`/connections/${connId}`)
      setPending(prev => prev.filter(p => p.id !== connId))
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível recusar')
    } finally {
      setConnLoading(prev => ({ ...prev, [connId]: false }))
    }
  }

  const handleNotifPress = (item: any) => {
    if (!item.read_at) markRead(item.id)
    const p = item.payload_json || {}
    if (item.tipo === 'nova_mensagem' && p.sender_id) {
      router.push(`/usuario/${p.sender_id}` as any)
    } else if (item.tipo === 'conexao_aceita' && p.accepter_id) {
      router.push(`/usuario/${p.accepter_id}` as any)
    } else if (item.tipo === 'conexao_solicitada' && p.sender_id) {
      router.push(`/usuario/${p.sender_id}` as any)
    }
  }

  const handleLongPress = (item: any) => {
    Alert.alert('Notificação', 'O que deseja fazer?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteNotif(item.id) },
    ])
  }

  const renderPending = ({ item }: any) => {
    const busy = connLoading[item.id]
    return (
      <View style={s.pendingCard}>
        <TouchableOpacity
          style={s.pendingLeft}
          onPress={() => router.push(`/usuario/${item.user_id || item.id}` as any)}
          activeOpacity={0.75}
        >
          <View style={[s.pendingAv, { backgroundColor: Colors.dentista }]}>
            <Text style={s.pendingAvT}>{item.nome?.charAt(0) || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.pendingNome} numberOfLines={1}>{item.nome}</Text>
            <Text style={s.pendingTipo} numberOfLines={1}>{item.tipo_profissional}</Text>
            {item.cidade ? (
              <Text style={s.pendingLoc}>📍 {item.cidade}{item.estado ? ` · ${item.estado}` : ''}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <View style={s.pendingBtns}>
          <TouchableOpacity
            style={[s.btnAceitar, busy && { opacity: 0.6 }]}
            onPress={() => acceptConn(item.id)}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.btnAceitarT}>Aceitar</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btnRecusar, busy && { opacity: 0.6 }]}
            onPress={() => declineConn(item.id)}
            disabled={busy}
          >
            <Text style={s.btnRecusarT}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderNotif = ({ item }: any) => {
    const meta = NOTIF_META[item.tipo] || { icon: '🔔', cor: Colors.text3, titulo: () => item.tipo, sub: () => '' }
    const p = item.payload_json || {}
    const isUnread = !item.read_at
    return (
      <TouchableOpacity
        style={[s.notifItem, isUnread && s.notifUnread]}
        onPress={() => handleNotifPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        {isUnread && <View style={[s.unreadBar, { backgroundColor: meta.cor }]} />}
        <View style={[s.notifIcon, { backgroundColor: meta.cor + '18' }]}>
          <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.notifTitle, !isUnread && { fontWeight: '600', color: Colors.text2 }]}>
            {meta.titulo(p)}
          </Text>
          {meta.sub && meta.sub(p) ? (
            <Text style={s.notifSub} numberOfLines={2}>{meta.sub(p)}</Text>
          ) : null}
          <Text style={s.notifTime}>{timeAgo(item.created_at)}</Text>
        </View>
        {isUnread && <View style={s.unreadDot} />}
      </TouchableOpacity>
    )
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Notificações</Text>
          {unread > 0 && (
            <Text style={s.sub}>{unread} não {unread === 1 ? 'lida' : 'lidas'}</Text>
          )}
        </View>
        {unread > 0 && (
          <TouchableOpacity style={s.markAllBtn} onPress={markAll}>
            <Text style={s.markAllT}>✓ Marcar lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load() }}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          pending.length > 0 ? (
            <View>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Solicitações de Conexão</Text>
                <View style={s.sectionBadge}>
                  <Text style={s.sectionBadgeT}>{pending.length}</Text>
                </View>
              </View>
              {pending.map(item => (
                <View key={item.id}>{renderPending({ item })}</View>
              ))}
              <View style={s.divider} />
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Atividade</Text>
              </View>
            </View>
          ) : notifs.length > 0 ? (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Atividade</Text>
            </View>
          ) : null
        }
        renderItem={renderNotif}
        contentContainerStyle={notifs.length === 0 && pending.length === 0 ? s.emptyContainer : { paddingBottom: 40 }}
        ListEmptyComponent={
          pending.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 48, marginBottom: 14 }}>🔔</Text>
              <Text style={s.emptyTitle}>Tudo em dia!</Text>
              <Text style={s.emptySub}>Nenhuma notificação no momento</Text>
            </View>
          ) : null
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
  sub: { fontSize: 12, color: Colors.primary, marginTop: 2, fontWeight: '700' },
  markAllBtn: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  markAllT: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bg },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionBadge: { backgroundColor: Colors.primary, borderRadius: 100, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  sectionBadgeT: { color: '#fff', fontSize: 10, fontWeight: '800' },
  divider: { height: 8, backgroundColor: Colors.bg },

  pendingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  pendingLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingAv: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  pendingAvT: { color: '#fff', fontWeight: '800', fontSize: 18 },
  pendingNome: { fontSize: 14, fontWeight: '800', color: Colors.text },
  pendingTipo: { fontSize: 12, color: Colors.text2, fontWeight: '600', marginTop: 1 },
  pendingLoc: { fontSize: 11, color: Colors.text3, marginTop: 1 },
  pendingBtns: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  btnAceitar: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, minWidth: 70, alignItems: 'center' },
  btnAceitarT: { color: '#fff', fontSize: 12, fontWeight: '800' },
  btnRecusar: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  btnRecusarT: { fontSize: 14, color: Colors.text3, fontWeight: '700' },

  notifItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative',
  },
  notifUnread: { backgroundColor: '#FAFFFE' },
  unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  notifIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  notifTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, lineHeight: 18 },
  notifSub: { fontSize: 12, color: Colors.text3, marginTop: 2, lineHeight: 16 },
  notifTime: { fontSize: 11, color: Colors.text3, marginTop: 4, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, flexShrink: 0 },

  emptyContainer: { flex: 1 },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.text3 },
})
