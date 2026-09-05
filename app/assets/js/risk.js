// ShasthoSathi risk + camp utilities — PURE, testable.
// Uses ONLY coefficients from app/data/forecast.json (trained on verified data).

/** Relative risk index (0-100) from lagged weather features.
 *  Same functional form as the trained model (research/forecast_model.py):
 *  pred = 10^(b0 + b1*rain_lag1 + b2*rain_lag2 + b3*rh_lag1) - 1
 *  then normalized against a reference month's features to an index.
 *  This is a WHAT-IF teaching tool for supervisors, clearly labeled in the UI. */
export function riskIndex(coeffs, f, refFeatures) {
  const pred = Math.pow(10, coeffs.b0_const + coeffs.b1_rain_lag1 * f.rain_lag1 +
    coeffs.b2_rain_lag2 * f.rain_lag2 + coeffs.b3_rh_lag1 * f.rh_lag1) - 1;
  const ref = Math.pow(10, coeffs.b0_const + coeffs.b1_rain_lag1 * refFeatures.rain_lag1 +
    coeffs.b2_rain_lag2 * refFeatures.rain_lag2 + coeffs.b3_rh_lag1 * refFeatures.rh_lag1) - 1;
  return Math.max(0, Math.min(100, Math.round(100 * pred / Math.max(ref, 1))));
}

/** Build CSV from camp screening rows (RFC-4180-ish: quote fields containing , " or \n). */
export function toCSV(rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
