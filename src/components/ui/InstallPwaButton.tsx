
'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt(): Promise<void>;
}

export default function InstallPwaButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Detectar si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!prompt) return;

    prompt.prompt();
    prompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsAppInstalled(true);
      }
      setPrompt(null);
    });
  };

  // No mostrar el botón si la app ya está instalada o si el prompt no está disponible
  if (isAppInstalled || !prompt) {
    return null;
  }

  // Renderizar solo en dispositivos móviles (o que soporten la instalación)
  return (
    <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={handleInstallClick} size="lg">
            <Download className="mr-2 h-5 w-5"/>
            Descargar App
        </Button>
    </div>
  );
}
