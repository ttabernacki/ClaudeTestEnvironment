export default function ProbabilitySliders({ rankProbs, setRankProbs }) {
  const labels = ['1st Choice', '2nd Choice', '3rd Choice', '4th+ Choice'];
  const keys = ['rank1', 'rank2', 'rank3', 'rank4plus'];

  function handleChange(changedIndex, newVal) {
    setRankProbs((prev) => {
      const values = keys.map((k) => prev[k]);

      // Sum of sliders above the changed one (these stay fixed)
      const fixedAbove = values.slice(0, changedIndex).reduce((s, v) => s + v, 0);

      // Cap the new value so it doesn't exceed what's left after fixed sliders above
      const capped = Math.min(newVal, 100 - fixedAbove);
      values[changedIndex] = capped;

      // Remaining budget for sliders below
      const remaining = 100 - fixedAbove - capped;
      const belowIndices = keys.slice(changedIndex + 1).map((_, i) => changedIndex + 1 + i);
      const belowSum = belowIndices.reduce((s, i) => s + values[i], 0);

      if (belowIndices.length > 0) {
        if (belowSum > 0) {
          // Distribute proportionally based on current values
          const scale = remaining / belowSum;
          belowIndices.forEach((i) => {
            values[i] = Math.round(values[i] * scale);
          });
        } else {
          // All below are 0 — distribute equally
          const each = Math.floor(remaining / belowIndices.length);
          belowIndices.forEach((i) => {
            values[i] = each;
          });
        }
        // Fix rounding so it sums to exactly 100
        const total = values.reduce((s, v) => s + v, 0);
        if (total !== 100) {
          values[belowIndices[belowIndices.length - 1]] += 100 - total;
        }
      }

      return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
    });
  }

  const total = keys.reduce((s, k) => s + rankProbs[k], 0);

  return (
    <section className="sliders-section">
      <h2>Match Probability by Rank</h2>
      <div className="sliders-grid">
        {keys.map((key, i) => (
          <div className="slider-row" key={key}>
            <label className="slider-label" htmlFor={key}>{labels[i]}</label>
            <input
              id={key}
              type="range"
              min={0}
              max={100}
              value={rankProbs[key]}
              onChange={(e) => handleChange(i, Number(e.target.value))}
              className="slider-input"
            />
            <span className="slider-value">{rankProbs[key]}%</span>
          </div>
        ))}
      </div>
      {total !== 100 && (
        <p className="slider-warning">Total: {total}% (should be 100%)</p>
      )}
    </section>
  );
}
