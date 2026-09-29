const themes = [
  { id: 'prism', name: 'Prism' },
  { id: 'lagoon', name: 'Lagoon' },
  { id: 'citrus', name: 'Citrus' },
  { id: 'daylight', name: 'Daylight' }
];

export default function ThemePicker({ label = 'Color theme', theme, onThemeChange }) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label={label}>
      <span className="theme-picker-label">{label}</span>
      <div className="theme-options">
        {themes.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`theme-option${theme === option.id ? ' is-selected' : ''}`}
            role="radio"
            aria-checked={theme === option.id}
            aria-label={`${option.name} theme`}
            title={`${option.name} theme`}
            onClick={() => onThemeChange(option.id)}
          >
            <span className={`theme-swatch swatch-${option.id}`} />
          </button>
        ))}
      </div>
    </div>
  );
}