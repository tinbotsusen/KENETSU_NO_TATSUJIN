const { useState, useEffect, useRef } = React;

const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

function App() {
    const [unlockedVeteran, setUnlockedVeteran] = useState(() => localStorage.getItem('unlockedVeteran') === 'true');
    const [gameMode, setGameMode] = useState('rookie');
    const [correctCount, setCorrectCount] = useState(0);
    const [gameState, setGameState] = useState('title');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [timeLeftMs, setTimeLeftMs] = useState(60000);
    const [resultType, setResultType] = useState('failed');
    const [history, setHistory] = useState([]);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showMobileLog, setShowMobileLog] = useState(false);
    const [failedItem, setFailedItem] = useState(null);

    const startGame = (mode) => {
        setGameMode(mode);
        const targetQuestions = mode === 'rookie' 
            ? SUBMISSIONS.filter(s => ROOKIE_IDS.includes(s.id))
            : SUBMISSIONS;
        setShuffledQuestions(shuffleArray(targetQuestions));
        setCurrentIndex(0);
        setScore(0);
        setCorrectCount(0);
        setTimeLeftMs(60000);
        setHistory([]);
        setIsPaused(false);
        setSelectedLog(null);
        setShowMobileLog(false);
        setFailedItem(null);
        setGameState('playing');
    };

    useEffect(() => {
        let animationFrameId;
        let lastTime = performance.now();
        const tick = (currentTime) => {
            if (gameState !== 'playing' || isPaused || gameMode === 'rookie') return;
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            setTimeLeftMs((prev) => Math.max(0, prev - deltaTime));
            animationFrameId = requestAnimationFrame(tick);
        };
        if (gameState === 'playing' && !isPaused && gameMode === 'veteran') {
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(tick);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState, isPaused, gameMode]);

    useEffect(() => {
        if (timeLeftMs === 0 && gameState === 'playing' && gameMode === 'veteran') {
            setResultType('timeup');
            setGameState('result');
        }
    }, [timeLeftMs, gameState, gameMode]);

    const handleJudge = (judgeSafe) => {
        if (isPaused) return; 
        const current = shuffledQuestions[currentIndex % shuffledQuestions.length];
        setHistory(prev => [current, ...prev]);
        
        if (current.isSafe === judgeSafe) {
            setScore(s => s + 100);
            const newCount = correctCount + 1;
            setCorrectCount(newCount);
            setCurrentIndex(i => i + 1);

            if (gameMode === 'rookie' && newCount >= 30) {
                setResultType('cleared');
                setGameState('result');
                localStorage.setItem('unlockedVeteran', 'true');
                setUnlockedVeteran(true);
                return;
            }

            if ((currentIndex + 1) % shuffledQuestions.length === 0) {
                setShuffledQuestions(shuffleArray(shuffledQuestions));
            }
        } else {
            setFailedItem(current);
            setResultType('failed');
            setGameState('result');
        }
    };

    const toggleMobileLog = (open) => {
        setShowMobileLog(open);
        setIsPaused(open);
    };

    const formatTime = (ms) => {
        const totalMs = Math.max(0, ms);
        const m = Math.floor(totalMs / 60000).toString();
        const s = Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0');
        const ms10 = Math.floor((totalMs % 1000) / 10).toString().padStart(2, '0');
        return `${m}:${s}:${ms10}`;
    };

    const lastKnowledge = history.length > 0 ? history[0] : null;

    return (
        <div className="h-full w-full flex flex-col md:flex-row text-slate-200 overflow-hidden relative">
            <div className="flex-1 flex flex-col p-4 md:p-8 border-r border-slate-700 bg-slate-900 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 z-20 h-16 md:h-20">
                    {gameState === 'playing' && (
                        <span className="bg-red-600 text-sm md:text-xl px-3 py-1.5 font-black tracking-widest shrink-0 mt-1 shadow-md rounded-sm text-white animate-in fade-in duration-300">
                            不適切な文章を見分けろ！
                        </span>
                    )}
                    <div className="flex flex-col items-end shrink-0 ml-auto">
                        {gameState !== 'title' && (
                            gameMode === 'rookie' && gameState === 'playing' ? (
                                <span className="font-mono text-xl md:text-2xl font-bold text-slate-300">業務ノルマ: {correctCount}/30</span>
                            ) : (
                                <>
                                    <span className="font-mono text-xl md:text-2xl font-bold text-slate-300">SCORE: {score}</span>
                                    {gameState === 'playing' && gameMode === 'veteran' && (
                                        <div className="bg-black border border-slate-400 px-3 py-1 rounded mt-1">
                                            <span className={`digital-font text-lg md:text-xl font-black ${timeLeftMs <= 10000 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                                                {formatTime(timeLeftMs)}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )
                        )}
                    </div>
                </div>

                {gameState === 'title' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter text-white uppercase shrink-text">
                            社内通信の守護者<br/><span className="text-red-500 italic">CORPORATE FIREWALL</span>
                        </h1>
                        <p className="text-sm text-slate-400 mb-8 max-w-sm leading-relaxed hide-on-short">
                            日々のビジネスメールや社内チャットに紛れ込む「悪質なネットミーム」を隔離し、会社の社会的信用を守ってください。
                        </p>
                        <div className="flex flex-col gap-4 w-full max-w-sm">
                            <button onClick={() => startGame('rookie')} className="bg-white text-slate-900 px-6 py-4 rounded-lg font-bold text-lg active:scale-95 shadow-xl transition-all border-l-8 border-green-500">
                                新人検閲官
                            </button>
                            <button 
                                onClick={() => unlockedVeteran && startGame('veteran')} 
                                className={`px-6 py-4 rounded-lg font-bold text-lg transition-all border-l-8 flex flex-col items-center justify-center ${unlockedVeteran ? 'bg-slate-800 text-white border-red-500 active:scale-95 shadow-xl hover:bg-slate-700' : 'bg-slate-900/50 text-slate-600 border-slate-700 cursor-not-allowed'}`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    {!unlockedVeteran && <span>🔒</span>}
                                    <span>ベテラン検閲官</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-8 w-full relative">
                        <div className="w-full max-w-xl relative">
                            {lastKnowledge && (
                                <div className="absolute bottom-full left-0 w-full mb-4 bg-slate-50/95 border-2 border-sky-300 rounded-lg p-3 md:p-6 shadow-xl z-10 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="text-[10px] md:text-sm font-black text-sky-500 mb-1 tracking-widest border-b border-sky-200 pb-1">直前の判定: {lastKnowledge.term}</div>
                                    <div className="text-sm md:text-xl font-bold text-sky-800 leading-tight whitespace-pre-wrap shrink-text">{lastKnowledge.desc}</div>
                                </div>
                            )}
                            <div className="w-full bg-slate-800 p-6 md:p-8 rounded-lg border-l-4 border-blue-500 shadow-2xl relative z-20">
                                <div className="absolute -top-3 left-4 bg-blue-500 text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-widest">{shuffledQuestions[currentIndex].type}</div>
                                <div className="text-lg md:text-2xl font-medium leading-snug text-white mt-1 shrink-text">「{shuffledQuestions[currentIndex].text}」</div>
                            </div>
                        </div>
                        <div className="flex gap-12 md:gap-24 mt-2 pb-10 md:pb-0">
                            <div className="flex flex-col items-center gap-2">
                                <button onClick={() => handleJudge(false)} className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-slate-800 border-4 border-red-500 flex items-center justify-center text-red-500 text-4xl active:bg-red-500 active:text-white transition-all shadow-lg">✕</button>
                                <span className="text-sm md:text-base font-black text-red-500 tracking-widest">却下</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <button onClick={() => handleJudge(true)} className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-slate-800 border-4 border-blue-500 flex items-center justify-center text-blue-500 text-4xl active:bg-blue-500 active:text-white transition-all shadow-lg">◯</button>
                                <span className="text-sm md:text-base font-black text-blue-500 tracking-widest">許可</span>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'result' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-2 md:p-4 overflow-y-auto">
                        {resultType === 'cleared' ? (
                            <>
                                <div className="text-5xl md:text-7xl mb-2 text-green-400 font-black uppercase tracking-widest drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">CLEAR!</div>
                                <p className="text-lg md:text-xl text-white mb-1 font-bold">新人研修を完了しました。</p>
                                <p className="text-sm md:text-base text-yellow-300 font-bold mb-6 animate-pulse">🔒「ベテラン検閲官」モードが解放されました！</p>
                            </>
                        ) : resultType === 'failed' ? (
                            <>
                                <div className="text-5xl md:text-7xl mb-1 text-red-600 font-black uppercase tracking-widest drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">FAILED</div>
                                <p className="text-base md:text-lg text-slate-300 mb-1 leading-relaxed font-bold">
                                    {failedItem?.isSafe ? '正常な業務連絡を遮断してしまいました。' : '汚染された通信を通過させてしまいました。'}
                                </p>
                                <p className="text-xs md:text-sm text-slate-400 mb-6 shrink-text">
                                    {failedItem?.isSafe ? '過剰な検閲により業務ラインが停止しました。即時解雇です。' : '社内ネットワークが深刻なミーム汚染を受けました。即時解雇です。'}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl md:text-7xl mb-1 text-blue-400 font-black uppercase tracking-widest drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]">TIME UP</div>
                                <p className="text-base md:text-lg text-slate-300 mb-1 leading-relaxed font-bold">本日の検閲業務が終了しました。</p>
                                <p className="text-xs md:text-sm text-slate-400 mb-6 shrink-text">コンプライアンスは無事に守られました。</p>
                            </>
                        )}
                        {resultType === 'failed' && failedItem && (
                            <div className="w-full max-w-lg bg-red-950/40 border border-red-500/50 p-4 rounded-lg mb-6 text-left">
                                <div className="text-[10px] font-bold text-red-400 uppercase mb-1 tracking-tighter">
                                    {failedItem.isSafe ? '誤って遮断した正常な通信：' : '見逃してしまった有害な通信：'}
                                </div>
                                <div className="text-sm md:text-base italic mb-3 text-white">「{failedItem.text}」</div>
                                <div className="bg-red-900/40 p-3 rounded border border-red-400/30">
                                    <div className="text-xs font-black text-red-300 mb-1">【{failedItem.term}】</div>
                                    <div className="text-[11px] md:text-xs leading-relaxed text-red-100/80 whitespace-pre-wrap">{failedItem.desc}</div>
                                </div>
                            </div>
                        )}
                        {gameMode === 'veteran' && <div className="text-2xl md:text-3xl font-black mb-6 text-white">SCORE: {score}</div>}
                        <button onClick={() => setGameState('title')} className="bg-white text-slate-900 px-10 py-3 rounded-full font-bold text-lg active:scale-95 mb-4 shadow-xl transition-all">タイトルへ</button>
                    </div>
                )}
            </div>

            <div className={`${showMobileLog ? 'translate-y-0' : 'translate-y-[calc(100%-140px)] md:translate-y-0'} fixed md:relative bottom-0 left-0 w-full md:w-80 h-1/2 md:h-full bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 p-4 flex flex-col shadow-2xl z-40 log-panel-transition`}>
                <h3 
                    onClick={() => { if(window.innerWidth < 768) toggleMobileLog(!showMobileLog); }}
                    className="text-[10px] font-bold text-slate-400 mb-4 border-b border-slate-700 pb-2 uppercase tracking-widest flex items-center justify-between cursor-pointer md:cursor-default"
                >
                    <span>知識アーカイブ (判定ログ)</span>
                    <span className="md:hidden text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-600">
                        {showMobileLog ? '▼ 閉じて再開' : '▲ 展開してポーズ'}
                    </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 pb-10">
                    {history.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic text-center mt-4">履歴はありません</p>
                    ) : (
                        history.map((item, idx) => (
                            <button key={idx} onClick={() => { setSelectedLog(item); setIsPaused(true); }} className="w-full text-left bg-slate-800 p-2 rounded border border-slate-700 hover:bg-slate-700 transition-colors">
                                <div className={`text-[10px] font-bold truncate ${item.isSafe ? 'text-blue-400' : 'text-red-400'}`}>{item.term}</div>
                                <div className="text-[9px] text-slate-400 truncate opacity-70">{item.text}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-blue-500 rounded-lg max-w-lg w-full p-6 flex flex-col max-h-[80dvh]">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2 shrink-0">
                            <h2 className="text-lg font-black text-white tracking-widest uppercase italic">Knowledge</h2>
                            <span className="bg-blue-600 text-[10px] px-2 py-1 rounded font-bold">PAUSED</span>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <div className={`text-lg font-bold mb-2 ${selectedLog.isSafe ? 'text-blue-400' : 'text-red-400'}`}>対象: {selectedLog.term}</div>
                            <div className="text-sm text-slate-300 bg-slate-900 p-4 rounded-lg whitespace-pre-wrap leading-relaxed border border-slate-700 shadow-inner">{selectedLog.desc}</div>
                        </div>
                        <button onClick={() => { setSelectedLog(null); if(!showMobileLog) setIsPaused(false); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded mt-4 active:scale-95 transition-all">詳細を閉じる</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);