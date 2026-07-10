import { Toaster } from 'sonner';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemedToaster() {
  const { resolvedTheme, isDark } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: isDark ? 'glass-strong !border-white/10' : 'glass-strong !border-zinc-200',
          title: isDark ? 'text-white' : 'text-zinc-900',
          description: isDark ? 'text-zinc-400' : 'text-zinc-600',
        },
      }}
    />
  );
}
