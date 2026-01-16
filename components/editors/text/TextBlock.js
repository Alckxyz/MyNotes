import React, { useState, useRef } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const TextBlock = ({ 
    block, 
    index, 
    blocks, 
    isCurrentlyEditing, 
    onUpdate, 
    onRemove, 
    onFocus, 
    onSetNewlyCreated,
    onStopEditing,
    onSetEditingId
}) => {
    const [copyFeedback, setCopyFeedback] = useState(false);
    const longPressTimer = useRef(null);
    const isLongPressActive = useRef(false);

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
                onClick=${() => onUpdate(block.id, 'checked', !block.checked)}
                style=${{ color: block.checked ? 'var(--success)' : 'var(--text-secondary)', marginRight: '8px' }}
            >
                <${block.checked ? Lucide.CheckCircle2 : Lucide.Circle} size=${20} />
            </button>
        `;
        return null;
    };

    const isCopyable = block.type === 'copyable';
    const placeholder = block.type === 'subtitle' ? 'Write subtitle...' : '';

    const handleCopyClick = () => {
        if (isCurrentlyEditing) return;
        if (isLongPressActive.current) {
            isLongPressActive.current = false;
            return;
        }
        if (block.text) {
            navigator.clipboard.writeText(block.text);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 1000);
        }
    };

    const handlePointerDown = () => {
        if (isCurrentlyEditing) return;
        isLongPressActive.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPressActive.current = true;
            onSetEditingId(block.id);
        }, 600);
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return html`
        <div style=${{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '4px',
            padding: '0'
        }}>
            <div style=${{ display: 'flex', alignItems: 'flex-start', flex: 1, position: 'relative' }}>
                ${getPrefix()}
                ${isCopyable ? html`
                    <div style=${{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0px', 
                        flex: 1, 
                        minHeight: '36px',
                        background: isCurrentlyEditing ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                        padding: isCurrentlyEditing ? '4px 8px' : '0',
                        borderRadius: '8px',
                        border: isCurrentlyEditing ? '1px dashed rgba(59, 130, 246, 0.3)' : 'none'
                    }}>
                        <input 
                            placeholder="Label..."
                            value=${block.label || ''}
                            onChange=${(e) => onUpdate(block.id, 'label', e.target.value)}
                            onFocus=${(e) => onFocus(block.id, e.target.selectionStart)}
                            style=${{ 
                                width: 'auto',
                                minWidth: '20px',
                                maxWidth: '120px',
                                flexShrink: 0,
                                fontSize: '16px', 
                                color: 'var(--text-primary)',
                                borderRight: isCurrentlyEditing ? '1px solid #444' : 'none',
                                paddingRight: isCurrentlyEditing ? '8px' : '4px'
                            }}
                        />
                        ${isCurrentlyEditing ? html`
                            <input 
                                autoFocus
                                placeholder="Value..."
                                value=${block.text}
                                onBlur=${onStopEditing}
                                onChange=${(e) => onUpdate(block.id, 'text', e.target.value)}
                                onKeyDown=${(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        onStopEditing();
                                        const nextId = Date.now() + 1;
                                        const newBlock = { id: nextId, type: 'text', text: '', label: '', checked: false };
                                        const newBlocks = [...blocks];
                                        newBlocks.splice(index + 1, 0, newBlock);
                                        onUpdate(null, 'REPLACE_ALL', newBlocks);
                                        onSetNewlyCreated(nextId);
                                    }
                                }}
                                style=${{ flex: 1, fontSize: '14px', fontWeight: 'bold' }}
                            />
                        ` : html`
                            <div 
                                onClick=${handleCopyClick}
                                onPointerDown=${handlePointerDown}
                                onPointerUp=${handlePointerUp}
                                onPointerLeave=${handlePointerUp}
                                style=${{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: copyFeedback ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                                    border: `1px solid ${copyFeedback ? 'var(--success)' : 'rgba(59, 130, 246, 0.3)'}`,
                                    color: copyFeedback ? 'var(--success)' : 'var(--accent)',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    minHeight: '36px',
                                    width: 'fit-content',
                                    maxWidth: 'calc(100% - 40px)',
                                    overflow: 'hidden',
                                    marginLeft: '4px'
                                }}
                            >
                                <span style=${{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    ${block.text || '...'}
                                </span>
                                <${copyFeedback ? Lucide.Check : Lucide.Clipboard} size=${14} style=${{ marginLeft: '8px', opacity: 0.7, flexShrink: 0 }} />
                            </div>
                        `}
                    </div>
                ` : html`
                    <textarea 
                        id=${`block-${block.id}`}
                        autoFocus=${isCurrentlyEditing}
                        placeholder=${placeholder}
                        value=${block.text}
                        onFocus=${(e) => onFocus(block.id, e.target.selectionStart)}
                        onChange=${(e) => {
                            onUpdate(block.id, 'text', e.target.value);
                            onFocus(block.id, e.target.selectionStart);
                        }}
                        onKeyDown=${(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const newType = (block.type === 'bullet' || block.type === 'number' || block.type === 'letter' || block.type === 'todo') 
                                    ? block.type 
                                    : 'text';
                                const nextId = Date.now();
                                const newBlock = { id: nextId, type: newType, text: '', label: '', checked: false };
                                const newBlocks = [...blocks];
                                newBlocks.splice(index + 1, 0, newBlock);
                                onUpdate(null, 'REPLACE_ALL', newBlocks);
                                onSetNewlyCreated(nextId);
                            } else if (e.key === 'Backspace' && block.text === '') {
                                e.preventDefault();
                                onRemove(block.id);
                            }
                        }}
                        style=${{ 
                            flex: 1, 
                            fontSize: block.type === 'subtitle' ? '22px' : '16px',
                            fontWeight: block.type === 'subtitle' ? '700' : '400',
                            color: block.type === 'subtitle' ? 'white' : 'var(--text-secondary)',
                            textDecoration: block.checked ? 'line-through' : 'none',
                            opacity: block.checked ? 0.5 : 1,
                            minHeight: '20px',
                            height: 'auto',
                            resize: 'none',
                            overflow: 'hidden',
                            lineHeight: '1.1',
                            background: 'transparent',
                            border: 'none'
                        }}
                        onInput=${(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                    />
                `}
            </div>
            <button onClick=${() => onRemove(block.id)} style=${{ color: 'var(--danger)', opacity: 0.15, padding: '4px' }}>
                <${Lucide.X} size=${14} />
            </button>
        </div>
    `;
};