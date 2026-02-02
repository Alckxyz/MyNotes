import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { isBiometricsAvailable, registerBiometrics } from '../constants.js';

const html = htm.bind(React.createElement);

export const LockSetupModal = ({ onConfirm, onCancel }) => {
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [biometricsSupported, setBiometricsSupported] = useState(false);
    const [useBiometrics, setUseBiometrics] = useState(false);

    useEffect(() => {
        isBiometricsAvailable().then(setBiometricsSupported);
    }, []);

    const handleSubmit = async () => {
        if (!pin) return setError("PIN inválido");
        if (pin.length < 4) return setError("El PIN debe tener al menos 4 dígitos");
        if (pin !== confirm) return setError("Los PIN no coinciden");
        
        try {
            const { encryptMasterKey } = await import('../constants.js');
            const encryptionResult = await encryptMasterKey(pin);
            
            let bioId = null;
            if (useBiometrics) {
                try {
                    bioId = await registerBiometrics();
                } catch (e) {
                    console.error("Biometrics failed, continuing with PIN only", e);
                }
            }
            
            onConfirm({
                ...encryptionResult,
                biometricId: bioId
            });
        } catch (e) {
            setError("Error al cifrar clave maestra.");
        }
    };

    return html`
        <div style=${{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style=${{ background: '#1e1e1e', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '360px', textAlign: 'center', border: '1px solid #333' }}>
                <h2 style=${{ marginBottom: '8px', fontSize: '20px' }}>Configurar PIN</h2>
                <p style=${{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    Crea un PIN para proteger el acceso a la aplicación.
                </p>
                
                <div style=${{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                    <input 
                        type="password" 
                        inputMode="numeric"
                        placeholder="Nuevo PIN"
                        value=${pin}
                        onChange=${(e) => { setPin(e.target.value); setError(''); }}
                        autoFocus
                        style=${{ background: '#252525', padding: '16px', borderRadius: '12px', fontSize: '20px', textAlign: 'center', letterSpacing: '8px' }}
                    />
                    <input 
                        type="password" 
                        inputMode="numeric"
                        placeholder="Confirmar PIN"
                        value=${confirm}
                        onChange=${(e) => { setConfirm(e.target.value); setError(''); }}
                        onKeyDown=${(e) => e.key === 'Enter' && handleSubmit()}
                        style=${{ background: '#252525', padding: '16px', borderRadius: '12px', fontSize: '20px', textAlign: 'center', letterSpacing: '8px' }}
                    />
                </div>

                ${biometricsSupported && html`
                    <label style=${{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#252525', borderRadius: '12px', marginBottom: '20px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked=${useBiometrics} 
                            onChange=${(e) => setUseBiometrics(e.target.checked)}
                            style=${{ width: '20px', height: '20px', accentColor: 'var(--accent)' }}
                        />
                        <div style=${{ textAlign: 'left' }}>
                            <div style=${{ fontSize: '14px', fontWeight: 'bold' }}>Usar Huella / FaceID</div>
                            <div style=${{ fontSize: '11px', color: 'var(--text-secondary)' }}>Permite acceso rápido sin PIN</div>
                        </div>
                    </label>
                `}

                ${error && html`<p style=${{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>${error}</p>`}

                <div style=${{ display: 'flex', gap: '12px' }}>
                    <button onClick=${onCancel} style=${{ flex: 1, padding: '16px', borderRadius: '12px', background: '#333' }}>Cancelar</button>
                    <button 
                        onClick=${handleSubmit}
                        style=${{ flex: 1, padding: '16px', borderRadius: '12px', background: 'var(--accent)', fontWeight: 'bold' }}
                    >
                        Guardar PIN
                    </button>
                </div>
            </div>
        </div>
    `;
};