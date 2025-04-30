import React, { useState } from 'react';
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
import { SessionProvider } from './contexts/SessionContext';
import { InstructionsProvider } from './contexts/InstructionsContext';
import { ElevenLabsVoicesProvider } from './contexts/ElevenLabsVoicesContext';
import { PresetProvider } from './contexts/PresetContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';

function App() {
  const [activeTab, setActiveTab] = useState<'meditate' | 'configure' | 'instructions' | 'settings'>('meditate');

  return (
    <div className="App fade-in">
      <MeditationConfigProvider>
        <SessionProvider>
          <InstructionsProvider>
            <ElevenLabsVoicesProvider>
              <PresetProvider>
                <ApiKeyProvider>
                  <header className="App-header">
                    <div className="logo-container">
                      <img 
                        src="/assets/buddha-lotus-logo.png" 
                        alt="Buddha Meditation Logo" 
                        className="app-logo"
                      />
                    </div>
                    <h1 className="slide-in-bottom">Mindful Meditation</h1>
                    <nav className="app-navigation">
                      <button 
                        className={`${activeTab === 'meditate' ? 'active' : ''} btn-responsive touch-target`}
                        onClick={() => setActiveTab('meditate')}
                      >
                        Meditate
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

                  <main className="app-content responsive-container">
                    {activeTab === 'meditate' && <div className="page-enter-active"><SessionView /></div>}
                    {activeTab === 'configure' && <div className="page-enter-active"><ConfigurationView /></div>}
                    {activeTab === 'instructions' && <div className="page-enter-active"><InstructionsManagerView /></div>}
                    {activeTab === 'settings' && <div className="page-enter-active"><SettingsView /></div>}
                  </main>

                  <footer className="app-footer">
                    <p>Meditation App - Phase 4: Refinement & Deployment</p>
                  </footer>
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
