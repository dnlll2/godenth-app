import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const PRIMARY = '#1c909b'

export default function Privacidade() {
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backT}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Política de Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.brand}>GoDenth — Política de Privacidade</Text>
        <Text style={s.updated}>Última atualização: junho de 2026</Text>

        <Section title="1. Dados Coletados">
          Coletamos as seguintes informações quando você usa o GoDenth:{'\n\n'}
          • <B>Dados de cadastro:</B> nome, e-mail, senha (armazenada de forma criptografada), cidade e estado.{'\n'}
          • <B>Dados de perfil profissional:</B> tipo profissional, especialidades, habilidades, bio, experiência, formação acadêmica e foto de perfil.{'\n'}
          • <B>Dados de uso:</B> publicações, candidaturas a vagas, curtidas, mensagens trocadas na plataforma e notificações.{'\n'}
          • <B>Dados técnicos:</B> informações do dispositivo, sistema operacional e logs de acesso para fins de segurança e diagnóstico.
        </Section>

        <Section title="2. Como Usamos Seus Dados">
          Utilizamos suas informações para:{'\n\n'}
          • Criar e gerenciar sua conta na plataforma.{'\n'}
          • Exibir seu perfil profissional para outros usuários.{'\n'}
          • Recomendar vagas e profissionais relevantes para você.{'\n'}
          • Enviar notificações sobre atividades relacionadas ao seu perfil.{'\n'}
          • Melhorar os serviços e corrigir problemas técnicos.{'\n'}
          • Cumprir obrigações legais aplicáveis.
        </Section>

        <Section title="3. Compartilhamento de Dados">
          Não vendemos seus dados pessoais. Podemos compartilhar informações com:{'\n\n'}
          • <B>Provedores de serviços:</B> empresas de infraestrutura e hospedagem necessárias para o funcionamento da plataforma (ex.: servidores, armazenamento de imagens).{'\n'}
          • <B>Autoridades competentes:</B> quando exigido por lei, decisão judicial ou regulamentação aplicável.{'\n\n'}
          Seu perfil profissional (nome, cargo, especialidades, bio) é visível para outros usuários logados na plataforma.
        </Section>

        <Section title="4. Segurança">
          Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda ou divulgação indevida:{'\n\n'}
          • Senhas armazenadas com hash seguro (bcrypt).{'\n'}
          • Comunicação via HTTPS (TLS).{'\n'}
          • Acesso restrito aos dados por parte da equipe.{'\n\n'}
          Apesar dos nossos esforços, nenhum sistema é 100% seguro. Em caso de incidente, você será notificado conforme exigido pela LGPD.
        </Section>

        <Section title="5. Seus Direitos (LGPD)">
          De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos:{'\n\n'}
          • <B>Acesso:</B> solicitar uma cópia dos dados que temos sobre você.{'\n'}
          • <B>Correção:</B> corrigir dados incorretos ou incompletos.{'\n'}
          • <B>Exclusão:</B> solicitar a exclusão de seus dados pessoais.{'\n'}
          • <B>Portabilidade:</B> receber seus dados em formato estruturado.{'\n'}
          • <B>Revogação do consentimento:</B> retirar seu consentimento a qualquer momento.{'\n'}
          • <B>Oposição:</B> opor-se ao tratamento de dados em determinadas situações.{'\n\n'}
          Para exercer seus direitos, entre em contato pelo e-mail abaixo.
        </Section>

        <Section title="6. Menores de Idade">
          O GoDenth é destinado a profissionais e estudantes da área de saúde bucal. Não coletamos intencionalmente dados de pessoas com menos de 16 anos. Se você acredita que um menor forneceu dados pessoais, entre em contato para que possamos removê-los.
        </Section>

        <Section title="7. Contato">
          Para dúvidas, solicitações ou exercício dos seus direitos, entre em contato:{'\n\n'}
          <B>E-mail:</B> contato.idealilab@gmail.com{'\n'}
          <B>Responsável:</B> Equipe GoDenth / Ideali Lab
        </Section>
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionBody}>{children}</Text>
    </View>
  )
}

function B({ children }: { children: string }) {
  return <Text style={{ fontWeight: '800' }}>{children}</Text>
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F8F4' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backT: { fontSize: 22, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  scroll: { padding: 20, paddingBottom: 48 },
  brand: { fontSize: 20, fontWeight: '900', color: '#0A1C14', marginBottom: 4 },
  updated: { fontSize: 12, color: '#7A9E8E', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: PRIMARY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionBody: { fontSize: 14, color: '#2A4A3C', lineHeight: 22 },
})
