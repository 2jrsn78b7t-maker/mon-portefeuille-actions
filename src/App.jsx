import { useState, useEffect } from "react";

const PORTFOLIO = [
  { ticker: "AVGO.NE", name: "Broadcom", shares: 40, buyPrice: 16.25, currency: "CAD" },
  { ticker: "NVDA.TO", name: "Nvidia", shares: 12, buyPrice: 49.17, currency: "CAD" },
  { ticker: "MSFT.TO", name: "Microsoft", shares: 18, buyPrice: 28.89, currency: "CAD" },
  { ticker: "CLS.TO", name: "Celestica", shares: 1, buyPrice: 510.00, currency: "CAD" },
  { ticker: "XWD.TO", name: "iShares MSCI World", shares: 4, buyPrice: 117.50, currency: "CAD" },
  { ticker: "ASML.TO", name: "ASML", shares: 9, buyPrice: 42.22, currency: "CAD" },
  { ticker: "GOOG.TO", name: "Alphabet", shares: 6, buyPrice: 61.67, currency: "CAD" },
  { ticker: "TTWO", name: "Take-Two", shares: 1, buyPrice: 300.00, currency: "USD" },
];

const fmt = (n) => n.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtSign = (n) => (n >= 0 ? "+" : "") + fmt(n);

const YAHOO_TICKERS = {
  "AVGO.NE": "AVGO.NE",
  "NVDA.TO": "NVDA.TO",
  "MSFT.TO": "MSFT.TO",
  "CLS.TO": "CLS.TO",
  "XWD.TO": "XWD.TO",
  "ASML.TO": "ASML.TO",
  "GOOG.TO": "GOOG.TO",
  "TTWO": "TTWO",
};

export default function App() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const tickers = Object.values(YAHOO_TICKERS).join(",");
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers}&fields=regularMarketPrice,shortName`;
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      const data = await res.json();
      const result = {};
      const quotes = data?.quoteResponse?.result || [];
      quotes.forEach((q) => {
        const key = Object.keys(YAHOO_TICKERS).find(k => YAHOO_TICKERS[k] === q.symbol);
        if (key) result[key] = q.regularMarketPrice;
      });
      if (Object.keys(result).length === 0) throw new Error("Aucun prix reçu");
      setPrices(result);
      setLastUpdate(new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setError("Impossible de récupérer les prix. Vérifie ta connexion et réessaie.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  const rows = PORTFOLIO.map((s) => {
    const current = prices[s.ticker] ?? null;
    const totalCost = s.buyPrice * s.shares;
    const currentValue = current !== null ? current * s.shares : null;
    const gainAbs = currentValue !== null ? currentValue - totalCost : null;
    const gainPct = gainAbs !== null ? (gainAbs / totalCost) * 100 : null;
    return { ...s, current, totalCost, currentValue, gainAbs, gainPct };
  });

  const cadRows = rows.filter(r => r.currency === "CAD");
  const usdRows = rows.filter(r => r.currency === "USD");
  const hasPrices = Object.keys(prices).length > 0;

  const totalCostCAD = cadRows.reduce((s, r) => s + r.totalCost, 0);
  const totalValueCAD = hasPrices ? cadRows.reduce((s, r) => s + (r.currentValue ?? 0), 0) : null;
  const totalGainCAD = totalValueCAD !== null ? totalValueCAD - totalCostCAD : null;
  const totalGainPctCAD = totalGainCAD !== null ? (totalGainCAD / totalCostCAD) * 100 : null;

  const totalCostUSD = usdRows.reduce((s, r) => s + r.totalCost, 0);
  const totalValueUSD = hasPrices ? usdRows.reduce((s, r) => s + (r.currentValue ?? 0), 0) : null;
  const totalGainUSD = totalValueUSD !== null ? totalValueUSD - totalCostUSD : null;
  const totalGainPctUSD = totalGainUSD !== null ? (totalGainUSD / totalCostUSD) * 100 : null;

  const pos = (n) => n >= 0;

  return (
    <div style={{ minHeight: "100vh", background: "#080812", color: "#e0e0f0", fontFamily: "system-ui, -apple-system, sans-serif", padding: "0 0 40px" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fu { animation: fadeUp 0.3s ease forwards; }
        .card { background: #0f0f1e; border: 1px solid #1c1c35; border-radius: 14px; padding: 16px; }
        .stock-card { background: #0d0d1c; border: 1px solid #1a1a30; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
        .stock-card:active { background: #131326; }
        .btn { background: transparent; border: 1.5px solid #38bdf8; color: #38bdf8; padding: 8px 18px; border-radius: 20px; font-size: 13px; cursor: pointer; font-weight: 600; letter-spacing: 0.03em; }
        .btn:disabled { opacity: 0.4; }
        .badge-pos { background: #14532d55; color: #4ade80; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .badge-neg { background: #7f1d1d55; color: #f87171; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .label { font-size: 11px; color: #40406a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .divider { height: 1px; background: #1a1a30; margin: 16px 0; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg, #0f0f22 0%, #080812 100%)", padding: "50px 20px 24px", borderBottom: "1px solid #1a1a30" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#f0f0ff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Mon<br />Portefeuille
            </div>
            <div style={{ fontSize: 12, color: "#40406a", marginTop: 6 }}>
              Depuis le 13 mai 2026{lastUpdate ? ` · ${lastUpdate}` : ""}
            </div>
          </div>
          <button className="btn" onClick={fetchPrices} disabled={loading}>
            {loading ? <span className="spin">◌</span> : "↻ Actualiser"}
          </button>
        </div>

        {/* TOTAL CARDS */}
        {hasPrices && totalGainCAD !== null && (
          <div className="fu" style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="card">
              <div className="label">Investi (CAD)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e0f0" }}>{fmt(totalCostCAD)} $</div>
            </div>
            <div className="card">
              <div className="label">Valeur actuelle</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e0f0" }}>{fmt(totalValueCAD)} $</div>
            </div>
            <div className="card" style={{ gridColumn: "1 / -1", borderColor: pos(totalGainCAD) ? "#14532d" : "#7f1d1d" }}>
              <div className="label">Gain total depuis le 13 mai</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: pos(totalGainCAD) ? "#4ade80" : "#f87171" }}>
                  {fmtSign(totalGainCAD)} $
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: pos(totalGainPctCAD) ? "#4ade80" : "#f87171" }}>
                  {fmtSign(totalGainPctCAD)} %
                </div>
              </div>
              <div style={{ background: "#1a1a30", borderRadius: 4, height: 5, marginTop: 10 }}>
                <div style={{
                  height: 5, borderRadius: 4,
                  width: `${Math.min(Math.abs(totalGainPctCAD) * 3, 100)}%`,
                  background: pos(totalGainPctCAD) ? "#4ade80" : "#f87171",
                  transition: "width 1s ease"
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div style={{ margin: "16px 20px", background: "#7f1d1d22", border: "1px solid #7f1d1d55", color: "#f87171", padding: "12px 16px", borderRadius: 10, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading && !hasPrices && (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#40406a", fontSize: 14 }}>
          <div className="spin" style={{ fontSize: 24, display: "block", marginBottom: 12 }}>◌</div>
          Récupération des prix…
        </div>
      )}

      {/* STOCK LIST */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ fontSize: 12, color: "#40406a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Actions CAD</div>

        {cadRows.map((s, i) => (
          <div key={s.ticker} className={`stock-card fu`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e8ff" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#40406a", marginTop: 2 }}>{s.ticker} · {s.shares} parts</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {s.current !== null
                  ? <div style={{ fontSize: 16, fontWeight: 600, color: "#c8c8e8" }}>{fmt(s.current)} $</div>
                  : <div style={{ fontSize: 14, color: "#2a2a45" }}>{loading ? "…" : "—"}</div>}
                <div style={{ fontSize: 11, color: "#40406a", marginTop: 2 }}>prix actuel</div>
              </div>
            </div>

            <div className="divider" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <div className="label">Coût total</div>
                <div style={{ fontSize: 13, color: "#8080a0" }}>{fmt(s.totalCost)} $</div>
              </div>
              <div>
                <div className="label">Valeur act.</div>
                <div style={{ fontSize: 13, color: s.currentValue !== null ? "#c8c8e8" : "#2a2a45" }}>
                  {s.currentValue !== null ? `${fmt(s.currentValue)} $` : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {s.gainAbs !== null ? (
                  <>
                    <span className={s.gainAbs >= 0 ? "badge-pos" : "badge-neg"}>
                      {fmtSign(s.gainAbs)} $
                    </span>
                    <div style={{ fontSize: 12, marginTop: 4, color: s.gainPct >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                      {s.gainPct >= 0 ? "▲" : "▼"} {Math.abs(s.gainPct).toFixed(1)} %
                    </div>
                  </>
                ) : <span style={{ color: "#2a2a45", fontSize: 13 }}>—</span>}
              </div>
            </div>
          </div>
        ))}

        {/* USD Section */}
        <div style={{ fontSize: 12, color: "#40406a", textTransform: "uppercase", letterSpacing: "0.1em", margin: "20px 0 12px" }}>Actions USD</div>

        {usdRows.map((s, i) => (
          <div key={s.ticker} className="stock-card fu" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e8ff" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#40406a", marginTop: 2 }}>{s.ticker} · {s.shares} part</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {s.current !== null
                  ? <div style={{ fontSize: 16, fontWeight: 600, color: "#c8c8e8" }}>{fmt(s.current)} $</div>
                  : <div style={{ fontSize: 14, color: "#2a2a45" }}>{loading ? "…" : "—"}</div>}
                <div style={{ fontSize: 11, color: "#40406a", marginTop: 2 }}>prix actuel USD</div>
              </div>
            </div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <div className="label">Coût total</div>
                <div style={{ fontSize: 13, color: "#8080a0" }}>{fmt(s.totalCost)} $</div>
              </div>
              <div>
                <div className="label">Valeur act.</div>
                <div style={{ fontSize: 13, color: s.currentValue !== null ? "#c8c8e8" : "#2a2a45" }}>
                  {s.currentValue !== null ? `${fmt(s.currentValue)} $` : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {s.gainAbs !== null ? (
                  <>
                    <span className={s.gainAbs >= 0 ? "badge-pos" : "badge-neg"}>
                      {fmtSign(s.gainAbs)} $
                    </span>
                    <div style={{ fontSize: 12, marginTop: 4, color: s.gainPct >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                      {s.gainPct >= 0 ? "▲" : "▼"} {Math.abs(s.gainPct).toFixed(1)} %
                    </div>
                  </>
                ) : <span style={{ color: "#2a2a45", fontSize: 13 }}>—</span>}
              </div>
            </div>
          </div>
        ))}

        {/* USD Total */}
        {hasPrices && totalGainUSD !== null && (
          <div className="card fu" style={{ marginTop: 8, borderColor: pos(totalGainUSD) ? "#14532d" : "#7f1d1d" }}>
            <div className="label">Gain Take-Two (USD)</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: pos(totalGainUSD) ? "#4ade80" : "#f87171" }}>
                {fmtSign(totalGainUSD)} $
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: pos(totalGainPctUSD) ? "#4ade80" : "#f87171" }}>
                {fmtSign(totalGainPctUSD)} %
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: "#25253a", textAlign: "center" }}>
          Prix fournis par Yahoo Finance · TTWO en USD, reste en CAD
        </div>
      </div>
    </div>
  );
}
