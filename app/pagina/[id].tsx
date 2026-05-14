import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Linking, Platform, Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

const API_BASE = 'https://godenth-api-production.up.railway.app'

const CAT_COR: Record<string, string> = {
  clinica: Colors.clinica,
  laboratorio: Colors.laboratorio,
  fabricante: Colors.fabricante,
  ensino: Colors.ensino,
  marketing: Colors.marketing,
  gestao: Colors.gestao,
  servicos: Colors.servicos,
}

const CAT_LABEL: Record<string, string> = {
  clinica: 'Clínica Odontológica',
  laboratorio: 'Laboratório de Prótese',
  fabricante: 'Fabricante / Distribuidora',
  ensino: 'Instituição de Ensino',
  marketing: 'Marketing & Comunicação',
  gestao: 'Gestão & Consultoria',
  servicos: 'Serviços Profissionais',
}

const ABAS = ['Sobre', 'Vagas']

export default function PaginaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('Sobre')

  const isOwner = user?.id === page?.user_id

  useEffect(() => {
    api.get(`/pages/${id}`)
      .then(r => setPage(r.data))
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar a página'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  if (!page) return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 20 }}>Página não encontrada</Text>
      <TouchableOpacity style={s.btnVoltar} onPress={() => router.back()}>
        <Text style={s.btnVoltarT}>← Voltar</Text>
      </TouchableOpacity>
    </View>
  )

  const cor = page.cor || CAT_COR[page.categoria] || Colors.primary
  const logoSrc = page.logo_url ? (page.logo_url.startsWith('http') ? page.logo_url : API_BASE + page.logo_url) : null
  const vagas: any[] = page.vagas || []

  return (
    <View style={s.root}>
      <View style={[s.header, { backgroundColor: cor }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerSide}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Página</Text>
        {isOwner ? (
          <TouchableOpacity style={s.headerSide} onPress={() => router.push(`/editar-pagina/${id}` as any)}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Editar</Text>
          </TouchableOpacity>
        ) : <View style={s.headerSide} />}
      </View>

      <View style={[s.cover, { backgroundColor: cor }]}>
        <Text style={s.coverWatermark} numberOfLines={1} ellipsizeMode="clip">
          {(CAT_LABEL[page.categoria] || page.categoria || '').toUpperCase()}
        </Text>
        {page.cover_url ? (
          <Image source={{ uri: page.cover_url.startsWith('http') ? page.cover_url : API_BASE + page.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
      </View>

      <View style={s.avatarRow}>
        {logoSrc ? (
          <Image source={{ uri: logoSrc }} style={s.logo} resizeMode="cover" />
        ) : (
          <View style={[s.logo, { backgroundColor: cor, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{page.nome?.charAt(0) || 'P'}</Text>
          </View>
        )}
        {page.verificada && (
          <View style={s.badge}>
            <Text style={s.badgeT}>✓ Verificada</Text>
          </View>
        )}
      </View>

      <View style={s.info}>
        <Text style={s.nome}>{page.nome}</Text>
        <Text style={[s.catChip, { color: cor }]}>{CAT_LABEL[page.categoria] || page.categoria}</Text>
        {(page.cidade || page.estado) && (
          <Text style={s.loc}>📍 {page.cidade}{page.estado ? ` · ${page.estado}` : ''}</Text>
        )}
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={[s.statN, { color: cor }]}>{vagas.length}</Text>
          <Text style={s.statL}>Vagas abertas</Text>
        </View>
      </View>

      {(page.telefone || page.site) && (
        <View style={s.contacts}>
          {page.telefone && (
            <TouchableOpacity style={[s.contactBtn, { borderColor: cor }]} onPress={() => Linking.openURL(`tel:${page.telefone}`)}>
              <Text style={[s.contactBtnT, { color: cor }]}>📞 Ligar</Text>
            </TouchableOpacity>
          )}
          {page.site && (
            <TouchableOpacity style={[s.contactBtn, { borderColor: cor }]} onPress={() => Linking.openURL(page.site.startsWith('http') ? page.site : `https://${page.site}`)}>
              <Text style={[s.contactBtnT, { color: cor }]}>🌐 Site</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={s.abas}>
        {ABAS.map(a => (
          <TouchableOpacity key={a} style={[s.aba, aba === a && { borderBottomColor: cor }]} onPress={() => setAba(a)}>
            <Text style={[s.abaT, aba === a && { color: cor }]}>{a}{a === 'Vagas' && vagas.length > 0 ? ` (${vagas.length})` : ''}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {aba === 'Sobre' && (
          <View style={s.tab}>
            {page.descricao ? (
              <View style={s.card}>
                <Text style={s.cardTitle}>📝 Sobre a empresa</Text>
                <Text style={s.cardText}>{page.descricao}</Text>
              </View>
            ) : null}

            <View style={s.card}>
              <Text style={s.cardTitle}>📋 Informações</Text>
              {page.cnpj ? <Text style={s.cardRow}>CNPJ: <Text style={s.cardVal}>{page.cnpj}</Text></Text> : null}
              {page.telefone ? <Text style={s.cardRow}>Telefone: <Text style={s.cardVal}>{page.telefone}</Text></Text> : null}
              {page.site ? <Text style={s.cardRow}>Site: <Text style={[s.cardVal, { color: cor }]}>{page.site}</Text></Text> : null}
              {page.cidade ? <Text style={s.cardRow}>Cidade: <Text style={s.cardVal}>{page.cidade}{page.estado ? ` · ${page.estado}` : ''}</Text></Text> : null}
              {!page.cnpj && !page.telefone && !page.site && !page.cidade && (
                <Text style={s.emptyT}>Nenhuma informação cadastrada</Text>
              )}
            </View>
          </View>
        )}

        {aba === 'Vagas' && (
          <View style={s.tab}>
            {vagas.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
                <Text style={s.emptyT}>Nenhuma vaga aberta no momento</Text>
              </View>
            ) : vagas.map((vaga: any) => (
              <TouchableOpacity key={vaga.id} style={s.vagaCard} onPress={() => router.push(`/(tabs)/vagas` as any)}>
                <View style={s.vagaTop}>
                  <Text style={s.vagaTitulo} numberOfLines={1}>{vaga.titulo}</Text>
                  {vaga.destaque && <View style={[s.vagaDestaque, { backgroundColor: cor + '18' }]}><Text style={[s.vagaDestaqueT, { color: cor }]}>Destaque</Text></View>}
                </View>
                <Text style={s.vagaInfo}>{vaga.cidade}{vaga.estado ? ` · ${vaga.estado}` : ''} · {vaga.modelo || 'Presencial'}</Text>
                {vaga.salario && <Text style={s.vagaSalario}>{vaga.salario}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  btnVoltar: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  btnVoltarT: { color: '#fff', fontWeight: '800', fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
  },
  headerSide: { width: 50 },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },

  cover: { height: 100, overflow: 'hidden' },
  coverWatermark: {
    position: 'absolute', bottom: -8, left: 10, right: 10,
    fontSize: 52, fontWeight: '900', color: 'rgba(255,255,255,0.13)', letterSpacing: 3,
  },

  avatarRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: -28, marginBottom: 8,
  },
  logo: { width: 64, height: 64, borderRadius: 16, borderWidth: 3, borderColor: '#fff' },
  badge: { backgroundColor: 'rgba(0,168,128,0.12)', borderWidth: 1, borderColor: 'rgba(0,168,128,0.4)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 4 },
  badgeT: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  info: { paddingHorizontal: 16, marginBottom: 8 },
  nome: { fontSize: 20, fontWeight: '800', color: Colors.text },
  catChip: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  loc: { fontSize: 12, color: Colors.text3, marginTop: 2 },

  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statN: { fontSize: 18, fontWeight: '800' },
  statL: { fontSize: 10, color: Colors.text3, marginTop: 2, fontWeight: '600' },

  contacts: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  contactBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, backgroundColor: '#fff' },
  contactBtnT: { fontSize: 14, fontWeight: '800' },

  abas: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  aba: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  abaT: { fontSize: 13, fontWeight: '700', color: Colors.text3 },

  tab: { padding: 16, gap: 12, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  cardText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  cardRow: { fontSize: 13, color: Colors.text3, marginBottom: 6, fontWeight: '500' },
  cardVal: { fontWeight: '600', color: Colors.text },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 28, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center' },
  emptyT: { fontSize: 14, fontWeight: '600', color: Colors.text3 },

  vagaCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  vagaTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  vagaTitulo: { fontSize: 15, fontWeight: '800', color: Colors.text, flex: 1 },
  vagaDestaque: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  vagaDestaqueT: { fontSize: 11, fontWeight: '700' },
  vagaInfo: { fontSize: 12, color: Colors.text3, fontWeight: '500' },
  vagaSalario: { fontSize: 13, fontWeight: '700', color: Colors.green, marginTop: 4 },
})
