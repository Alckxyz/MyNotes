import React from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const Toolbar = ({ onAddBlock }) => {
    return html`
        <div style=${{ 
            background: 'var(--bg-color)', 
            padding: '12px 0', 
            display: 'flex', 
            justifyContent: 'center',
            borderBottom: '1px solid #333',
            zIndex: 30,
            gap: '16px',
            flexShrink: 0,
            position: 'sticky',
            top: '-16px',
            margin: '0 -16px 16px -16px'
        }}>
            <div style=${{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <button onClick=${() => onAddBlock('subtitle')} title="Subtitle" style=${{ padding: '8px' }}><${Lucide.Heading3} size=${22} /></button>
                <button onClick=${() => onAddBlock('text')} title="Text" style=${{ padding: '8px' }}><${Lucide.Type} size=${22} /></button>
                <button onClick=${() => onAddBlock('bullet')} title="Bullet" style=${{ padding: '8px' }}><${Lucide.List} size=${22} /></button>
                <button onClick=${() => onAddBlock('number')} title="Numbers" style=${{ padding: '8px' }}><${Lucide.ListOrdered} size=${22} /></button>
                <button onClick=${() => onAddBlock('letter')} title="Letters" style=${{ padding: '8px' }}><${Lucide.CaseSensitive} size=${22} /></button>
                <button onClick=${() => onAddBlock('todo')} title="Checkbox" style=${{ padding: '8px' }}><${Lucide.CheckSquare} size=${22} /></button>
                <button onClick=${() => onAddBlock('copyable')} title="Click to Copy" style=${{ padding: '8px' }}><${Lucide.ClipboardCopy} size=${22} /></button>
            </div>
        </div>
    `;
};