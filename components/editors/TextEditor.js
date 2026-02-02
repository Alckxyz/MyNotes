import React, { useRef, useEffect } from 'react';
import htm from 'htm';
import { Toolbar } from './text/Toolbar.js';

const html = htm.bind(React.createElement);

export const TextEditor = ({ content, onChange }) => {
    const editorRef = useRef(null);

    // Initial content setup
    useEffect(() => {
        if (editorRef.current && content && editorRef.current.innerHTML !== content) {
            // We only set this once or when it's totally different to avoid cursor jumps
            if (!editorRef.current.innerHTML || (typeof content === 'string' && content.length > 0 && editorRef.current.innerHTML === '')) {
                editorRef.current.innerHTML = typeof content === 'string' ? content : '';
            }
        }
    }, []);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleAction = (action) => {
        editorRef.current?.focus();
        switch (action) {
            case 'subtitle':
                document.execCommand('formatBlock', false, 'h3');
                break;
            case 'text':
                document.execCommand('formatBlock', false, 'p');
                break;
            case 'bullet':
                document.execCommand('insertUnorderedList', false, null);
                break;
            case 'number':
                document.execCommand('insertOrderedList', false, null);
                break;
            case 'todo':
                // For a unified editor, checklist items are slightly harder, 
                // we'll just use a special symbol or block for now
                document.execCommand('insertHTML', false, '☐ ');
                break;
            case 'copyable':
                const selection = window.getSelection().toString();
                if (selection) {
                    navigator.clipboard.writeText(selection);
                    // Minimal visual feedback handled by browser selection
                } else {
                    document.execCommand('insertHTML', false, '<span style="color:var(--accent); font-weight:bold;">[CLICK_TO_COPY]</span> ');
                }
                break;
        }
        handleInput();
    };

    return html`
        <div style=${{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
            <${Toolbar} onAction=${handleAction} />

            <div 
                ref=${editorRef}
                contentEditable="true"
                onInput=${handleInput}
                style=${{ 
                    flex: 1, 
                    padding: '8px 0', 
                    outline: 'none', 
                    fontSize: '16px', 
                    lineHeight: '1.6', 
                    color: 'var(--text-secondary)',
                    minHeight: '200px',
                    cursor: 'text'
                }}
                data-placeholder="Start typing..."
            ></div>

            <style>${`
                [contenteditable=true]:empty:before {
                    content: attr(data-placeholder);
                    color: #555;
                    cursor: text;
                }
                [contenteditable=true] h3 {
                    color: var(--text-primary);
                    font-size: 22px;
                    margin: 16px 0 8px 0;
                }
                [contenteditable=true] p {
                    margin-bottom: 12px;
                }
                [contenteditable=true] ul, [contenteditable=true] ol {
                    padding-left: 24px;
                    margin-bottom: 12px;
                    color: var(--accent);
                }
                [contenteditable=true] li {
                    margin-bottom: 4px;
                }
            `}</style>
        </div>
    `;
};