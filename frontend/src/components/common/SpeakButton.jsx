import { Volume2, VolumeX } from 'lucide-react';
import PropTypes from 'prop-types';
import useTranslation from '../../hooks/useTranslation';

const SpeakButton = ({ text, label, className = '' }) => {
  const { speak, isSpeaking, stopSpeaking, isEnglish, translate, currentLanguage } = useTranslation();

  const handleClick = async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (!text) return;

    // Translate first if not English, then speak
    let textToSpeak = text;
    if (!isEnglish) {
      try {
        textToSpeak = await translate(text) || text;
      } catch {
        textToSpeak = text;
      }
    }

    speak(textToSpeak);
  };

  const Icon = isSpeaking ? VolumeX : Volume2;

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-sm font-medium ${
        isSpeaking
          ? 'border-purple-300 bg-purple-50 text-purple-700'
          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-600 hover:text-purple-700'
      } ${className}`}
      aria-label={isSpeaking ? 'Stop speaking' : `Read aloud${!isEnglish ? ` in ${currentLanguage}` : ''}`}
      title={isSpeaking ? 'Stop' : 'Listen'}
    >
      <Icon className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
      {label && <span>{isSpeaking ? 'Stop' : label}</span>}
    </button>
  );
};

SpeakButton.propTypes = {
  text: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
};

export default SpeakButton;
