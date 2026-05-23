import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

// ── Dados das etapas ──────────────────────────────────────────────────────────

const TIPOS = [
  {
    key: 'parceria',
    emoji: '🤝',
    label: 'Busco Parceria',
    desc: 'Lab, clínica, especialista ou fornecedor para trabalhar junto',
    cor: '#00A880',
  },
  {
    key: 'vaga',
    emoji: '🛠️',
    label: 'Ofereço Serviço',
    desc: 'Plantão, freelance ou serviço pontual com condição especial',
    cor: '#1A6FD4',
  },
  {
    key: 'ajuda',
    emoji: '📋',
    label: 'Tenho uma Demanda',
    desc: 'Substituto, manutenção, equipamento ou caso urgente',
    cor: '#E53935',
  },
]

const SUBCATEGORIAS: Record<string, string[]> = {
  parceria: [
    'Clínica', 'Laboratório', 'Especialista', 'Fornecedor', 'Investidor',
  ],
  vaga: [
    'Plantão', 'Freelance', 'Prótese', 'Ortodontia',
    'Implante', 'Radiologia', 'Avaliação', 'Consultoria',
  ],
  ajuda: [
    'Substituto', 'Urgente', 'Plantão', 'Cobertura',
    'Caso específico', 'Manutenção', 'Equipamento', 'Reparo',
  ],
}

const PLACEHOLDER: Record<string, string> = {
  parceria: 'Descreva o perfil que busca, sua especialidade e como quer trabalhar junto…',
  vaga:     'Descreva o serviço que oferece, disponibilidade e condições…',
  ajuda:    'Descreva a demanda, urgência e como a pessoa deve entrar em contato…',
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function Publicar() {
  const { user } = useAuthStore()

  const [etapa, setEtapa]           = useState<1 | 2 | 3>(1)
  const [tipo, setTipo]             = useState<string | null>(null)
  const [subcategoria, setSubcategoria] = useState<string | null>(null)
  const [texto, setTexto]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [published, setPublished]   = useState(false)

  const tipoMeta = TIPOS.find(t => t.key === tipo)
  const cor = tipoMeta?.cor || '#1c909b'

  const reset = () => {
    setEtapa(1)
    setTipo(null)
    setSubcategoria(null)
    setTexto('')
  }

  const voltar = () => {
    if (etapa === 1) {
      router.back()
    } else if (etapa === 2) {
      setEtapa(1)
      setSubcategoria(null)
    } else {
      setEtapa(2)
    }
  }

  const selecionarTipo = (key: string) => {
    setTipo(key)
    setSubcategoria(null)
    setEtapa(2)
  }

  const selecionarSubcategoria = (sub: string) => {
    setSubcategoria(sub)
    setEtapa(3)
  }

  const handlePublish = async () => {
    if (!texto.trim()) {
      return Alert.alert('Atenção', 'Escreva uma descrição para o seu post')
    }
    setLoading(true)
    try {
      await api.post('/posts', {
        tipo_post: tipo,
        data_json: {
          texto:        texto.trim(),
          subcategoria: subcategoria,
          cidade:       user?.cidade || '',
          estado:       user?.estado || '',
        },
      })
      setPublished(true)
      setTimeout(() => {
        router.replace('/(tabs)/feed' as any)
      }, 1500)
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível publicar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F8F4' }}>

      {/* ── Header dinâmico ── */}
      <View style={[s.header, { backgroundColor: cor }]}>
        <TouchableOpacity onPress={voltar} style={s.backBtn} activeOpacity={0.75}>
          <Text style={s.backBtnT}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {etapa === 1 ? 'Nova publicação' : etapa === 2 ? 'Especialidade' : 'Descrição'}
        </Text>
        <View style={s.dotsRow}>
          {([1, 2, 3] as const).map(n => (
            <View key={n} style={[s.dot, etapa >= n && s.dotOn]} />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── ETAPA 1: Tipo ── */}
        {etapa === 1 && (
          <View>
            <Text style={s.etapaLabel}>O que você quer publicar?</Text>
            {TIPOS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.tipoCard, { borderColor: t.cor, backgroundColor: t.cor + '12' }]}
                onPress={() => selecionarTipo(t.key)}
                activeOpacity={0.82}
              >
                <Text style={s.tipoEmoji}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.tipoLabel, { color: t.cor }]}>{t.label}</Text>
                  <Text style={s.tipoDesc}>{t.desc}</Text>
                </View>
                <Text style={[s.tipoArrow, { color: t.cor }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── ETAPA 2: Subcategoria ── */}
        {etapa === 2 && tipo && (
          <View>
            <Text style={s.etapaLabel}>Qual especialidade ou área?</Text>
            <View style={s.chipsGrid}>
              {SUBCATEGORIAS[tipo].map(sub => {
                const on = subcategoria === sub
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[s.chip, on && { backgroundColor: cor, borderColor: cor }]}
                    onPress={() => selecionarSubcategoria(sub)}
                    activeOpacity={0.78}
                  >
                    <Text style={[s.chipT, on && { color: '#fff' }]}>{sub}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* ── ETAPA 3: Texto + localização ── */}
        {etapa === 3 && tipoMeta && (
          <View>
            <Text style={s.etapaLabel}>Descreva sua publicação</Text>

            {/* Badge tipo + subcategoria */}
            <View style={[s.subcBadge, { backgroundColor: cor + '18', borderColor: cor + '50' }]}>
              <Text style={[s.subcBadgeT, { color: cor }]}>
                {tipoMeta.emoji} {tipoMeta.label} · {subcategoria}
              </Text>
            </View>

            {/* Localização travada */}
            <View style={s.locRow}>
              <View style={[s.locBox, { flex: 1 }]}>
                <Text style={s.locLabel}>📍 Cidade</Text>
                <Text style={s.locVal}>{user?.cidade || 'Não informada'}</Text>
              </View>
              <View style={s.locBox}>
                <Text style={s.locLabel}>Estado</Text>
                <Text style={s.locVal}>{user?.estado || '—'}</Text>
              </View>
            </View>
            {(!user?.cidade || !user?.estado) && (
              <Text style={s.locHint}>
                Localização não preenchida — complete seu perfil para aumentar a visibilidade
              </Text>
            )}

            {/* Texto livre */}
            <TextInput
              style={s.textarea}
              placeholder={PLACEHOLDER[tipo!]}
              placeholderTextColor="#A0B8AC"
              value={texto}
              onChangeText={setTexto}
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              maxLength={800}
            />
            <Text style={s.charCount}>{texto.length}/800</Text>

            <TouchableOpacity
              style={[s.publishBtn, { backgroundColor: cor }, loading && { opacity: 0.75 }]}
              onPress={handlePublish}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.publishBtnT}>Publicar →</Text>
              }
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Overlay de sucesso ── */}
      {published && (
        <View style={s.successOverlay}>
          <Text style={s.successIcon}>✅</Text>
          <Text style={s.successTitle}>Publicado com sucesso!</Text>
          <Text style={s.successSub}>Redirecionando para o feed…</Text>
        </View>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  backBtnT: { color: '#fff', fontSize: 26, lineHeight: 30, fontWeight: '300' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff' },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.30)' },
  dotOn: { backgroundColor: '#fff' },

  body: { padding: 20, paddingBottom: 56 },

  etapaLabel: { fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 20 },

  // Etapa 1 — cards de tipo
  tipoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 2, borderRadius: 16, padding: 18, marginBottom: 12,
  },
  tipoEmoji: { fontSize: 30 },
  tipoLabel: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  tipoDesc:  { fontSize: 12, color: '#7A9E8E', lineHeight: 17 },
  tipoArrow: { fontSize: 24, fontWeight: '300' },

  // Etapa 2 — chips
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 100,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
  },
  chipT: { fontSize: 13, fontWeight: '700', color: '#3A6550' },

  // Etapa 3
  subcBadge: {
    borderWidth: 1, borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'flex-start', marginBottom: 16,
  },
  subcBadgeT: { fontSize: 13, fontWeight: '700' },

  locRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  locBox: {
    backgroundColor: '#E8F5EE', borderWidth: 1, borderColor: '#D0E8DA',
    borderRadius: 12, padding: 12,
  },
  locLabel: { fontSize: 10, fontWeight: '700', color: '#7A9E8E', marginBottom: 3 },
  locVal:   { fontSize: 14, fontWeight: '800', color: '#0A1C14' },
  locHint:  { fontSize: 11, color: '#C49800', marginBottom: 14, lineHeight: 16 },

  textarea: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA',
    borderRadius: 14, padding: 14, fontSize: 14, color: '#0A1C14',
    minHeight: 160, marginTop: 16, lineHeight: 22,
  },
  charCount: { fontSize: 11, color: '#A0B8AC', textAlign: 'right', marginTop: 4, marginBottom: 20 },

  publishBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  publishBtnT: { color: '#fff', fontSize: 16, fontWeight: '800' },

  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00A880',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successIcon:  { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  successSub:   { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
})
