import { useState, useRef, useEffect } from 'react';
import { useAutocomplete } from '../../hooks/useAutocomplete';

export default function AutosuggestInput({
  endpoint,
  placeholder,
  value,
  onChange,
  theme
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const { suggestions, loading } = useAutocomplete(endpoint, inputValue);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setInputValue(item.label);
    onChange(item.value);
    setIsOpen(false);
  };

  const T = theme;

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: T.inputBg || "rgba(255,255,255,0.04)",
            border: `1px solid ${T.inputBorder || "rgba(255,255,255,0.1)"}`,
            borderRadius: 8,
            color: T.text,
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocusCapture={(e) => e.target.style.borderColor = T.accent}
          onBlurCapture={(e) => e.target.style.borderColor = T.inputBorder}
        />
        {loading && (
          <span style={{ position: "absolute", right: 12, fontSize: 11, color: T.text2 }}>
            ...
          </span>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "105%",
          left: 0,
          right: 0,
          background: T.bg3 || "#111218",
          border: `1px solid ${T.border || "rgba(255,255,255,0.08)"}`,
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          maxHeight: 200,
          overflowY: "auto",
          zIndex: 1000,
          padding: 4
        }}>
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                cursor: "pointer",
                color: T.text,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.cardHover || "rgba(138,43,255,0.07)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {item.logo && (
                <img src={item.logo} alt="" style={{ width: 16, height: 16, borderRadius: 2, objectFit: "contain" }} />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
