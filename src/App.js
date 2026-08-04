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

export default function TakwiraApp() {
  const [language, setLanguage] = useState('de');
  const [view, setView] = useState('matches');
  const [playerName, setPlayerName] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  const [newMatch, setNewMatch] = useState({
    organizer: '',
    opponent: '',
    date: '',
    time: '',
    place: '',
    ballResponsible: '',
    bibsResponsible: ''
  });

  // ============================================
  //  FIREBASE: Live-Verbindung zur Datenbank
  //  Läuft automatisch bei jeder Änderung —
  //  auf ALLEN Geräten gleichzeitig!
  // ============================================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'matches'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setMatches(list);
        setLoading(false);
      },
      (error) => {
        console.error('Firebase Fehler:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
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
      createMatch: '➕ Neues Spiel erstellen',
      date: 'Datum',
      time: 'Uhrzeit',
      opponent: 'Spielname',
      location: 'Ort',
      organizer: 'Organisator',
      ballResponsible: '⚽ Ball-Verantwortlicher',
      bibsResponsible: '🟡 Trainings-Westen',
      specialRoles: '⭐ Besondere Rollen',
      ballShort: '⚽ Ball',
      bibsShort: '🟡 Westen',
      enterName: 'Gib deinen Namen ein',
      chooseTeam: 'Wähle dein Team',
      teamA: 'Team Rot',
      teamB: 'Team Blau',
      joinTeamA: '🔴 Team Rot',
      joinTeamB: '🔵 Team Blau',
      backToMatches: '← Zurück zu Spielen',
      editMatch: 'Spiel bearbeiten',
      edit: '✏️ Bearbeiten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: '🗑️ Löschen',
      noMatches: 'Noch keine Spiele geplant',
      createFirst: 'Erstes Spiel erstellen',
      createNew: 'Neues Spiel erstellen',
      copyLink: '📋 Link kopieren',
      copied: 'Link kopiert! Schick ihn per WhatsApp an deine Freunde.',
      loading: 'Lade Spiele...',
      confirmDeleteMatch: 'Dieses Spiel wirklich löschen?',
      confirmRemovePlayer: 'wirklich aus dem Team entfernen?',
      teamFull: 'Team ist voll!',
      liveSync: '🟢 Live — alle sehen dasselbe',
      players: 'Spieler'
    },
    en: {
      appName: 'TAKWIRA',
      tagline: 'Organize Football Matches With Friends',
      createMatch: '➕ Create New Match',
      date: 'Date',
      time: 'Time',
      opponent: 'Match Name',
      location: 'Location',
      organizer: 'Organizer',
      ballResponsible: '⚽ Ball Responsible',
      bibsResponsible: '🟡 Training Bibs',
      specialRoles: '⭐ Special Roles',
      ballShort: '⚽ Ball',
      bibsShort: '🟡 Bibs',
      enterName: 'Enter your name',
      chooseTeam: 'Choose your team',
      teamA: 'Red Team',
      teamB: 'Blue Team',
      joinTeamA: '🔴 Red Team',
      joinTeamB: '🔵 Blue Team',
      backToMatches: '← Back to Matches',
      editMatch: 'Edit Match',
      edit: '✏️ Edit',
      save: 'Save',
      cancel: 'Cancel',
      delete: '🗑️ Delete',
      noMatches: 'No matches yet',
      createFirst: 'Create first match',
      createNew: 'Create New Match',
      copyLink: '📋 Copy Link',
      copied: 'Link copied! Send it to your friends via WhatsApp.',
      loading: 'Loading matches...',
      confirmDeleteMatch: 'Really delete this match?',
      confirmRemovePlayer: 'really remove from the team?',
      teamFull: 'Team is full!',
      liveSync: '🟢 Live — everyone sees the same',
      players: 'players'
    },
    fr: {
      appName: 'TAKWIRA',
      tagline: 'Organisez des Matchs de Foot avec des Amis',
      createMatch: '➕ Créer un nouveau match',
      date: 'Date',
      time: 'Heure',
      opponent: 'Nom du match',
      location: 'Lieu',
      organizer: 'Organisateur',
      ballResponsible: '⚽ Responsable du Ballon',
      bibsResponsible: '🟡 Chasubles',
      specialRoles: '⭐ Rôles Spéciaux',
      ballShort: '⚽ Ballon',
      bibsShort: '🟡 Chasubles',
      enterName: 'Entrez votre nom',
      chooseTeam: 'Choisissez votre équipe',
      teamA: 'Équipe Rouge',
      teamB: 'Équipe Bleue',
      joinTeamA: '🔴 Équipe Rouge',
      joinTeamB: '🔵 Équipe Bleue',
      backToMatches: '← Retour aux matchs',
      editMatch: 'Modifier le match',
      edit: '✏️ Modifier',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: '🗑️ Supprimer',
      noMatches: 'Aucun match pour le moment',
      createFirst: 'Créez votre premier match',
      createNew: 'Créer un nouveau match',
      copyLink: '📋 Copier le lien',
      copied: 'Lien copié! Envoie-le à tes amis sur WhatsApp.',
      loading: 'Chargement des matchs...',
      confirmDeleteMatch: 'Vraiment supprimer ce match?',
      confirmRemovePlayer: 'vraiment retirer de l\'équipe?',
      teamFull: 'Équipe complète!',
      liveSync: '🟢 En direct — tout le monde voit pareil',
      players: 'joueurs'
    },
    ar: {
      appName: 'تكوير',
      tagline: 'نظم مباريات كرة مع أصدقائك',
      createMatch: '➕ إنشاء مباراة جديدة',
      date: 'التاريخ',
      time: 'الوقت',
      opponent: 'اسم المباراة',
      location: 'الموقع',
      organizer: 'المنظم',
      ballResponsible: '⚽ مسؤول الكرة',
      bibsResponsible: '🟡 المريلات',
      specialRoles: '⭐ الأدوار الخاصة',
      ballShort: '⚽ الكرة',
      bibsShort: '🟡 المريلات',
      enterName: 'أدخل اسمك',
      chooseTeam: 'اختر فريقك',
      teamA: 'الفريق الأحمر',
      teamB: 'الفريق الأزرق',
      joinTeamA: '🔴 الفريق الأحمر',
      joinTeamB: '🔵 الفريق الأزرق',
      backToMatches: '← العودة للمباريات',
      editMatch: 'تعديل المباراة',
      edit: '✏️ تعديل',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: '🗑️ حذف',
      noMatches: 'لا توجد مباريات',
      createFirst: 'أنشئ أول مباراة',
      createNew: 'إنشاء مباراة جديدة',
      copyLink: '📋 نسخ الرابط',
      copied: 'تم نسخ الرابط! أرسله لأصدقائك على واتساب.',
      loading: 'جاري تحميل المباريات...',
      confirmDeleteMatch: 'هل تريد حذف هذه المباراة؟',
      confirmRemovePlayer: 'هل تريد إزالته من الفريق؟',
      teamFull: 'الفريق ممتلئ!',
      liveSync: '🟢 مباشر — الجميع يرى نفس الشيء',
      players: 'لاعبين'
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
      ballResponsible: '',
      bibsResponsible: ''
    });
    setView('matches');
  };

  const addPlayer = async (team) => {
    if (!playerName.trim() || !currentMatch) return;
    const key = team === 'A' ? 'teamA' : 'teamB';
    const list = currentMatch[key] || [];

    if (list.length >= 10) {
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '1.5rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#fff',
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        {/* SPRACHE */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1.5rem',
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

        {/* HEADER */}
        {view === 'matches' && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid rgba(52, 152, 219, 0.3)'
            }}
          >
            <div style={{ fontSize: '60px', animation: 'bounce 2s infinite' }}>
              ⚽
            </div>
            <h1
              style={{
                fontSize: '42px',
                fontWeight: '900',
                margin: '0.5rem 0',
                background: 'linear-gradient(135deg, #3498db 0%, #e74c3c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {t.appName}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}
            >
              {t.tagline}
            </p>
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: '11px',
                color: '#4caf50',
                fontWeight: '700'
              }}
            >
              {t.liveSync}
            </div>
          </div>
        )}

        {/* LADEN */}
        {loading && (
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

        {/* SPIELE LISTE */}
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
                  padding: '3rem 2rem',
                  background: 'rgba(52, 152, 219, 0.1)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(52, 152, 219, 0.3)'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🏆</div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {t.noMatches}
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
                      🎮 {(match.teamA?.length || 0) + (match.teamB?.length || 0)}/20
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

                  {(match.ballResponsible || match.bibsResponsible) && (
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
                      🔴 {match.teamA?.length || 0}/10
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
                      🔵 {match.teamB?.length || 0}/10
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SPIEL ERSTELLEN */}
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
              onChange={(e) =>
                setNewMatch({ ...newMatch, organizer: e.target.value })
              }
              placeholder="z.B. Ahmed"
            />

            <label style={labelStyle}>{t.opponent}</label>
            <input
              style={inputStyle}
              value={newMatch.opponent}
              onChange={(e) =>
                setNewMatch({ ...newMatch, opponent: e.target.value })
              }
              placeholder="z.B. Freunde vs Arbeit"
            />

            <label style={labelStyle}>{t.date}</label>
            <input
              type="date"
              style={inputStyle}
              value={newMatch.date}
              onChange={(e) =>
                setNewMatch({ ...newMatch, date: e.target.value })
              }
            />

            <label style={labelStyle}>{t.time}</label>
            <input
              type="time"
              style={inputStyle}
              value={newMatch.time}
              onChange={(e) =>
                setNewMatch({ ...newMatch, time: e.target.value })
              }
            />

            <label style={labelStyle}>{t.location}</label>
            <input
              style={inputStyle}
              value={newMatch.place}
              onChange={(e) =>
                setNewMatch({ ...newMatch, place: e.target.value })
              }
              placeholder="z.B. Mainz Sportpark"
            />

            <label style={labelStyle}>{t.ballResponsible}</label>
            <input
              style={inputStyle}
              value={newMatch.ballResponsible}
              onChange={(e) =>
                setNewMatch({ ...newMatch, ballResponsible: e.target.value })
              }
              placeholder="z.B. Marco"
            />

            <label style={labelStyle}>{t.bibsResponsible}</label>
            <input
              style={inputStyle}
              value={newMatch.bibsResponsible}
              onChange={(e) =>
                setNewMatch({ ...newMatch, bibsResponsible: e.target.value })
              }
              placeholder="z.B. Klaus"
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}
            >
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
                  background:
                    'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
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

        {/* SPIEL DETAIL */}
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
              <div style={cardStyle}>
                <div
                  style={{
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
                      background: 'rgba(52, 152, 219, 0.3)',
                      border: '2px solid rgba(52, 152, 219, 0.6)',
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
                <input
                  style={inputStyle}
                  value={editData.organizer}
                  onChange={(e) =>
                    setEditData({ ...editData, organizer: e.target.value })
                  }
                />
                <label style={labelStyle}>{t.opponent}</label>
                <input
                  style={inputStyle}
                  value={editData.opponent}
                  onChange={(e) =>
                    setEditData({ ...editData, opponent: e.target.value })
                  }
                />
                <label style={labelStyle}>{t.date}</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={editData.date}
                  onChange={(e) =>
                    setEditData({ ...editData, date: e.target.value })
                  }
                />
                <label style={labelStyle}>{t.time}</label>
                <input
                  type="time"
                  style={inputStyle}
                  value={editData.time}
                  onChange={(e) =>
                    setEditData({ ...editData, time: e.target.value })
                  }
                />
                <label style={labelStyle}>{t.location}</label>
                <input
                  style={inputStyle}
                  value={editData.place}
                  onChange={(e) =>
                    setEditData({ ...editData, place: e.target.value })
                  }
                />
                <label style={labelStyle}>{t.ballResponsible}</label>
                <input
                  style={inputStyle}
                  value={editData.ballResponsible}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      ballResponsible: e.target.value
                    })
                  }
                />
                <label style={labelStyle}>{t.bibsResponsible}</label>
                <input
                  style={inputStyle}
                  value={editData.bibsResponsible}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      bibsResponsible: e.target.value
                    })
                  }
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}
                >
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={saveEdit}
                    style={{
                      padding: '10px',
                      background:
                        'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            )}

            {/* BESONDERE ROLLEN */}
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255, 193, 7, 0.3)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: '0.5rem',
                      fontWeight: '700'
                    }}
                  >
                    {t.ballShort}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#FFD700'
                    }}
                  >
                    {currentMatch.ballResponsible || '—'}
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255, 193, 7, 0.3)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: '0.5rem',
                      fontWeight: '700'
                    }}
                  >
                    {t.bibsShort}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#FFD700'
                    }}
                  >
                    {currentMatch.bibsResponsible || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* PLATZ */}
            <div
              style={{
                background:
                  'linear-gradient(180deg, rgba(46, 125, 50, 0.3) 0%, rgba(27, 94, 32, 0.2) 100%)',
                border: '3px dashed rgba(76, 175, 80, 0.4)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: '#ff6b6b',
                  fontWeight: '800',
                  marginBottom: '1rem',
                  textTransform: 'uppercase'
                }}
              >
                🔴 {t.teamA} — {currentMatch.teamA?.length || 0}/10
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}
              >
                {(currentMatch.teamA || []).map((player, idx) => (
                  <div
                    key={idx}
                    onClick={() => removePlayer('A', idx)}
                    style={{
                      background: 'rgba(255, 107, 107, 0.2)',
                      border: '2px solid rgba(255, 107, 107, 0.5)',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#ff6b6b',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {player} ✕
                  </div>
                ))}
              </div>

              <div
                style={{
                  height: '3px',
                  background: 'rgba(255,255,255,0.2)',
                  margin: '1.5rem 0',
                  borderRadius: '2px'
                }}
              />

              <div
                style={{
                  fontSize: '13px',
                  color: '#4dabf7',
                  fontWeight: '800',
                  marginBottom: '1rem',
                  textTransform: 'uppercase'
                }}
              >
                🔵 {t.teamB} — {currentMatch.teamB?.length || 0}/10
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}
              >
                {(currentMatch.teamB || []).map((player, idx) => (
                  <div
                    key={idx}
                    onClick={() => removePlayer('B', idx)}
                    style={{
                      background: 'rgba(77, 171, 247, 0.2)',
                      border: '2px solid rgba(77, 171, 247, 0.5)',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#4dabf7',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {player} ✕
                  </div>
                ))}
              </div>
            </div>

            {/* SPIELER HINZUFÜGEN */}
            <div style={cardStyle}>
              <label style={labelStyle}>{t.enterName}</label>
              <input
                style={inputStyle}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t.enterName}
              />
              <label style={labelStyle}>{t.chooseTeam}</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}
              >
                <button
                  onClick={() => addPlayer('A')}
                  style={{
                    padding: '14px',
                    background:
                      'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {t.joinTeamA}
                </button>
                <button
                  onClick={() => addPlayer('B')}
                  style={{
                    padding: '14px',
                    background:
                      'linear-gradient(135deg, #4dabf7 0%, #1e88e5 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {t.joinTeamB}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}
            >
              <button
                onClick={copyMatchLink}
                style={{
                  padding: '12px',
                  background:
                    'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {t.copyLink}
              </button>
              <button
                onClick={() => deleteMatch(currentMatch.id)}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255, 99, 71, 0.4)',
                  color: '#ff6347',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {t.delete}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        input::placeholder { color: rgba(255,255,255,0.4); }
        input { outline: none; }
      `}</style>
    </div>
  );
}