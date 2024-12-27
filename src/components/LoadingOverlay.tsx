import { useState, useEffect } from 'react';

const loadingTexts = [
    { text: "Cargando", lang: "es" },
    { text: "Loading", lang: "en" },
    { text: "Chargement", lang: "fr" },
    { text: "読み込み中", lang: "ja" },
    { text: "Carregando", lang: "pt" },
    { text: "Caricamento", lang: "it" },
    { text: "Laden", lang: "de" },
    { text: "加载中", lang: "zh" },
    { text: "로딩 중", lang: "ko" },
    { text: "Загрузка", lang: "ru" },
    { text: "Đang tải", lang: "vi" },
    { text: "Načítání", lang: "cs" },
    { text: "Betöltés", lang: "hu" },
    { text: "Ładowanie", lang: "pl" },
    { text: "Učitavanje", lang: "hr" },
];

export function LoadingOverlay() {
    const [currentText, setCurrentText] = useState(loadingTexts[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * loadingTexts.length);
            setCurrentText(loadingTexts[randomIndex]);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="relative">
                <div className="flex justify-center mb-4">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>

                {/* Texto de carga */}
                <div className="text-center mb-4">
                    <p className="text-lg font-semibold text-white mb-1 transition-opacity duration-300">
                        {currentText.text}...
                        <span className="opacity-50 text-sm mr-2">{currentText.lang}</span>
                    </p>
                    <p className="text-sm text-slate-400">Por favor, espere...</p>
                    <div className="flex justify-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
} 