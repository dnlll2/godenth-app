import { useState, useEffect, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

function fmt(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function dateSep(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user: me } = useAuthStore()
  const [messages, setMessages] = useState<any[]>([])
  const [other, setOther] = useState<any>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const flatRef = useRef<FlatList>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadMessages = async (silent = false) => {
    try {
      const res = await api.get(`/messages/${id}`)
      setMessages(res.data.messages || [])
    } catch { }
    finally { if (!silent) setLoading(false) }
  }

  useEffect(() => {
    api.get(`/users/${id}`).then(r => setOther(r.data)).catch(() => null)
    loadMessages()
    intervalRef.current = setInterval(() => loadMessages(true), 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [id])

  const send = async () => {
    const msg = text.trim()
    if (!msg || sending) return
    setText('')
    setSending(true)
    try {
      const res = await api.post('/messages', { receiver_id: parseInt(id), conteudo: msg })
      setMessages(prev => [...prev, res.data.msg])
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
    } catch { setText(msg) }
    finally { setSending(false) }
  }

  const tipoCor = Colors.primary2

  return (
    <View style={s.root}>
      <View style={[s.header, { backgroundColor: tipoCor }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.headerInfo}
          onPress={() => router.push(`/usuario/${id}` as any)}
          activeOpacity={0.8}
        >
          <View style={s.headerAv}>
            <Text style={s.headerAvT}>{other?.nome?.charAt(0) || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerNome} numberOfLines={1}>{other?.nome || '...'}</Text>
            <Text style={s.headerTipo} numberOfLines={1}>{other?.tipo_profissional || 'Ver perfil →'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 14, paddingBottom: 12 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const isMe = item.sender_id === me?.id
            const prev = messages[index - 1]
            const showSep = !prev || new Date(item.created_at).toDateString() !== new Date(prev.created_at).toDateString()
            return (
              <View>
                {showSep && (
                  <Text style={s.dateSep}>{dateSep(item.created_at)}</Text>
                )}
                <View style={[s.row, isMe ? s.rowMe : s.rowOther]}>
                  <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
                    <Text style={[s.bubbleText, isMe && s.bubbleTextMe]}>{item.conteudo}</Text>
                    <Text style={[s.time, isMe && s.timeMe]}>{fmt(item.created_at)}</Text>
                  </View>
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>💬</Text>
              <Text style={s.emptyTitle}>Nenhuma mensagem ainda</Text>
              <Text style={s.emptySub}>Envie a primeira mensagem para {other?.nome?.split(' ')[0] || 'este profissional'}</Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={Colors.text3}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnOff]}
            onPress={send}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.sendBtnT}>›</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 52 : 12,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAv: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  headerAvT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  headerNome: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerTipo: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  dateSep: { textAlign: 'center', fontSize: 11, color: Colors.text3, fontWeight: '700', marginVertical: 12 },
  row: { flexDirection: 'row', marginBottom: 4 },
  rowMe: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  time: { fontSize: 10, color: Colors.text3, marginTop: 4, textAlign: 'right' },
  timeMe: { color: 'rgba(255,255,255,0.65)' },
  emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: Colors.text, maxHeight: 100,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { backgroundColor: Colors.border2 },
  sendBtnT: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 26, marginLeft: 2 },
})
