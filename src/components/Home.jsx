import { MathJax } from 'better-react-mathjax';

const Home = ({ metadata, questions, history, onStart, onBack }) => {
    const categories = [...new Set(questions.map(q => q.majorCategory))];

    const formatDate = (iso) => {
        const d = new Date(iso);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="card animate-fade-in">
            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.4em 1em', fontSize: '0.8rem' }} onClick={onBack}>
                    &lt; 戻る
                </button>
            </div>

            <h1><MathJax dynamic>{metadata.title}</MathJax></h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                <MathJax dynamic>{metadata.description}</MathJax>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div>
                    <div className="mode-section" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                        <h2>模擬試験モード</h2>
                        <p className="text-muted">本番形式で {metadata.totalQuestions}問 を出題します。</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                            <div className="stat-badge">時間: {metadata.timeLimit}分</div>
                            <div className="stat-badge">合格: {metadata.passLine}%</div>
                        </div>
                        <button className="btn" style={{ marginTop: '1.5rem', width: '100%', maxWidth: '300px' }} onClick={() => onStart('full')}>
                            試験開始
                        </button>
                    </div>

                    <div className="mode-section" style={{ marginTop: '2rem' }}>
                        <h2>分野別演習</h2>
                        <div className="category-grid">
                            {categories.map((cat, idx) => (
                                <div
                                    key={idx}
                                    className="category-card"
                                    onClick={() => onStart('category', cat)}
                                >
                                    <h3>{cat}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {questions.filter(q => q.majorCategory === cat).length} 問
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="history-section">
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>過去の履歴</h2>
                    {history.length === 0 ? (
                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>履歴はありません</p>
                    ) : (
                        history.map((h, i) => (
                            <div key={i} className="history-item">
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{h.score} / {h.total}</div>
                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{formatDate(h.timestamp)}</div>
                                </div>
                                <span className={`history-badge ${h.isPassed ? 'pass-badge' : 'fail-badge'}`}>
                                    {h.isPassed ? 'PASS' : 'FAIL'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
