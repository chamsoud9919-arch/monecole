import { useState, useMemo } from "react";

const COULEURS_PALETTE = ["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#e91e63","#00bcd4","#8bc34a"];

const getMentionInfo = (avg) => {
  if (avg === null || avg === undefined || isNaN(avg)) return { label: "—", labelAr: "—", color: "#aaa" };
  if (avg >= 16) return { label: "Très Bien", labelAr: "ممتاز", color: "#27ae60" };
  if (avg >= 14) return { label: "Bien", labelAr: "جيد جداً", color: "#2ecc71" };
  if (avg >= 12) return { label: "Assez Bien", labelAr: "جيد", color: "#f39c12" };
  if (avg >= 10) return { label: "Passable", labelAr: "مقبول", color: "#e67e22" };
  return { label: "Insuffisant", labelAr: "ضعيف", color: "#e74c3c" };
};

const calcMoyenne = (notes, matieres) => {
  const valides = matieres.filter(m => notes[m.nom] !== "" && notes[m.nom] !== undefined && !isNaN(parseFloat(notes[m.nom])));
  if (valides.length === 0) return null;
  return valides.reduce((a, m) => a + parseFloat(notes[m.nom]), 0) / valides.length;
};

let nextId = 10;

const MATIERES_DEFAUT = [
  { nom: "Français", nomAr: "الفرنسية", couleur: "#e74c3c" },
  { nom: "Mathématiques", nomAr: "الرياضيات", couleur: "#3498db" },
  { nom: "Sciences", nomAr: "العلوم", couleur: "#2ecc71" },
  { nom: "Histoire-Géo", nomAr: "التاريخ والجغرافيا", couleur: "#f39c12" },
  { nom: "Arts", nomAr: "الفنون", couleur: "#9b59b6" },
  { nom: "EPS", nomAr: "التربية البدنية", couleur: "#1abc9c" },
];

const TRIMESTRES = ["1er Trimestre", "2ème Trimestre", "3ème Trimestre"];
const TRIMESTRES_AR = ["الفصل الأول", "الفصل الثاني", "الفصل الثالث"];

const MEDAILLES = ["🥇", "🥈", "🥉"];

export default function App() {
  const [page, setPage] = useState("liste");
  const [matieres, setMatieres] = useState(MATIERES_DEFAUT);
  const [nouvMatiere, setNouvMatiere] = useState({ nom: "", nomAr: "" });
  const [eleves, setEleves] = useState([
    
  ]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ nom: "", nomAr: "", prenom: "", prenomAr: "", classe: "" });
  const [editNotes, setEditNotes] = useState({});
  const [search, setSearch] = useState("");
  const [printId, setPrintId] = useState(null);
  const [printTrimestre, setPrintTrimestre] = useState(null);
  const [printClassement, setPrintClassement] = useState(null); // classe à imprimer classement
  const [printClassementTrimestre, setPrintClassementTrimestre] = useState(null);
  const [showMatieres, setShowMatieres] = useState(false);
  const [showParametres, setShowParametres] = useState(false);
  const [parametres, setParametres] = useState({ nomEcole: "", nomEcoleAr: "", annee: "2015-2016" });

  const classements = useMemo(() => {
    const result = {};
    const classes = [...new Set(eleves.map(e => e.classe))];
    classes.forEach(cl => {
      const elevesClasse = eleves
        .filter(e => e.classe === cl)
        .map(e => ({ ...e, moy: calcMoyenne(e.notes, matieres) }))
        .filter(e => e.moy !== null)
        .sort((a, b) => b.moy - a.moy);
      elevesClasse.forEach((e, i) => { result[e.id] = { rang: i + 1, total: elevesClasse.length }; });
    });
    return result;
  }, [eleves, matieres]);

  const classementsParClasse = useMemo(() => {
    const classes = [...new Set(eleves.map(e => e.classe))];
    const result = {};
    classes.forEach(cl => {
      result[cl] = eleves
        .filter(e => e.classe === cl)
        .map(e => ({ ...e, moy: calcMoyenne(e.notes, matieres) }))
        .sort((a, b) => {
          if (a.moy === null) return 1;
          if (b.moy === null) return -1;
          return b.moy - a.moy;
        });
    });
    return result;
  }, [eleves, matieres]);

  const meilleurParClasse = useMemo(() => {
    const classes = [...new Set(eleves.map(e => e.classe))];
    const result = {};
    classes.forEach(cl => {
      let best = null, bestM = -1;
      eleves.forEach(e => {
        if (e.classe !== cl) return;
        const m = calcMoyenne(e.notes, matieres);
        if (m !== null && m > bestM) { bestM = m; best = e; }
      });
      if (best) result[cl] = { eleve: best, moy: bestM };
    });
    return result;
  }, [eleves, matieres]);

  const selected = eleves.find(e => e.id === selectedId);
  const printEleve = eleves.find(e => e.id === printId);
  const filteredEleves = useMemo(() =>
    eleves.filter(e =>
      `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      e.classe.toLowerCase().includes(search.toLowerCase())
    ), [eleves, search]);

  const handleAjouter = () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.classe.trim()) return;
    setEleves([...eleves, { id: nextId++, ...form, notes: {} }]);
    setForm({ nom: "", nomAr: "", prenom: "", prenomAr: "", classe: "" });
    setPage("liste");
  };

  const handleSelectEleve = (id) => {
    const e = eleves.find(el => el.id === id);
    setSelectedId(id);
    setEditNotes({ ...e.notes });
    setPage("eleve");
  };

  const handleSaveNotes = () => {
    setEleves(eleves.map(e => e.id === selectedId ? { ...e, notes: { ...editNotes } } : e));
    setPage("liste");
  };

  const handleSupprimer = (id) => {
    if (!window.confirm("Supprimer cet élève ?")) return;
    setEleves(eleves.filter(e => e.id !== id));
  };

  const handleAjouterMatiere = () => {
    const nom = nouvMatiere.nom.trim();
    if (!nom || matieres.find(m => m.nom === nom)) return;
    const couleur = COULEURS_PALETTE[matieres.length % COULEURS_PALETTE.length];
    setMatieres([...matieres, { nom, nomAr: nouvMatiere.nomAr.trim() || nom, couleur }]);
    setNouvMatiere({ nom: "", nomAr: "" });
  };

  const handleSupprimerMatiere = (nom) => {
    if (matieres.length <= 1) return;
    setMatieres(matieres.filter(m => m.nom !== nom));
  };

  // ── IMPRESSION CLASSEMENT PAR CLASSE ──
  if (printClassement && printClassementTrimestre === null) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2342, #1a3a5c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 40, border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h2 style={{ color: "white", marginBottom: 6 }}>Classement — {printClassement}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24, fontSize: 14 }}>Choisissez le trimestre</p>
          <div style={{ display: "grid", gap: 12 }}>
            {TRIMESTRES.map((t, i) => (
              <button key={t} onClick={() => setPrintClassementTrimestre(i)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "13px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                {t} <span style={{ opacity: 0.6, fontSize: 12, marginRight: 6 }}>— {TRIMESTRES_AR[i]}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setPrintClassement(null)} style={{ marginTop: 18, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>← Annuler</button>
        </div>
      </div>
    );
  }

  if (printClassement && printClassementTrimestre !== null) {
    const elevesClasse = classementsParClasse[printClassement] || [];
    const nomEcole = parametres.nomEcole || "École Primaire";
    const nomEcoleAr = parametres.nomEcoleAr || "المدرسة الابتدائية";
    const trimLabel = TRIMESTRES[printClassementTrimestre];
    const trimArLabel = TRIMESTRES_AR[printClassementTrimestre];
    return (
      <div style={{ fontFamily: "'Georgia', serif", maxWidth: 750, margin: "0 auto", padding: 40, background: "white", color: "#222" }}>
        <div style={{ border: "3px double #1a3a5c", padding: 28, borderRadius: 4 }}>
          {/* EN-TÊTE */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1a3a5c", paddingBottom: 14, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: "bold", color: "#1a3a5c" }}>{nomEcole}</div>
              <div style={{ fontSize: 13, color: "#555" }}>{trimLabel} — {parametres.annee}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a3a5c" }}>Tableau de Classement</div>
              <div style={{ fontSize: 15, color: "#1a3a5c", fontFamily: "Arial", direction: "rtl" }}>جدول الترتيب</div>
              <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>Classe : <strong>{printClassement}</strong></div>
            </div>
            <div style={{ textAlign: "right", direction: "rtl", fontFamily: "Arial" }}>
              <div style={{ fontSize: 17, fontWeight: "bold", color: "#1a3a5c" }}>{nomEcoleAr}</div>
              <div style={{ fontSize: 13, color: "#555" }}>{trimArLabel} — {parametres.annee}</div>
            </div>
          </div>

          {/* TABLEAU */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1a3a5c", color: "white" }}>
                <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 12, width: 50 }}>Rang / الرتبة</th>
                <th style={{ padding: "9px 10px", textAlign: "left", fontSize: 12 }}>Élève / التلميذ</th>
                {matieres.map(m => (
                  <th key={m.nom} style={{ padding: "9px 6px", textAlign: "center", fontSize: 10, minWidth: 55 }}>
                    <div>{m.nom.slice(0, 6)}.</div>
                    {m.nomAr && <div style={{ fontFamily: "Arial", opacity: 0.8, fontSize: 9 }}>{m.nomAr.slice(0, 6)}</div>}
                  </th>
                ))}
                <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 12 }}>Moy. / المعدل</th>
                <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 12 }}>Mention</th>
              </tr>
            </thead>
            <tbody>
              {elevesClasse.map((e, i) => {
                const mention = getMentionInfo(e.moy);
                return (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa", borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "bold", fontSize: 16 }}>
                      {i < 3 ? MEDAILLES[i] : <span style={{ fontSize: 14, color: "#555" }}>{i + 1}</span>}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{e.prenom} {e.nom}</div>
                      {(e.prenomAr || e.nomAr) && <div style={{ fontSize: 11, direction: "rtl", fontFamily: "Arial", color: "#666" }}>{e.prenomAr} {e.nomAr}</div>}
                    </td>
                    {matieres.map(m => {
                      const n = parseFloat(e.notes[m.nom]);
                      return (
                        <td key={m.nom} style={{ padding: "8px 6px", textAlign: "center", fontSize: 13, fontWeight: 600, color: isNaN(n) ? "#ccc" : n >= 10 ? "#27ae60" : "#e74c3c" }}>
                          {isNaN(n) ? "—" : n}
                        </td>
                      );
                    })}
                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "bold", fontSize: 15, color: mention.color }}>
                      {e.moy !== null ? e.moy.toFixed(2) : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, color: mention.color }}>
                      <div>{mention.label}</div>
                      <div style={{ fontFamily: "Arial", direction: "rtl" }}>{mention.labelAr}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* RÉSUMÉ */}
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              ["Total élèves", elevesClasse.length, "عدد التلاميذ"],
              ["Moyenne classe", (() => { const m = elevesClasse.filter(e => e.moy !== null); return m.length ? (m.reduce((a, e) => a + e.moy, 0) / m.length).toFixed(2) : "—"; })(), "معدل القسم"],
              ["1er élève", elevesClasse[0] ? `${elevesClasse[0].prenom} (${elevesClasse[0].moy?.toFixed(2)})` : "—", "الأول"],
            ].map(([label, val, ar]) => (
              <div key={label} style={{ background: "#f0f4f8", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#888" }}>{label} / <span style={{ fontFamily: "Arial" }}>{ar}</span></div>
                <div style={{ fontWeight: "bold", fontSize: 15, color: "#1a3a5c", marginTop: 4 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ borderTop: "1px solid #ccc", paddingTop: 8, fontSize: 11, color: "#888", textAlign: "center" }}>Signature du Directeur / توقيع المدير</div>
            <div style={{ borderTop: "1px solid #ccc", paddingTop: 8, fontSize: 11, color: "#888", textAlign: "center" }}>Signature de l'Enseignant / توقيع المعلم</div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => window.print()} style={{ background: "#1a3a5c", color: "white", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>🖨️ Imprimer</button>
          <button onClick={() => { setPrintClassement(null); setPrintClassementTrimestre(null); }} style={{ background: "#eee", color: "#333", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>← Retour</button>
        </div>
      </div>
    );
  }

  // ── CHOIX TRIMESTRE BULLETIN INDIVIDUEL ──
  if (printId && !printTrimestre && printTrimestre !== 0) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2342, #1a3a5c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 40, border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🖨️</div>
          <h2 style={{ color: "white", marginBottom: 6 }}>Bulletin Individuel</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24, fontSize: 14 }}>Choisissez le trimestre</p>
          <div style={{ display: "grid", gap: 12 }}>
            {TRIMESTRES.map((t, i) => (
              <button key={t} onClick={() => setPrintTrimestre(i)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "13px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                {t} <span style={{ opacity: 0.6, fontSize: 12, marginRight: 6 }}>— {TRIMESTRES_AR[i]}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setPrintId(null)} style={{ marginTop: 18, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>← Annuler</button>
        </div>
      </div>
    );
  }

  // ── BULLETIN INDIVIDUEL ──
  if (printEleve && (printTrimestre !== null && printTrimestre !== undefined)) {
    const moy = calcMoyenne(printEleve.notes, matieres);
    const mention = getMentionInfo(moy);
    const rangInfo = classements[printEleve.id];
    const nomEcole = parametres.nomEcole || "École Primaire";
    const nomEcoleAr = parametres.nomEcoleAr || "المدرسة الابتدائية";
    return (
      <div style={{ fontFamily: "'Georgia', serif", maxWidth: 720, margin: "0 auto", padding: 40, background: "white", color: "#222" }}>
        <div style={{ border: "3px double #1a3a5c", padding: 28, borderRadius: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1a3a5c", paddingBottom: 14, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: "bold", color: "#1a3a5c" }}>{nomEcole}</div>
              <div style={{ fontSize: 13, color: "#555" }}>{TRIMESTRES[printTrimestre]} — {parametres.annee}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a3a5c" }}>Bulletin Scolaire</div>
              <div style={{ fontSize: 15, color: "#1a3a5c", fontFamily: "Arial", direction: "rtl" }}>بطاقة النقاط المدرسية</div>
            </div>
            <div style={{ textAlign: "right", direction: "rtl", fontFamily: "Arial" }}>
              <div style={{ fontSize: 17, fontWeight: "bold", color: "#1a3a5c" }}>{nomEcoleAr}</div>
              <div style={{ fontSize: 13, color: "#555" }}>{TRIMESTRES_AR[printTrimestre]} — {parametres.annee}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 18, background: "#f8f9fa", padding: 14, borderRadius: 4 }}>
            <div><div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Nom / الاسم</div><div style={{ fontWeight: "bold", color: "#1a3a5c" }}>{printEleve.nom}</div>{printEleve.nomAr && <div style={{ fontSize: 12, direction: "rtl", fontFamily: "Arial", color: "#444" }}>{printEleve.nomAr}</div>}</div>
            <div><div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Prénom / اللقب</div><div style={{ fontWeight: "bold", color: "#1a3a5c" }}>{printEleve.prenom}</div>{printEleve.prenomAr && <div style={{ fontSize: 12, direction: "rtl", fontFamily: "Arial", color: "#444" }}>{printEleve.prenomAr}</div>}</div>
            <div><div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Classe / القسم</div><div style={{ fontWeight: "bold", color: "#1a3a5c" }}>{printEleve.classe}</div></div>
            <div><div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Rang / الرتبة</div><div style={{ fontWeight: "bold", color: "#e74c3c", fontSize: 15 }}>{rangInfo ? `${rangInfo.rang}er / ${rangInfo.total}` : "—"}</div></div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
            <thead>
              <tr style={{ background: "#1a3a5c", color: "white" }}>
                <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 12 }}>Matière / المادة</th>
                <th style={{ padding: "9px 12px", textAlign: "center", fontSize: 12 }}>Note /20</th>
                <th style={{ padding: "9px 12px", textAlign: "center", fontSize: 12 }}>Mention / الملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map((m, i) => {
                const n = parseFloat(printEleve.notes[m.nom]);
                const valid = !isNaN(n);
                const appr = valid ? getMentionInfo(n) : null;
                return (
                  <tr key={m.nom} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, borderBottom: "1px solid #eee" }}>{m.nom}{m.nomAr && <span style={{ color: "#888", fontSize: 11, marginRight: 6, fontFamily: "Arial", direction: "rtl" }}> — {m.nomAr}</span>}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "bold", fontSize: 15, borderBottom: "1px solid #eee", color: valid ? m.couleur : "#ccc" }}>{valid ? n.toFixed(2) : "—"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 12, borderBottom: "1px solid #eee", color: appr?.color }}>{appr ? `${appr.label} / ${appr.labelAr}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a3a5c", color: "white", padding: "14px 20px", borderRadius: 4, marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: "bold" }}>Moyenne Générale / المعدل العام</div>
              {rangInfo && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Rang {rangInfo.rang}er sur {rangInfo.total} élèves</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 28, fontWeight: "bold" }}>{moy !== null ? moy.toFixed(2) : "—"}</span>
              <span style={{ fontSize: 13, opacity: 0.7, marginLeft: 4 }}>/20</span>
              <div style={{ fontSize: 12, color: "#ffd78a" }}>{mention.label} / {mention.labelAr}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {["Directeur / المدير", "Enseignant(e) / المعلم", "Parents / الأولياء"].map(l => (
              <div key={l} style={{ borderTop: "1px solid #ccc", paddingTop: 8, fontSize: 11, color: "#888", textAlign: "center" }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => window.print()} style={{ background: "#1a3a5c", color: "white", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>🖨️ Imprimer</button>
          <button onClick={() => { setPrintId(null); setPrintTrimestre(null); }} style={{ background: "#eee", color: "#333", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>← Retour</button>
        </div>
      </div>
    );
  }

  // ── INTERFACE PRINCIPALE ──
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2342 0%, #1a3a5c 50%, #0d4b6b 100%)", fontFamily: "'Segoe UI', sans-serif", color: "#fff" }}>
      <div style={{ background: "rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.12)", padding: "0 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, background: "linear-gradient(135deg, #f39c12, #e74c3c)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎓</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{parametres.nomEcole || "EcoleManager"}</div>
              <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, textTransform: "uppercase" }}>Gestion des Moyennes</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["liste","👥 Élèves"],["ajouter","➕ Ajouter"]].map(([p, label]) => (
              <button key={p} onClick={() => setPage(p)} style={{ background: page === p ? "rgba(255,255,255,0.2)" : "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: page === p ? 700 : 400 }}>{label}</button>
            ))}
            <button onClick={() => { setShowMatieres(!showMatieres); setShowParametres(false); }} style={{ background: showMatieres ? "rgba(243,156,18,0.3)" : "transparent", border: "1px solid rgba(243,156,18,0.5)", color: "#f39c12", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>⚙️ Matières</button>
            <button onClick={() => { setShowParametres(!showParametres); setShowMatieres(false); }} style={{ background: showParametres ? "rgba(52,152,219,0.3)" : "transparent", border: "1px solid rgba(52,152,219,0.5)", color: "#3498db", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>🏫 École</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }}>

        {showParametres && (
          <div style={{ background: "rgba(52,152,219,0.08)", border: "1px solid rgba(52,152,219,0.3)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "#3498db", fontSize: 16 }}>🏫 Paramètres de l'École</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[["Nom de l'école (Français)","nomEcole","ltr"],["اسم المدرسة (عربي)","nomEcoleAr","rtl"],["Année scolaire","annee","ltr"]].map(([label, key, dir]) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 11, opacity: 0.7, marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
                  <input value={parametres[key]} onChange={e => setParametres({ ...parametres, [key]: e.target.value })} style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(52,152,219,0.4)", color: "white", padding: "9px 12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", direction: dir, fontFamily: dir === "rtl" ? "Arial" : "inherit" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {showMatieres && (
          <div style={{ background: "rgba(243,156,18,0.08)", border: "1px solid rgba(243,156,18,0.3)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "#f39c12", fontSize: 16 }}>⚙️ Gérer les Matières</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              {matieres.map(m => (
                <div key={m.nom} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "6px 12px", borderLeft: `3px solid ${m.couleur}` }}>
                  <span style={{ fontSize: 13 }}>{m.nom}</span>
                  {m.nomAr && <span style={{ fontSize: 11, opacity: 0.6, fontFamily: "Arial" }}>/ {m.nomAr}</span>}
                  <button onClick={() => handleSupprimerMatiere(m.nom)} style={{ background: "transparent", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
              <input value={nouvMatiere.nom} onChange={e => setNouvMatiere({ ...nouvMatiere, nom: e.target.value })} placeholder="Matière (Français)" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "9px 14px", borderRadius: 8, fontSize: 14, outline: "none" }} />
              <input value={nouvMatiere.nomAr} onChange={e => setNouvMatiere({ ...nouvMatiere, nomAr: e.target.value })} placeholder="المادة (عربي)" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "9px 14px", borderRadius: 8, fontSize: 14, outline: "none", direction: "rtl", fontFamily: "Arial" }} />
              <button onClick={handleAjouterMatiere} style={{ background: "#f39c12", border: "none", color: "white", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>+ Ajouter</button>
            </div>
          </div>
        )}

        {/* STATS + CLASSEMENTS PAR CLASSE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 28 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 26 }}>👥</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#3498db" }}>{eleves.length}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Total Élèves</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 26 }}>📚</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#2ecc71" }}>{[...new Set(eleves.map(e => e.classe))].length}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Classes</div>
          </div>
          {Object.entries(meilleurParClasse).map(([cl, info]) => (
            <div key={cl} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(243,156,18,0.3)" }}>
              <div style={{ fontSize: 13, opacity: 0.7 }}>🏆 Meilleur(e) {cl}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#f39c12", marginTop: 4 }}>{info.eleve.prenom}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>Moy. {info.moy.toFixed(2)}</div>
              <button onClick={() => { setPrintClassement(cl); setPrintClassementTrimestre(null); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, width: "100%" }}>
                📋 Classement {cl}
              </button>
            </div>
          ))}
        </div>

        {/* LISTE */}
        {page === "liste" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 19 }}>Liste des Élèves</h2>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "9px 16px", borderRadius: 8, fontSize: 14, outline: "none", width: 210 }} />
            </div>
            {filteredEleves.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>Aucun élève trouvé.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {filteredEleves.map(e => {
                  const moy = calcMoyenne(e.notes, matieres);
                  const mention = getMentionInfo(moy);
                  const rangInfo = classements[e.id];
                  return (
                    <div key={e.id} onClick={() => handleSelectEleve(e.id)} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 18px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #3498db, #9b59b6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{e.prenom} {e.nom}</div>
                        {(e.prenomAr || e.nomAr) && <div style={{ fontSize: 11, direction: "rtl", fontFamily: "Arial", opacity: 0.55 }}>{e.prenomAr} {e.nomAr}</div>}
                        <div style={{ fontSize: 11, opacity: 0.5 }}>{e.classe}{rangInfo && <span style={{ color: "#f39c12", marginLeft: 6 }}>· Rang {rangInfo.rang}/{rangInfo.total}</span>}</div>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
                        {matieres.map(m => {
                          const n = parseFloat(e.notes[m.nom]);
                          return <div key={m.nom} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "2px 7px", fontSize: 11, borderLeft: `3px solid ${m.couleur}` }}><span style={{ opacity: 0.6 }}>{m.nom.slice(0, 3)}.</span> <span style={{ fontWeight: 700 }}>{isNaN(n) ? "—" : n}</span></div>;
                        })}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: mention.color }}>{moy !== null ? moy.toFixed(2) : "—"}</div>
                        <div style={{ fontSize: 10, color: mention.color }}>{mention.label}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={ev => { ev.stopPropagation(); setPrintId(e.id); setPrintTrimestre(null); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "7px 10px", borderRadius: 7, cursor: "pointer" }}>🖨️</button>
                        <button onClick={ev => { ev.stopPropagation(); handleSupprimer(e.id); }} style={{ background: "rgba(231,76,60,0.2)", border: "none", color: "#e74c3c", padding: "7px 10px", borderRadius: 7, cursor: "pointer" }}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AJOUTER */}
        {page === "ajouter" && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ marginTop: 0, fontSize: 19 }}>➕ Nouvel Élève</h2>
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 26, border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {[["Prénom","prenom","ltr"],["اللقب (Prénom Arabe)","prenomAr","rtl"],["Nom","nom","ltr"],["الاسم (Nom Arabe)","nomAr","rtl"]].map(([label, key, dir]) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 11, opacity: 0.7, marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
                    <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", direction: dir, fontFamily: dir === "rtl" ? "Arial" : "inherit" }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, opacity: 0.7, marginBottom: 5, textTransform: "uppercase" }}>Classe</label>
                <input value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} placeholder="ex: CM1, CE2..." style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={handleAjouter} style={{ width: "100%", background: "linear-gradient(135deg, #f39c12, #e74c3c)", border: "none", color: "white", padding: 13, borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>Ajouter l'Élève</button>
            </div>
          </div>
        )}

        {/* NOTES ÉLÈVE */}
        {page === "eleve" && selected && (
          <div style={{ maxWidth: 680 }}>
            <button onClick={() => setPage("liste")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "7px 16px", borderRadius: 7, cursor: "pointer", marginBottom: 18, fontSize: 13 }}>← Retour</button>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg, #3498db, #9b59b6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17 }}>{selected.prenom[0]}{selected.nom[0]}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>{selected.prenom} {selected.nom}</h2>
                {(selected.prenomAr || selected.nomAr) && <div style={{ fontSize: 13, direction: "rtl", fontFamily: "Arial", opacity: 0.6 }}>{selected.prenomAr} {selected.nomAr}</div>}
                <div style={{ opacity: 0.5, fontSize: 12 }}>{selected.classe}{classements[selected.id] && <span style={{ color: "#f39c12", marginLeft: 8 }}>· Rang {classements[selected.id].rang}/{classements[selected.id].total}</span>}</div>
              </div>
              <button onClick={() => { setPrintId(selected.id); setPrintTrimestre(null); }} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>🖨️ Bulletin</button>
            </div>
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 22, border: "1px solid rgba(255,255,255,0.12)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, opacity: 0.8 }}>Notes sur 20</h3>
              {matieres.map(m => (
                <div key={m.nom} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: m.couleur, flexShrink: 0 }} />
                  <div style={{ width: 190, fontSize: 13 }}>{m.nom}{m.nomAr && <span style={{ fontSize: 11, opacity: 0.5, marginRight: 5, fontFamily: "Arial" }}> / {m.nomAr}</span>}</div>
                  <input type="number" min="0" max="20" step="0.5" value={editNotes[m.nom] ?? ""} onChange={e => setEditNotes({ ...editNotes, [m.nom]: e.target.value })} style={{ width: 76, background: "rgba(255,255,255,0.1)", border: `1px solid ${m.couleur}55`, color: "white", padding: "7px 10px", borderRadius: 7, fontSize: 15, outline: "none", textAlign: "center" }} />
                  <div style={{ fontSize: 11, color: getMentionInfo(parseFloat(editNotes[m.nom])).color }}>
                    {editNotes[m.nom] !== "" && !isNaN(parseFloat(editNotes[m.nom])) ? getMentionInfo(parseFloat(editNotes[m.nom])).label : ""}
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 14, marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ opacity: 0.6, fontSize: 13 }}>Moyenne : </span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: getMentionInfo(calcMoyenne(editNotes, matieres)).color }}>{calcMoyenne(editNotes, matieres) !== null ? calcMoyenne(editNotes, matieres).toFixed(2) : "—"}</span>
                  <span style={{ fontSize: 12, opacity: 0.4 }}> /20</span>
                </div>
                <button onClick={handleSaveNotes} style={{ background: "linear-gradient(135deg, #2ecc71, #1abc9c)", border: "none", color: "white", padding: "10px 24px", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✅ Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}