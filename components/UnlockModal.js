import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { isBiometricsAvailable, authenticateBiometrics, playSound, AUDIO_CLICK } from '../constants.js';

const html = htm.bind(React.createElement);

export const UnlockModal = ({ onUnlock, onCancel, noteTitle, actionType = 'unlock' }) => {
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState(null); // 'success', 'error'
    const [hasBio, setHasBio] = useState(false);

    useEffect(() => {
        isBiometricsAvailable().then(available => {
            setHasBio(available);
            if (available) {
                // Auto-trigger biometrics on mobile
                setTimeout(handleBiometrics, 500);
            }
        });
    }, []);

    const handlePinSubmit = (e) => {
        if (e) e.preventDefault();
        onUnlock(pin);
    };

    const handleBiometrics = async () => {
        const success = await authenticateBiometrics();
        if (success) {
            setStatus('success');
            setTimeout(() => onUnlock('AUTO_BIO'), 600);
        } else {
            setStatus('error');
            setTimeout(() => setStatus(null), 2000);
        }
    };

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const title = actionType === 'unlock' ? 'Nota Bloqueada' : 'Confirmar Acción';
    const subtitle = actionType === 'unlock' 
        ? `"${noteTitle || 'Nota sin título'}"`
        : 'Esta acción requiere autenticación';

    return html`
        <div style=${{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style=${{ 
                background: '#1e1e1e', padding: '32px', borderRadius: '24px', 
                width: '100%', maxWidth: '360px', textAlign: 'center',
                animation: 'fadeIn 0.3s ease-out',
                border: status === 'success' ? '2px solid var(--success)' : (status === 'error' ? '2px solid var(--danger)' : '1px solid #333')
            }}>
                <div style=${{ 
                    width: '64px', height: '64px', borderRadius: '32px', 
                    background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    color: status === 'success' ? 'var(--success)' : (status === 'error' ? 'var(--danger)' : 'var(--accent)'),
                    transition: 'all 0.3s'
                }}>
                    ${status === 'success' ? html`<${Lucide.Check} size=${32} />` : (status === 'error' ? html`<${Lucide.X} size=${32} />` : html`<${Lucide.Lock} size=${32} />`)}
                </div>
                
                <h2 style=${{ fontSize: '20px', marginBottom: '8px' }}>${status === 'success' ? 'Desbloqueado ✅' : (status === 'error' ? 'Falló autenticación ❌' : title)}</h2>
                <p style=${{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    ${subtitle}
                </p>

                <form onSubmit=${handlePinSubmit} style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input 
                        type="password"
                        inputMode="numeric"
                        placeholder="PIN"
                        value=${pin}
                        autoFocus
                        onChange=${(e) => { setPin(e.target.value); setStatus(null); }}
                        style=${{ 
                            background: '#2a2a2a', padding: '16px', borderRadius: '12px', 
                            textAlign: 'center', fontSize: '24px', letterSpacing: '8px' 
                        }}
                    />
                    
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