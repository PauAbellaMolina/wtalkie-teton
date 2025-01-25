import React, { useEffect } from 'react';
import './WalkieTalkieKeypad.css';

interface WalkieTalkieKeypadProps {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  maxLength: number;
  onReachedLength?: () => void;
  onUndoReachedLength?: () => void;
}

const WalkieTalkieKeypad: React.FC<WalkieTalkieKeypadProps> = ({
  value,
  onChange,
  maxLength,
  onReachedLength,
  onUndoReachedLength
}) => {

  useEffect(() => {
    if (value.length === maxLength && onReachedLength) {
      onReachedLength();
    }
  }, [value]);

  const handleButtonClick = (digit: string) => {
    if (value.length >= maxLength) return;
    
    const newValue = value + digit;
    onChange({ target: { value: newValue } });
  };

  const handleClear = () => {
    const oldValueLength = value.length;
    onChange({ target: { value: '' } });
    if (onUndoReachedLength && oldValueLength === maxLength) {
      onUndoReachedLength();
    }
  };

  const handleRemove = () => {
    const newValue = value.slice(0, -1);
    onChange({ target: { value: newValue } });
    if (onUndoReachedLength && newValue.length === maxLength-1) {
      onUndoReachedLength();
    }
  };

  return (
    <div className="keypad">
      <div className="keypad-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleButtonClick(num.toString())}
          >
            {num}
          </button>
        ))}
        <button onClick={handleClear}>
          C
        </button>
        <button onClick={() => handleButtonClick('0')}>
          0
        </button>
        <button onClick={handleRemove}>
          ←
        </button>
      </div>
    </div>
  );
};

export default WalkieTalkieKeypad;