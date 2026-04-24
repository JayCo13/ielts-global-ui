import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, Loader2, AlertCircle, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import translatorService from './translatorService';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from './translatorService';

const TranslatorDialog = ({
    isOpen,
    onClose,
    selectedText,
    position = { x: 0, y: 0 },
    colorTheme = 'black-on-white'
}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [selectedLang, setSelectedLang] = useState(translatorService.getSavedLanguage());
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const langDropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
                setShowLangDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && selectedText) {
            handleLookup();
        } else {
            setData(null);
            setError(null);
            setLoading(false);
            setExpandedSections({});
        }
    }, [isOpen, selectedText, selectedLang]);

    const handleLookup = async () => {
        if (!selectedText || selectedText.trim().length === 0) return;

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const result = await translatorService.getDetailedDefinition(selectedText.trim(), selectedLang);
            setData(result);
            // Expand all sections by default
            const expanded = {};
            result.meanings?.forEach((_, idx) => {
                expanded[idx] = true;
            });
            setExpandedSections(expanded);
        } catch (err) {
            console.error('Dictionary lookup error:', err);
            // Fallback to simple translation
            try {
                const simpleResult = await translatorService.translateText(selectedText, 'English', selectedLang);
                setData({
                    word: selectedText,
                    phonetics: { uk: '', us: '' },
                    meanings: [{
                        partOfSpeech: 'Translation',
                        definitions: [{ meaning: simpleResult.translatedText }]
                    }]
                });
                setExpandedSections({ 0: true });
            } catch (fallbackErr) {
                setError('Unable to look up this word. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (langCode) => {
        setSelectedLang(langCode);
        translatorService.saveLanguage(langCode);
        setShowLangDropdown(false);
    };

    const handleSpeak = (text, lang) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleSection = (idx) => {
        setExpandedSections(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    if (!isOpen) return null;

    const currentLang = getLanguageByCode(selectedLang);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Dictionary Tab and Language Selector */}
                <div className="flex items-center border-b border-gray-100 px-4 pt-3 pb-0 bg-white gap-2">
                    <button
                        className="px-4 py-2 font-semibold text-sm text-emerald-600 border-b-2 border-emerald-500 -mb-px"
                    >
                        Dictionary
                    </button>

                    {/* Language Dropdown */}
                    <div className="flex-1 flex justify-end relative" ref={langDropdownRef}>
                        <button
                            onClick={() => setShowLangDropdown(!showLangDropdown)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors border border-gray-200 -mb-px"
                            title="Choose translation language"
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>{currentLang.flag}</span>
                            <span className="hidden sm:inline">{currentLang.name}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showLangDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 max-h-[60vh] overflow-y-auto"
                                style={{ scrollbarWidth: 'thin' }}
                            >
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                            selectedLang === lang.code
                                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="flex-1 text-left">{lang.name}</span>
                                        <span className="text-xs text-gray-400">{lang.nativeName}</span>
                                        {selectedLang === lang.code && (
                                            <span className="text-emerald-500 text-xs">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors -mb-px"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-white p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <p className="text-sm">Looking up...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-8 text-red-500 space-y-2">
                            <AlertCircle className="w-8 h-8" />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : data ? (
                        <div className="animate-fade-in">
                            {/* Word Title */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">{data.word}</h2>

                            {/* Phonetics Row */}
                            <div className="flex flex-wrap gap-4 mb-5 text-sm">
                                {/* UK Pronunciation */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleSpeak(data.word, 'en-GB')}
                                        className="p-1.5 hover:bg-emerald-50 rounded-full transition-colors text-emerald-600"
                                        title="UK Pronunciation"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                    <span className="text-gray-600 font-mono">{data.phonetics?.uk || '/.../'}</span>
                                    <span className="text-xs text-gray-400">- UK</span>
                                </div>

                                {/* US Pronunciation */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleSpeak(data.word, 'en-US')}
                                        className="p-1.5 hover:bg-emerald-50 rounded-full transition-colors text-emerald-600"
                                        title="US Pronunciation"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                    <span className="text-gray-600 font-mono">{data.phonetics?.us || '/.../'}</span>
                                    <span className="text-xs text-gray-400">- US</span>
                                </div>
                            </div>

                            {/* Meanings by Part of Speech */}
                            <div className="space-y-3">
                                {data.meanings?.map((meaning, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50"
                                    >
                                        {/* Part of Speech Header (Collapsible) */}
                                        <button
                                            onClick={() => toggleSection(idx)}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100/50 transition-colors"
                                        >
                                            <span className="font-semibold text-gray-800">{meaning.partOfSpeech}</span>
                                            {expandedSections[idx] ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>

                                        {/* Definitions List */}
                                        {expandedSections[idx] && (
                                            <div className="px-4 pb-4 space-y-3 bg-white">
                                                {meaning.definitions?.map((def, dIdx) => (
                                                    <div key={dIdx} className="flex gap-3">
                                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                                        <div className="space-y-1.5 flex-1">
                                                            {/* Translated Meaning */}
                                                            <p className="text-gray-800 font-medium leading-relaxed">
                                                                {def.meaning}
                                                            </p>

                                                            {/* Example Sentence */}
                                                            {def.example && (
                                                                <div className="text-sm">
                                                                    <p className="text-gray-700 italic">
                                                                        {def.example}
                                                                    </p>
                                                                    {def.exampleTrans && (
                                                                        <p className="text-gray-500 italic">
                                                                            {def.exampleTrans}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
                    IELTS Dictionary • {currentLang.flag} {currentLang.name}
                </div>
            </div>
        </div>
    );
};

export default TranslatorDialog;
