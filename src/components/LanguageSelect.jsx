import React from 'react';

export default function LanguageSelect({ id, label, value, options, onChange }) {
  return (
    <div className="language-select">
      <label className="micro-label" htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.code} value={option.code}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}