import fetchWithTimeout from '../utils/fetchWithTimeout';
import API_BASE from '../config/api';

// Supported languages for dictionary translation
export const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', nativeName: 'Vietnamese' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', nativeName: 'Hindi' },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: 'Chinese' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', nativeName: 'Korean' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: 'Japanese' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾', nativeName: 'Malay' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', nativeName: 'Indonesian' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', nativeName: 'Thai' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭', nativeName: 'Filipino' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', nativeName: 'Bengali' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', nativeName: 'Urdu' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'Arabic' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Russian' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Spanish' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', nativeName: 'Portuguese' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'French' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'German' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', nativeName: 'Turkish' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', nativeName: 'Persian' },
  { code: 'ne', name: 'नेपाली', flag: '🇳🇵', nativeName: 'Nepali' },
  { code: 'si', name: 'සිංහල', flag: '🇱🇰', nativeName: 'Sinhala' },
  { code: 'my', name: 'မြန်မာ', flag: '🇲🇲', nativeName: 'Burmese' },
  { code: 'km', name: 'ខ្មែរ', flag: '🇰🇭', nativeName: 'Khmer' },
];

// Helper to get language name by code
export const getLanguageByCode = (code) => {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
};

class TranslatorService {
  // Translation/dictionary go through OUR backend (/student/translate,
  // /student/dictionary). The Groq key lives server-side only and is never
  // shipped in this bundle — see app/routes/student/translate_routes.py.
  _authHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Get the user's saved language preference
  getSavedLanguage() {
    return localStorage.getItem('dictionary_language') || 'vi';
  }

  // Save the user's language preference
  saveLanguage(langCode) {
    localStorage.setItem('dictionary_language', langCode);
  }

  async translateText(text, sourceLanguage = 'English', targetLanguage = null) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text to translate cannot be empty');
      }

      // Use saved language if not explicitly provided
      const langCode = targetLanguage || this.getSavedLanguage();
      const targetLangName = getLanguageByCode(langCode).nativeName;

      const response = await fetchWithTimeout(`${API_BASE}/student/translate`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({ text, sourceLanguage, targetLanguage: targetLangName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Translation failed: ${response.status} - ${errorData.detail || 'Unknown error'}`);
      }

      // Backend already returns { originalText, translatedText, sourceLanguage, targetLanguage, timestamp }.
      return await response.json();

    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  async getDetailedDefinition(word, targetLanguage = null) {
    try {
      if (!word || word.trim().length === 0) {
        throw new Error('Word cannot be empty');
      }

      // Use saved language if not explicitly provided
      const langCode = targetLanguage || this.getSavedLanguage();
      const targetLangName = getLanguageByCode(langCode).nativeName;

      const response = await fetchWithTimeout(`${API_BASE}/student/dictionary`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({ word, targetLanguage: targetLangName }),
      });

      if (!response.ok) {
        throw new Error(`Dictionary lookup failed: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Dictionary lookup error:', error);
      throw error;
    }
  }

  // Method to detect if text is likely English
  isEnglishText(text) {
    // Simple heuristic to detect English text
    const englishPattern = /^[a-zA-Z0-9\s.,!?;:()\-"']+$/;
    return englishPattern.test(text.trim());
  }

  // Method to clean and prepare text for translation
  prepareTextForTranslation(text) {
    // Remove extra whitespace and clean the text
    return text.trim().replace(/\s+/g, ' ');
  }

  // Method to validate API key format (basic validation)
  validateApiKey() {
    // The key now lives server-side; the client has nothing to validate.
    return true;
  }
}

// Create and export a singleton instance
const translatorService = new TranslatorService();
export default translatorService;