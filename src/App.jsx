import { useState, useEffect } from 'react';
import { MathJaxContext } from 'better-react-mathjax';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Result from './components/Result';
import TestSelection from './components/TestSelection';

function App() {
  const [view, setView] = useState('selection'); // 'selection', 'home', 'quiz', 'result'
  const [registry, setRegistry] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [history, setHistory] = useState([]);
  const [quizMode, setQuizMode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [testHistory, setTestHistory] = useState({});

  useEffect(() => {
    const savedHistory = localStorage.getItem('g_test_history');
    if (savedHistory) setTestHistory(JSON.parse(savedHistory));

    // Fetch dynamic index
    const fetchIndex = async () => {
      try {
        const response = await fetch('/data/sets-index.json');
        if (response.ok) {
          const data = await response.json();
          setRegistry(data);

          // Check for active session after index is loaded
          const session = localStorage.getItem('quiz_session');
          if (session) {
            const { testId, mode, category } = JSON.parse(session);
            const testInfo = data.find(r => r.id === testId);

            if (testInfo) {
              const res = await fetch(`/data/sets/${testInfo.file}`);
              if (res.ok) {
                const sdata = await res.json();
                setSelectedSet(testInfo);
                setFullData(sdata);
                setQuizMode(mode);
                setSelectedCategory(category);
                setView('quiz');
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch index or restore session", e);
      }
    };
    fetchIndex();
  }, []);

  const refreshHistory = () => {
    const saved = localStorage.getItem('g_test_history');
    if (saved) setTestHistory(JSON.parse(saved));
  };

  const handleSetSelect = async (testInfo) => {
    setSelectedSet(testInfo);
    // Fetch the selected JSON set from public directory
    try {
      const response = await fetch(`/data/sets/${testInfo.file}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setFullData(data);
      setView('home');
    } catch (error) {
      console.error("Failed to load test set:", error);
      alert("問題データの読み込みに失敗しました。");
    }
  };

  const startQuiz = (mode, category = null) => {
    setQuizMode(mode);
    setSelectedCategory(category);
    setView('quiz');
    setScore(0);
    setHistory([]);
    // Clear any previous session just in case, though Quiz will overwrite
    localStorage.removeItem('quiz_session');
  };

  const finishQuiz = (finalScore, total, finalHistory) => {
    setScore(finalScore);
    setTotalQuestions(total);
    setHistory(finalHistory);
    setView('result');
    localStorage.removeItem('quiz_session'); // Clear session on finish
  };

  const goHome = () => setView('home');
  const goSelection = () => {
    setView('selection');
    setSelectedSet(null);
    setFullData(null);
    localStorage.removeItem('quiz_session'); // Ensure no lingering session
  };

  // Called when user actively chooses to interrupt/exit from Quiz
  const handleQuizInterrupt = () => {
    setView('home');
    // We DO NOT clear localStorage here, allowing resume.
  };

  const mathjaxConfig = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
      inlineMath: [
        ["$", "$"],
        ["\\(", "\\)"],
      ],
      displayMath: [
        ["$$", "$$"],
        ["\\[", "\\]"],
      ],
    },
  };

  return (
    <MathJaxContext
      version={3}
      config={mathjaxConfig}
      src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
    >
      <div className="app-container">
        {view === 'selection' && (
          <TestSelection registry={registry} onSelect={handleSetSelect} />
        )}
        {view === 'home' && fullData && (
          <Home
            metadata={fullData.metadata}
            questions={fullData.questions}
            history={testHistory[selectedSet.id] || []}
            onStart={startQuiz}
            onBack={goSelection}
          />
        )}
        {view === 'quiz' && fullData && (
          <Quiz
            mode={quizMode}
            category={selectedCategory}
            onFinish={finishQuiz}
            onExit={handleQuizInterrupt}
            questionsData={fullData.questions}
            metadata={fullData.metadata}
            testId={selectedSet.id}
          />
        )}
        {view === 'result' && fullData && (
          <Result
            score={score}
            total={totalQuestions}
            history={history}
            metadata={fullData.metadata}
            testId={selectedSet.id}
            onRetry={goHome}
            onExit={goSelection}
            onSave={refreshHistory}
          />
        )}
      </div>
    </MathJaxContext>
  );
}

export default App;
