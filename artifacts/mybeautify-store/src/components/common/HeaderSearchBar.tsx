import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Mic, Camera, X, Sparkles } from 'lucide-react';

export interface HeaderSearchBarProps {
  /** Current search input value */
  value: string;
  /** Callback when search input value changes */
  onChange: (value: string) => void;
  /** Optional submit callback (triggered on Enter or voice recognition result) */
  onSubmit?: (value: string) => void;
  /** Search input placeholder text */
  placeholder?: string;
  /** Optional custom CSS class for outer wrapper */
  className?: string;
  /** Optional external toast notification handler */
  showToast?: (message: string) => void;
}

export const HeaderSearchBar: React.FC<HeaderSearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search jewellery, collections and more...',
  className = '',
  showToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Helper to show toast using parent handler or internal toast
  const notify = useCallback(
    (msg: string) => {
      if (showToast) {
        showToast(msg);
      } else {
        setLocalToast(msg);
        setTimeout(() => {
          setLocalToast((prev) => (prev === msg ? null : prev));
        }, 3200);
      }
    },
    [showToast]
  );

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // Voice search handler
  const handleMicClick = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      notify('Voice search is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        notify('Listening... Speak a product name or category.');
      };

      recognition.onresult = (event: any) => {
        setIsListening(false);
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          const trimmed = transcript.trim();
          onChange(trimmed);
          onSubmit?.(trimmed);
          notify(`Voice search: "${trimmed}"`);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          notify('Microphone access was denied. Please allow microphone access in browser settings.');
        } else if (event.error === 'no-speech') {
          notify('No speech detected. Please try again.');
        } else if (event.error === 'network') {
          notify('Network error during voice recognition. Please try again.');
        } else {
          notify(`Voice search error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Voice search failed to start:', err);
      setIsListening(false);
      notify('Could not start voice search. Please check your microphone settings.');
    }
  };

  // Image search handler (Camera icon)
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Please select a valid image file (PNG, JPG, WEBP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Backend validation: The current Spring catalog API does not support image-based queries.
    // Gracefully inform the user without displaying simulated/fake results.
    notify(`Selected: "${file.name}". Visual product search is currently not supported by the backend catalog.`);

    // Reset input so re-selecting the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    onSubmit?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit?.(value);
    }
  };

  return (
    <div className={`mb-header-search-wrap ${className}`}>
      {/* Existing magnifying glass search icon */}
      <Search size={18} className="mb-header-search-icon" aria-hidden="true" />

      {/* Existing search input with existing placeholder text */}
      <input
        ref={inputRef}
        type="text"
        className={`mb-header-search-input ${value ? 'has-clear' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search for products, brands and more"
        data-testid="header-search-input"
      />

      {/* Right inside actions: Clear (when query exists), Voice Search (Mic), Image Search (Camera) */}
      <div className="mb-header-search-actions">
        {value && (
          <button
            type="button"
            className="mb-header-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
            data-testid="header-search-clear-btn"
          >
            <X size={15} />
          </button>
        )}

        {/* Microphone Button */}
        <button
          type="button"
          className={`mb-search-action-btn mb-search-action-mic ${isListening ? 'is-listening' : ''}`}
          onClick={handleMicClick}
          aria-label={isListening ? 'Stop voice listening' : 'Search by voice'}
          title={isListening ? 'Listening... Click to stop' : 'Search by voice'}
          data-testid="header-voice-search-btn"
        >
          <Mic size={15} />
        </button>

        {/* Camera Button */}
        <button
          type="button"
          className="mb-search-action-btn mb-search-action-camera"
          onClick={handleCameraClick}
          aria-label="Search by image"
          title="Search by image"
          data-testid="header-image-search-btn"
        >
          <Camera size={15} />
        </button>

        {/* Hidden file input for camera image selection */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          data-testid="header-image-file-input"
          aria-hidden="true"
        />
      </div>

      {/* Fallback toast for pages without root toast handler */}
      {!showToast && localToast && (
        <div className="mb-toast" role="status">
          <Sparkles size={16} />
          <span>{localToast}</span>
        </div>
      )}
    </div>
  );
};

export default HeaderSearchBar;
