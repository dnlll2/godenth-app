import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../services/api'

const API_BASE = 'https://godenth-api-production.up.railway.app'

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

const DISP_META: Record<string, { label: string; cor: string }> = {
  disponivel: { label: 'Disponível', cor: '#00A880' },
  contratado: { label: 'Contratado', cor: '#1A6FD4' },
  freelancer: { label: 'Freelancer', cor: '#C49800' },
  parceria: { label: 'Parcerias', cor: '#7B3FC4' },
}

const ABAS = ['Sobre', 'Experiência', 'Formação', 'Habilidades']

export default function PerfilPublico() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('Sobre')

  useEffect(() => {
    api.get(`/users/${id}`)
      .then(r => setProfile(r.data))
      .catch(e => console.log(e))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#00A880" size="large" /></View>
  }

  if (!profile) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#0A1C14', marginBottom: 20 }}>Usuário não encontrado</Text>
        <TouchableOpacity style={s.btnVoltar} onPress={() => router.back()}>
          <Text style={s.btnVoltarT}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const tipoCor = TIPO_CORES[profile.tipo_profissional] || '#007A6E'
  const priv = profile.privacidade || {}
  const disp = profile.disponibilidade ? DISP_META[profile.disponibilidade] : null
  const avatarSrc = profile.avatar_url
    ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : API_BASE + profile.avatar_url)
    : null

  const renderSobre = () => (
    <View style={s.tabContent}>
      {profile.bio ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>📝 Resumo</Text>
          <Text style={s.cardText}>{profile.bio}</Text>
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.cardTitle}>📍 Localização</Text>
        <Text style={s.cardText}>
          {profile.cidade || 'Não informada'}{profile.estado ? ` · ${profile.estado}` : ''}
        </Text>
      </View>

      {!priv.ocultar_email && profile.email ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>✉️ E-mail</Text>
          <Text style={s.cardText}>{profile.email}</Text>
        </View>
      ) : null}

      {!priv.ocultar_celular && profile.celular ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>📱 Celular / WhatsApp</Text>
          <Text style={s.cardText}>{profile.celular}</Text>
        </View>
      ) : null}

      {profile.instagram ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>📸 Instagram</Text>
          <Text style={s.cardText}>@{profile.instagram}</Text>
        </View>
      ) : null}
    </View>
  )

  const renderExperiencia = () => {
    const extras = profile.cargos_extras || []
    const especialidades = profile.especialidades || []
    return (
      <View style={s.tabContent}>
        <View style={s.card}>
          <Text style={s.cardTitle}>🎯 Cargo Principal</Text>
          <Text style={s.cardValue}>{profile.tipo_profissional}</Text>
          {profile.cro ? <Text style={[s.cardText, { marginTop: 4 }]}>CRO: {profile.cro}</Text> : null}
        </View>

        {extras.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>➕ Cargos Adicionais</Text>
            {extras.map((e: any, i: number) => (
              <Text key={i} style={s.cardItem}>• {e.label || e}</Text>
            ))}
          </View>
        )}

        {especialidades.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>⭐ Especialidades</Text>
            <View style={s.chips}>
              {especialidades.map((esp: string, i: number) => (
                <View key={i} style={[s.chip, { borderColor: tipoCor + '55', backgroundColor: tipoCor + '12' }]}>
                  <Text style={[s.chipT, { color: tipoCor }]}>{esp}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {extras.length === 0 && especialidades.length === 0 && (
          <View style={s.emptyCard}><Text style={s.emptyT}>Nenhuma informação adicional</Text></View>
        )}
      </View>
    )
  }

  const renderFormacao = () => (
    <View style={s.tabContent}>
      {(profile.formacao || []).length > 0 ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>🎓 Formação Acadêmica</Text>
          {(profile.formacao || []).map((f: any, i: number) => (
            <View key={f.id || i} style={[s.timelineItem, i > 0 && { marginTop: 12 }]}>
              <Text style={[s.timelineType, { color: tipoCor }]}>
                {f.tipo ? `${f.tipo} · ` : ''}{f.curso}
              </Text>
              <Text style={s.timelineInst}>{f.instituicao}</Text>
              {(f.ano_inicio || f.ano_conclusao) && (
                <Text style={s.timelineDate}>{f.ano_inicio || '?'} — {f.ano_conclusao || 'Em curso'}</Text>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={s.emptyCard}><Text style={s.emptyT}>Nenhuma formação cadastrada</Text></View>
      )}

      {(profile.experiencia || []).length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>💼 Experiência Profissional</Text>
          {(profile.experiencia || []).map((e: any, i: number) => (
            <View key={e.id || i} style={[s.timelineItem, i > 0 && { marginTop: 12 }]}>
              <Text style={[s.timelineType, { color: '#1A6FD4' }]}>{e.cargo}</Text>
              <Text style={s.timelineInst}>{e.empresa}</Text>
              {(e.inicio || e.fim) && (
                <Text style={s.timelineDate}>
                  {e.inicio || '?'} — {e.atual ? 'Atualmente' : (e.fim || '?')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )

  const renderHabilidades = () => {
    const habilidades = profile.habilidades || []
    return (
      <View style={s.tabContent}>
        {habilidades.length > 0 ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>🛠️ Habilidades e Competências</Text>
            <View style={s.chips}>
              {habilidades.map((hab: string, i: number) => (
                <View key={i} style={s.chipHab}>
                  <Text style={s.chipHabT}>{hab}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.emptyCard}><Text style={s.emptyT}>Nenhuma habilidade cadastrada</Text></View>
        )}
      </View>
    )
  }

  return (
    <View style={s.root}>
      <View style={[s.header, { backgroundColor: tipoCor }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerSide}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Perfil</Text>
        <View style={s.headerSide} />
      </View>

      <View style={[s.cover, { backgroundColor: tipoCor }]}>
        <Text style={s.coverWatermark} numberOfLines={1} ellipsizeMode="clip">
          {(profile.tipo_profissional || '').toUpperCase()}
        </Text>
      </View>

      <View style={s.avatarRow}>
        {avatarSrc
          ? <Image source={{ uri: avatarSrc }} style={s.avatarImg} />
          : (
            <View style={[s.avatar, { backgroundColor: tipoCor }]}>
              <Text style={s.avatarText}>{profile.nome?.charAt(0) || 'U'}</Text>
            </View>
          )
        }
        {disp && (
          <View style={[s.dispBadge, { backgroundColor: disp.cor + '18', borderColor: disp.cor + '60' }]}>
            <View style={[s.dispDot, { backgroundColor: disp.cor }]} />
            <Text style={[s.dispBadgeT, { color: disp.cor }]}>{disp.label}</Text>
          </View>
        )}
      </View>

      <View style={s.info}>
        <Text style={s.nome}>{profile.nome}</Text>
        <Text style={s.cargo}>{profile.tipo_profissional}</Text>
        {profile.cidade ? (
          <Text style={s.loc}>📍 {profile.cidade}{profile.estado ? ` · ${profile.estado}` : ''}</Text>
        ) : null}
      </View>

      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={[s.statN, { color: tipoCor }]}>0</Text>
          <Text style={s.statL}>Conexões</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statN, { color: tipoCor }]}>{(profile.especialidades || []).length}</Text>
          <Text style={s.statL}>Especialidades</Text>
        </View>
        <View style={[s.stat, { borderRightWidth: 0 }]}>
          <Text style={[s.statN, { color: tipoCor }]}>{(profile.habilidades || []).length}</Text>
          <Text style={s.statL}>Habilidades</Text>
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: tipoCor }]}>
          <Text style={s.actionBtnT}>🤝 Conectar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtnOutline, { borderColor: tipoCor }]}>
          <Text style={[s.actionBtnOutlineT, { color: tipoCor }]}>💬 Mensagem</Text>
        </TouchableOpacity>
      </View>

      <View style={s.abas}>
        {ABAS.map(a => (
          <TouchableOpacity
            key={a}
            style={[s.aba, aba === a && { borderBottomColor: tipoCor }]}
            onPress={() => setAba(a)}
          >
            <Text style={[s.abaT, aba === a && { color: tipoCor }]}>{a}</Text>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEF7F2' },
  btnVoltar: { backgroundColor: '#007A6E', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  btnVoltarT: { color: '#fff', fontWeight: '800', fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
  },
  headerSide: { width: 40 },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },

  cover: { height: 100, overflow: 'hidden' },
  coverWatermark: {
    position: 'absolute', bottom: -8, left: 10, right: 10,
    fontSize: 58, fontWeight: '900', color: 'rgba(255,255,255,0.13)', letterSpacing: 3,
  },

  avatarRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: -28, marginBottom: 8,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarImg: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#fff' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  dispBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 4 },
  dispDot: { width: 7, height: 7, borderRadius: 4 },
  dispBadgeT: { fontSize: 12, fontWeight: '700' },

  info: { paddingHorizontal: 16, marginBottom: 8 },
  nome: { fontSize: 20, fontWeight: '800', color: '#0A1C14' },
  cargo: { fontSize: 13, color: '#3A6550', marginTop: 2 },
  loc: { fontSize: 12, color: '#7A9E8E', marginTop: 2 },

  stats: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D0E8DA' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: '#D0E8DA' },
  statN: { fontSize: 18, fontWeight: '800' },
  statL: { fontSize: 10, color: '#7A9E8E', marginTop: 2, fontWeight: '600' },

  actions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#D0E8DA',
  },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  actionBtnT: { color: '#fff', fontSize: 14, fontWeight: '800' },
  actionBtnOutline: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, backgroundColor: '#fff' },
  actionBtnOutlineT: { fontSize: 14, fontWeight: '800' },

  abas: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#D0E8DA' },
  aba: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  abaT: { fontSize: 12, fontWeight: '700', color: '#7A9E8E' },

  tabContent: { padding: 16, gap: 12, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#D0E8DA' },
  cardTitle: { fontSize: 11, fontWeight: '800', color: '#3A6550', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  cardText: { fontSize: 14, color: '#0A1C14', lineHeight: 22 },
  cardValue: { fontSize: 16, fontWeight: '700', color: '#0A1C14' },
  cardItem: { fontSize: 14, color: '#0A1C14', marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  chipT: { fontSize: 12, fontWeight: '600' },
  chipHab: { backgroundColor: 'rgba(26,111,212,0.1)', borderWidth: 1, borderColor: 'rgba(26,111,212,0.3)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  chipHabT: { fontSize: 12, fontWeight: '600', color: '#1A6FD4' },
  timelineItem: { borderLeftWidth: 2, borderLeftColor: '#D0E8DA', paddingLeft: 12 },
  timelineType: { fontSize: 11, fontWeight: '800', marginBottom: 2 },
  timelineInst: { fontSize: 13, fontWeight: '600', color: '#0A1C14' },
  timelineDate: { fontSize: 11, color: '#7A9E8E', marginTop: 2 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, borderWidth: 2, borderColor: '#D0E8DA', borderStyle: 'dashed', alignItems: 'center' },
  emptyT: { fontSize: 14, fontWeight: '600', color: '#A0B8AC' },
})
