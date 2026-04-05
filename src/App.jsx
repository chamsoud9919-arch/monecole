import { useState, useMemo, useEffect } from "react";

const COULEURS_PALETTE = ["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#e91e63","#00bcd4","#8bc34a"];

const getMentionInfo = (avg) => {
  if (avg === null || avg === undefined || isNaN(avg)) return { label: "---", labelAr: "---", color: "#aaa" };
  if (avg >= 16) return { label: "Tres Bien", labelAr: "Mumtaz", color: "#27ae60" };
  if (avg >= 14) return { label: "Bien", labelAr: "Jayyid Jiddan", color: "#2ecc71" };
  if (avg >= 12) return { label: "Assez Bien", labelAr: "Jayyid", color: "#f39c12" };
  if (avg >= 10) return { label: "Passable", labelAr: "Maqbul", color: "#e67e22" };
  return { label: "Insuffisant", labelAr: "Daif", color: "#e74c3c" };
};

const calcMoyenne = (notes, matieres) => {
  const valides = matieres.filter(m => notes[m.nom] !== "" && notes[m.nom] !== undefined && !isNaN(parseFloat(notes[m.nom])));
  if (valides.length === 0) return null;
  return valides.reduce((a, m) => a + parseFloat(notes[m.nom]), 0) / valides.length;
};

let nextId = 10;

const MATIERES_DEFAUT = [
  { nom: "Francais", nomAr: "Al-Faransiya", couleur: "#e74c3c" },
  { nom: "Mathematiques", nomAr: "Al-Riyadiyyat", couleur: "#3498db" },
  { nom: "Sciences", nomAr: "Al-Ulum", couleur: "#2ecc71" },
  { nom: "Histoire-Geo", nomAr: "Al-Tarikh wa Al-Jughrafiya", couleur: "#f39c12" },
  { nom: "Arts", nomAr: "Al-Funun", couleur: "#9b59b6" },
  { nom: "EPS", nomAr: "Al-Tarbiya Al-Badaniya", couleur: "#1abc9c" },
];

const PARAMETRES_DEFAUT = {
  nomEcole: "",
  nomEcoleAr: "",
  drena: "",
  iepp: "",
  epc: "",
  quartier: "",
  contact: "",
  codeEcole: "",
  statut: "PRIVE",
  annee: "2025-2026",
};

const TRIMESTRES = ["1er Trimestre", "2eme Trimestre", "3eme Trimestre"];
const MEDAILLES = ["1er", "2eme", "3eme"];

const load = (key, def) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
};
const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

export default function App() {
  const [page, setPage] = useState("liste");
  const [matieres, setMatieres] = useState(() => load("matieres", MATIERES_DEFAUT));
  const [nouvMatiere, setNouvMatiere] = useState({ nom: "", nomAr: "" });
  const [eleves, setEleves] = useState(() => load("eleves", []));
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ nom: "", nomAr: "", prenom: "", prenomAr: "", classe: "" });
  const [editNotes, setEditNotes] = useState({});
  const [search, setSearch] = useState("");
  const [printId, setPrintId] = useState(null);
  const [printTrimestre, setPrintTrimestre] = useState(null);
  const [printClassement, setPrintClassement] = useState(null);
  const [printClassementTrimestre, setPrintClassementTrimestre] = useState(null);
  const [showMatieres, setShowMatieres] = useState(false);
  const [showParametres, setShowParametres] = useState(false);
  const [parametres, setParametres] = useState(() => load("parametres", PARAMETRES_DEFAUT));
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => { save("eleves", eleves); }, [eleves]);
  useEffect(() => { save("matieres", matieres); }, [matieres]);
  useEffect(() => { save("parametres", parametres); }, [parametres]);

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
      (e.prenom + " " + e.nom).toLowerCase().includes(search.toLowerCase()) ||
      e.classe.toLowerCase().includes(search.toLowerCase())
    ), [eleves, search]);

  const handleSaveParametres = () => {
    save("parametres", parametres);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

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
    if (!window.confirm("Supprimer cet eleve ?")) return;
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

  const EnteteBulletin = () => (
    <div style={{ borderBottom: "2px solid #1a3a5c", paddingBottom: 14, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "start" }}>
        <div style={{ fontSize: 11, lineHeight: 1.8, color: "#222" }}>
          <div style={{ fontWeight: "bold", fontSize: 12 }}>REPUBLIQUE DE COTE D IVOIRE</div>
          <div>Union - Discipline - Travail</div>
          <div style={{ marginTop: 4 }}>
            <div>Ministere de l Education Nationale</div>
            {parametres.drena && <div><b>DRENA :</b> <span style={{ color: "#c0392b" }}>{parametres.drena}</span></div>}
            {parametres.iepp && <div><b>IEPP :</b> <span style={{ color: "#c0392b" }}>{parametres.iepp}</span></div>}
            {parametres.epc && <div><b>EPC :</b> <span style={{ color: "#c0392b" }}>{parametres.epc}</span></div>}
            {parametres.quartier && <div><b>QUARTIER :</b> {parametres.quartier}</div>}
            {parametres.contact && <div><b>CONTACT :</b> {parametres.contact}</div>}
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "0 10px" }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", border: "2px solid #1a3a5c", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            {"🎓"}
          </div>
          <div style={{ fontSize: 13, fontWeight: "bold", color: "#1a3a5c" }}>Bulletin Scolaire</div>
          {parametres.statut && <div style={{ marginTop: 4, fontSize: 10, background: "#1a3a5c", color: "white", borderRadius: 4, padding: "2px 8px", display: "inline-block" }}>STATUT : {parametres.statut}</div>}
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.8, color: "#222", textAlign: "right" }}>
          <div style={{ fontWeight: "bold", fontSize: 12 }}>Jumhuriyyat Kot Difwar</div>
          <div>Ittihad - Nizam - Amal</div>
          <div style={{ marginTop: 4 }}>
            <div>Wizarat Al-Tarbiya wa Al-Talim</div>
            {parametres.nomEcoleAr && <div style={{ color: "#c0392b", fontWeight: "bold" }}>Madrasa {parametres.nomEcoleAr}</div>}
            {parametres.quartier && <div>Al-Hara : {parametres.quartier}</div>}
            {parametres.contact && <div>Unwan Al-Madrasa : {parametres.contact}</div>}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, background: "#f0f4f8", padding: "6px 12px", borderRadius: 4, fontSize: 11 }}>
        {parametres.statut && <span><b>STATUT :</b> {parametres.statut}</span>}
        <span><b>{parametres.annee}</b></span>
        {parametres.codeEcole && <span><b>CODE :</b> {parametres.codeEcole}</span>}
      </div>
    </div>
  );

  if (printClassement && printClassementTrimestre === null) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2342, #1a3a5c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 40, border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{"📋"}</div>
          <h2 style={{ color: "white", marginBottom: 6 }}>Classement - {printClassement}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24, fontSize: 14 }}>Choisissez le trimestre</p>
          <div style={{ display: "grid", gap: 12 }}>
            {TRIMESTRES.map((t, i) => (
              <button key={t} onClick={() => setPrintClassementTrimestre(i)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "13px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setPrintClassement(null)} style={{ marginTop: 18, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Annuler</button>
        </div>
      </div>
    );
  }

  if (printClassement && printClassementTrimestre !== null) {
    const elevesClasse = classementsParClasse[printClassement] || [];
    return (
      <div style={{ fontFamily: "Georgia, serif", maxWidth: 750, margin: "0 auto", padding: 40, background: "white", color: "#222" }}>
        <div style={{ border: "3px double #1a3a5c", padding: 28, borderRadius: 4 }}>
          <EnteteBulletin />
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: "bold", color: "#1a3a5c" }}>
              Tableau de Classement - {printClassement} - {TRIMESTRES[printClassementTrimestre]}
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1a3a5c", color: "white" }}>
                <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 12, width: 50 }}>Rang</th>
                <th style={{ padding: "9px 10px", textAlign: "left", fontSize: 12 }}>Eleve</th>
                {matieres.map(m => (
                  <th key={m.nom} style={{ padding: "9px 6px", textAlign: "center", fontSize: 10, minWidth: 50 }}>
                    {m.nom.slice(0, 6)}.
                  </th>
                ))}
                <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 12 }}>Moy.</th>
                <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 12 }}>Mention</th>
              </tr>
            </thead>
            <tbody>
              {elevesClasse.map((e, i) => {
                const mention = getMentionInfo(e.moy);
                return (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa", borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "bold", fontSize: 14 }}>
                      {i < 3 ? MEDAILLES[i] : (i + 1)}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{e.prenom} {e.nom}</div>
                    </td>
                    {matieres.map(m => {
                      const n = parseFloat(e.notes[m.nom]);
                      return (
                        <td key={m.nom} style={{ padding: "8px 6px", textAlign: "center", fontSize: 13, fontWeight: 600, color: isNaN(n) ? "#ccc" : n >= 10 ? "#27ae60" : "#e74c3c" }}>
                          {isNaN(n) ? "-" : n}
                        </td>
                      );
                    })}
                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "bold", fontSize: 15, color: mention.color }}>
                      {e.moy !== null ? e.moy.toFixed(2) : "-"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, color: mention.color }}>
                      {mention.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              ["Total eleves", elevesClasse.length],
              ["Moyenne classe", (() => { const m = elevesClasse.filter(e => e.moy !== null); return m.length ? (m.reduce((a, e) => a + e.moy, 0) / m.length).toFixed(2) : "-"; })()],
              ["1er eleve", elevesClasse[0] ? (elevesClasse[0].prenom + " (" + elevesClasse[0].moy?.toFixed(2) + ")") : "-"],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "#f0f4f8", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
                <div style={{ fontWeight: "bold", fontSize: 14, color: "#1a3a5c", marginTop: 3 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ borderTop: "1px solid #ccc", paddingTop: 8, fontSize: 11, color: "#888", textAlign: "center" }}>Signature du Directeur</div>
            <div style={{ borderTop: "1px solid #ccc", paddingTop: 8, fontSize: 11, color: "#888", textAlign: "center" }}>Signature de l Enseignant</div>
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => window.print()} style={{ background: "#1a3a5c", color: "white", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>Imprimer</button>
          <button onClick={() => { setPrintClassement(null); setPrintClassementTrimestre(null); }} style={{ background: "#eee", color: "#333", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>Retour</button>
        </div>
      </div>
    );
  }

  if (printId && printTrimestre === null) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2342, #1a3a5c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 40, border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{"🖨️"}</div>
          <h2 style={{ color: "white", marginBottom: 6 }}>Bulletin Individuel</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24, fontSize: 14 }}>Choisissez le trimestre</p>
          <div style={{ display: "grid", gap: 12 }}>
            {TRIMESTRES.map((t, i) => (
              <button key={t} onClick={() => setPrintTrimestre(i)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "13px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setPrintId(null)} style={{ marginTop: 18, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Annuler</button>
        </div>
      </div>
    );
  }

  if (printEleve && printTrimestre !== null) {
    const moy = calcMoyenne(printEleve.notes, matieres);
    const mention = getMentionInfo(moy);
    const rangInfo = classements[printEleve.id];
    return (
      <div style={{ fontFamily: "Georgia, serif", maxWidth: 720, margin: "0 auto", padding: 40, background: "white", color: "#222" }}>
        <div style={{ border: "3px double #1a3a5c", padding: 28, borderRadius: 4 }}>
          <EnteteBulletin />
          <div style={{ textAlign: "center", marginBottom: 14, background: "#1a3a5c", color: "white", padding: "8px", borderRadius: 4 }}>
            <span style={{ fontWeight: "bold", fontSize: 13 }}>{TRIMESTRES[printTrimestre]}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16, background: "#f8f9fa", padding: 12, borderRadius: 4 }}>
            <div><div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Nom</div><div style={{ fontWeight: "bold", color: "#1a3a5c" }}>{printEleve.nom}</div></div>
            <div><div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Prenom</div><div style={{ fontWeight: "bold", color: "#1a3a5c" }}>{printEleve.prenom}</div></div>
            <div><div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Classe</div><div style={{ fontWeight: "bold", color: "#1a3a5c" }}>{printEleve.classe}</div></div>
            <div><div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Rang</div><div style={{ fontWeight: "bold", color: "#e74c3c", fontSize: 15 }}>{rangInfo ? (rangInfo.rang + " / " + rangInfo.total) : "-"}</div></div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr style={{ background: "#1a3a5c", color: "white" }}>
                <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 12 }}>Matiere</th>
                <th style={{ padding: "9px 12px", textAlign: "center", fontSize: 12 }}>Note /20</th>
                <th style={{ padding: "9px 12px", textAlign: "center", fontSize: 12 }}>Mention</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map((m, i) => {
                const n = parseFloat(printEleve.notes[m.nom]);
                const valid = !isNaN(n);
                const appr = valid ? getMentionInfo(n) : null;
                return (
                  <tr key={m.nom} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, borderBottom: "1px solid #eee" }}>{m.nom}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "bold", fontSize: 15, borderBottom: "1px solid #eee", color: valid ? m.couleur : "#ccc" }}>{valid ? n.toFixed(2) : "-"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 12, borderBottom: "1px solid #eee", color: appr ? appr.color : "#ccc" }}>{appr ? appr.label : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a3a5c", color: "white", padding: "14px 20px", borderRadius: 4, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: "bold" }}>Moyenne Generale</div>
              {rangInfo && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Rang {rangInfo.rang} sur {rangInfo.total} eleves</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 28, fontWeight: "bold" }}>{moy !== null ? moy.toFixed(2) : "-"}</span>
              <span style={{ fontSize: 13, opacity: 0.7, marginLeft: 4 }}>/20</span>
              <div style={{ fontSize: 12, color: "#ffd78a" }}>{mention.label}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {["Directeur", "Enseignant(e)", "Parents"].map(l => (
              <div key={l} style={{ borderTop: "1px solid #ccc", paddingTop: 8, fontSize: 11, color: "#888", textAlign: "center" }}>Signature {l}</div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => window.print()} style={{ background: "#1a3a5c", color: "white", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>Imprimer</button>
          <button onClick={() => { setPrintId(null); setPrintTrimestre(null); }} style={{ background: "#eee", color: "#333", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2342 0%, #1a3a5c 50%, #0d4b6b 100%)", fontFamily: "Segoe UI, sans-serif", color: "#fff" }}>
      <div style={{ background: "rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.12)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 65 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #f39c12, #e74c3c)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{"🎓"}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{parametres.epc || "EcoleManager"}</div>
              <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1, textTransform: "uppercase" }}>Gestion des Moyennes</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["liste","Eleves"],["ajouter","+ Ajouter"]].map(([p, label]) => (
              <button key={p} onClick={() => setPage(p)} style={{ background: page === p ? "rgba(255,255,255,0.2)" : "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "7px 13px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: page === p ? 700 : 400 }}>{label}</button>
            ))}
            <button onClick={() => { setShowMatieres(!showMatieres); setShowParametres(false); }} style={{ background: showMatieres ? "rgba(243,156,18,0.3)" : "transparent", border: "1px solid rgba(243,156,18,0.5)", color: "#f39c12", padding: "7px 13px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>Matieres</button>
            <button onClick={() => { setShowParametres(!showParametres); setShowMatieres(false); }} style={{ background: showParametres ? "rgba(52,152,219,0.3)" : "transparent", border: "1px solid rgba(52,152,219,0.5)", color: "#3498db", padding: "7px 13px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>Ecole</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px" }}>

        {showParametres && (
          <div style={{ background: "rgba(52,152,219,0.08)", border: "1px solid rgba(52,152,219,0.3)", borderRadius: 16, padding: 22, marginBottom: 22 }}>
            <h3 style={{ margin: "0 0 16px", color: "#3498db", fontSize: 15 }}>Informations de l Ecole</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                ["Nom de l ecole (Francais)","epc"],
                ["Nom de l ecole (Arabe)","nomEcoleAr"],
                ["DRENA","drena"],
                ["IEPP","iepp"],
                ["Quartier","quartier"],
                ["Contact","contact"],
                ["Code Ecole","codeEcole"],
                ["Statut (PRIVE / PUBLIC)","statut"],
                ["Annee scolaire","annee"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 10, opacity: 0.7, marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
                  <input value={parametres[key]} onChange={e => setParametres({ ...parametres, [key]: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(52,152,219,0.4)", color: "white", padding: "8px 11px", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button onClick={handleSaveParametres} style={{ marginTop: 14, background: "#3498db", border: "none", color: "white", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              {savedMsg ? "Sauvegarde !" : "Sauvegarder"}
            </button>
          </div>
        )}

        {showMatieres && (
          <div style={{ background: "rgba(243,156,18,0.08)", border: "1px solid rgba(243,156,18,0.3)", borderRadius: 16, padding: 22, marginBottom: 22 }}>
            <h3 style={{ margin: "0 0 14px", color: "#f39c12", fontSize: 15 }}>Gerer les Matieres</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 14 }}>
              {matieres.map(m => (
                <div key={m.nom} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(0,0,0,0.2)", borderRadius: 7, padding: "5px 11px", borderLeft: "3px solid " + m.couleur }}>
                  <span style={{ fontSize: 13 }}>{m.nom}</span>
                  <button onClick={() => handleSupprimerMatiere(m.nom)} style={{ background: "transparent", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 17, padding: 0 }}>x</button>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 9 }}>
              <input value={nouvMatiere.nom} onChange={e => setNouvMatiere({ ...nouvMatiere, nom: e.target.value })} placeholder="Matiere" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 12px", borderRadius: 7, fontSize: 13, outline: "none" }} />
              <input value={nouvMatiere.nomAr} onChange={e => setNouvMatiere({ ...nouvMatiere, nomAr: e.target.value })} placeholder="Nom arabe (optionnel)" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 12px", borderRadius: 7, fontSize: 13, outline: "none" }} />
              <button onClick={handleAjouterMatiere} style={{ background: "#f39c12", border: "none", color: "white", padding: "8px 18px", borderRadius: 7, cursor: "pointer", fontWeight: 700 }}>+ Ajouter</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 24 }}>{"👥"}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#3498db" }}>{eleves.length}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Total Eleves</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 24 }}>{"📚"}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#2ecc71" }}>{[...new Set(eleves.map(e => e.classe))].length}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Classes</div>
          </div>
          {Object.entries(meilleurParClasse).map(([cl, info]) => (
            <div key={cl} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(243,156,18,0.3)" }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Meilleur(e) {cl}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f39c12", marginTop: 3 }}>{info.eleve.prenom}</div>
              <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 6 }}>Moy. {info.moy.toFixed(2)}</div>
              <button onClick={() => { setPrintClassement(cl); setPrintClassementTrimestre(null); }} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "4px 9px", borderRadius: 5, cursor: "pointer", fontSize: 10, width: "100%" }}>
                Classement {cl}
              </button>
            </div>
          ))}
        </div>

        {page === "liste" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Liste des Eleves</h2>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 14px", borderRadius: 7, fontSize: 13, outline: "none", width: 200 }} />
            </div>
            {filteredEleves.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>Aucun eleve. Cliquez sur + Ajouter pour commencer.</div>
            ) : (
              <div style={{ display: "grid", gap: 9 }}>
                {filteredEleves.map(e => {
                  const moy = calcMoyenne(e.notes, matieres);
                  const mention = getMentionInfo(moy);
                  const rangInfo = classements[e.id];
                  return (
                    <div key={e.id} onClick={() => handleSelectEleve(e.id)} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 11, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #3498db, #9b59b6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      <div style={{ minWidth: 150 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{e.prenom} {e.nom}</div>
                        <div style={{ fontSize: 10, opacity: 0.5 }}>{e.classe}{rangInfo && <span style={{ color: "#f39c12", marginLeft: 6 }}>Rang {rangInfo.rang}/{rangInfo.total}</span>}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
                        {matieres.map(m => {
                          const n = parseFloat(e.notes[m.nom]);
                          return <div key={m.nom} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 5, padding: "2px 6px", fontSize: 10, borderLeft: "2px solid " + m.couleur }}><span style={{ opacity: 0.6 }}>{m.nom.slice(0, 3)}.</span> <span style={{ fontWeight: 700 }}>{isNaN(n) ? "-" : n}</span></div>;
                        })}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: mention.color }}>{moy !== null ? moy.toFixed(2) : "-"}</div>
                        <div style={{ fontSize: 10, color: mention.color }}>{mention.label}</div>
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={ev => { ev.stopPropagation(); setPrintId(e.id); setPrintTrimestre(null); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "6px 9px", borderRadius: 6, cursor: "pointer" }}>{"🖨️"}</button>
                        <button onClick={ev => { ev.stopPropagation(); handleSupprimer(e.id); }} style={{ background: "rgba(231,76,60,0.2)", border: "none", color: "#e74c3c", padding: "6px 9px", borderRadius: 6, cursor: "pointer" }}>{"🗑️"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {page === "ajouter" && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Nouvel Eleve</h2>
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {[["Prenom","prenom"],["Prenom (Arabe)","prenomAr"],["Nom","nom"],["Nom (Arabe)","nomAr"]].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 10, opacity: 0.7, marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
                    <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "9px 11px", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, opacity: 0.7, marginBottom: 5, textTransform: "uppercase" }}>Classe</label>
                <input value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} placeholder="ex: 6eme, CM1, CE2..." style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "9px 11px", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={handleAjouter} style={{ width: "100%", background: "linear-gradient(135deg, #f39c12, #e74c3c)", border: "none", color: "white", padding: 12, borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Ajouter l Eleve</button>
            </div>
          </div>
        )}

        {page === "eleve" && selected && (
          <div style={{ maxWidth: 660 }}>
            <button onClick={() => setPage("liste")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 14px", borderRadius: 6, cursor: "pointer", marginBottom: 16, fontSize: 12 }}>Retour</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #3498db, #9b59b6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>{selected.prenom[0]}{selected.nom[0]}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{selected.prenom} {selected.nom}</h2>
                <div style={{ opacity: 0.5, fontSize: 11 }}>{selected.classe}{classements[selected.id] && <span style={{ color: "#f39c12", marginLeft: 7 }}>Rang {classements[selected.id].rang}/{classements[selected.id].total}</span>}</div>
              </div>
              <button onClick={() => { setPrintId(selected.id); setPrintTrimestre(null); }} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>Bulletin</button>
            </div>
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, border: "1px solid rgba(255,255,255,0.12)" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 13, opacity: 0.8 }}>Notes sur 20</h3>
              {matieres.map(m => (
                <div key={m.nom} style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.couleur, flexShrink: 0 }} />
                  <div style={{ width: 185, fontSize: 13 }}>{m.nom}</div>
                  <input type="number" min="0" max="20" step="0.5" value={editNotes[m.nom] ?? ""} onChange={e => setEditNotes({ ...editNotes, [m.nom]: e.target.value })} style={{ width: 72, background: "rgba(255,255,255,0.1)", border: "1px solid " + m.couleur + "55", color: "white", padding: "7px 9px", borderRadius: 6, fontSize: 14, outline: "none", textAlign: "center" }} />
                  <div style={{ fontSize: 11, color: getMentionInfo(parseFloat(editNotes[m.nom])).color }}>
                    {editNotes[m.nom] !== "" && !isNaN(parseFloat(editNotes[m.nom])) ? getMentionInfo(parseFloat(editNotes[m.nom])).label : ""}
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ opacity: 0.6, fontSize: 12 }}>Moyenne : </span>
                  <span style={{ fontSize: 19, fontWeight: 800, color: getMentionInfo(calcMoyenne(editNotes, matieres)).color }}>{calcMoyenne(editNotes, matieres) !== null ? calcMoyenne(editNotes, matieres).toFixed(2) : "-"}</span>
                  <span style={{ fontSize: 11, opacity: 0.4 }}> /20</span>
                </div>
                <button onClick={handleSaveNotes} style={{ background: "linear-gradient(135deg, #2ecc71, #1abc9c)", border: "none", color: "white", padding: "9px 22px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}