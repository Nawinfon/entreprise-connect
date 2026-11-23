import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { blink } from '@/lib/blink';
import type { AnnouncementsRow, CompaniesRow, ComplaintsRow, TasksRow } from '@/lib/db-types';
import {
  ArrowRight, Bell, Building2, CheckCircle2, ClipboardList, FileWarning, LogOut,
  Megaphone, MessageSquare, Plus, ShieldCheck, Users, Video, X,
  Button, Card, H1, H2, H3, Input, Paragraph, ScrollView, SizableText, XStack, YStack,
} from '@blinkdotnew/mobile-ui';
import { Screen } from '@/components/Screen';

type User = { id: string; email?: string | null; displayName?: string | null };
type Tab = 'home' | 'announcements' | 'tasks' | 'complaints';

const companyTable = blink.db.table<CompaniesRow>('companies');
const announcementTable = blink.db.table<AnnouncementsRow>('announcements');
const taskTable = blink.db.table<TasksRow>('tasks');
const complaintTable = blink.db.table<ComplaintsRow>('complaints');

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Une erreur est survenue. Réessayez.';
}

function Metric({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return <Card bordered backgroundColor="#FFFFFF" padding="$4" flex={1} minWidth={140} borderColor="#DCE5E2">
    <XStack alignItems="center" gap="$2"><YStack backgroundColor={color} padding="$2" borderRadius="$3">{icon}</YStack><SizableText color="#62736F" size="$2">{label}</SizableText></XStack>
    <H2 color="#142A2A" marginTop="$2">{value}</H2>
  </Card>;
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        await blink.auth.signUp({ email: email.trim(), password, metadata: { displayName: name.trim() } });
        const signedInUser = await blink.auth.me();
        const userId = signedInUser?.id;
        if (userId && company.trim()) {
          const created = await companyTable.create({ userId, name: company.trim(), description: 'Espace de travail Entreprise Connect' });
          await blink.db.table('user_profiles').create({ userId, companyId: created.id, role: 'owner', displayName: name.trim() });
        }
      } else {
        await blink.auth.signInWithEmail(email.trim(), password);
      }
    } catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }

  return <Screen backgroundColor="#F4F8F6" justifyContent="center">
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <YStack padding="$5" maxWidth={520} width="100%" alignSelf="center" gap="$5">
        <YStack gap="$2"><XStack alignItems="center" gap="$2"><YStack backgroundColor="#0E766E" padding="$2" borderRadius="$3"><Building2 color="white" size={22} /></YStack><SizableText color="#0E766E" fontWeight="800" size="$5">ENTREPRISE CONNECT</SizableText></XStack><H1 color="#142A2A">Pilotez votre entreprise avec clarté.</H1><Paragraph color="#62736F">Un espace sécurisé pour vos équipes, vos clients et vos opérations quotidiennes.</Paragraph></YStack>
        <Card bordered backgroundColor="white" padding="$5" borderColor="#DCE5E2" gap="$4">
          <YStack gap="$1"><H2 color="#142A2A">{mode === 'signup' ? 'Créer votre espace patron' : 'Connexion'}</H2><SizableText color="#62736F">{mode === 'signup' ? 'Commencez avec votre compte administrateur principal.' : 'Retrouvez votre espace de travail.'}</SizableText></YStack>
          {mode === 'signup' && <><Input value={name} onChangeText={setName} placeholder="Votre nom complet" minHeight={52} borderColor="#DCE5E2" /><Input value={company} onChangeText={setCompany} placeholder="Nom de l’entreprise" minHeight={52} borderColor="#DCE5E2" /></>}
          <Input value={email} onChangeText={setEmail} placeholder="Adresse e-mail" autoCapitalize="none" keyboardType="email-address" minHeight={52} borderColor="#DCE5E2" />
          <Input value={password} onChangeText={setPassword} placeholder="Mot de passe sécurisé" secureTextEntry minHeight={52} borderColor="#DCE5E2" />
          {!!message && <SizableText color="#B42318">{message}</SizableText>}
          <Button backgroundColor="#0E766E" color="white" size="$5" disabled={busy} onPress={submit}>{busy ? 'Connexion…' : mode === 'signup' ? 'Créer mon espace' : 'Se connecter'} <ArrowRight size={18} color="white" /></Button>
          <Button chromeless color="#0E766E" onPress={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'J’ai déjà un compte' : 'Créer un compte patron'}</Button>
        </Card>
      </YStack>
    </KeyboardAvoidingView>
  </Screen>;
}

function AppShell({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('home');
  const [company, setCompany] = useState<CompaniesRow | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementsRow[]>([]);
  const [tasks, setTasks] = useState<TasksRow[]>([]);
  const [complaints, setComplaints] = useState<ComplaintsRow[]>([]);
  const [composer, setComposer] = useState<'announcement' | 'task' | 'complaint' | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    const companies = await companyTable.list({ where: { userId: user.id }, limit: 1 });
    const current = companies[0] ?? null; setCompany(current);
    if (!current) return;
    const where = { companyId: current.id };
    const [a, t, c] = await Promise.all([
      announcementTable.list({ where, orderBy: { createdAt: 'desc' }, limit: 10 }),
      taskTable.list({ where, orderBy: { createdAt: 'desc' }, limit: 10 }),
      complaintTable.list({ where, orderBy: { createdAt: 'desc' }, limit: 10 }),
    ]);
    setAnnouncements(a); setTasks(t); setComplaints(c);
  }
  useEffect(() => { load().catch((error) => setNotice(errorText(error))); }, [user.id]);

  async function createItem() {
    if (!company || !title.trim()) return;
    try {
      if (composer === 'announcement') await announcementTable.create({ userId: user.id, companyId: company.id, title: title.trim(), body: body.trim(), audience: 'everyone', published: true });
      if (composer === 'task') await taskTable.create({ userId: user.id, companyId: company.id, title: title.trim(), description: body.trim(), assigneeName: 'À attribuer', status: 'todo' });
      if (composer === 'complaint') await complaintTable.create({ userId: user.id, companyId: company.id, title: title.trim(), description: body.trim(), status: 'new' });
      setTitle(''); setBody(''); setComposer(null); setNotice('Enregistré dans votre espace.'); await load();
    } catch (error) { setNotice(errorText(error)); }
  }
  const pendingTasks = useMemo(() => tasks.filter((item) => item.status !== 'done').length, [tasks]);

  return <Screen backgroundColor="#F4F8F6" bottomInset>
    <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 110 }}>
      <YStack padding="$4" gap="$4" maxWidth={1180} width="100%" alignSelf="center">
        <XStack justifyContent="space-between" alignItems="center"><XStack alignItems="center" gap="$2"><YStack backgroundColor="#0E766E" padding="$2" borderRadius="$3"><Building2 color="white" size={20} /></YStack><YStack><SizableText color="#0E766E" fontWeight="800">ENTREPRISE CONNECT</SizableText><SizableText color="#62736F" size="$2">{company?.name ?? 'Votre espace'}</SizableText></YStack></XStack><XStack gap="$2"><Button circular chromeless icon={<Bell size={21} color="#142A2A" />} onPress={() => setNotice('Aucune nouvelle notification.')} /><Button circular chromeless icon={<LogOut size={21} color="#142A2A" />} onPress={() => blink.auth.signOut()} /></XStack></XStack>
        {!!notice && <Card backgroundColor="#E3F4EF" padding="$3" bordered borderColor="#B8DED5"><XStack justifyContent="space-between" alignItems="center"><SizableText color="#0E766E">{notice}</SizableText><Button chromeless size="$2" icon={<X size={16} color="#0E766E" />} onPress={() => setNotice('')} /></XStack></Card>}
        {tab === 'home' && <><YStack backgroundColor="#142A2A" borderRadius="$5" padding="$5" gap="$3"><SizableText color="#9BD8C9" fontWeight="700">VUE D’ENSEMBLE</SizableText><H1 color="white">Bonjour {user.displayName?.split(' ')[0] ?? 'patron'}.</H1><Paragraph color="#C6D8D3">Votre activité est centralisée ici. Créez, déléguez et suivez les priorités de votre entreprise.</Paragraph><Button alignSelf="flex-start" backgroundColor="#8ED7C3" color="#142A2A" onPress={() => setComposer('announcement')}>Publier une annonce <Plus size={17} color="#142A2A" /></Button></YStack><XStack gap="$3" flexWrap="wrap"><Metric icon={<Users size={18} color="white" />} value="1" label="Espace patron" color="#0E766E" /><Metric icon={<ClipboardList size={18} color="white" />} value={String(pendingTasks)} label="Tâches ouvertes" color="#D18B32" /><Metric icon={<FileWarning size={18} color="white" />} value={String(complaints.length)} label="Réclamations" color="#B85C5C" /></XStack><YStack gap="$3"><H2 color="#142A2A">À ne pas manquer</H2>{announcements.length === 0 ? <Empty text="Votre première annonce apparaîtra ici." /> : announcements.slice(0, 3).map((item) => <Card key={item.id} bordered backgroundColor="white" padding="$4" borderColor="#DCE5E2"><SizableText color="#0E766E" size="$2" fontWeight="700">ANNONCE</SizableText><H3 color="#142A2A">{item.title}</H3><Paragraph color="#62736F">{item.body}</Paragraph></Card>)}</YStack></>}
        {tab === 'announcements' && <ListPage title="Annonces & informations" action="Nouvelle annonce" onAction={() => setComposer('announcement')} items={announcements} render={(item) => <Card key={item.id} bordered backgroundColor="white" padding="$4" borderColor="#DCE5E2"><H3 color="#142A2A">{item.title}</H3><Paragraph color="#62736F">{item.body}</Paragraph><SizableText color="#0E766E" size="$2">Visible pour : {item.audience}</SizableText></Card>} empty="Aucune annonce. Créez la première communication de votre entreprise." />}
        {tab === 'tasks' && <ListPage title="Tâches opérationnelles" action="Nouvelle tâche" onAction={() => setComposer('task')} items={tasks} render={(item) => <Card key={item.id} bordered backgroundColor="white" padding="$4" borderColor="#DCE5E2"><XStack justifyContent="space-between"><H3 color="#142A2A">{item.title}</H3><SizableText color={item.status === 'done' ? '#0E766E' : '#D18B32'}>{item.status}</SizableText></XStack><Paragraph color="#62736F">{item.description || 'Aucune description'}</Paragraph><SizableText color="#62736F" size="$2">Responsable : {item.assigneeName}</SizableText></Card>} empty="Aucune tâche. Créez une tâche pour lancer votre organisation." />}
        {tab === 'complaints' && <ListPage title="Réclamations clients" action="Nouvelle réclamation" onAction={() => setComposer('complaint')} items={complaints} render={(item) => <Card key={item.id} bordered backgroundColor="white" padding="$4" borderColor="#DCE5E2"><XStack justifyContent="space-between"><H3 color="#142A2A">{item.title}</H3><SizableText color="#B85C5C">{item.status}</SizableText></XStack><Paragraph color="#62736F">{item.description}</Paragraph></Card>} empty="Aucune réclamation à traiter." />}
      </YStack>
    </ScrollView>
    <XStack position="absolute" bottom={0} left={0} right={0} backgroundColor="white" borderTopWidth={1} borderColor="#DCE5E2" padding="$2" justifyContent="space-around"><Nav icon={<Building2 size={19} />} label="Accueil" active={tab === 'home'} onPress={() => setTab('home')} /><Nav icon={<Megaphone size={19} />} label="Annonces" active={tab === 'announcements'} onPress={() => setTab('announcements')} /><Nav icon={<ClipboardList size={19} />} label="Tâches" active={tab === 'tasks'} onPress={() => setTab('tasks')} /><Nav icon={<FileWarning size={19} />} label="Réclamations" active={tab === 'complaints'} onPress={() => setTab('complaints')} /></XStack>
    {composer && <Card position="absolute" left="$4" right="$4" bottom={78} backgroundColor="white" bordered borderColor="#B8DED5" padding="$4" gap="$3" elevation={8}><XStack justifyContent="space-between"><H3 color="#142A2A">{composer === 'announcement' ? 'Nouvelle annonce' : composer === 'task' ? 'Nouvelle tâche' : 'Nouvelle réclamation'}</H3><Button chromeless icon={<X size={18} color="#62736F" />} onPress={() => setComposer(null)} /></XStack><Input value={title} onChangeText={setTitle} placeholder="Titre" minHeight={48} /><Input value={body} onChangeText={setBody} placeholder="Description" minHeight={72} multiline /><Button backgroundColor="#0E766E" color="white" onPress={createItem}>Enregistrer</Button></Card>}
  </Screen>;
}

function ListPage({ title, action, onAction, items, render, empty }: { title: string; action: string; onAction: () => void; items: unknown[]; render: (item: any) => React.ReactNode; empty: string }) { return <YStack gap="$4"><XStack justifyContent="space-between" alignItems="center"><H2 color="#142A2A">{title}</H2><Button backgroundColor="#0E766E" color="white" size="$3" onPress={onAction}>{action} <Plus size={16} color="white" /></Button></XStack>{items.length === 0 ? <Empty text={empty} /> : items.map(render)}</YStack>; }
function Empty({ text }: { text: string }) { return <Card bordered backgroundColor="#FFFFFF" padding="$5" alignItems="center" borderColor="#DCE5E2"><MessageSquare size={30} color="#8DA8A1" /><Paragraph color="#62736F" textAlign="center">{text}</Paragraph></Card>; }
function Nav({ icon, label, active, onPress }: { icon: any; label: string; active: boolean; onPress: () => void }) { return <Button chromeless onPress={onPress} minWidth={72} color={active ? '#0E766E' : '#62736F'} icon={icon}>{label}</Button>; }

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => blink.auth.onAuthStateChanged((state) => { setUser(state.user as User | null); if (!state.isLoading) setLoading(false); }), []);
  if (loading) return <Screen backgroundColor="#F4F8F6" justifyContent="center" alignItems="center"><ShieldCheck size={42} color="#0E766E" /><SizableText color="#62736F">Préparation de votre espace…</SizableText></Screen>;
  return user ? <AppShell user={user} /> : <AuthScreen />;
}
