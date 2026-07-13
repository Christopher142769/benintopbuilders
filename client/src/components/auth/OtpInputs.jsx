import { useEffect, useRef } from 'react';

export default function OtpInputs({ value = '', onChange, length = 6 }) {
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setDigit(index, digit) {
    const chars = value.padEnd(length, ' ').split('').slice(0, length);
    chars[index] = digit;
    const next = chars.join('').replace(/\s/g, '');
    onChange(next.slice(0, length));
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(e, index) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function onPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      refs.current[Math.min(pasted.length, length) - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Chiffre ${i + 1} du code`}
          value={value[i] || ''}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(-1);
            setDigit(i, d);
          }}
          onKeyDown={(e) => onKeyDown(e, i)}
          className="h-14 w-11 rounded-2xl border-[1.5px] border-black/10 bg-fond-doux text-center font-display text-xl font-extrabold focus:border-bleu focus:bg-white md:w-12"
        />
      ))}
    </div>
  );
}
