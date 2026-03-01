import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Capture beforeinstallprompt as early as possible — before React even mounts.
// Chrome may delay this event until sufficient user engagement is detected.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt: BeforeInstallPromptEvent | null;
  }
}

window.__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
  window.dispatchEvent(new Event('pwaInstallReady'));
});

// Register service worker
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('PWA: App is ready for offline use');
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
