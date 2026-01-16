import React, { useState } from 'react';
import htm from 'htm';
import { Toolbar } from './text/Toolbar.js';
import { TextBlock } from './text/TextBlock.js';

const html = htm.bind(React.createElement);

// removed BlockIcon helper (moved to components/editors/text/BlockIcon.js)

export const TextEditor = ({ content, onChange }) => {
    const blocks = Array.isArray(content) ? content : [];
    const [lastFocusedId, setLastFocusedId] = useState(null);
    const [lastCaretPos, setLastCaretPos] = useState(null);
    const [newlyCreatedId, setNewlyCreatedId] = useState(null);
    const [editingBlockId, setEditingBlockId] = useState(null);

    // removed copyFeedbackId state (moved to TextBlock.js)
    // removed longPressTimer ref (moved to TextBlock.js)
    // removed isLongPressActive ref (moved to TextBlock.js)

    const addBlock = (type) => {
        const now = Date.now();
        const newBlock = {
            id: now,
            type,
            text: '',
            label: '',
            checked: false
        };
        
        let newBlocks = [...blocks];
        const index = blocks.findIndex(b => b.id === lastFocusedId);
        
        if (index === -1) {
            newBlocks.push(newBlock);
        } else {
            if (lastCaretPos === 0) {
                newBlocks.splice(index, 0, newBlock);
            } else {
                newBlocks.splice(index + 1, 0, newBlock);
            }
        }
        
        setNewlyCreatedId(newBlock.id);
        onChange(newBlocks);
    };

    const updateBlock = (id, field, value) => {
        if (field === 'REPLACE_ALL') {
            onChange(value);
            return;
        }
        onChange(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const removeBlock = (id) => {
        const index = blocks.findIndex(b => b.id === id);
        const newBlocks = blocks.filter(b => b.id !== id);
        onChange(newBlocks);
        
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
            <${Toolbar} onAddBlock=${addBlock} />

            ${blocks.length === 0 && html`
                <div 
                    onClick=${() => addBlock('text')}
                    style=${{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'text' }}
                >
                </div>
            `}
            
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                ${blocks.map((block, index) => html`
                    <${TextBlock} 
                        key=${block.id}
                        block=${block}
                        index=${index}
                        blocks=${blocks}
                        isCurrentlyEditing=${block.id === newlyCreatedId || editingBlockId === block.id}
                        onUpdate=${updateBlock}
                        onRemove=${removeBlock}
                        onFocus=${(id, pos) => { setLastFocusedId(id); setLastCaretPos(pos); }}
                        onSetNewlyCreated=${setNewlyCreatedId}
                        onStopEditing=${() => { setEditingBlockId(null); setNewlyCreatedId(null); }}
                        onSetEditingId=${setEditingBlockId}
                    />
                `)}
            </div>
        </div>
    `;
};