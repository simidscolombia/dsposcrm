/**
 * Discovery AI Voice Utility
 * Uses Web Speech API to provide voice assistance in the app.
 */

const voices = window.speechSynthesis;

export const speak = (text, lang = 'es-ES') => {
    if (!voices) return;

    // Cancel any ongoing speech
    voices.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Slightly higher pitch for a friendlier "tech" voice

    voices.speak(utterance);
};

export const stopSpeech = () => {
    if (voices) voices.cancel();
};
