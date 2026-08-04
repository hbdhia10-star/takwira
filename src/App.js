import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut
} from 'firebase/auth';
import { RULES, RULES_FOOTER } from './rules';

export default function TakwiraApp() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [language, setLanguage] = useState('de');
  const [view, setView] = useState('matches');
  const [playerName, setPlayerName] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [modalMsg, setModalMsg] = useState(null); // {kind:'info'|'error'|'success', text}

  // Zentrale Meldung in der Mitte des Bildschirms anzeigen
  const showMsg = (text, kind = 'info') => setModalMsg({ text, kind });

  const [newMatch, setNewMatch] = useState({
    organizer: '',
    opponent: '',
    date: '',
    time: '',
    place: '',
    teamSize: 10,
    teamAName: '',
    teamBName: '',
    teamAColor: '#e74c3c',
    teamBColor: '#2980ef',
    ballResponsible: '',
    bibsResponsible: ''
  });

  // Gerät-ID für Gäste (bleibt gleich auch wenn Firebase-UID sich ändert)
  const getDeviceId = () => {
    let id = '';
    try {
      id = localStorage.getItem('takwira_device_id') || '';
      if (!id) {
        id = 'dev_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('takwira_device_id', id);
      }
    } catch {
      id = 'dev_temp_' + Math.random().toString(36).slice(2, 8);
    }
    return id;
  };

  // ============================================
  //  FIREBASE: Login-Status beobachten
  // ============================================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (u && !u.isAnonymous && u.displayName) {
        setPlayerName((prev) => prev || u.displayName.split(' ')[0]);
      }
      if (u && u.isAnonymous) {
        // Gäste bekommen einen freundlichen Anzeigenamen aus der Geräte-ID
        const suffix = getDeviceId().slice(-4).toUpperCase();
        setPlayerName((prev) => prev || 'Gast-' + suffix);
      }
    });
    return () => unsub();
  }, []);

  // ============================================
  //  FIREBASE: Live-Verbindung — Spiele
  // ============================================
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'matches'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Vergangene Spiele automatisch löschen (Datum vor heute).
        // Datum ist im Format YYYY-MM-DD, heute ebenso -> String-Vergleich reicht.
        const today = new Date().toISOString().slice(0, 10);
        const expired = list.filter((m) => m.date && m.date < today);
        expired.forEach((m) => {
          deleteDoc(doc(db, 'matches', m.id)).catch((e) =>
            console.error('Auto-Löschen fehlgeschlagen:', e)
          );
        });

        const current = list.filter((m) => !m.date || m.date >= today);
        current.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setMatches(current);
        setLoading(false);
      },
      (err) => {
        console.error('Firebase Fehler:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ============================================
  //  FIREBASE: Live-Verbindung — Vorschläge
  // ============================================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'suggestions'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setSuggestions(list);
    });
    return () => unsub();
  }, []);

  // Link mit ?match=XYZ öffnet direkt das richtige Spiel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('match');
    if (id && matches.length > 0 && matches.some((m) => m.id === id)) {
      setSelectedMatchId(id);
      setView('match-detail');
    }
  }, [matches]);

  const translations = {
    de: {
      appName: 'TAKWIRA',
      tagline: 'Organisiere Fußballspiele mit deinen Freunden',
      navMatches: '⚽ Spiele',
      navRules: '📜 Regeln',
      navIdeas: '💡 Ideen',
      createMatch: '➕ Neues Spiel erstellen',
      date: 'Datum',
      time: 'Uhrzeit',
      opponent: 'Spielname',
      location: 'Ort',
      teamSize: 'Spieler pro Team',
      organizer: 'Organisator',
      ballResponsible: '⚽ Ball-Verantwortlicher (optional)',
      bibsResponsible: '🟡 Trainings-Westen (optional)',
      specialRoles: '⭐ Besondere Rollen',
      ballShort: '⚽ Ball',
      bibsShort: '🟡 Westen',
      claimRole: '➕ Ich bring mit',
      freeRole: 'Noch frei',
      rolesClaimedLater: 'werden im Spiel übernommen',
      release: 'Freigeben',
      confirmRelease: 'Rolle wirklich freigeben?',
      onlyOrganizerRole: 'Nur der Organisator kann Rollen freigeben.',
      noRoles: 'Keine Rollen festgelegt',
      enterName: 'Gib deinen Namen ein',
      chooseTeam: 'Wähle dein Team',
      teamA: 'Team A',
      teamB: 'Team B',
      joinTeamA: 'Team A',
      joinTeamB: 'Team B',
      backToMatches: '← Zurück',
      editMatch: 'Spiel bearbeiten',
      edit: '✏️ Bearbeiten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: '🗑️ Löschen',
      noMatches: 'Noch keine Spiele geplant',
      createNew: 'Neues Spiel erstellen',
      copyLink: '📋 Link kopieren',
      copied: 'Link kopiert! Schick ihn per WhatsApp an deine Freunde.',
      loading: 'Lade Spiele...',
      confirmDeleteMatch: 'Dieses Spiel wirklich löschen?',
      confirmRemovePlayer: 'wirklich entfernen?',
      onlyOwnPlayer: 'Du kannst nur deinen eigenen Eintrag entfernen.',
      teamFull: 'Team ist voll!',
      matchFixed: 'Match ist voll — Aufstellung steht!',
      nameTaken: 'Name ist in diesem Match schon vergeben.',
      alreadyBooked: 'Du bist an dem Tag schon für ein Spiel angemeldet.',
      needLogin: 'Bitte zuerst anmelden.',
      needName: 'Bitte trage deinen Namen ein.',
      onlyClaimerOrOrg: 'Nur der Übernehmende oder der Organisator können die Rolle freigeben.',
      viewOnly: 'Nur ansehen — du bist nicht in diesem Spiel angemeldet.',
      cannotEditOthers: 'Du kannst nur dich selbst hinzufügen oder entfernen.',
      morePlayers: 'Mehr Spieler gesucht',
      liveSync: '🟢 Live — alle sehen dasselbe',
      loginTitle: 'Willkommen bei Takwira',
      loginSubtitle: 'Melde dich an, um mitzuspielen',
      loginGoogle: 'Mit Google anmelden',
      loginAnon: 'Als Gast weitermachen',
      logout: 'Abmelden',
      guestNoCreate: 'Als Gast kannst du keine Spiele erstellen. Melde dich mit Google an.',
      onlyCreatorDelete: 'Nur wer das Spiel erstellt hat, darf es löschen.',
      loginNote: 'Gast-Login: du bist dabei, aber ohne Namen aus Google.',
      rulesTitle: '📜 Die Regeln',
      rulesSubtitle: 'Wer in der Gruppe ist, hat die Regeln akzeptiert. 👑',
      ideasTitle: '💡 Verbessere die App',
      ideasSubtitle: 'Deine Idee für Takwira? Schreib sie hier rein.',
      ideaNamePlaceholder: 'Dein Name (optional)',
      ideaPlaceholder: 'Was sollen wir hinzufügen oder verbessern?',
      ideaSend: 'Vorschlag senden',
      ideaThanks: '✅ Danke! Dein Vorschlag ist angekommen.',
      ideaEmpty: 'Noch keine Vorschläge. Sei der Erste!',
      ideaListTitle: 'Bisherige Ideen'
    },
    en: {
      appName: 'TAKWIRA',
      tagline: 'Organize Football Matches With Friends',
      navMatches: '⚽ Matches',
      navRules: '📜 Rules',
      navIdeas: '💡 Ideas',
      createMatch: '➕ Create New Match',
      date: 'Date',
      time: 'Time',
      opponent: 'Match Name',
      location: 'Location',
      teamSize: 'Players per Team',
      organizer: 'Organizer',
      ballResponsible: '⚽ Ball Responsible (optional)',
      bibsResponsible: '🟡 Training Bibs (optional)',
      specialRoles: '⭐ Special Roles',
      ballShort: '⚽ Ball',
      bibsShort: '🟡 Bibs',
      claimRole: "➕ I'll bring it",
      freeRole: 'Still open',
      rolesClaimedLater: 'claimed inside the match',
      release: 'Release',
      confirmRelease: 'Really release this role?',
      onlyOrganizerRole: 'Only the organizer can release roles.',
      noRoles: 'No roles assigned',
      enterName: 'Enter your name',
      chooseTeam: 'Choose your team',
      teamA: 'Team A',
      teamB: 'Team B',
      joinTeamA: 'Team A',
      joinTeamB: 'Team B',
      backToMatches: '← Back',
      editMatch: 'Edit Match',
      edit: '✏️ Edit',
      save: 'Save',
      cancel: 'Cancel',
      delete: '🗑️ Delete',
      noMatches: 'No matches yet',
      createNew: 'Create New Match',
      copyLink: '📋 Copy Link',
      copied: 'Link copied! Send it to your friends via WhatsApp.',
      loading: 'Loading matches...',
      confirmDeleteMatch: 'Really delete this match?',
      confirmRemovePlayer: 'really remove?',
      onlyOwnPlayer: 'You can only remove your own entry.',
      teamFull: 'Team is full!',
      matchFixed: 'Match full — line-up is set!',
      nameTaken: 'That name is already in this match.',
      alreadyBooked: 'You are already booked for a game that day.',
      needLogin: 'Please sign in first.',
      needName: 'Please type your name.',
      onlyClaimerOrOrg: 'Only the person who claimed or the organizer can release the role.',
      viewOnly: 'View only — you are not in this match.',
      cannotEditOthers: 'You can only add or remove yourself.',
      morePlayers: 'More players needed',
      liveSync: '🟢 Live — everyone sees the same',
      loginTitle: 'Welcome to Takwira',
      loginSubtitle: 'Sign in to join the game',
      loginGoogle: 'Sign in with Google',
      loginAnon: 'Continue as guest',
      logout: 'Sign out',
      guestNoCreate: 'Guests cannot create matches. Sign in with Google.',
      onlyCreatorDelete: 'Only the creator can delete this match.',
      loginNote: 'Guest login: you are in, but without your Google name.',
      rulesTitle: '📜 The Rules',
      rulesSubtitle: 'If you are in the group, you accepted the rules. 👑',
      ideasTitle: '💡 Improve the App',
      ideasSubtitle: 'Got an idea for Takwira? Drop it here.',
      ideaNamePlaceholder: 'Your name (optional)',
      ideaPlaceholder: 'What should we add or improve?',
      ideaSend: 'Send Suggestion',
      ideaThanks: '✅ Thanks! Your suggestion was received.',
      ideaEmpty: 'No suggestions yet. Be the first!',
      ideaListTitle: 'Previous Ideas'
    },
    fr: {
      appName: 'TAKWIRA',
      tagline: 'Organisez des Matchs de Foot avec des Amis',
      navMatches: '⚽ Matchs',
      navRules: '📜 Règles',
      navIdeas: '💡 Idées',
      createMatch: '➕ Créer un nouveau match',
      date: 'Date',
      time: 'Heure',
      opponent: 'Nom du match',
      location: 'Lieu',
      teamSize: 'Joueurs par équipe',
      organizer: 'Organisateur',
      ballResponsible: '⚽ Responsable du Ballon (optionnel)',
      bibsResponsible: '🟡 Chasubles (optionnel)',
      specialRoles: '⭐ Rôles Spéciaux',
      ballShort: '⚽ Ballon',
      bibsShort: '🟡 Chasubles',
      claimRole: '➕ Je apporte',
      freeRole: 'Libre',
      rolesClaimedLater: 'à prendre dans le match',
      release: 'Libérer',
      confirmRelease: 'Vraiment libérer ce rôle?',
      onlyOrganizerRole: 'Seul organisateur peut libérer les rôles.',
      noRoles: 'Aucun rôle attribué',
      enterName: 'Entrez votre nom',
      chooseTeam: 'Choisissez votre équipe',
      teamA: 'Team A',
      teamB: 'Team B',
      joinTeamA: 'Team A',
      joinTeamB: 'Team B',
      backToMatches: '← Retour',
      editMatch: 'Modifier le match',
      edit: '✏️ Modifier',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: '🗑️ Supprimer',
      noMatches: 'Aucun match pour le moment',
      createNew: 'Créer un nouveau match',
      copyLink: '📋 Copier le lien',
      copied: 'Lien copié! Envoie-le à tes amis sur WhatsApp.',
      loading: 'Chargement des matchs...',
      confirmDeleteMatch: 'Vraiment supprimer ce match?',
      confirmRemovePlayer: 'vraiment retirer?',
      onlyOwnPlayer: 'Tu peux seulement retirer ta propre entrée.',
      teamFull: 'Équipe complète!',
      matchFixed: 'Match complet — composition prête!',
      nameTaken: 'Ce nom est déjà pris dans ce match.',
      alreadyBooked: 'Tu es déjà inscrit à un match ce jour-là.',
      needLogin: 'Connecte-toi d abord.',
      needName: 'Entre ton nom.',
      onlyClaimerOrOrg: 'Seul celui qui a pris le rôle ou organisateur peut libérer.',
      viewOnly: 'Lecture seule — tu ne joues pas ce match.',
      cannotEditOthers: 'Tu peux seulement t inscrire ou te retirer.',
      morePlayers: 'Plus de joueurs recherchés',
      liveSync: '🟢 En direct — tout le monde voit pareil',
      loginTitle: 'Bienvenue sur Takwira',
      loginSubtitle: 'Connecte-toi pour jouer',
      loginGoogle: 'Se connecter avec Google',
      loginAnon: 'Continuer en invité',
      logout: 'Déconnexion',
      guestNoCreate: 'Les invités ne peuvent pas créer de matchs. Connecte-toi avec Google.',
      onlyCreatorDelete: 'Seul le créateur peut supprimer ce match.',
      loginNote: 'Invité: tu es là, mais sans ton nom Google.',
      rulesTitle: '📜 Les Règles',
      rulesSubtitle: 'Si tu es dans le groupe, tu as accepté les règles. 👑',
      ideasTitle: '💡 Améliore l\'App',
      ideasSubtitle: 'Une idée pour Takwira? Écris-la ici.',
      ideaNamePlaceholder: 'Ton nom (optionnel)',
      ideaPlaceholder: 'Qu\'est-ce qu\'on devrait ajouter ou améliorer?',
      ideaSend: 'Envoyer',
      ideaThanks: '✅ Merci! Ta suggestion a été reçue.',
      ideaEmpty: 'Aucune suggestion. Sois le premier!',
      ideaListTitle: 'Idées précédentes'
    },
    ar: {
      appName: 'تكوير',
      tagline: 'نظم مباريات كرة مع أصدقائك',
      navMatches: '⚽ الماتشات',
      navRules: '📜 القوانين',
      navIdeas: '💡 أفكار',
      createMatch: '➕ إنشاء مباراة جديدة',
      date: 'التاريخ',
      time: 'الوقت',
      opponent: 'اسم المباراة',
      location: 'الموقع',
      teamSize: 'لاعبين في كل فريق',
      organizer: 'المنظم',
      ballResponsible: '⚽ مسؤول الكرة (اختياري)',
      bibsResponsible: '🟡 المريلات (اختياري)',
      specialRoles: '⭐ الأدوار الخاصة',
      ballShort: '⚽ الكرة',
      bibsShort: '🟡 المريلات',
      claimRole: '➕ أنا نجيبها',
      freeRole: 'مازال فاضي',
      rolesClaimedLater: 'تتاخذ في الماتش',
      release: 'تخلي',
      confirmRelease: 'تحب تخلي الدور؟',
      onlyOrganizerRole: 'كان المنظم برك ينجم يخلي الأدوار.',
      noRoles: 'ما فماش أدوار محددة',
      enterName: 'أدخل اسمك',
      chooseTeam: 'اختر فريقك',
      teamA: 'الفريق A',
      teamB: 'الفريق B',
      joinTeamA: 'الفريق A',
      joinTeamB: 'الفريق B',
      backToMatches: '← رجوع',
      editMatch: 'تعديل المباراة',
      edit: '✏️ تعديل',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: '🗑️ حذف',
      noMatches: 'لا توجد مباريات',
      createNew: 'إنشاء مباراة جديدة',
      copyLink: '📋 نسخ الرابط',
      copied: 'تم نسخ الرابط! أرسلو لأصحابك في واتساب.',
      loading: 'جاري تحميل المباريات...',
      confirmDeleteMatch: 'تحب تمسح الماتش هذا؟',
      confirmRemovePlayer: 'تحب تنحيه؟',
      onlyOwnPlayer: 'تنجم تنحي كان الاسم متاعك.',
      teamFull: 'الفريق عامر!',
      matchFixed: 'الماتش عامر — التشكيلة جاهزة!',
      nameTaken: 'الاسم موجود في الماتش هذا.',
      alreadyBooked: 'راك مسجل في ماتش آخر نفس النهار.',
      needLogin: 'سجل دخول الاول.',
      needName: 'اكتب اسمك.',
      onlyClaimerOrOrg: 'اللي اخذ الدور والا المنظم برك ينجم يخليه.',
      viewOnly: 'مشاهدة برك — راك ماكش في الماتش هذا.',
      cannotEditOthers: 'تنجم تزيد او تنحي كان روحك.',
      morePlayers: 'مازلنا نحتاجو لاعبين',
      liveSync: '🟢 مباشر — الكل يشوف نفس الشيء',
      loginTitle: 'مرحبا بيك في تكوير',
      loginSubtitle: 'سجل دخول باش تلعب',
      loginGoogle: 'دخول بـ Google',
      loginAnon: 'كمل كضيف',
      logout: 'خروج',
      guestNoCreate: 'كضيف ما تنجمش تعمل ماتشات. سجل دخول بـ Google.',
      onlyCreatorDelete: 'الي عمل الماتش برك ينجم يمسحو.',
      loginNote: 'دخول كضيف: راك معانا، أما بلا اسم من Google.',
      rulesTitle: '📜 القوانين',
      rulesSubtitle: 'اللي في الغروب راهو قبل بالقوانين. 👑',
      ideasTitle: '💡 حسّن الأبليكاسيون',
      ideasSubtitle: 'عندك فكرة لتكوير؟ اكتبها هوني.',
      ideaNamePlaceholder: 'اسمك (اختياري)',
      ideaPlaceholder: 'شنو نزيدو ولا نحسنو؟',
      ideaSend: 'ابعث الفكرة',
      ideaThanks: '✅ يعيشك! وصلتنا فكرتك.',
      ideaEmpty: 'ما فماش أفكار بعد. كون الأول!',
      ideaListTitle: 'الأفكار السابقة'
    }
  };

  const t = translations[language];
  const isRTL = language === 'ar';
  const currentMatch = matches.find((m) => m.id === selectedMatchId);

  // ============================================
  //  FIREBASE FUNKTIONEN
  // ============================================
  const createMatch = async () => {
    if (!user || user.isAnonymous) {
      showMsg(t.guestNoCreate, 'error');
      return;
    }
    if (
      !newMatch.organizer.trim() ||
      !newMatch.opponent.trim() ||
      !newMatch.date.trim() ||
      !newMatch.place.trim()
    )
      return;
    await addDoc(collection(db, 'matches'), {
      ...newMatch,
      teamA: [],
      teamB: [],
      creatorUid: user ? user.uid : null,
      createdAt: Date.now()
    });
    setNewMatch({
      organizer: '',
      opponent: '',
      date: '',
      time: '',
      place: '',
      teamSize: 10,
      teamAName: '',
      teamBName: '',
      teamAColor: '#e74c3c',
      teamBColor: '#2980ef',
      ballResponsible: '',
      bibsResponsible: ''
    });
    setView('matches');
  };

  const addPlayer = async (team) => {
    if (!currentMatch) return;
    if (!user) {
      showMsg(t.needLogin, 'error');
      return;
    }
    const name = playerName.trim();
    if (!name) {
      showMsg(t.needName, 'error');
      return;
    }
    const key = team === 'A' ? 'teamA' : 'teamB';
    const otherKey = team === 'A' ? 'teamB' : 'teamA';
    let list = currentMatch[key] || [];
    let otherList = currentMatch[otherKey] || [];
    const cap = currentMatch.teamSize || 10;

    // Ist der User schon irgendwo drin?
    const inThis = list.some((p) => playerUidOf(p) === user.uid);
    const inOther = otherList.some((p) => playerUidOf(p) === user.uid);

    if (inThis) {
      showMsg(t.alreadyInTeam, 'info');
      return;
    }

    // Team voll → nicht reinlassen
    if (list.length >= cap) {
      showMsg(t.teamFull, 'error');
      return;
    }

    // Name schon in DIESEM Match vergeben (Groß-/Kleinschreibung egal)?
    const nameLC = name.toLowerCase();
    const nameTaken =
      list.some((p) => (playerNameOf(p) || '').toLowerCase() === nameLC) ||
      otherList.some((p) => (playerNameOf(p) || '').toLowerCase() === nameLC);
    if (nameTaken) {
      showMsg(t.nameTaken, 'error');
      return;
    }

    // Ein Match pro Tag pro Nutzer
    const matchDate = currentMatch.date;
    if (matchDate) {
      const alreadyBooked = matches.some((m) => {
        if (m.id === currentMatch.id) return false;
        if (m.date !== matchDate) return false;
        const inA = (m.teamA || []).some((p) => playerUidOf(p) === user.uid);
        const inB = (m.teamB || []).some((p) => playerUidOf(p) === user.uid);
        return inA || inB;
      });
      if (alreadyBooked) {
        showMsg(t.alreadyBooked, 'error');
        return;
      }
    }

    // Team wechseln
    if (inOther) {
      otherList = otherList.filter((p) => playerUidOf(p) !== user.uid);
    }

    await updateDoc(doc(db, 'matches', currentMatch.id), {
      [key]: [...list, { name, uid: user.uid }],
      [otherKey]: otherList
    });
    setPlayerName('');
  };

  // Name/UID lesen — funktioniert für alte Strings UND neue Objekte
  const playerNameOf = (p) => (typeof p === 'string' ? p : p.name);
  const playerUidOf = (p) => (typeof p === 'string' ? null : p.uid);

  // Team-Name/Farbe mit Fallback (für alte Spiele ohne diese Felder)
  const teamNameOf = (m, team) =>
    (team === 'A' ? m.teamAName : m.teamBName) ||
    (team === 'A' ? t.teamA : t.teamB);
  const teamColorOf = (m, team) =>
    (team === 'A' ? m.teamAColor : m.teamBColor) ||
    (team === 'A' ? '#e74c3c' : '#2980ef');

  // Darf der aktuelle User diesen Spieler entfernen?
  // Darf der aktuelle User diesen Spieler entfernen?
  // Regel: NUR sich selbst. Auch der Organisator darf keine anderen entfernen.
  // Alte Einträge ohne UID (Altlasten) sind für alle entfernbar.
  const canRemovePlayer = (p) => {
    const uid = playerUidOf(p);
    if (!uid) return true; // Altlast
    if (user && uid === user.uid) return true; // selbst
    return false;
  };

  const removePlayer = async (team, index) => {
    const key = team === 'A' ? 'teamA' : 'teamB';
    const list = currentMatch[key] || [];
    const p = list[index];
    if (!canRemovePlayer(p)) {
      showMsg(t.onlyOwnPlayer, 'error');
      return;
    }
    if (!window.confirm(`${playerNameOf(p)} — ${t.confirmRemovePlayer}`)) return;
    await updateDoc(doc(db, 'matches', currentMatch.id), {
      [key]: list.filter((_, i) => i !== index)
    });
  };

  const deleteMatch = async (id) => {
    const match = matches.find((m) => m.id === id);
    // Nur der Ersteller darf löschen.
    // Alte Spiele ohne creatorUid darf jeder löschen (Altlasten).
    if (match && match.creatorUid && match.creatorUid !== (user && user.uid)) {
      showMsg(t.onlyCreatorDelete, 'error');
      return;
    }
    if (!window.confirm(t.confirmDeleteMatch)) return;
    await deleteDoc(doc(db, 'matches', id));
    setSelectedMatchId(null);
    setView('matches');
  };

  const startEditing = () => {
    setEditData({
      organizer: currentMatch.organizer || '',
      opponent: currentMatch.opponent || '',
      date: currentMatch.date || '',
      time: currentMatch.time || '',
      place: currentMatch.place || '',
      ballResponsible: currentMatch.ballResponsible || '',
      bibsResponsible: currentMatch.bibsResponsible || ''
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!editData.organizer.trim() || !editData.opponent.trim()) return;
    await updateDoc(doc(db, 'matches', currentMatch.id), { ...editData });
    setIsEditing(false);
    setEditData(null);
  };

  const copyMatchLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?match=${selectedMatchId}`;
    navigator.clipboard.writeText(url);
    showMsg(t.copied, 'success');
  };

  // ============================================
  //  LOGIN / LOGOUT
  // ============================================
  const loginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Google Login Fehler:', e);
      alert('Login fehlgeschlagen: ' + e.message);
    }
  };

  const loginAnonymous = async () => {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error('Anonym Login Fehler:', e);
      alert('Login fehlgeschlagen: ' + e.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setView('matches');
    setSelectedMatchId(null);
  };

  // Rolle übernehmen (Ball oder Westen) — nur wenn noch frei
  const claimRole = async (roleKey) => {
    if (!currentMatch || !user) return;
    if (roleValueOf(currentMatch[roleKey])) return; // schon vergeben
    const name = (playerName.trim() || window.prompt(t.enterName) || '').trim();
    if (!name) return;
    await updateDoc(doc(db, 'matches', currentMatch.id), {
      [roleKey]: { name, uid: user.uid }
    });
  };

  // Rolle wieder freigeben — Claimer selbst ODER Organisator
  const releaseRole = async (roleKey) => {
    if (!currentMatch || !user) return;
    const val = currentMatch[roleKey];
    const uid = roleUidOf(val);
    const isClaimer = uid && uid === user.uid;
    const isOrganizer = currentMatch.creatorUid === user.uid;
    const isOldString = typeof val === 'string'; // Altlast
    if (!isClaimer && !isOrganizer && !isOldString) {
      showMsg(t.onlyClaimerOrOrg, 'error');
      return;
    }
    if (!window.confirm(t.confirmRelease)) return;
    await updateDoc(doc(db, 'matches', currentMatch.id), { [roleKey]: '' });
  };

  // Rollen-Helfer: funktioniert für alte Strings UND neue Objekte
  const roleValueOf = (r) => (typeof r === 'string' ? r.trim() : (r && r.name) || '');
  const roleUidOf = (r) => (typeof r === 'string' ? null : (r && r.uid) || null);
  // Claimer ODER Organisator dürfen freigeben
  const canReleaseRole = (val) => {
    if (!user || !currentMatch) return false;
    if (currentMatch.creatorUid === user.uid) return true;
    const uid = roleUidOf(val);
    return !!(uid && uid === user.uid);
  };

  const sendSuggestion = async () => {
    if (!suggestionText.trim()) return;
    await addDoc(collection(db, 'suggestions'), {
      name: suggestionName.trim() || 'Anonym',
      text: suggestionText.trim(),
      createdAt: Date.now()
    });
    setSuggestionText('');
    setSuggestionName('');
    setSuggestionSent(true);
    setTimeout(() => setSuggestionSent(false), 4000);
  };

  const hasRoles = (m) => (m.ballResponsible || '').trim() || (m.bibsResponsible || '').trim();

  // Verteilt N Spieler auf Reihen (Torwart + Feldreihen), egal wie viele.
  // 1 -> [1] | 5 -> [1,2,2] | 8 -> [1,3,3,1] | 10 -> [1,4,3,2] | 11 -> [1,4,4,2]
  const buildFormation = (count) => {
    if (count <= 0) return [];
    if (count === 1) return [1];
    const outfield = count - 1; // einer ist immer Torwart
    const presets = {
      1: [1],
      2: [1, 1],
      3: [2, 1],
      4: [2, 2],
      5: [2, 2, 1],
      6: [3, 2, 1],
      7: [3, 3, 1],
      8: [3, 3, 2],
      9: [4, 3, 2],
      10: [4, 4, 2],
      11: [4, 4, 3],
      12: [4, 5, 3],
      13: [5, 5, 3]
    };
    let rows = presets[outfield];
    if (!rows) {
      // Für sehr große Zahlen: gleichmäßig auf 4er-Reihen verteilen
      rows = [];
      let rest = outfield;
      while (rest > 0) {
        const take = Math.min(4, rest);
        rows.push(take);
        rest -= take;
      }
    }
    return [1, ...rows]; // erste Reihe = Torwart
  };

  // ============================================
  //  STYLES
  // ============================================
  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(52, 152, 219, 0.3)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '1rem'
  };
  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    marginBottom: '0.5rem',
    textTransform: 'uppercase'
  };
  const cardStyle = {
    background:
      'linear-gradient(135deg, rgba(52, 152, 219, 0.15) 0%, rgba(231, 76, 60, 0.15) 100%)',
    border: '2px solid rgba(52, 152, 219, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    backdropFilter: 'blur(10px)'
  };

  // Hellt/verdunkelt eine Hex-Farbe (percent: +heller / -dunkler)
  const shadeColor = (hex, percent) => {
    try {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      const num = parseInt(h, 16);
      let r = (num >> 16) + percent;
      let g = ((num >> 8) & 0x00ff) + percent;
      let b = (num & 0x0000ff) + percent;
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    } catch {
      return hex;
    }
  };

  // Ein einzelnes Trikot mit Namen drunter (FC-Style, Team-Farbe)
  const Jersey = ({ name, color, isKeeper, removable, onClick }) => {
    // Torwart bekommt eine kontrastreiche Farbe (gelb), sonst Team-Farbe
    const fill = isKeeper ? '#f5d020' : color || '#f4f4f4';
    const shade = isKeeper ? '#c9a800' : shadeColor(fill, -35);
    const highlight = shadeColor(fill, 22);
    const deepShade = shadeColor(fill, -20);
    const uid = fill.replace('#', '') + (isKeeper ? 'k' : '');
    return (
      <div
        onClick={removable ? onClick : undefined}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: removable ? 'pointer' : 'default',
          width: '92px',
          userSelect: 'none',
          transform: 'rotateX(-22deg)',
          transformOrigin: 'bottom center'
        }}
        title={name}
      >
        <svg width="72" height="80" viewBox="0 0 100 110">
          <defs>
            {/* Grundfarbe: leichter Verlauf oben->unten (Volumen) */}
            <linearGradient id={`base-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={highlight} />
              <stop offset="55%" stopColor={fill} />
              <stop offset="100%" stopColor={deepShade} />
            </linearGradient>
            {/* Schulter-Glanz oben links */}
            <radialGradient id={`shL-${uid}`} cx="0.32" cy="0.18" r="0.28">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {/* Schulter-Glanz oben rechts */}
            <radialGradient id={`shR-${uid}`} cx="0.68" cy="0.18" r="0.28">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {/* Brust-Glanz Mitte */}
            <radialGradient id={`chest-${uid}`} cx="0.5" cy="0.4" r="0.32">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {/* Schatten am Bauch/Saum */}
            <linearGradient id={`hem-${uid}`} x1="0" y1="0.55" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
            </linearGradient>
          </defs>

          {/* Bodenschatten unter dem Trikot */}
          <ellipse cx="50" cy="102" rx="24" ry="4" fill="rgba(0,0,0,0.55)" />

          {/* Ärmel */}
          <path d="M30 16 L14 28 L22 44 L34 36 Z" fill={fill} stroke={shade} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M70 16 L86 28 L78 44 L66 36 Z" fill={fill} stroke={shade} strokeWidth="1.5" strokeLinejoin="round" />

          {/* Trikot-Körper: Grundfarbe */}
          <path d="M30 16 Q40 22 50 22 Q60 22 70 16 L70 86 Q50 90 30 86 Z" fill={`url(#base-${uid})`} stroke={shade} strokeWidth="1.5" strokeLinejoin="round" />

          {/* Weiche Highlights auf dem Trikot-Körper */}
          <path d="M30 16 Q40 22 50 22 Q60 22 70 16 L70 86 Q50 90 30 86 Z" fill={`url(#shL-${uid})`} />
          <path d="M30 16 Q40 22 50 22 Q60 22 70 16 L70 86 Q50 90 30 86 Z" fill={`url(#shR-${uid})`} />
          <path d="M30 16 Q40 22 50 22 Q60 22 70 16 L70 86 Q50 90 30 86 Z" fill={`url(#chest-${uid})`} />
          <path d="M30 16 Q40 22 50 22 Q60 22 70 16 L70 86 Q50 90 30 86 Z" fill={`url(#hem-${uid})`} />

          {/* Kragen */}
          <path d="M40 18 Q50 28 60 18" fill="none" stroke={shade} strokeWidth="2.5" />
        </svg>
        <div
          style={{
            marginTop: '2px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#fff',
            textShadow: '0 1px 4px rgba(0,0,0,0.95)',
            maxWidth: '92px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center'
          }}
        >
          {name}{removable && <span style={{ color: '#ff8a8a' }}> ✕</span>}
        </div>
      </div>
    );
  };

  // Eine Mannschaftshälfte: Spieler in Formation aufs Feld verteilt
  const TeamHalf = ({ players, team, color, flip }) => {
    const formation = buildFormation(players.length);
    // Spieler den Reihen zuordnen
    const rows = [];
    let cursor = 0;
    for (const n of formation) {
      const start = cursor; // fester Wert für dieses Reihen-map
      rows.push(
        players.slice(start, start + n).map((p, idx) => ({ player: p, idx: start + idx }))
      );
      cursor += n;
    }
    const orderedRows = flip ? [...rows].reverse() : rows;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          gap: '32px',
          minHeight: '250px',
          padding: '24px 0'
        }}
      >
        {orderedRows.map((row, r) => (
          <div
            key={r}
            style={{
              display: 'flex',
              justifyContent: 'space-evenly',
              gap: '48px',
              flexWrap: 'wrap',
              width: '100%'
            }}
          >
            {row.map((entry) => (
              <Jersey
                key={entry.idx}
                name={playerNameOf(entry.player)}
                color={color}
                isKeeper={entry.idx === 0}
                removable={canRemovePlayer(entry.player)}
                onClick={() => removePlayer(team, entry.idx)}
              />
            ))}
          </div>
        ))}
        {players.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)'
            }}
          >
            —
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        padding: '1.5rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#fff',
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      {/* HINTERGRUND-BILD (fest, scrollt nicht mit) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/images/pitch.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      {/* DUNKLER SCHLEIER, damit Text lesbar bleibt */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(10,15,30,0.9) 100%)'
        }}
      />

      {/* ================= LOGIN-GATE ================= */}
      {!authReady ? (
        <div style={{ textAlign: 'center', paddingTop: '30vh', color: 'rgba(255,255,255,0.6)' }}>
          ⏳
        </div>
      ) : !user ? (
        <div style={{ maxWidth: '420px', margin: '0 auto', paddingTop: '12vh' }}>
          {/* Sprache */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { code: 'de', label: 'Deutsch' },
              { code: 'en', label: 'English' },
              { code: 'fr', label: 'Français' },
              { code: 'ar', label: 'العربية' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '8px 14px',
                  background: language === lang.code ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: language === lang.code ? 'none' : '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '20px',
              padding: '2.5rem 1.75rem',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '56px', animation: 'bounce 2s infinite' }}>⚽</div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '900',
                margin: '0.5rem 0',
                background: 'linear-gradient(135deg, #3498db 0%, #e74c3c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {t.loginTitle}
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', marginBottom: '2rem' }}>
              {t.loginSubtitle}
            </p>

            <button
              onClick={loginGoogle}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fff',
                color: '#333',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.5 2.5 30.1 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.9 6.1C12.4 13.2 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.5z" />
                <path fill="#FBBC05" d="M10.5 28.3c-.5-1.4-.7-2.9-.7-4.3s.3-2.9.7-4.3l-7.9-6.1C1 16.7 0 20.2 0 24s1 7.3 2.6 10.4l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.3-4.5 2.1-7.9 2.1-6.3 0-11.6-3.7-13.5-9.1l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
              </svg>
              {t.loginGoogle}
            </button>

            <button
              onClick={loginAnonymous}
              style={{
                width: '100%',
                padding: '14px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              👤 {t.loginAnon}
            </button>

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '1.5rem', lineHeight: '1.5' }}>
              {t.loginNote}
            </p>
          </div>
        </div>
      ) : (
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        {/* SPRACHE */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          {[
            { code: 'de', label: 'Deutsch' },
            { code: 'en', label: 'English' },
            { code: 'fr', label: 'Français' },
            { code: 'ar', label: 'العربية' }
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              style={{
                padding: '8px 14px',
                background:
                  language === lang.code
                    ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border:
                  language === lang.code
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* NAVIGATION */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            marginBottom: '1.5rem'
          }}
        >
          {[
            { key: 'matches', label: t.navMatches },
            { key: 'rules', label: t.navRules },
            { key: 'ideas', label: t.navIdeas }
          ].map((nav) => (
            <button
              key={nav.key}
              onClick={() => {
                setView(nav.key);
                setSelectedMatchId(null);
                setIsEditing(false);
              }}
              style={{
                padding: '12px 8px',
                background:
                  view === nav.key
                    ? 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
                    : 'rgba(255,255,255,0.08)',
                color: '#fff',
                border:
                  view === nav.key
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {nav.label}
            </button>
          ))}
        </div>

        {/* USER + LOGOUT */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontSize: '12px'
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.75)' }}>
            {user && !user.isAnonymous && user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                style={{ width: '20px', height: '20px', borderRadius: '50%', verticalAlign: 'middle', marginRight: '6px' }}
              />
            )}
            {user && user.isAnonymous
              ? '👤 ' + (language === 'de' ? 'Gast' : language === 'fr' ? 'Invité' : language === 'ar' ? 'ضيف' : 'Guest')
              : (user && (user.displayName || user.email)) || ''}
          </span>
          <button
            onClick={logout}
            style={{
              padding: '5px 12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.7)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {t.logout}
          </button>
        </div>

        {/* HEADER mit Foto (nur auf Spiele-Seite) */}
        {view === 'matches' && (
          <div
            style={{
              position: 'relative',
              textAlign: 'center',
              marginBottom: '2rem',
              padding: '2.5rem 1rem',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundImage: 'url(/images/street.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(26,26,46,0.5) 0%, rgba(15,52,96,0.85) 100%)'
              }}
            />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '52px', animation: 'bounce 2s infinite' }}>
                ⚽
              </div>
              <h1
                style={{
                  fontSize: '40px',
                  fontWeight: '900',
                  margin: '0.5rem 0',
                  color: '#fff',
                  textShadow: '0 2px 20px rgba(0,0,0,0.6)'
                }}
              >
                {t.appName}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.95)',
                  textShadow: '0 1px 8px rgba(0,0,0,0.8)'
                }}
              >
                {t.tagline}
              </p>
              <div
                style={{
                  marginTop: '0.75rem',
                  fontSize: '11px',
                  color: '#7CFC7C',
                  fontWeight: '700'
                }}
              >
                {t.liveSync}
              </div>
            </div>
          </div>
        )}

        {/* LADEN */}
        {loading && view === 'matches' && (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            ⏳ {t.loading}
          </div>
        )}

        {/* ================= SPIELE LISTE ================= */}
        {!loading && view === 'matches' && (
          <div>
            {user && !user.isAnonymous ? (
              <button
                onClick={() => setView('create')}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginBottom: '2rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: '0 8px 25px rgba(231, 76, 60, 0.3)'
                }}
              >
                {t.createMatch}
              </button>
            ) : (
              <div
                style={{
                  padding: '12px 16px',
                  marginBottom: '2rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center'
                }}
              >
                🔒 {t.guestNoCreate}
              </div>
            )}

            {matches.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundImage: 'url(/images/pitch.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15,52,96,0.75)'
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🏆</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    {t.noMatches}
                  </div>
                </div>
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => {
                    setSelectedMatchId(match.id);
                    setView('match-detail');
                  }}
                  style={{ ...cardStyle, cursor: 'pointer', padding: '1.25rem' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        background:
                          'linear-gradient(135deg, #3498db 0%, #e74c3c 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      ⚽ {match.opponent}
                    </div>
                    <div
                      style={{
                        background:
                          'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🎮 {(match.teamA?.length || 0) + (match.teamB?.length || 0)}/{(match.teamSize || 10) * 2}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: '0.75rem'
                    }}
                  >
                    👤 {match.organizer} &nbsp;•&nbsp; 📅 {match.date}
                    &nbsp;•&nbsp; 🕐 {match.time}
                    <br />📍 {match.place}
                  </div>

                  {hasRoles(match) && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#FFD700',
                        fontWeight: '700',
                        marginBottom: '0.75rem'
                      }}
                    >
                      {match.ballResponsible && `⚽ ${match.ballResponsible}`}
                      {match.ballResponsible && match.bibsResponsible && '  •  '}
                      {match.bibsResponsible && `🟡 ${match.bibsResponsible}`}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem'
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(192, 57, 43, 0.3)',
                        border: '2px solid rgba(231, 76, 60, 0.5)',
                        padding: '10px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        fontWeight: '700',
                        fontSize: '13px'
                      }}
                    >
                      🔴 {match.teamA?.length || 0}/{match.teamSize || 10}
                    </div>
                    <div
                      style={{
                        background: 'rgba(52, 73, 94, 0.3)',
                        border: '2px solid rgba(52, 152, 219, 0.5)',
                        padding: '10px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        fontWeight: '700',
                        fontSize: '13px'
                      }}
                    >
                      🔵 {match.teamB?.length || 0}/{match.teamSize || 10}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= REGELN ================= */}
        {view === 'rules' && (
          <div>
            <div
              style={{
                position: 'relative',
                textAlign: 'center',
                marginBottom: '1.5rem',
                padding: '2rem 1rem',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundImage: 'url(/images/pitch.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15,52,96,0.78)'
                }}
              />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 0.5rem 0' }}>
                  {t.rulesTitle}
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                  {t.rulesSubtitle}
                </p>
              </div>
            </div>

            {RULES[language].map((rule, idx) => (
              <div
                key={idx}
                style={{
                  ...cardStyle,
                  marginBottom: '1rem',
                  padding: '1.25rem'
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#FFD700',
                    marginBottom: '0.5rem'
                  }}
                >
                  {rule.title}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.7',
                    color: 'rgba(255,255,255,0.9)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {rule.body}
                </div>
              </div>
            ))}

            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                fontSize: '13px',
                fontWeight: '700',
                color: '#FFD700',
                fontStyle: 'italic'
              }}
            >
              {RULES_FOOTER[language]}
            </div>
          </div>
        )}

        {/* ================= IDEEN ================= */}
        {view === 'ideas' && (
          <div>
            <div
              style={{
                position: 'relative',
                textAlign: 'center',
                marginBottom: '1.5rem',
                padding: '2rem 1rem',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundImage: 'url(/images/bench.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15,52,96,0.72)'
                }}
              />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 0.5rem 0' }}>
                  {t.ideasTitle}
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                  {t.ideasSubtitle}
                </p>
              </div>
            </div>

            <div style={cardStyle}>
              <input
                style={inputStyle}
                value={suggestionName}
                onChange={(e) => setSuggestionName(e.target.value)}
                placeholder={t.ideaNamePlaceholder}
              />
              <textarea
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder={t.ideaPlaceholder}
              />
              <button
                onClick={sendSuggestion}
                style={{
                  width: '100%',
                  padding: '13px',
                  background:
                    'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {t.ideaSend}
              </button>
              {suggestionSent && (
                <div
                  style={{
                    marginTop: '1rem',
                    textAlign: 'center',
                    color: '#7CFC7C',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}
                >
                  {t.ideaThanks}
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: '13px',
                fontWeight: '800',
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                marginBottom: '1rem'
              }}
            >
              {t.ideaListTitle}
            </div>

            {suggestions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '13px'
                }}
              >
                {t.ideaEmpty}
              </div>
            ) : (
              suggestions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#4dabf7',
                      fontWeight: '700',
                      marginBottom: '0.25rem'
                    }}
                  >
                    💡 {s.name}
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {s.text}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= SPIEL ERSTELLEN ================= */}
        {view === 'create' && (
          <div style={cardStyle}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '800',
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, #3498db 0%, #e74c3c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              🎮 {t.createNew}
            </h2>

            <label style={labelStyle}>{t.organizer}</label>
            <input
              style={inputStyle}
              value={newMatch.organizer}
              onChange={(e) => setNewMatch({ ...newMatch, organizer: e.target.value })}
              placeholder="z.B. Ahmed"
            />
            <label style={labelStyle}>{t.opponent}</label>
            <input
              style={inputStyle}
              value={newMatch.opponent}
              onChange={(e) => setNewMatch({ ...newMatch, opponent: e.target.value })}
              placeholder="z.B. Freunde vs Arbeit"
            />
            <label style={labelStyle}>{t.date}</label>
            <input
              type="date"
              style={inputStyle}
              value={newMatch.date}
              onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
            />
            <label style={labelStyle}>{t.time}</label>
            <input
              type="time"
              style={inputStyle}
              value={newMatch.time}
              onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
            />
            <label style={labelStyle}>{t.location}</label>
            <input
              style={inputStyle}
              value={newMatch.place}
              onChange={(e) => setNewMatch({ ...newMatch, place: e.target.value })}
              placeholder="z.B. Mainz Sportpark"
            />

            <label style={labelStyle}>{t.teamSize}</label>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '1rem'
              }}
            >
              {[5, 6, 7, 8, 9, 10, 11].map((size) => (
                <button
                  key={size}
                  onClick={() => setNewMatch({ ...newMatch, teamSize: size })}
                  style={{
                    flex: '1 0 auto',
                    minWidth: '52px',
                    padding: '12px 0',
                    background:
                      newMatch.teamSize === size
                        ? 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)'
                        : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border:
                      newMatch.teamSize === size
                        ? 'none'
                        : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                marginTop: '-0.5rem',
                marginBottom: '1rem'
              }}
            >
              {newMatch.teamSize} vs {newMatch.teamSize}
            </div>

            <label style={labelStyle}>{t.teamsLabel}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="color"
                    value={newMatch.teamAColor}
                    onChange={(e) => setNewMatch({ ...newMatch, teamAColor: e.target.value })}
                    style={{ width: '38px', height: '38px', border: 'none', borderRadius: '8px', background: 'none', cursor: 'pointer', padding: 0 }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{t.teamAShort}</span>
                </div>
                <input
                  style={{ ...inputStyle, marginBottom: 0 }}
                  value={newMatch.teamAName}
                  onChange={(e) => setNewMatch({ ...newMatch, teamAName: e.target.value })}
                  placeholder={t.teamA}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="color"
                    value={newMatch.teamBColor}
                    onChange={(e) => setNewMatch({ ...newMatch, teamBColor: e.target.value })}
                    style={{ width: '38px', height: '38px', border: 'none', borderRadius: '8px', background: 'none', cursor: 'pointer', padding: 0 }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{t.teamBShort}</span>
                </div>
                <input
                  style={{ ...inputStyle, marginBottom: 0 }}
                  value={newMatch.teamBName}
                  onChange={(e) => setNewMatch({ ...newMatch, teamBName: e.target.value })}
                  placeholder={t.teamB}
                />
              </div>
            </div>

            <div
              style={{
                borderTop: '1px dashed rgba(255,255,255,0.2)',
                paddingTop: '1rem',
                marginBottom: '1rem',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center'
              }}
            >
              {t.specialRoles}: {t.rolesClaimedLater}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setView('matches')}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {t.cancel}
              </button>
              <button
                onClick={createMatch}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {t.save}
              </button>
            </div>
          </div>
        )}

        {/* ================= SPIEL DETAIL ================= */}
        {view === 'match-detail' && currentMatch && (
          <div>
            <button
              onClick={() => {
                setView('matches');
                setIsEditing(false);
              }}
              style={{
                marginBottom: '1.5rem',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {t.backToMatches}
            </button>

            {!isEditing ? (
              <div
                style={{
                  ...cardStyle,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url(/images/ball.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.18
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: '900',
                        marginBottom: '0.5rem',
                        background:
                          'linear-gradient(135deg, #3498db 0%, #e74c3c 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      ⚽ {currentMatch.opponent}
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                      👤 {currentMatch.organizer}
                      <br />📅 {currentMatch.date}
                      <br />🕐 {currentMatch.time}
                      <br />📍 {currentMatch.place}
                    </div>
                  </div>
                  {(!currentMatch.creatorUid || (user && currentMatch.creatorUid === user.uid)) && (
                    <button
                      onClick={startEditing}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(52, 152, 219, 0.4)',
                        border: '2px solid rgba(52, 152, 219, 0.7)',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t.edit}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>✏️ {t.editMatch}</h3>
                <label style={labelStyle}>{t.organizer}</label>
                <input style={inputStyle} value={editData.organizer} onChange={(e) => setEditData({ ...editData, organizer: e.target.value })} />
                <label style={labelStyle}>{t.opponent}</label>
                <input style={inputStyle} value={editData.opponent} onChange={(e) => setEditData({ ...editData, opponent: e.target.value })} />
                <label style={labelStyle}>{t.date}</label>
                <input type="date" style={inputStyle} value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                <label style={labelStyle}>{t.time}</label>
                <input type="time" style={inputStyle} value={editData.time} onChange={(e) => setEditData({ ...editData, time: e.target.value })} />
                <label style={labelStyle}>{t.location}</label>
                <input style={inputStyle} value={editData.place} onChange={(e) => setEditData({ ...editData, place: e.target.value })} />
                <label style={labelStyle}>{t.ballResponsible}</label>
                <input style={inputStyle} value={editData.ballResponsible} onChange={(e) => setEditData({ ...editData, ballResponsible: e.target.value })} />
                <label style={labelStyle}>{t.bibsResponsible}</label>
                <input style={inputStyle} value={editData.bibsResponsible} onChange={(e) => setEditData({ ...editData, bibsResponsible: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{t.cancel}</button>
                  <button onClick={saveEdit} style={{ padding: '10px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{t.save}</button>
                </div>
              </div>
            )}

            {/* BESONDERE ROLLEN — offen, jeder kann übernehmen */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.1) 100%)',
                border: '2px solid rgba(255, 193, 7, 0.4)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#FFD700',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase'
                }}
              >
                {t.specialRoles}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { key: 'ballResponsible', label: t.ballShort },
                  { key: 'bibsResponsible', label: t.bibsShort }
                ].map((role) => {
                  const taken = (currentMatch[role.key] || '').trim();
                  return (
                    <div
                      key={role.key}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255, 193, 7, 0.3)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: '700' }}>
                        {role.label}
                      </div>
                      {taken ? (
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFD700', marginBottom: '0.5rem' }}>
                            {taken}
                          </div>
                          {canReleaseRole(currentMatch[role.key]) && (
                            <button
                              onClick={() => releaseRole(role.key)}
                              style={{
                                fontSize: '10px',
                                padding: '4px 10px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'rgba(255,255,255,0.7)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              {t.release}
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => claimRole(role.key)}
                          style={{
                            width: '100%',
                            fontSize: '11px',
                            padding: '8px',
                            background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '700'
                          }}
                        >
                          {t.claimRole}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '0.6rem', textAlign: 'center' }}>
                {t.enterName} ↑ {language === 'de' ? '(oben eintippen, dann übernehmen)' : language === 'fr' ? '(tape en haut puis prends le rôle)' : language === 'ar' ? '(اكتب فوق ثم خذ الدور)' : '(type above, then claim)'}
              </div>
            </div>

            {/* STATUS-BANNER: voll = fix, sonst mehr Spieler nötig */}
            {(() => {
              const cap = currentMatch.teamSize || 10;
              const aFull = (currentMatch.teamA?.length || 0) >= cap;
              const bFull = (currentMatch.teamB?.length || 0) >= cap;
              const ready = aFull && bFull;
              return (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '12px',
                    marginBottom: '1.25rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '14px',
                    background: ready
                      ? 'linear-gradient(135deg, rgba(39,174,96,0.25), rgba(30,132,73,0.2))'
                      : 'rgba(255,255,255,0.06)',
                    border: ready
                      ? '2px solid rgba(39,174,96,0.6)'
                      : '1px dashed rgba(255,255,255,0.25)',
                    color: ready ? '#7CFC7C' : 'rgba(255,255,255,0.75)'
                  }}
                >
                  {ready ? `✅ ${t.matchFixed}` : `⏳ ${t.morePlayers}`}
                </div>
              );
            })()}

            {/* PLATZ — 3D Feld (FC-Style) mit farbigen Trikots */}
            <div style={{ perspective: '1100px', marginBottom: '2.5rem' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, #3aa543 0%, #2c8a33 100%)',
                  border: '4px solid #1f6b28',
                  transform: 'rotateX(22deg) scale(1.01)',
                  transformOrigin: 'center top',
                  boxShadow: '0 30px 45px rgba(0,0,0,0.5)'
                }}
              >
                {/* Senkrechte Rasenstreifen */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 46px, transparent 46px, transparent 92px)'
                  }}
                />
                {/* Feld-Linien */}
                <svg
                  viewBox="0 0 300 420"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.75 }}
                >
                  <rect x="8" y="8" width="284" height="404" fill="none" stroke="#fff" strokeWidth="2" />
                  <line x1="8" y1="210" x2="292" y2="210" stroke="#fff" strokeWidth="2" />
                  <circle cx="150" cy="210" r="38" fill="none" stroke="#fff" strokeWidth="2" />
                  <circle cx="150" cy="210" r="3" fill="#fff" />
                  {/* Strafraum oben */}
                  <rect x="80" y="8" width="140" height="52" fill="none" stroke="#fff" strokeWidth="2" />
                  <rect x="115" y="8" width="70" height="22" fill="none" stroke="#fff" strokeWidth="2" />
                  <path d="M115 60 Q150 82 185 60" fill="none" stroke="#fff" strokeWidth="2" />
                  {/* Strafraum unten */}
                  <rect x="80" y="360" width="140" height="52" fill="none" stroke="#fff" strokeWidth="2" />
                  <rect x="115" y="390" width="70" height="22" fill="none" stroke="#fff" strokeWidth="2" />
                  <path d="M115 360 Q150 338 185 360" fill="none" stroke="#fff" strokeWidth="2" />
                </svg>

                {/* Inhalt: zwei Hälften */}
                <div style={{ position: 'relative', padding: '0.5rem' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: '13px',
                      color: '#fff',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      textShadow: '0 1px 5px rgba(0,0,0,0.95)',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      background: teamColorOf(currentMatch, 'A'),
                      margin: '4px'
                    }}
                  >
                    {teamNameOf(currentMatch, 'A')} — {currentMatch.teamA?.length || 0}/{currentMatch.teamSize || 10}
                  </div>
                  <TeamHalf
                    players={currentMatch.teamA || []}
                    team="A"
                    color={teamColorOf(currentMatch, 'A')}
                    flip={false}
                  />

                  <TeamHalf
                    players={currentMatch.teamB || []}
                    team="B"
                    color={teamColorOf(currentMatch, 'B')}
                    flip={true}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        fontSize: '13px',
                        color: '#fff',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        textShadow: '0 1px 5px rgba(0,0,0,0.95)',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        background: teamColorOf(currentMatch, 'B'),
                        margin: '4px'
                      }}
                    >
                      {teamNameOf(currentMatch, 'B')} — {currentMatch.teamB?.length || 0}/{currentMatch.teamSize || 10}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                marginTop: '-0.75rem',
                marginBottom: '1.5rem'
              }}
            >
              👕 {language === 'de' ? 'Tippe auf dein Trikot zum Entfernen' : language === 'fr' ? 'Tape sur ton maillot pour te retirer' : language === 'ar' ? 'انقر على قميصك للحذف' : 'Tap your own jersey to remove yourself'}
            </div>

            {/* SPIELER HINZUFÜGEN */}
            {(() => {
              const cap = currentMatch.teamSize || 10;
              const aCount = currentMatch.teamA?.length || 0;
              const bCount = currentMatch.teamB?.length || 0;
              const aFull = aCount >= cap;
              const bFull = bCount >= cap;
              const colorA = teamColorOf(currentMatch, 'A');
              const colorB = teamColorOf(currentMatch, 'B');
              return (
                <div style={cardStyle}>
                  <label style={labelStyle}>{t.enterName}</label>
                  <input
                    style={inputStyle}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder={t.enterName}
                  />
                  <label style={labelStyle}>{t.chooseTeam}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => addPlayer('A')}
                      disabled={aFull}
                      style={{
                        padding: '14px',
                        background: aFull
                          ? 'rgba(255,255,255,0.1)'
                          : `linear-gradient(135deg, ${shadeColor(colorA, 20)} 0%, ${colorA} 100%)`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: aFull ? 'not-allowed' : 'pointer',
                        textTransform: 'uppercase',
                        opacity: aFull ? 0.5 : 1
                      }}
                    >
                      {teamNameOf(currentMatch, 'A')} ({aCount}/{cap})
                    </button>
                    <button
                      onClick={() => addPlayer('B')}
                      disabled={bFull}
                      style={{
                        padding: '14px',
                        background: bFull
                          ? 'rgba(255,255,255,0.1)'
                          : `linear-gradient(135deg, ${shadeColor(colorB, 20)} 0%, ${colorB} 100%)`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: bFull ? 'not-allowed' : 'pointer',
                        textTransform: 'uppercase',
                        opacity: bFull ? 0.5 : 1
                      }}
                    >
                      {teamNameOf(currentMatch, 'B')} ({bCount}/{cap})
                    </button>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const isCreator =
                !currentMatch.creatorUid ||
                (user && currentMatch.creatorUid === user.uid);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: isCreator ? '1fr 1fr' : '1fr', gap: '10px' }}>
                  <button onClick={copyMatchLink} style={{ padding: '12px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>{t.copyLink}</button>
                  {isCreator && (
                    <button onClick={() => deleteMatch(currentMatch.id)} style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255, 99, 71, 0.4)', color: '#ff6347', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>{t.delete}</button>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
      )}

      {/* ============ MODAL: zentrale Meldung ============ */}
      {modalMsg && (
        <div
          onClick={() => setModalMsg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '380px',
              width: '100%',
              padding: '1.75rem 1.5rem',
              borderRadius: '16px',
              background: 'rgba(20, 30, 50, 0.98)',
              border: `2px solid ${
                modalMsg.kind === 'error'
                  ? 'rgba(231, 76, 60, 0.7)'
                  : modalMsg.kind === 'success'
                  ? 'rgba(39, 174, 96, 0.7)'
                  : 'rgba(52, 152, 219, 0.6)'
              }`,
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              animation: 'popIn 0.2s ease-out'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '0.75rem' }}>
              {modalMsg.kind === 'error' ? '⚠️' : modalMsg.kind === 'success' ? '✅' : 'ℹ️'}
            </div>
            <div
              style={{
                fontSize: '15px',
                color: '#fff',
                fontWeight: '600',
                lineHeight: '1.5',
                marginBottom: '1.5rem'
              }}
            >
              {modalMsg.text}
            </div>
            <button
              onClick={() => setModalMsg(null)}
              style={{
                padding: '10px 28px',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.4); }
        input, textarea { outline: none; font-family: inherit; }
      `}</style>
    </div>
  );
}