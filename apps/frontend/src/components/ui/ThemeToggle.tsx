import { useTheme } from '../../lib/theme';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from './IconButton';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <IconButton onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </IconButton>
  );
};
