import { useEffect } from 'react';

const Result = ({ score, total, history, metadata, testId, onRetry, onExit, onSave }) => {
    const percentage = Math.round((score / total) * 100);
    const isPassed = percentage >= metadata.passLine;

    useEffect(() => {
        const saved = localStorage.getItem('g_test_history');
        const allHistory = saved ? JSON.parse(saved) : {};
        const setHistory = allHistory[testId] || [];

        const newRecord = {
            timestamp: new Date().toISOString(),
            score,
            total,
            percentage,
            isPassed
        };

        allHistory[testId] = [newRecord, ...setHistory].slice(0, 10); // Keep last 10
        localStorage.setItem('g_test_history', JSON.stringify(allHistory));
        if (onSave) onSave();
    }, []);

    return (
        <div className="card animate-scale-in">
            <h2>結果発表</h2>

            <div className="result-score" style={{ color: isPassed ? 'var(--correct-color)' : 'var(--wrong-color)' }}>
                {score} / {total}
            </div>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                正答率: {percentage}% (合格ライン: {metadata.passLine}%)
                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    {isPassed ? "🎉 合格！" : "💪 再挑戦！"}
                </span>
            </p>

            <div style={{ textAlign: 'left', marginTop: '1rem' }}>
                <h3 className="text-muted">カテゴリー別正解率</h3>
                {/* Simple category summary */}
                {[...new Set(history.map(h => h.question.majorCategory))].map(cat => {
                    const catItems = history.filter(h => h.question.majorCategory === cat);
                    const catCorrect = catItems.filter(h => h.isCorrect).length;
                    const catPerc = Math.round((catCorrect / catItems.length) * 100);
                    return (
                        <div key={cat} style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{cat}</span>
                                <span>{catPerc}% ({catCorrect}/{catItems.length})</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ background: catPerc >= metadata.passLine ? 'var(--correct-color)' : 'var(--wrong-color)', width: `${catPerc}%`, height: '100%' }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
                <button className="btn btn-secondary" onClick={onRetry}>
                    もう一度
                </button>
                <button className="btn" onClick={onExit}>
                    問題集選択に戻る
                </button>
            </div>
        </div>
    );
};

export default Result;
