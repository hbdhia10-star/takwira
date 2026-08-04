import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { RULES, RULES_FOOTER } from './rules';

export default function TakwiraApp() {
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

  const [newMatch, setNewMatch] = useState({
    organizer: '',
    opponent: '',
    date: '',
    time: '',
    place: '',
    teamSize: 10,
    ballResponsible: '',
    bibsResponsible: ''
  });

  // ============================================
  //  FIREBASE: Live-Verbindung — Spiele
  // ============================================
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'matches'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setMatches(list);
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
      noRoles: 'Keine Rollen festgelegt',
      enterName: 'Gib deinen Namen ein',
      chooseTeam: 'Wähle dein Team',
      teamA: 'Team Rot',
      teamB: 'Team Blau',
      joinTeamA: '🔴 Team Rot',
      joinTeamB: '🔵 Team Blau',
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
      teamFull: 'Team ist voll!',
      liveSync: '🟢 Live — alle sehen dasselbe',
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
      noRoles: 'No roles assigned',
      enterName: 'Enter your name',
      chooseTeam: 'Choose your team',
      teamA: 'Red Team',
      teamB: 'Blue Team',
      joinTeamA: '🔴 Red Team',
      joinTeamB: '🔵 Blue Team',
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
      teamFull: 'Team is full!',
      liveSync: '🟢 Live — everyone sees the same',
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
      noRoles: 'Aucun rôle attribué',
      enterName: 'Entrez votre nom',
      chooseTeam: 'Choisissez votre équipe',
      teamA: 'Équipe Rouge',
      teamB: 'Équipe Bleue',
      joinTeamA: '🔴 Équipe Rouge',
      joinTeamB: '🔵 Équipe Bleue',
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
      teamFull: 'Équipe complète!',
      liveSync: '🟢 En direct — tout le monde voit pareil',
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
      noRoles: 'ما فماش أدوار محددة',
      enterName: 'أدخل اسمك',
      chooseTeam: 'اختر فريقك',
      teamA: 'الفريق الأحمر',
      teamB: 'الفريق الأزرق',
      joinTeamA: '🔴 الفريق الأحمر',
      joinTeamB: '🔵 الفريق الأزرق',
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
      teamFull: 'الفريق عامر!',
      liveSync: '🟢 مباشر — الكل يشوف نفس الشيء',
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
      createdAt: Date.now()
    });
    setNewMatch({
      organizer: '',
      opponent: '',
      date: '',
      time: '',
      place: '',
      teamSize: 10,
      ballResponsible: '',
      bibsResponsible: ''
    });
    setView('matches');
  };

  const addPlayer = async (team) => {
    if (!playerName.trim() || !currentMatch) return;
    const key = team === 'A' ? 'teamA' : 'teamB';
    const list = currentMatch[key] || [];
    const cap = currentMatch.teamSize || 10;
    if (list.length >= cap) {
      alert(t.teamFull);
      return;
    }
    await updateDoc(doc(db, 'matches', currentMatch.id), {
      [key]: [...list, playerName.trim()]
    });
    setPlayerName('');
  };

  const removePlayer = async (team, index) => {
    const key = team === 'A' ? 'teamA' : 'teamB';
    const list = currentMatch[key] || [];
    if (!window.confirm(`${list[index]} — ${t.confirmRemovePlayer}`)) return;
    await updateDoc(doc(db, 'matches', currentMatch.id), {
      [key]: list.filter((_, i) => i !== index)
    });
  };

  const deleteMatch = async (id) => {
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
    alert(t.copied);
  };

  // Rolle übernehmen (Ball oder Westen) — nur wenn noch frei
  const claimRole = async (roleKey) => {
    if (!currentMatch) return;
    if ((currentMatch[roleKey] || '').trim()) return; // schon vergeben
    const name = (playerName.trim() || window.prompt(t.enterName) || '').trim();
    if (!name) return;
    await updateDoc(doc(db, 'matches', currentMatch.id), { [roleKey]: name });
  };

  // Rolle wieder freigeben
  const releaseRole = async (roleKey) => {
    if (!currentMatch) return;
    if (!window.confirm(t.confirmRelease)) return;
    await updateDoc(doc(db, 'matches', currentMatch.id), { [roleKey]: '' });
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

  // Ein einzelnes Trikot mit Namen drunter (Stil wie Aufstellungs-Grafik)
  const Jersey = ({ name, isKeeper, onClick }) => {
    const fill = isKeeper ? '#f5d020' : '#f4f4f4';
    const shade = isKeeper ? '#d4b010' : '#d0d0d0';
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          width: '70px',
          userSelect: 'none'
        }}
        title={name}
      >
        <svg width="46" height="46" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
          {/* Ärmel */}
          <path d="M30 16 L14 28 L22 44 L34 36 Z" fill={fill} stroke={shade} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M70 16 L86 28 L78 44 L66 36 Z" fill={fill} stroke={shade} strokeWidth="1.5" strokeLinejoin="round" />
          {/* Körper */}
          <path d="M30 16 Q40 22 50 22 Q60 22 70 16 L70 86 Q50 90 30 86 Z" fill={fill} stroke={shade} strokeWidth="1.5" strokeLinejoin="round" />
          {/* Kragen */}
          <path d="M40 18 Q50 28 60 18" fill="none" stroke={shade} strokeWidth="2.5" />
        </svg>
        <div
          style={{
            marginTop: '1px',
            fontSize: '10px',
            fontWeight: '700',
            color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
            maxWidth: '70px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center'
          }}
        >
          {name} <span style={{ color: '#ff8a8a' }}>✕</span>
        </div>
      </div>
    );
  };

  // Eine Mannschaftshälfte: Spieler in Formation aufs Feld verteilt
  const TeamHalf = ({ players, team, flip }) => {
    const formation = buildFormation(players.length);
    // Spieler den Reihen zuordnen
    const rows = [];
    let i = 0;
    for (const n of formation) {
      rows.push(players.slice(i, i + n).map((name, idx) => ({ name, idx: i + idx })));
      i += n;
    }
    const orderedRows = flip ? [...rows].reverse() : rows;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          gap: '30px',
          minHeight: '260px',
          padding: '26px 0'
        }}
      >
        {orderedRows.map((row, r) => (
          <div
            key={r}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              flexWrap: 'wrap'
            }}
          >
            {row.map((p) => (
              <Jersey
                key={p.idx}
                name={p.name}
                isKeeper={p.idx === 0}
                onClick={() => removePlayer(team, p.idx)}
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

            {/* PLATZ — echtes Feld mit Trikots in Formation */}
            <div
              style={{
                position: 'relative',
                borderRadius: '14px',
                marginBottom: '1.5rem',
                overflow: 'hidden',
                background:
                  'linear-gradient(180deg, #3a9e3f 0%, #2f8a34 100%)',
                border: '4px solid #1f6b28'
              }}
            >
              {/* Senkrechte Rasenstreifen */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 42px, transparent 42px, transparent 84px)'
                }}
              />
              {/* Feld-Linien */}
              <svg
                viewBox="0 0 300 460"
                preserveAspectRatio="none"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0.7
                }}
              >
                <rect x="8" y="8" width="284" height="444" fill="none" stroke="#fff" strokeWidth="2" />
                {/* Mittellinie + Kreis */}
                <line x1="8" y1="230" x2="292" y2="230" stroke="#fff" strokeWidth="2" />
                <circle cx="150" cy="230" r="42" fill="none" stroke="#fff" strokeWidth="2" />
                <circle cx="150" cy="230" r="3" fill="#fff" />
                {/* Strafraum oben */}
                <rect x="85" y="8" width="130" height="58" fill="none" stroke="#fff" strokeWidth="2" />
                <rect x="118" y="8" width="64" height="26" fill="none" stroke="#fff" strokeWidth="2" />
                <path d="M118 66 Q150 86 182 66" fill="none" stroke="#fff" strokeWidth="2" />
                {/* Strafraum unten */}
                <rect x="85" y="394" width="130" height="58" fill="none" stroke="#fff" strokeWidth="2" />
                <rect x="118" y="426" width="64" height="26" fill="none" stroke="#fff" strokeWidth="2" />
                <path d="M118 394 Q150 374 182 394" fill="none" stroke="#fff" strokeWidth="2" />
              </svg>

              {/* Inhalt: zwei Hälften */}
              <div style={{ position: 'relative', padding: '0.5rem' }}>
                {/* TEAM ROT — obere Hälfte */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#fff',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                    padding: '4px 8px'
                  }}
                >
                  🔴 {t.teamA} — {currentMatch.teamA?.length || 0}/{currentMatch.teamSize || 10}
                </div>
                <TeamHalf
                  players={currentMatch.teamA || []}
                  team="A"
                  flip={false}
                />

                {/* TEAM BLAU — untere Hälfte (Formation gespiegelt) */}
                <TeamHalf
                  players={currentMatch.teamB || []}
                  team="B"
                  flip={true}
                />
                <div
                  style={{
                    fontSize: '12px',
                    color: '#fff',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                    padding: '4px 8px',
                    textAlign: 'right'
                  }}
                >
                  🔵 {t.teamB} — {currentMatch.teamB?.length || 0}/{currentMatch.teamSize || 10}
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
              👕 {language === 'de' ? 'Tippe auf ein Trikot zum Entfernen' : language === 'fr' ? 'Tape sur un maillot pour retirer' : language === 'ar' ? 'انقر على القميص للحذف' : 'Tap a jersey to remove'}
            </div>

            {/* SPIELER HINZUFÜGEN */}
            <div style={cardStyle}>
              <label style={labelStyle}>{t.enterName}</label>
              <input style={inputStyle} value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder={t.enterName} />
              <label style={labelStyle}>{t.chooseTeam}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => addPlayer('A')} style={{ padding: '14px', background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>{t.joinTeamA}</button>
                <button onClick={() => addPlayer('B')} style={{ padding: '14px', background: 'linear-gradient(135deg, #4dabf7 0%, #1e88e5 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>{t.joinTeamB}</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={copyMatchLink} style={{ padding: '12px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>{t.copyLink}</button>
              <button onClick={() => deleteMatch(currentMatch.id)} style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255, 99, 71, 0.4)', color: '#ff6347', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>{t.delete}</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.4); }
        input, textarea { outline: none; font-family: inherit; }
      `}</style>
    </div>
  );
}