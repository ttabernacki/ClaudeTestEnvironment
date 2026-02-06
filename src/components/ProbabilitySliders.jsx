export default function ProbabilitySliders({ rankProbs, setRankProbs }) {
  const labels = ['1st Choice', '2nd Choice', '3rd Choice', '4th+ Choice'];
  const keys = ['rank1', 'rank2', 'rank3', 'rank4plus'];

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
              onChange={(e) =>
                setRankProbs((prev) => ({ ...prev, [key]: Number(e.target.value) }))
              }
              className="slider-input"
            />
            <span className="slider-value">{rankProbs[key]}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
