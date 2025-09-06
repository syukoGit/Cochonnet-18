import React, { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import './FloatingLabelInput.css'; // Assurez-vous que ce fichier CSS existe

interface FloatingLabelInputProps {
  id: string;
  label: string;
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  // Ajoutez d'autres props HTML standard si nécessaire, par exemple:
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  label,
  type = 'text',
  value = '',
  onChange,
  onKeyDown,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const isActive = isFocused || value !== '';

  return (
    <div className={`input-container ${isActive ? 'is-active' : ''}`}>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder=" "
        {...rest}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
};

export default FloatingLabelInput;
