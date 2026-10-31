import { useEffect, useState } from 'react';

/**
 * Qiymat tinchiganidan keyin qaytaradi.
 * ⚠️ Qidiruv maydonida majburiy: har bosilgan harf uchun so‘rov yuborilsa,
 * «maktab» so‘zi 6 ta so‘rov hosil qiladi va javoblar tartibsiz keladi.
 */
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
