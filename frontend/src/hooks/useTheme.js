import { useState, useEffect } from 'react';

/**
 * Reads/writes the current theme ('dark' | 'light') from localStorage.
 * Applies the 'light' class to document.body so CSS vars respond.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
