

## Multilingual and Voice System for MindFlow

This plan adds complete multilingual support (pt-BR, en-US, fr-FR, es-ES), speech recognition, text-to-speech, and AI multilingual processing to MindFlow.

### Overview

The implementation covers 5 interconnected layers:

1. **i18next** -- All UI text translated across 4 languages
2. **Language preference** -- Saved in profile, auto-detected on first visit
3. **Web Speech API** -- Free speech-to-text and text-to-speech (works in Chrome/Edge)
4. **ElevenLabs** -- Premium high-quality TTS/STT (via connector)
5. **Lovable AI** -- Multilingual natural language processing (already available)

### Phase 1: i18next Setup and Translation Files

**Install** `i18next` and `react-i18next` packages.

**Create translation files:**
- `src/i18n/locales/pt-BR.json` -- Portuguese (default)
- `src/i18n/locales/en-US.json` -- English
- `src/i18n/locales/fr-FR.json` -- French
- `src/i18n/locales/es-ES.json` -- Spanish

**Create** `src/i18n/index.ts` -- Initialize i18next with browser language detection, localStorage persistence, and fallback to pt-BR.

**Translate all pages:**
- OnboardingPage (slides titles, descriptions, buttons)
- LoginPage / RegisterPage (form labels, buttons, messages)
- ModeSelectPage (mode names, descriptions, features)
- HomePage (greetings, section titles, task labels)
- AgendaPage (month names, day names, event categories)
- FinancasPage (category names, bill labels, budget text)
- OffloadPage (placeholders, suggestions, AI hints)
- PerfilPage (settings names, mode names, version text)
- BottomNavigation (tab labels)
- All toast messages

**Wrap App** with i18next provider in `main.tsx`.

### Phase 2: Database -- Add Language Column to Profiles

**Database migration** to add `language` column to `profiles` table:

```text
ALTER TABLE profiles ADD COLUMN language text DEFAULT 'pt-BR';
```

This stores the user's language preference persistently.

### Phase 3: Language Selector in Profile

**Update PerfilPage:**
- Replace the static "Idioma" settings item with an interactive language picker
- Show a dialog/sheet with 4 language options (flags + names)
- On selection: update i18next language, save to localStorage and profiles table
- Show current language as subtitle

**Create** `src/hooks/useLanguage.ts` -- Custom hook that:
- Reads language from profile (database) on login
- Falls back to `navigator.language` or `pt-BR`
- Provides `setLanguage()` to update both i18next and database
- Syncs language across tabs via localStorage

### Phase 4: Web Speech API (Free Voice)

**Create** `src/hooks/useSpeechRecognition.ts`:
- Wraps `webkitSpeechRecognition` / `SpeechRecognition`
- Sets `recognition.lang` based on current i18next language
- Returns `{ transcript, isListening, start, stop, isSupported }`
- Handles interim and final results
- Graceful fallback message if browser doesn't support it

**Create** `src/hooks/useSpeechSynthesis.ts`:
- Wraps `window.speechSynthesis`
- Sets `utterance.lang` based on current language
- Returns `{ speak, stop, isSpeaking, isSupported }`
- Auto-selects best voice for the language

**Update OffloadPage:**
- Replace placeholder mic handler with real `useSpeechRecognition`
- Live transcript display in the listening modal
- Transcript auto-fills the text input on completion
- Add "Read aloud" button to AI responses

**Update HomePage:**
- Add optional "Read aloud" on AI suggestion cards

### Phase 5: ElevenLabs Premium Voice (Connector)

**Connect ElevenLabs** via the connector system (provides `ELEVENLABS_API_KEY`).

**Create edge function** `supabase/functions/elevenlabs-tts/index.ts`:
- Accepts `{ text, language }` 
- Selects appropriate voice per language (e.g., Brazilian voice for pt-BR)
- Returns audio stream
- Used for premium TTS responses

**Create edge function** `supabase/functions/elevenlabs-stt/index.ts`:
- Accepts audio file upload
- Uses Scribe v2 for batch transcription
- Auto-detects language or uses user preference
- Returns transcription text

**Update OffloadPage:**
- Add toggle or auto-detect: use Web Speech API (free) or ElevenLabs (premium)
- Premium users get ElevenLabs quality; free users get Web Speech API
- "Read response aloud" uses ElevenLabs TTS for premium, Web Speech for free

### Phase 6: Multilingual AI Processing

**Create edge function** `supabase/functions/offload-process/index.ts`:
- Uses Lovable AI (Gemini Flash) to interpret user text
- System prompt includes: "Respond in the user's language: {language}"
- Uses tool calling to extract structured output (task/event/expense/reminder)
- Returns structured data for confirmation

**Update OffloadPage:**
- On "Processar" button click, send text + language to `offload-process`
- Show confirmation card with extracted items (task, event, expense, reminder)
- User confirms or edits before saving to database
- AI response spoken aloud (optional, via TTS)

### Phase 7: Real-time Voice Assistant Flow

**Update OffloadPage listening modal:**
- Show live transcript as user speaks
- Auto-send to AI when user stops speaking (VAD)
- Show AI response text with typing animation
- Auto-speak response (if enabled in settings)
- Full voice-in, voice-out loop

**Add to PerfilPage settings:**
- "Auto-read responses" toggle
- "Voice quality" selector (Standard / Premium)
- "Voice language" shows current language

### Technical Details

**New dependencies:**
- `i18next` + `react-i18next` + `i18next-browser-languagedetector`

**New files:**
- `src/i18n/index.ts` -- i18next configuration
- `src/i18n/locales/pt-BR.json` -- ~150 translation keys
- `src/i18n/locales/en-US.json`
- `src/i18n/locales/fr-FR.json`
- `src/i18n/locales/es-ES.json`
- `src/hooks/useLanguage.ts` -- Language management hook
- `src/hooks/useSpeechRecognition.ts` -- Web Speech API STT hook
- `src/hooks/useSpeechSynthesis.ts` -- Web Speech API TTS hook
- `supabase/functions/offload-process/index.ts` -- AI text processing
- `supabase/functions/elevenlabs-tts/index.ts` -- Premium TTS
- `supabase/functions/elevenlabs-stt/index.ts` -- Premium STT

**Modified files:**
- `src/main.tsx` -- Add i18next provider
- `src/App.tsx` -- Language context
- All page files -- Replace hardcoded text with `t()` calls
- `src/components/layout/BottomNavigation.tsx` -- Translated labels
- `supabase/config.toml` -- Add edge function configs

**Database changes:**
- Add `language` column to `profiles` table (default: `pt-BR`)

**ElevenLabs voice mapping:**
- pt-BR: Brazilian Portuguese voice
- en-US: American English voice  
- fr-FR: French voice
- es-ES: Spanish voice

