import React from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const Toolbar = ({ onAction }) => {
    return html`
        <div style=${{ 
            background: 'var(--bg-color)', 
            padding: '12px 0', 
            display: 'flex', 
            justifyContent: 'center',
            borderBottom: '1px solid #333',
            zIndex: 30,
            gap: '12px',
            flexShrink: 0,
            position: 'sticky',
            top: '-16px',
            margin: '0 -16px 16px -16px'
        }}>
            <div style=${{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <button onPointerDown=${(e) => { e.preventDefault(); onAction('subtitle'); }} title="Subtitle" style=${{ padding: '8px' }}><${Lucide.Heading3} size=${20} /></button>
                <button onPointerDown=${(e) => { e.preventDefault(); onAction('text'); }} title="Paragraph" style=${{ padding: '8px' }}><${Lucide.Type} size=${20} /></button>
                <button onPointerDown=${(e) => { e.preventDefault(); onAction('bullet'); }} title="Bullet List" style=${{ padding: '8px' }}><${Lucide.List} size=${20} /></button>
                <button onPointerDown=${(e) => { e.preventDefault(); onAction('number'); }} title="Numbered List" style=${{ padding: '8px' }}><${Lucide.ListOrdered} size=${20} /></button>
                <button onPointerDown=${(e) => { e.preventDefault(); onAction('todo'); }} title="Checkbox Symbol" style=${{ padding: '8px' }}><${Lucide.CheckSquare} size=${20} /></button>
                <button onPointerDown=${(e) => { e.preventDefault(); onAction('copyable'); }} title="Copy Selection" style=${{ padding: '8px' }}><${Lucide.ClipboardCopy} size=${20} /></button>
            </div>
        </div>
    `;
};