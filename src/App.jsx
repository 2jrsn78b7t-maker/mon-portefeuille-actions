import { useState, useEffect } from "react";

const PORTFOLIO = [
  { ticker: "AVGO.NE", name: "Broadcom", shares: 40, buyPrice: 650, currency: "CAD" },
  { ticker: "NVDA.TO", name: "Nvidia", shares: 12, buyPrice: 590, currency: "CAD" },
  { ticker: "MSFT.TO", name: "Microsoft", shares: 18, buyPrice: 520, currency: "CAD" },
  { ticker: "CLS.TO", name: "Celestica", shares: 1, buyPrice: 510, currency: "CAD" },
  { ticker: "XWD.TO", name: "iShares MSCI World", shares: 4, buyPrice: 470, currency: "CAD" },
  { ticker: "ASML.TO", name: "ASML", shares: 9, buyPrice: 380, currency: "CAD" },
  { ticker: "GOOG.TO", name: "Alphabet", shares: 6, buyPrice: 370, currency: "CAD" },
  { ticker: "TTWO", name: "Take-Two", shares: 1, buyPrice: 300, currency: "USD" },
];

const fmt = (n, d = 2) => n.toLocaleString("fr-CA", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtSign = (n) => (n >= 0 ? "+" : "") + fmt(n);

export default function PortfolioTracker() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `Search the web and find today's current stock prices (May 22, 2026) for these tickers.
For .TO tickers (TSX) and .NE (NEO Exchange), return prices in CAD.
For TTWO (NASDAQ), return price in USD.

Tickers needed:
- AVGO.NE (Broadcom CDR, CAD-hedged, NEO Exchange Canada)
- NVDA.TO (Nvidia, TSX, CAD)
- MSFT.TO (Microsoft, TSX, CAD)
- CLS.TO (Celestica, TSX, CAD)
- XWD.TO (iShares MSCI World ETF, TSX, CAD)
- ASML.TO (ASML, TSX, CAD)
- GOOG.TO (Alphabet, TSX, CAD)
- TTWO (Take-Two Interactive, NASDAQ, USD)

Respond ONLY with a valid JSON object, no markdown fences, no explanation, no extra text:
{"currentPrices":{"AVGO.NE":0,"NVDA.TO":0,"MSFT.TO":0,"CLS.TO":0,"XWD.TO":0,"ASML.TO":0,"GOOG.TO":0,"TTWO":0}}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const textBlock = data.content?.find((b) => b.type === "text");
      if (!textBlock) throw new Error("No text block");
      const raw = textBlock.text.replace(/```json|```/g, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);
      setPrices(parsed);
      setLastUpdate(new Date().toLocaleTimeString("fr-CA"));
    } catch (e) {
      setError("Impossible de récupérer les prix. Réessaie dans un moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  const hasPrices = !!(prices.currentPrices);

  const rows = PORTFOLIO.map((stock) => {
    const current = hasPrices ? prices.currentPrices[stock.ticker] : null;
    const totalCost = stock.buyPrice * stock.shares;
    const currentValue = current ? current * stock.shares : null;
    const gainAbs = currentValue !== null ? currentValue - totalCost : null;
    const gainPct = gainAbs !== null ? (gainAbs / totalCost) * 100 : null;
    return { ...stock, current, totalCost, currentValue, gainAbs, gainPct };
  });

  const cadRows = rows.filter((r) => r.currency === "CAD");
  const usdRows = rows.filter((r) => r.currency === "USD");
  const totalCostCAD = cadRows.reduce((s, r) => s + r.totalCost, 0);
  const totalValueCAD = hasPrices ? cadRows.reduce((s, r) => s + (r.currentValue || 0), 0) : null;
  const totalGainCAD = totalValueCAD !== null ? totalValueCAD - totalCostCAD : null;
  const totalGainPctCAD = totalGainCAD !== null ? (totalGainCAD / totalCostCAD) * 100 : null;
  const totalCostUSD = usdRows.reduce((s, r) => s + r.totalCost, 0);
  const totalValueUSD = hasPrices ? usdRows.reduce((s, r) => s + (r.currentValue || 0), 0) : null;
  const totalGainUSD = totalValueUSD !== null ? totalValueUSD - totalCostUSD : null;
  const totalGainPctUSD = totalGainUSD !== null ? (totalGainUSD / totalCostUSD) * 100 : null;

  const GainBadge = ({ abs, pct, small }) => {
    if (abs === null) return <span style={{ color: "#3a3a5a", fontSize: 13 }}>{loading ? "…" : "—"}</span>;
    const pos = abs >= 0;
    return (
      <div>
        <div style={{
          display: "inline-block",
          background: pos ? "#14532d55" : "#7f1d1d55",
          color: pos ? "#4ade80" : "#f87171",
          padding: small ? "1px 7px" : "3px 10px",
          borderRadius: 20,
          fontSize: small ? 11 : 13,
          fontWeight: 500,
        }}>
          {fmtSign(abs)} $
        </div>
        <div style={{ marginTop: 3, fontSize: small ? 11 : 12, color: pos ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: 4 }}>
          <span>{pos ? "▲" : "▼"}</span>
          <span>{Math.abs(pct).toFixed(2)} %</span>
        </div>
        {!small && (
          <div style={{ background: "#1a1a2e", borderRadius: 2, height: 3, width: "100%", marginTop: 4 }}>
            <div style={{
              height: 3, borderRadius: 2,
              width: `${Math.min(Math.abs(pct) * 1.5, 100)}%`,
              background: pos ? "#4ade80" : "#f87171",
              transition: "width 1s ease",
            }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#ddddf0", fontFamily: "'DM Mono','Courier New',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .row:hover { background: rgba(255,255,255,0.03) !important; }
        .refresh-btn { background: transparent; border: 1px solid #38bdf8; color: #38bdf8; cursor: pointer; padding: 8px 18px; font-family: inherit; font-size: 12px; letter-spacing: 0.08em; transition: all 0.2s; border-radius: 2px; }
        .refresh-btn:hover { background: #38bdf811; }
        .refresh-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes up { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .up { animation: up 0.45s ease forwards; }
        th { font-size: 10px; letter-spacing: 0.12em; color: #404060; text-transform: uppercase; font-weight: 400; text-align: left; padding: 0 0 10px; }
        td { padding: 13px 0; vertical-align: top; }
        tr { border-bottom: 1px solid #111120; transition: background 0.15s; }
        .sep { border-top: 1px solid #1e1e35 !important; border-bottom: none !important; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "36px 28px 0", borderBottom: "1px solid #12121f" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 28 }}>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "#f0f0ff", letterSpacing: "-0.02em" }}>
                MON PORTEFEUILLE
              </div>
              <div style={{ color: "#404060", fontSize: 12, marginTop: 5 }}>
                Acheté le 13 mai 2026 &nbsp;·&nbsp; {lastUpdate ? `Mis à jour ${lastUpdate}` : "—"}
              </div>
            </div>
            <button className="refresh-btn" onClick={fetchPrices} disabled={loading}>
              {loading ? <span className="spin">◌</span> : "↻"}&nbsp;{loading ? " Chargement…" : " Actualiser"}
            </button>
          </div>

          {/* SUMMARY TOP CARDS */}
          {hasPrices && (
            <div className="up" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1 }}>
              {[
                { label: "Investi (CAD)", val: `${fmt(totalCostCAD)} $`, color: "#ddddf0" },
                { label: "Valeur actuelle (CAD)", val: totalValueCAD ? `${fmt(totalValueCAD)} $` : "—", color: "#ddddf0" },
                {
                  label: "Gain total (CAD)",
                  val: totalGainCAD !== null ? `${fmtSign(totalGainCAD)} $` : "—",
                  color: totalGainCAD >= 0 ? "#4ade80" : "#f87171",
                },
                {
                  label: "Rendement (CAD)",
                  val: totalGainPctCAD !== null ? `${fmtSign(totalGainPctCAD)} %` : "—",
                  color: totalGainPctCAD >= 0 ? "#4ade80" : "#f87171",
                },
              ].map((c, i) => (
                <div key={i} style={{ background: "#0d0d1a", borderTop: "1px solid #12121f", padding: "18px 20px" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#404060", textTransform: "uppercase", marginBottom: 7 }}>{c.label}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: c.color }}>{c.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: 920, margin: "20px auto", padding: "0 28px" }}>
          <div style={{ background: "#7f1d1d22", border: "1px solid #7f1d1d55", color: "#f87171", padding: "11px 16px", fontSize: 12, borderRadius: 2 }}>{error}</div>
        </div>
      )}

      {loading && !hasPrices && (
        <div style={{ textAlign: "center", padding: "70px 0", color: "#404060", fontSize: 13 }}>
          <div className="spin" style={{ fontSize: 22, display: "block", marginBottom: 14 }}>◌</div>
          Récupération des prix en cours…
        </div>
      )}

      {/* TABLE */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 28px 60px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: "18%" }}>Action</th>
              <th style={{ width: "7%" }}>Parts</th>
              <th style={{ width: "13%" }}>Prix achat</th>
              <th style={{ width: "12%" }}>Coût total</th>
              <th style={{ width: "12%" }}>Prix actuel</th>
              <th style={{ width: "13%" }}>Valeur actuelle</th>
              <th style={{ width: "14%" }}>Gain ($)</th>
              <th style={{ width: "11%" }}>Gain (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.ticker} className="row up" style={{ animationDelay: `${i * 0.05}s` }}>
                <td>
                  <div style={{ color: "#c8c8e8", fontWeight: 500, fontSize: 13 }}>{s.name}</div>
                  <div style={{ color: "#404060", fontSize: 11, marginTop: 2 }}>{s.ticker} · {s.currency}</div>
                </td>
                <td style={{ color: "#7070a0", fontSize: 13 }}>{s.shares}</td>
                <td style={{ fontSize: 13, color: "#9090b0" }}>{fmt(s.buyPrice)} $</td>
                <td style={{ fontSize: 13, color: "#9090b0" }}>{fmt(s.totalCost)} $</td>
                <td style={{ fontSize: 13 }}>
                  {s.current
                    ? <span style={{ color: "#ddddf0" }}>{fmt(s.current)} $</span>
                    : <span style={{ color: "#2a2a40" }}>{loading ? "…" : "—"}</span>}
                </td>
                <td style={{ fontSize: 13 }}>
                  {s.currentValue
                    ? <span style={{ color: "#ddddf0" }}>{fmt(s.currentValue)} $</span>
                    : <span style={{ color: "#2a2a40" }}>—</span>}
                </td>
                <td>
                  {s.gainAbs !== null
                    ? <span style={{
                        display: "inline-block",
                        background: s.gainAbs >= 0 ? "#14532d44" : "#7f1d1d44",
                        color: s.gainAbs >= 0 ? "#4ade80" : "#f87171",
                        padding: "2px 9px", borderRadius: 20, fontSize: 12, fontWeight: 500
                      }}>{fmtSign(s.gainAbs)} $</span>
                    : <span style={{ color: "#2a2a40", fontSize: 13 }}>{loading ? "…" : "—"}</span>}
                </td>
                <td>
                  {s.gainPct !== null
                    ? <div>
                        <span style={{ fontSize: 12, color: s.gainPct >= 0 ? "#4ade80" : "#f87171", fontWeight: 500 }}>
                          {s.gainPct >= 0 ? "▲" : "▼"} {Math.abs(s.gainPct).toFixed(2)} %
                        </span>
                        <div style={{ background: "#141425", borderRadius: 2, height: 3, width: "80%", marginTop: 5 }}>
                          <div style={{
                            height: 3, borderRadius: 2,
                            width: `${Math.min(Math.abs(s.gainPct) * 2, 100)}%`,
                            background: s.gainPct >= 0 ? "#4ade80" : "#f87171",
                            transition: "width 1s ease"
                          }} />
                        </div>
                      </div>
                    : <span style={{ color: "#2a2a40", fontSize: 13 }}>{loading ? "…" : "—"}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL ROW */}
        {hasPrices && (
          <div className="up" style={{ marginTop: 2 }}>
            {/* CAD Total */}
            <div style={{
              background: "#0d0d1a",
              border: "1px solid #1e1e35",
              borderRadius: 4,
              padding: "20px 24px",
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 0,
            }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#404060", textTransform: "uppercase", marginBottom: 6 }}>Total investi (CAD)</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#ddddf0" }}>{fmt(totalCostCAD)} $</div>
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#404060", textTransform: "uppercase", marginBottom: 6 }}>Valeur actuelle (CAD)</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#ddddf0" }}>{totalValueCAD ? `${fmt(totalValueCAD)} $` : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#404060", textTransform: "uppercase", marginBottom: 6 }}>Gain / Perte (CAD)</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: totalGainCAD >= 0 ? "#4ade80" : "#f87171" }}>
                  {totalGainCAD !== null ? `${fmtSign(totalGainCAD)} $` : "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#404060", textTransform: "uppercase", marginBottom: 6 }}>Rendement (CAD)</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: totalGainPctCAD >= 0 ? "#4ade80" : "#f87171" }}>
                  {totalGainPctCAD !== null ? `${fmtSign(totalGainPctCAD)} %` : "—"}
                </div>
                {totalGainPctCAD !== null && (
                  <div style={{ background: "#141425", borderRadius: 2, height: 4, width: "60%", marginTop: 6 }}>
                    <div style={{
                      height: 4, borderRadius: 2,
                      width: `${Math.min(Math.abs(totalGainPctCAD) * 3, 100)}%`,
                      background: totalGainPctCAD >= 0 ? "#4ade80" : "#f87171",
                      transition: "width 1s ease"
                    }} />
                  </div>
                )}
              </div>
            </div>

            {/* USD Total (TTWO) */}
            {totalGainUSD !== null && (
              <div style={{
                background: "#0a0a14",
                border: "1px solid #1e1e35",
                borderRadius: 4,
                padding: "14px 24px",
                marginTop: 8,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 0,
              }}>
                <div>
                  <div style={{ fontSize: 10, color: "#404060", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Take-Two investi (USD)</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#9090b0" }}>{fmt(totalCostUSD)} $</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#404060", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Valeur actuelle (USD)</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#9090b0" }}>{totalValueUSD ? `${fmt(totalValueUSD)} $` : "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#404060", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Gain / Perte (USD)</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: totalGainUSD >= 0 ? "#4ade80" : "#f87171" }}>{fmtSign(totalGainUSD)} $</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#404060", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Rendement (USD)</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: totalGainPctUSD >= 0 ? "#4ade80" : "#f87171" }}>{fmtSign(totalGainPctUSD)} %</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 11, color: "#282840", borderTop: "1px solid #111120", paddingTop: 14 }}>
          * TTWO (Take-Two) est en USD — affiché séparément. Tous les autres titres sont en CAD.
        </div>
      </div>
    </div>
  );
}
