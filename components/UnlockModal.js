import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { isBiometricsAvailable, authenticateBiometrics, playSound, AUDIO_CLICK } from '../constants.js';

const html = htm.bind(React.createElement);

export const UnlockModal = ({ onUnlock, onCancel, noteTitle }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [hasBio, setHasBio] = useState(false);

    useEffect(() => {
        isBiometricsAvailable().then(setHasBio);
    }, []);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }
        onUnlock(pin);
    };

    const handleBiometrics = async () => {
        playSound(AUDIO_CLICK);
        const success = await authenticateBiometrics();
        if (success) {
            // Note: In a real passkey scenario, biometrics unlocks the vault. 
            // Here, for local demo, we'll assume the session-cached PIN is used.
            // If it's the first time this session, biometrics doesn't "know" the PIN.
            // But we'll follow the user request flow.
            onUnlock('AUTO_BIO'); 
        }
    };

    return html`
        <div style=${{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style=${{ 
                background: '#1e1e1e', padding: '32px', borderRadius: '24px', 
                width: '100%', maxWidth: '360px', textAlign: 'center',
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <div style=${{ 
                    width: '64px', height: '64px', borderRadius: '32px', 
                    background: 'rgba(59, 130, 246, 0.1)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    color: 'var(--accent)'
                }}>
                    <${Lucide.Lock} size=${32} />
                </div>
                
                <h2 style=${{ fontSize: '20px', marginBottom: '8px' }}>Nota Bloqueada</h2>
                <p style=${{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    "${noteTitle}"
                </p>

                <form onSubmit=${handlePinSubmit} style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input 
                        type="password"
                        inputMode="numeric"
                        placeholder="Ingresa PIN"
                        value=${pin}
                        autoFocus
                        onChange=${(e) => { setPin(e.target.value); setError(''); }}
                        style=${{ 
                            background: '#2a2a2a', padding: '16px', borderRadius: '12px', 
                            textAlign: 'center', fontSize: '24px', letterSpacing: '8px' 
                        }}
                    />
                    
                    ${error && html`<div style=${{ color: 'var(--danger)', fontSize: '12px' }}>${error}</div>`}

                    <button 
                        type="submit"
                        style=${{ background: 'var(--accent)', padding: '16px', borderRadius: '12px', fontWeight: 'bold' }}
                    >
                        Desbloquear con PIN
                    </button>
                </form>

                ${hasBio && html`
                    <button 
                        onClick=${handleBiometrics}
                        style=${{ 
                            width: '100%', marginTop: '12px', padding: '16px', 
                            borderRadius: '12px', border: '1px solid #444', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <${Lucide.Fingerprint} size=${20} /> Biometría
                    </button>
                `}

                <button 
                    onClick=${onCancel}
                    style=${{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}
                >
                    Cancelar
                </button>
            </div>
        </div>
    `;
};