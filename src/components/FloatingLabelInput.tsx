import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import './FloatingLabelInput.css'; // Assurez-vous que ce fichier CSS existe

interface FloatingLabelInputProps {
  id: string;
  label: string;
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
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
