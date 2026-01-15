import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const LockSetupModal = ({ onConfirm, onCancel }) => {
    return html`
        <div style=${{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style=${{ background: '#1e1e1e', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '320px' }}>
                <h3 style=${{ marginBottom: '16px' }}>Establecer PIN de bloqueo</h3>
                <input 
                    type="password" 
                    inputMode="numeric"
                    placeholder="Nuevo PIN (4+ dígitos)"
                    id="new-pin-input"
                    autoFocus
                    style=${{ background: '#252525', padding: '12px', borderRadius: '8px', fontSize: '18px', textAlign: 'center', marginBottom: '16px' }}
                />
                <div style=${{ display: 'flex', gap: '8px' }}>
                    <button onClick=${onCancel} style=${{ flex: 1, padding: '12px', borderRadius: '8px', background: '#333' }}>Cancelar</button>
                    <button 
                        onClick=${() => {
                            const pin = document.getElementById('new-pin-input').value;
                            if (pin.length < 4) return alert("PIN muy corto");
                            onConfirm(pin);
                        }}
                        style=${{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--accent)', fontWeight: 'bold' }}
                    >
                        Bloquear
                    </button>
                </div>
            </div>
        </div>
    `;
};