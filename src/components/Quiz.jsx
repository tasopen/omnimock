import { useState, useEffect, useRef } from 'react';
import { MathJax } from 'better-react-mathjax';

const Quiz = ({ mode, category, onFinish, onExit, questionsData, metadata, testId }) => {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null); // number for single, array for multi
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showAbortModal, setShowAbortModal] = useState(false);
    const cancelBtnRef = useRef(null);

    const currentQ = questions[currentIndex] || null;

    // Initialization Effect
    useEffect(() => {
        // Try to restore session
        const savedSession = localStorage.getItem('quiz_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (session.testId === testId && session.questions && session.questions.length > 0) {
                    // Valid session found, restore it
                    setQuestions(session.questions);
                    setCurrentIndex(session.currentIndex);
                    setScore(session.score);
                    setHistory(session.history);
                    setTimeLeft(session.timeLeft);
                    setIsInitialized(true);
                    return; // Skip new generation
                }
            } catch (e) {
                console.error("Failed to parse session", e);
            }
        }

        // No valid session, start new
        let filtered = [];
        if (mode === 'category' && category) {
            filtered = questionsData.filter(q => q.majorCategory === category);
        } else {
            // Limit to metadata.totalQuestions or all if less
            filtered = questionsData.slice(0, metadata.totalQuestions);
        }

        // Shuffle options for each question
        const processed = filtered.map(q => {
            // Create pairs of [optionText, originalIndex]
            const optionsWithIndex = q.options.map((opt, i) => ({ text: opt, originalIndex: i }));

            // Shuffle the options
            for (let i = optionsWithIndex.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
            }

            // Reconstruct options array and find new answer indices
            const newOptions = optionsWithIndex.map(o => o.text);
            let newAnswer;
            if (Array.isArray(q.answer)) {
                newAnswer = q.answer.map(oldIdx =>
                    optionsWithIndex.findIndex(o => o.originalIndex === oldIdx)
                ).sort();
            } else {
                newAnswer = optionsWithIndex.findIndex(o => o.originalIndex === q.answer);
            }

            return {
                ...q,
                options: newOptions,
                answer: newAnswer
            };
        });

        // Shuffle question order
        const shuffled = [...processed];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        setQuestions(shuffled);
        // Set dynamic time limit
        const baseTimeLimit = metadata.timeLimit * 60; // in seconds
        const totalQuestions = metadata.totalQuestions;
        const sessionCount = shuffled.length;
        const dynamicTime = Math.round((baseTimeLimit / totalQuestions) * sessionCount);

        setTimeLeft(dynamicTime);
        setIsInitialized(true);
    }, [testId, mode, category, questionsData, metadata]);

    // Persistence Effect
    useEffect(() => {
        if (!isInitialized || questions.length === 0) return;

        const sessionState = {
            testId,
            mode,
            category,
            questions,
            currentIndex,
            score,
            history,
            timeLeft,
            timestamp: Date.now()
        };
        localStorage.setItem('quiz_session', JSON.stringify(sessionState));
    }, [testId, mode, category, questions, currentIndex, score, history, timeLeft, isInitialized]);


    useEffect(() => {
        if (!isInitialized || questions.length === 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    finish();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [questions, isInitialized]);

    // Focus management for modal
    useEffect(() => {
        if (showAbortModal && cancelBtnRef.current) {
            cancelBtnRef.current.focus();
        }
    }, [showAbortModal]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // If modal is open, let standard focus handle Enter/Tab
            if (showAbortModal) {
                if (e.key === 'Escape') setShowAbortModal(false);
                return;
            }

            // Esc for Abort
            if (e.key === 'Escape') {
                handleAbortClick();
                return;
            }

            // Enter for Next (only if explanation shown)
            if (e.key === 'Enter' && showExplanation) {
                nextQuestion();
                return;
            }

            // Space for Submit (Multi-choice only)
            if (e.key === ' ' && !showExplanation && currentQ && Array.isArray(currentQ.answer)) {
                e.preventDefault();
                handleSubmitMulti();
                return;
            }

            // 1-6 for Options
            if (!showExplanation && currentQ) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= currentQ.options.length) {
                    handleOptionClick(num - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showExplanation, showAbortModal, currentQ]);

    const handleOptionClick = (index) => {
        if (showExplanation) return;

        const isMulti = Array.isArray(currentQ.answer);

        if (isMulti) {
            setSelectedOption(prev => {
                const current = Array.isArray(prev) ? prev : [];
                if (current.includes(index)) {
                    return current.filter(i => i !== index);
                } else {
                    return [...current, index].sort();
                }
            });
        } else {
            // Single choice - immediate submit
            setSelectedOption(index);
            processAnswer(index);
        }
    };

    const handleSubmitMulti = () => {
        if (showExplanation || !Array.isArray(currentQ.answer)) return;
        const selected = Array.isArray(selectedOption) ? selectedOption : [];
        processAnswer(selected);
    };

    const processAnswer = (userChoice) => {
        setShowExplanation(true);
        const correctAnswers = currentQ.answer;

        let isCorrect = false;
        if (Array.isArray(correctAnswers)) {
            // Multi-choice validation (strict equality)
            const sortedUser = [...userChoice].sort().join(',');
            const sortedCorrect = [...correctAnswers].sort().join(',');
            isCorrect = sortedUser === sortedCorrect;
        } else {
            // Single choice
            isCorrect = userChoice === correctAnswers;
        }

        if (isCorrect) setScore(s => s + 1);

        setHistory(prev => [...prev, {
            question: currentQ,
            userChoice: userChoice,
            isCorrect
        }]);
    };

    const nextQuestion = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(c => c + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            finish();
        }
    };

    const finish = () => {
        onFinish(score, questions.length, history);
    };

    const handleAbortClick = () => {
        setShowAbortModal(true);
    };

    const handleConfirmAbort = () => {
        setIsInitialized(false); // Stop saving
        localStorage.removeItem('quiz_session');
        onExit();
    };

    if (questions.length === 0 || !currentQ) return <div className="card">Loading...</div>;

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <div>
                    <span className="text-muted">Q {currentIndex + 1} / {questions.length}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className={timeLeft < 60 ? "text-wrong" : "text-muted"}>
                        ⏰ {formatTime(timeLeft)}
                    </span>
                    <button className="btn outline" onClick={handleAbortClick} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                        中止
                    </button>
                </div>
            </div>

            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((currentIndex) / questions.length) * 100}%` }}></div>
            </div>

            <div className="animate-fade-in" key={currentIndex}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--accent-color)', marginBottom: '0.4rem' }}>
                        {currentQ.majorCategory} {currentQ.subCategory ? `> ${currentQ.subCategory}` : ''}
                    </span>
                    <MathJax dynamic>{currentQ.question}</MathJax>
                </h2>

                {currentQ.table && (
                    <div className="quiz-table-container">
                        <table className="quiz-table">
                            <thead>
                                <tr>
                                    {currentQ.table[0].map((header, i) => <th key={i}>{header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {currentQ.table.slice(1).map((row, i) => (
                                    <tr key={i}>
                                        {row.map((cell, j) => <td key={j}>{cell}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className={currentQ.options.length > 3 ? "options-grid" : "options-list-vertical"}>
                    {currentQ.options.map((opt, idx) => {
                        const isMulti = Array.isArray(currentQ.answer);
                        const isSelected = isMulti
                            ? (Array.isArray(selectedOption) && selectedOption.includes(idx))
                            : selectedOption === idx;

                        let className = "option-btn";
                        if (isSelected) className += " selected";

                        const isAnswer = isMulti
                            ? currentQ.answer.includes(idx)
                            : idx === currentQ.answer;

                        if (showExplanation) {
                            if (isAnswer) className += " correct";
                            else if (isSelected) className += " wrong";
                        }

                        return (
                            <div key={idx} className="option-wrapper">
                                <span className="shortcut-hint">{idx + 1}</span>
                                <button className={className} onClick={() => handleOptionClick(idx)} disabled={showExplanation}>
                                    {isMulti && (
                                        <div className={`custom-checkbox ${isSelected ? 'checked' : ''} ${showExplanation && isAnswer ? 'correct' : ''}`}>
                                            {(isSelected || (showExplanation && isAnswer)) && <span className="check-mark">✔</span>}
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <MathJax dynamic>{opt}</MathJax>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {Array.isArray(currentQ.answer) && !showExplanation && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button
                            className="btn"
                            onClick={handleSubmitMulti}
                            disabled={!Array.isArray(selectedOption) || selectedOption.length === 0}
                            style={{ minWidth: '200px' }}
                        >
                            回答を確定する (Space)
                        </button>
                    </div>
                )}
            </div>

            {showExplanation && (
                <div className="animate-fade-in explanation-box">
                    <strong>解説:</strong> <MathJax dynamic>{currentQ.explanation}</MathJax>
                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                        <button className="btn" onClick={nextQuestion}>
                            {currentIndex + 1 === questions.length ? '結果を見る' : '次の問題へ (Enter)'}
                        </button>
                    </div>
                </div>
            )}

            {showAbortModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p className="modal-title" style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                            回答を中止してメニューに戻りますか？<br />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>（進行状況は保存されません）</span>
                        </p>
                        <div className="modal-actions">
                            <button className="modal-btn secondary" ref={cancelBtnRef} onClick={() => setShowAbortModal(false)}>キャンセル</button>
                            <button className="modal-btn primary" onClick={handleConfirmAbort}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quiz;
