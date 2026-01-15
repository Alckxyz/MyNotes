import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { playSound, AUDIO_CLICK, AUDIO_DELETE } from '../../constants.js';

const html = htm.bind(React.createElement);

const BlockIcon = ({ type }) => {
    switch (type) {
        case 'subtitle': return html`<${Lucide.Heading3} size=${16} />`;
        case 'bullet': return html`<${Lucide.List} size=${16} />`;
        case 'number': return html`<${Lucide.ListOrdered} size=${16} />`;
        case 'letter': return html`<${Lucide.CaseSensitive} size=${16} />`;
        case 'todo': return html`<${Lucide.CheckSquare} size=${16} />`;
        default: return html`<${Lucide.Type} size=${16} />`;
    }
};

export const TextEditor = ({ content, onChange }) => {
    const blocks = Array.isArray(content) ? content : [];
    const [lastFocusedId, setLastFocusedId] = useState(null);
    const [newlyCreatedId, setNewlyCreatedId] = useState(null);

    const addBlock = (type) => {
        playSound(AUDIO_CLICK);
        const now = Date.now();
        const newBlock = {
            id: now,
            type,
            text: '',
            checked: false
        };
        
        let newBlocks = [...blocks];
        const index = blocks.findIndex(b => b.id === lastFocusedId);
        
        if (index === -1) {
            newBlocks.push(newBlock);
        } else {
            newBlocks.splice(index + 1, 0, newBlock);
        }
        
        setNewlyCreatedId(newBlock.id);
        onChange(newBlocks);
    };

    const updateBlock = (id, field, value) => {
        onChange(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const removeBlock = (id) => {
        playSound(AUDIO_DELETE);
        const index = blocks.findIndex(b => b.id === id);
        const newBlocks = blocks.filter(b => b.id !== id);
        onChange(newBlocks);
        
        // If we deleted a block, try to focus the previous one
        if (index > 0) {
            setTimeout(() => {
                const prevBlock = newBlocks[index - 1];
                if (prevBlock) {
                    const el = document.getElementById(`block-${prevBlock.id}`);
                    if (el) {
                        el.focus();
                        const len = el.value.length;
                        el.setSelectionRange(len, len);
                    }
                }
            }, 0);
        }
    };

    return html`
        <div style=${{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
                <div style=${{ display: 'flex', gap: '20px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <button onClick=${() => addBlock('subtitle')} title="Subtitle" style=${{ padding: '8px' }}><${Lucide.Heading3} size=${22} /></button>
                    <button onClick=${() => addBlock('text')} title="Text" style=${{ padding: '8px' }}><${Lucide.Type} size=${22} /></button>
                    <button onClick=${() => addBlock('bullet')} title="Bullet" style=${{ padding: '8px' }}><${Lucide.List} size=${22} /></button>
                    <button onClick=${() => addBlock('number')} title="Numbers" style=${{ padding: '8px' }}><${Lucide.ListOrdered} size=${22} /></button>
                    <button onClick=${() => addBlock('letter')} title="Letters" style=${{ padding: '8px' }}><${Lucide.CaseSensitive} size=${22} /></button>
                    <button onClick=${() => addBlock('todo')} title="Checkbox" style=${{ padding: '8px' }}><${Lucide.CheckSquare} size=${22} /></button>
                </div>
            </div>

            ${blocks.length === 0 && html`
                <div 
                    onClick=${() => addBlock('text')}
                    style=${{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'text' }}
                >
                    Write something...
                </div>
            `}
            
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                ${blocks.map((block, index) => {
                    const getPrefix = () => {
                        let relativeIndex = 0;
                        if (block.type === 'number' || block.type === 'letter') {
                            for (let i = index - 1; i >= 0; i--) {
                                if (blocks[i].type === block.type) {
                                    relativeIndex++;
                                } else {
                                    break;
                                }
                            }
                        }

                        if (block.type === 'number') return html`<span style=${{ minWidth: '24px', color: 'var(--accent)', paddingTop: '2px' }}>${relativeIndex + 1}.</span>`;
                        if (block.type === 'letter') return html`<span style=${{ minWidth: '24px', color: 'var(--accent)', paddingTop: '2px' }}>${String.fromCharCode(97 + (relativeIndex % 26))}.</span>`;
                        if (block.type === 'bullet') return html`<span style=${{ minWidth: '24px', color: 'var(--accent)', paddingTop: '2px', fontSize: '20px', lineHeight: '1' }}>•</span>`;
                        if (block.type === 'todo') return html`
                            <button 
                                onClick=${() => updateBlock(block.id, 'checked', !block.checked)}
                                style=${{ color: block.checked ? 'var(--success)' : 'var(--text-secondary)', marginRight: '8px' }}
                            >
                                <${block.checked ? Lucide.CheckCircle2 : Lucide.Circle} size=${20} />
                            </button>
                        `;
                        return null;
                    };

                    return html`
                        <div key=${block.id} style=${{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '4px',
                            padding: '4px 0'
                        }}>
                            <div style=${{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                                ${getPrefix()}
                                <textarea 
                                    id=${`block-${block.id}`}
                                    autoFocus=${block.id === newlyCreatedId}
                                    placeholder="Write something..."
                                    value=${block.text}
                                    onFocus=${() => setLastFocusedId(block.id)}
                                    onChange=${(e) => updateBlock(block.id, 'text', e.target.value)}
                                    onKeyDown=${(e) => {
                                        if (e.key === 'Backspace' && block.text === '') {
                                            e.preventDefault();
                                            removeBlock(block.id);
                                        }
                                    }}
                                    style=${{ 
                                        flex: 1, 
                                        fontSize: block.type === 'subtitle' ? '22px' : '16px',
                                        fontWeight: block.type === 'subtitle' ? '700' : '400',
                                        color: block.type === 'subtitle' ? 'white' : 'var(--text-secondary)',
                                        textDecoration: block.checked ? 'line-through' : 'none',
                                        opacity: block.checked ? 0.5 : 1,
                                        minHeight: '24px',
                                        height: 'auto',
                                        resize: 'none',
                                        overflow: 'hidden',
                                        padding: '0',
                                        lineHeight: '1.5'
                                    }}
                                    onInput=${(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                />
                            </div>
                            <button onClick=${() => removeBlock(block.id)} style=${{ color: 'var(--danger)', opacity: 0.15, padding: '4px' }}>
                                <${Lucide.X} size=${14} />
                            </button>
                        </div>
                    `;
                })}
            </div>
        </div>
    `;
};