import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import './styles/responsive.css'; // Import responsive styles
import './styles/animations.css'; // Import animations and transitions
import './styles/presets.css'; // Import preset component styles
import './styles/apiKeys.css'; // Import API key management styles
import ConfigurationView from './components/ConfigurationView';
import SessionView from './components/SessionView';
import InstructionsManagerView from './components/InstructionsManagerView';
import SettingsView from './components/SettingsView';
import { MeditationConfigProvider } from './contexts/MeditationConfigContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { InstructionsProvider } from './contexts/InstructionsContext';
import { ElevenLabsVoicesProvider } from './contexts/ElevenLabsVoicesContext';
import { PresetProvider } from './contexts/PresetContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';

// Create a navigation context to share the setActiveTab function
type TabType = 'contemplate' | 'configure' | 'instructions' | 'settings';
interface NavigationContextType {
  setActiveTab: (tab: TabType) => void;
}
export const NavigationContext = createContext<NavigationContextType>({ 
  setActiveTab: () => {} 
});
export const useNavigation = () => useContext(NavigationContext);

// Wrapper component that handles the contemplation status
const AppContent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('contemplate');
  const { session } = useSession();
  const isContemplationActive = session.isActive && !session.isPreparingAudio && !session.isBellPlaying;

  return (
    <NavigationContext.Provider value={{ setActiveTab }}>
      <header className="App-header">
        <div className="title-container">
          <span className="title-word">Contemplation</span>
          <img 
            src="/assets/buddha-lotus-logo.png" 
            alt="Contemplation Machine Logo" 
            className="title-logo"
          />
          <span className="title-word">Machine</span>
        </div>
        <nav className="app-navigation">
          <button 
            className={`${activeTab === 'contemplate' ? 'active' : ''} btn-responsive touch-target`}
            onClick={() => setActiveTab('contemplate')}
          >
            Contemplate
          </button>
          <button 
            className={`${activeTab === 'configure' ? 'active' : ''} btn-responsive touch-target`}
            onClick={() => setActiveTab('configure')}
          >
            Configure
          </button>
          <button 
            className={`${activeTab === 'instructions' ? 'active' : ''} btn-responsive touch-target`}
            onClick={() => setActiveTab('instructions')}
          >
            Instructions
          </button>
          <button 
            className={`${activeTab === 'settings' ? 'active' : ''} btn-responsive touch-target`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className={`app-content responsive-container ${isContemplationActive ? 'contemplation-active' : ''}`}>
        {activeTab === 'contemplate' && <div className="page-enter-active"><SessionView /></div>}
        {activeTab === 'configure' && <div className="page-enter-active"><ConfigurationView /></div>}
        {activeTab === 'instructions' && <div className="page-enter-active"><InstructionsManagerView /></div>}
        {activeTab === 'settings' && <div className="page-enter-active"><SettingsView /></div>}
      </main>

      <footer className="app-footer">
        <p>Contemplation Machine - Version 1.9.2</p>
      </footer>
    </NavigationContext.Provider>
  );
};

function App() {
  return (
    <div className="App fade-in">
      <MeditationConfigProvider>
        <SessionProvider>
          <InstructionsProvider>
            <ElevenLabsVoicesProvider>
              <PresetProvider>
                <ApiKeyProvider>
                  <AppContent />
                </ApiKeyProvider>
              </PresetProvider>
            </ElevenLabsVoicesProvider>
          </InstructionsProvider>
        </SessionProvider>
      </MeditationConfigProvider>
    </div>
  );
}

export default App;
