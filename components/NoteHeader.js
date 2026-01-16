import React from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { NoteType } from '../constants.js';

const html = htm.bind(React.createElement);

export const NoteHeader = ({ 
    note, 
    onSave, 
    onCancel, 
    onUndo, 
    onToggleLock, 
    onToggleColorPicker, 
    onToggleSettings, 
    onExport,
    canUndo
}) => {
    return html`
        <div style=${{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', flexShrink: 0 }}>
            <button onClick=${onCancel} style=${{ padding: '8px' }}>
                <${Lucide.X} size=${24} />
            </button>
            <div style=${{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                    onClick=${() => {
                        // Require auth to toggle lock status too
                        onToggleLock();
                    }} 
                    style=${{ padding: '8px', color: note.isLocked ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                    <${note.isLocked ? Lucide.Lock : Lucide.Unlock} size=${24} />
                </button>
                <button 
                    onClick=${() => { onToggleColorPicker(); }} 
                    style=${{ padding: '8px', color: note.color || 'var(--text-secondary)' }}
                >
                    <${Lucide.Palette} size=${24} />
                </button>
                ${note.type === NoteType.LINKS && html`
                    <button onClick=${() => { onToggleSettings(); }} style=${{ padding: '8px', color: 'var(--text-secondary)' }}>
                        <${Lucide.Settings} size=${24} />
                    </button>
                `}
                <button 
                    onClick=${onUndo} 
                    disabled=${!canUndo}
                    title="Undo (Ctrl+Z)"
                    style=${{ padding: '8px', color: !canUndo ? '#333' : 'var(--text-secondary)' }}
                >
                    <${Lucide.Undo2} size=${24} />
                </button>
                ${note.type === NoteType.CHECKLIST && html`
                    <button onClick=${onExport} style=${{ padding: '8px', color: 'var(--text-secondary)' }}>
                        <${Lucide.Download} size=${24} />
                    </button>
                `}
                <button 
                    onClick=${onSave}
                    style=${{ background: 'var(--accent)', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold' }}
                >
                    Save
                </button>
            </div>
        </div>
    `;
};