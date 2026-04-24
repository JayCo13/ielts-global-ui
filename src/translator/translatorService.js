import fetchWithTimeout from '../utils/fetchWithTimeout';

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
  constructor() {
    this.apiKey = process.env.REACT_APP_GROQ_API_KEY;
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
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

      if (!this.apiKey) {
        throw new Error('Translation service is not properly configured. Please contact support.');
      }

      // Use saved language if not explicitly provided
      const langCode = targetLanguage || this.getSavedLanguage();
      const lang = getLanguageByCode(langCode);
      const targetLangName = lang.nativeName;

      const prompt = `Translate the following ${sourceLanguage} text to ${targetLangName}. Provide only the translation without any additional explanation or formatting. Consider the context and provide the most appropriate translation:

"${text}"`;

      const response = await fetchWithTimeout(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator specializing in English to ${targetLangName} translation. Provide accurate, contextually appropriate translations. For IELTS exam content, maintain the academic tone and precision.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Translation failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from translation service');
      }

      const translation = data.choices[0].message.content.trim();
      const cleanedTranslation = translation.replace(/^["']|["']$/g, '');

      return {
        originalText: text,
        translatedText: cleanedTranslation,
        sourceLanguage,
        targetLanguage: targetLangName,
        timestamp: new Date().toISOString()
      };

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

      if (!this.apiKey) {
        throw new Error('Translation service is not properly configured.');
      }

      // Use saved language if not explicitly provided
      const langCode = targetLanguage || this.getSavedLanguage();
      const lang = getLanguageByCode(langCode);
      const targetLangName = lang.nativeName;

      const prompt = `Provide a detailed dictionary entry for the English word "${word}". Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "word": "${word}",
  "phonetics": {
    "uk": "/phonetic transcription UK/",
    "us": "/phonetic transcription US/"
  },
  "meanings": [
    {
      "partOfSpeech": "part of speech in ${targetLangName}",
      "definitions": [
        {
          "meaning": "${targetLangName} translation/definition",
          "example": "Example sentence in English if available",
          "exampleTrans": "${targetLangName} translation of example"
        }
      ]
    }
  ]
}

Rules:
- Use IPA for phonetics
- Translate part of speech to ${targetLangName}
- Provide ${targetLangName} meanings/definitions
- Include examples when relevant
- Return ONLY the JSON object, no other text`;

      const response = await fetchWithTimeout(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a professional English-${targetLangName} dictionary. Return ONLY valid JSON with no markdown formatting.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1000,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Dictionary lookup failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      // Parse JSON, handling potential markdown code blocks
      let jsonStr = content;
      if (content.includes('```')) {
        jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      return JSON.parse(jsonStr);

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
    if (!this.apiKey) {
      return false;
    }
    // Basic format check for Groq API keys (they typically start with 'gsk_')
    return this.apiKey.startsWith('gsk_') && this.apiKey.length > 20;
  }
}

// Create and export a singleton instance
const translatorService = new TranslatorService();
export default translatorService;