import React from 'react';
import htm from 'htm';
import { NOTE_COLORS } from '../constants.js';

const html = htm.bind(React.createElement);

export const ColorPicker = ({ currentColor, onSelect, onClose }) => {
    return html`
        <div style=${{
            position: 'absolute',
            top: '70px',
            right: '16px',
            background: '#252525',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 200,
            display: 'flex',
            gap: '8px'
        }}>
            ${NOTE_COLORS.map(c => html`
                <button 
                    key=${c.value}
                    onClick=${() => { onSelect(c.value); onClose(); }}
                    style=${{
                        width: '32px',
                        height: '32px',
                        borderRadius: '16px',
                        background: c.value,
                        border: currentColor === c.value ? '2px solid white' : '1px solid #444'
                    }}
                />
            `)}
        </div>
    `;
};