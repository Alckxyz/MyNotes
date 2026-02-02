import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { verifyBiometrics } from '../constants.js';

const html = htm.bind(React.createElement);

export const UnlockModal = ({ onUnlock, onCancel, onBiometricUnlock }) => {
    const [pin, setPin] = useState('');
    const biometricId = localStorage.getItem('biometric_id');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    useEffect(() => {
        if (biometricId && isMobile) {
            handleBiometric();
        }
    }, []);

    const handleBiometric = async () => {
        if (!biometricId) return;
        try {
            const success = await verifyBiometrics(biometricId);
            if (success) {
                onBiometricUnlock();
            }
        } catch (e) {
            console.error("Error verifying biometrics", e);
        }
    };

    const handlePinSubmit = (e) => {
        if (e) e.preventDefault();
        onUnlock(pin);
    };

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
                border: '1px solid #333'
            }}>
                <div style=${{ 
                    width: '64px', height: '64px', borderRadius: '32px', 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    color: 'var(--accent)'
                }}>
                    <${Lucide.Lock} size=${32} />
                </div>
                
                <h2 style=${{ fontSize: '20px', marginBottom: '8px' }}>Aplicación Bloqueada</h2>
                <p style=${{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    Introduce tu PIN para acceder
                </p>

                <form onSubmit=${handlePinSubmit} style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input 
                        type="password"
                        inputMode="numeric"
                        placeholder="PIN"
                        value=${pin}
                        autoFocus
                        onChange=${(e) => setPin(e.target.value)}
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

                ${biometricId && html`
                    <button 
                        onClick=${handleBiometric}
                        style=${{ 
                            marginTop: '16px', 
                            width: '100%', 
                            border: '1px solid var(--accent)', 
                            padding: '12px', 
                            borderRadius: '12px', 
                            color: 'var(--accent)',
                            display: 'flex',
                            gap: '8px'
                        }}
                    >
                        <${Lucide.Fingerprint} size=${20} /> Desbloquear con Biometría
                    </button>
                `}

                <button 
                    onClick=${onCancel}
                    style=${{ marginTop: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    `;
};