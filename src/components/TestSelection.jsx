const TestSelection = ({ registry, onSelect }) => {
    return (
        <div className="card animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img src="/OmniMock.png" alt="OmniMock Logo" style={{ maxWidth: '200px', height: 'auto' }} />
            </div>
            <h1>問題集選択</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>学習する問題集を選択してください。</p>

            <div className="category-grid">
                {registry.map((test) => (
                    <div
                        key={test.id}
                        className="category-card"
                        onClick={() => onSelect(test)}
                    >
                        <h3>{test.title}</h3>
                        <p style={{ fontSize: '0.9rem', margin: '0.4rem 0' }}>{test.description}</p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '1rem' }}>
                            <span>{test.totalQuestions} 問</span>
                            <span>{test.timeLimit} 分</span>
                            <span>合格：{test.passLine}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestSelection;
