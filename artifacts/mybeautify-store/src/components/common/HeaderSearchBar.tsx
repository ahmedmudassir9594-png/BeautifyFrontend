import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { Search, Mic, Camera, X, Sparkles } from 'lucide-react';
import { fetchProducts, type ProductResponse } from '@/lib/api';
import { getJewelleryImage } from '@/lib/jewellery-images';
import { matchesProductPrice, parsePriceSearchQuery } from '@/utils/product-price-search';

const SEARCH_PLACEHOLDER_PHRASES = [
  'Search for bridal necklaces',
  'Discover timeless gold rings',
  'Find a piece for every occasion',
];

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
  /** Existing product data to use for local suggestions */
  suggestions?: ProductResponse[];
}

export const HeaderSearchBar: React.FC<HeaderSearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search jewellery, collections and more...',
  className = '',
  showToast,
  suggestions,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const [placeholderPhraseIndex, setPlaceholderPhraseIndex] = useState(0);
  const [isDeletingPlaceholder, setIsDeletingPlaceholder] = useState(false);
  const [loadedSuggestions, setLoadedSuggestions] = useState<ProductResponse[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (value.trim()) return;

    const phrase = SEARCH_PLACEHOLDER_PHRASES[placeholderPhraseIndex];
    const isPhraseComplete = animatedPlaceholder === phrase;
    const isPhraseEmpty = animatedPlaceholder.length === 0;
    const delay = isDeletingPlaceholder
      ? isPhraseEmpty ? 280 : 42
      : isPhraseComplete ? 1450 : 78;
    const timer = window.setTimeout(() => {
      if (isPhraseComplete && !isDeletingPlaceholder) {
        setIsDeletingPlaceholder(true);
      } else if (isPhraseEmpty && isDeletingPlaceholder) {
        setIsDeletingPlaceholder(false);
        setPlaceholderPhraseIndex((index) => (index + 1) % SEARCH_PLACEHOLDER_PHRASES.length);
      } else {
        setAnimatedPlaceholder((text) =>
          isDeletingPlaceholder ? text.slice(0, -1) : phrase.slice(0, text.length + 1)
        );
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [animatedPlaceholder, isDeletingPlaceholder, placeholderPhraseIndex, value]);

  const searchTerm = value.trim().toLocaleLowerCase();
  const searchedPrice = parsePriceSearchQuery(value);
  const searchProducts = searchedPrice !== null ? loadedSuggestions : suggestions ?? loadedSuggestions;
  const matchingSuggestions = searchProducts
    .filter((product) =>
        searchedPrice !== null
          ? matchesProductPrice(product, searchedPrice)
          : !searchTerm || [
          product.name,
          product.brandName,
          product.categoryName,
          product.sku,
          product.shortDescription,
          product.description,
        ].some((field) => field?.toLocaleLowerCase().includes(searchTerm))
      )
    .slice(0, 5);

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

  const executeSearch = useCallback((query: string) => {
    if (onSubmit) {
      onSubmit(query);
    } else {
      const normalizedQuery = query.trim();
      setLocation(normalizedQuery ? `/shop?q=${encodeURIComponent(normalizedQuery)}` : '/shop');
    }
    setIsOpen(false);
  }, [onSubmit, setLocation]);

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

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !searchWrapRef.current?.contains(event.target) &&
        !searchOverlayRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || (suggestions && searchedPrice === null)) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoadingSuggestions(true);
      setSuggestionError(null);
      setLoadedSuggestions([]);
      fetchProducts({
        query: searchedPrice === null ? value.trim() || undefined : undefined,
        size: searchedPrice === null ? 5 : 100,
        sort: 'createdAt,desc',
      })
        .then((page) => {
          if (active) setLoadedSuggestions(page.content ?? []);
        })
        .catch((error: unknown) => {
          if (active) {
            setLoadedSuggestions([]);
            setSuggestionError(error instanceof Error ? error.message : 'Could not load product suggestions.');
          }
        })
        .finally(() => {
          if (active) setLoadingSuggestions(false);
        });
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, searchedPrice, suggestions, value]);

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
          executeSearch(trimmed);
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    onChange(query);
    executeSearch(query);
  };
  const searchPlaceholder = animatedPlaceholder || placeholder;

  return (
    <div className={`mb-header-search-wrap ${className}`} ref={searchWrapRef}>
      <button
        type="button"
        className="mb-header-icon-btn mz-header-icon-btn mb-header-search-toggle"
        aria-label="Search products"
        aria-expanded={isOpen}
        aria-controls="header-search-panel"
        onClick={() => setIsOpen((open) => !open)}
        data-testid="header-search-toggle"
      >
        <Search size={20} aria-hidden="true" />
      </button>

      {isOpen && createPortal(
        <div className="mb-search-overlay mz-site-search-overlay" ref={searchOverlayRef}>
          <button
            type="button"
            className="mb-search-backdrop"
            onClick={() => setIsOpen(false)}
            aria-label="Close product search"
          />
          <section
            className="mb-header-search-panel"
            id="header-search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Product search"
          >
            <form className="mb-header-search-form" role="search" onSubmit={handleSubmit}>
              <Search size={18} className="mb-header-search-icon" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                className="mb-header-search-input"
                placeholder={searchPlaceholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-label="Search for products, brands and more"
                data-testid="header-search-input"
              />
              <div className="mb-header-search-actions">
                <button
                  type="button"
                  className={`mb-search-action-btn mb-search-action-mic ${isListening ? 'is-listening' : ''}`}
                  onClick={handleMicClick}
                  aria-label={isListening ? 'Stop voice listening' : 'Search by voice'}
                  title={isListening ? 'Listening... Click to stop' : 'Search by voice'}
                  data-testid="header-voice-search-btn"
                >
                  <Mic size={14} />
                </button>
                <button
                  type="button"
                  className="mb-search-action-btn mb-search-action-camera"
                  onClick={handleCameraClick}
                  aria-label="Search by image"
                  title="Search by image"
                  data-testid="header-image-search-btn"
                >
                  <Camera size={14} />
                </button>
                <button
                  type="button"
                  className="mb-header-search-panel-close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close search"
                >
                  <X size={17} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
                data-testid="header-image-file-input"
                aria-hidden="true"
              />
            </form>

            <div className="mb-header-search-results" aria-live="polite">
              <h3>PRODUCTS</h3>
              {loadingSuggestions ? (
                <p className="mb-header-search-message">Searching products…</p>
              ) : suggestionError ? (
                <p className="mb-header-search-message" role="alert">{suggestionError}</p>
              ) : matchingSuggestions.length ? (
                matchingSuggestions.slice(0, 4).map((product) => (
                  <button
                    type="button"
                    className="mb-header-search-result"
                    key={product.id}
                    onClick={() => {
                      setIsOpen(false);
                      setLocation(`/products/${product.id}`);
                    }}
                  >
                    <img
                      src={getJewelleryImage(product.imageUrl, product.name, product.id)}
                      alt=""
                      loading="lazy"
                    />
                    <span className="mb-header-search-result-copy">
                      <strong>{product.name}</strong>
                      <span>₹ {(product.sellingPrice || product.price).toLocaleString('en-IN')}</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="mb-header-search-message">No matching products found.</p>
              )}
            </div>
          </section>
        </div>,
        document.body
      )}

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
