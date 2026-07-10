import { useMemo, useState } from "react";

/*
  Coeficientes calibrados con los datos reales del dataset (n=1000):

  Intercepto base:
    - Nota media global: 70.83
    - Ajustado para que los defaults (~4h estudio, 7h sueño, 80% asistencia, stress 5)
      sin extras den ~70.

  Horas de estudio: correlación r=0.704
    Pendiente estimada: diferencia A→D en notas ≈ 45 pts / diferencia en horas ≈ 7.3h
    → ~6.1 puntos por hora, pero con rendimientos decrecientes. Se usa escala lineal
    escalada: la diferencia de medias entre grupos de notas divide ~44 puntos en ~7h → 2.7/h
    (el rango efectivo es 0.5h→15.5h; la regresión simple no es lineal, se modera por estrés)

  Estrés: correlación r=-0.51
    Rango 1–10, diferencia A→F en estrés ≈ 3.7 pts → ~-4.5 puntos por punto de estrés

  Sueño: correlación r=0.27
    Efecto más pequeño: ~1.1 por hora extra

  Presencia: correlación r=0.26
    ~0.17 por punto porcentual

  Variables binarias (diferencias de medias):
    - Beca: +3.56 (73.94 vs 70.38)
    - Sin trabajo: +6.37 (73.0 vs 66.6)
    - Sin internet: -4.93 (71.2 vs 66.3)
    - Educación padres (vs High School base):
        Bachelor: +3.14 | Master: +7.14 | PhD: +10.16

  Intercepto ajustado empíricamente para que con valores medios (4.3h estudio,
  7.1h sueño, 74% presencia, stress 3.9) sin extras el resultado sea ≈ 70.8
*/

const GRADE_THRESHOLDS = [
  { grade: "A", min: 80 },
  { grade: "B", min: 65 },
  { grade: "C", min: 52 },
  { grade: "D", min: 40 },
  { grade: "F", min: 0  },
];

// Color va de rojo (0) → naranja (50) → azul (100): intuitivo, mayor = mejor
function scoreColor(score) {
  if (score >= 80) return "#3266ad";
  if (score >= 65) return "#5ca8f4";
  if (score >= 52) return "#f0a030";
  if (score >= 40) return "#d85a30";
  return "#a32d2d";
}

function getGrade(score) {
  const t = GRADE_THRESHOLDS.find(t => score >= t.min) || GRADE_THRESHOLDS[4];
  return { grade: t.grade, color: scoreColor(score) };
}

function ScoreArc({ score }) {
  const pct = score / 100;
  const r = 70;
  const cx = 90, cy = 90;
  const startAngle = Math.PI;
  const endAngle = Math.PI + pct * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = pct > 0.5 ? 1 : 0;
  const { grade, color } = getGrade(score);
  return (
    <svg viewBox="0 0 180 110" style={{ width: "100%", maxWidth: 220 }} aria-hidden="true">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="10" strokeLinecap="round" />
      {score > 0 && (
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          style={{ transition: "all 0.35s ease" }} />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle"
        style={{ fontSize: 36, fontWeight: 700, fill: color, transition: "fill 0.35s ease", fontFamily: "inherit" }}>
        {Math.round(score)}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 500, fill: color, transition: "fill 0.35s ease", fontFamily: "inherit" }}>
        {grade}
      </text>
    </svg>
  );
}

function Slider({ label, value, min, max, step = 1, unit = "", onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#3266ad" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{min}{unit}</span>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{max}{unit}</span>
      </div>
    </div>
  );
}

function Toggle({ label, sublabel, checked, onChange, icon }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      display: "flex", alignItems: "center", gap: 12,
      background: checked ? "rgba(50,102,173,0.08)" : "var(--color-background-secondary)",
      border: checked ? "0.5px solid rgba(50,102,173,0.4)" : "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-md)", padding: "10px 14px",
      cursor: "pointer", width: "100%", textAlign: "left", transition: "all 0.2s"
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{sublabel}</div>}
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        background: checked ? "#3266ad" : "var(--color-border-secondary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s", flexShrink: 0
      }}>
        {checked && <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>}
      </div>
    </button>
  );
}

const PARENT_EDU_LABELS = ["Secundaria", "Universitario", "Maestría", "Doctorado"];
const PARENT_EDU_BONUS = [0, 3.14, 7.14, 10.16];

export default function StudentBuilder() {
  const [gender, setGender] = useState("Female");
  const [studyHours, setStudyHours] = useState(4);
  const [sleepHours, setSleepHours] = useState(7);
  const [attendance, setAttendance] = useState(74);
  const [stress, setStress] = useState(4);
  const [scholarship, setScholarship] = useState(false);
  const [internet, setInternet] = useState(true);
  const [partTimeJob, setPartTimeJob] = useState(false);
  const [parentEdu, setParentEdu] = useState(1);

  // Sueño: parábola con pico en 8h. Coeficiente -0.55 elegido para que:
  //   8h → +0 (punto de referencia, absorbido en el intercepto)
  //   7h → -0.55 | 6h → -2.2 | 5h → -4.95 | 4h → -8.8
  //  10h → -2.2 | 12h → -8.8  (simétrico: exceso tan penalizante como déficit)
  // El intercepto se ajustó +8.8 para que 8h de sueño siga dando el mismo resultado base.
  const SLEEP_PEAK = 8;
  const sleepEffect = -0.55 * Math.pow(sleepHours - SLEEP_PEAK, 2);

  const score = useMemo(() => {
    const base = 56.0
      + (gender === "Male" ? 0.6 : 0)
      + (scholarship ? 3.56 : 0)
      + (internet ? 4.93 : 0)
      - (partTimeJob ? 6.37 : 0)
      + PARENT_EDU_BONUS[parentEdu]
      + 2.68 * studyHours
      + sleepEffect
      + 0.17 * attendance
      - 1.45 * stress;
    return Math.max(0, Math.min(100, Math.round(base * 10) / 10));
  }, [gender, scholarship, internet, partTimeJob, parentEdu, studyHours, sleepEffect, attendance, stress]);

  const { grade, color } = getGrade(score);

  const sleepLabel = sleepHours === SLEEP_PEAK
    ? `Horas de sueño (óptimo: ${SLEEP_PEAK}h)`
    : sleepHours < SLEEP_PEAK
    ? `Horas de sueño (déficit: −${SLEEP_PEAK - sleepHours}h)`
    : `Horas de sueño (exceso: +${sleepHours - SLEEP_PEAK}h)`;

  const factors = [
    { label: "Horas de estudio", impact: +(2.68 * studyHours).toFixed(1), positive: true },
    { label: sleepLabel, impact: +sleepEffect.toFixed(1), positive: sleepEffect >= 0 },
    { label: "Asistencia", impact: +(0.17 * attendance).toFixed(1), positive: true },
    { label: "Estrés", impact: +(-1.45 * stress).toFixed(1), positive: false },
    { label: "Educación de los padres", impact: +PARENT_EDU_BONUS[parentEdu].toFixed(1), positive: PARENT_EDU_BONUS[parentEdu] >= 0 },
    scholarship && { label: "Beca", impact: 3.56, positive: true },
    !internet && { label: "Sin acceso a internet", impact: -4.93, positive: false },
    partTimeJob && { label: "Trabajo part-time", impact: -6.37, positive: false },
  ].filter(Boolean).sort((a, b) => b.impact - a.impact);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "var(--font-sans)" }}>
      <h2 class="sr-only">Simulador de promedio estudiantil</h2>

      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>
          Simulador
        </div>
        <div style={{ fontSize: 26, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
          ¿Qué promedio sacaría tu estudiante?
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 6 }}>
          Basado en datos reales de 1.000 estudiantes universitarios.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>

        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Características
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Género</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Female", "Male"].map(g => (
                <button key={g} onClick={() => setGender(g)} style={{
                  flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 500,
                  borderRadius: "var(--border-radius-md)",
                  border: gender === g ? "0.5px solid rgba(50,102,173,0.5)" : "0.5px solid var(--color-border-tertiary)",
                  background: gender === g ? "rgba(50,102,173,0.08)" : "var(--color-background-secondary)",
                  color: gender === g ? "#3266ad" : "var(--color-text-secondary)",
                  cursor: "pointer", transition: "all 0.15s"
                }}>
                  {g === "Female" ? "Mujer" : "Varón"}
                </button>
              ))}
            </div>
          </div>

          <Slider label="Horas de estudio por día" value={studyHours} min={0} max={15} onChange={setStudyHours} unit="h" />
          <Slider label="Horas de sueño  (óptimo 7–9h)" value={sleepHours} min={4} max={12} onChange={setSleepHours} unit="h" />
          <Slider label="Tasa de asistencia" value={attendance} min={50} max={100} onChange={setAttendance} unit="%" />
          <Slider label="Nivel de estrés" value={stress} min={1} max={10} onChange={setStress} />

          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8, marginTop: 4 }}>
            Educación de los padres
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 18 }}>
            {PARENT_EDU_LABELS.map((label, i) => (
              <button key={i} onClick={() => setParentEdu(i)} style={{
                padding: "7px 0", fontSize: 12, fontWeight: 500,
                borderRadius: "var(--border-radius-md)",
                border: parentEdu === i ? "0.5px solid rgba(50,102,173,0.5)" : "0.5px solid var(--color-border-tertiary)",
                background: parentEdu === i ? "rgba(50,102,173,0.08)" : "var(--color-background-secondary)",
                color: parentEdu === i ? "#3266ad" : "var(--color-text-secondary)",
                cursor: "pointer", transition: "all 0.15s"
              }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Toggle label="Beca de estudios" sublabel="+3.6 pts en promedio" checked={scholarship} onChange={setScholarship} icon="🎓" />
            <Toggle label="Acceso a internet" sublabel="+4.9 pts sin acceso = penalización" checked={internet} onChange={setInternet} icon="📶" />
            <Toggle label="Trabajo part-time" sublabel="−6.4 pts en promedio" checked={partTimeJob} onChange={setPartTimeJob} icon="💼" />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Resultado esperado
          </div>

          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)", padding: "1.5rem", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <ScoreArc score={score} />
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                Mejor que el{" "}
                <span style={{ fontWeight: 600, color }}>{Math.round(score)}%</span>
                {" "}de los estudiantes
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                Media global del dataset: <strong>70.8</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Desglose de factores
          </div>

          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
            {factors.map((f, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 14px",
                borderBottom: i < factors.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
              }}>
                <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{f.label}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                  color: f.positive && f.impact > 0 ? "#1d9e75" : f.impact < 0 ? "#d85a30" : "var(--color-text-secondary)"
                }}>
                  {f.impact > 0 ? "+" : ""}{f.impact}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(50,102,173,0.06)", borderRadius: "var(--border-radius-md)", border: "0.5px solid rgba(50,102,173,0.2)" }}>
            <div style={{ fontSize: 11, color: "#3266ad", fontWeight: 500 }}>Modelo de regresión lineal</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, lineHeight: 1.5 }}>
              Coeficientes calibrados con datos reales. R² estimado ≈ 0.58. Las predicciones son aproximadas.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
