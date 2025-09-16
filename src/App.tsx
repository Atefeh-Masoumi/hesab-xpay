import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSettings } from '@/providers/SettingsProvider';
import { AppRouting } from '@/routing';
import { PathnameProvider, ProvidersWrapper } from '@/providers';
import { Toaster } from '@/components/ui/sonner';

const { BASE_URL } = import.meta.env;

const AppContent = () => {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add(settings.themeMode);
  }, [settings]);

  return (
    <BrowserRouter
      basename={BASE_URL}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}
    >
      <PathnameProvider>
        <AppRouting />
      </PathnameProvider>
      <Toaster />
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <ProvidersWrapper>
      <AppContent />
    </ProvidersWrapper>
  );
};

export { App };
