import React, { useState } from 'react';
import htm from 'htm';
import { LinkItem } from '../LinkItem.js';

const html = htm.bind(React.createElement);

export const LinkEditor = ({ content, settings, onUpdateItem, onRemoveItem, onAddItem, onUpdateContent }) => {
    const [dragActiveId, setDragActiveId] = useState(null);

    const moveItem = (id, direction) => {
        const index = content.findIndex(item => item.id === id);
        if (index === -1) return;
        
        const newContent = [...content];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (newIndex >= 0 && newIndex < newContent.length) {
            const [removed] = newContent.splice(index, 1);
            newContent.splice(newIndex, 0, removed);
            onUpdateContent(newContent);
        }
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedIndex = content.findIndex(item => String(item.id) === draggedId);
        
        if (draggedIndex === -1 || draggedIndex === targetIndex) return;
        
        const newContent = [...content];
        const [draggedItem] = newContent.splice(draggedIndex, 1);
        newContent.splice(targetIndex, 0, draggedItem);
        onUpdateContent(newContent);
    };

    return html`
        <div style=${{ display: 'grid', gap: '12px' }}>
            ${content.map((item, index) => html`
                <div 
                    key=${item.id}
                    draggable=${dragActiveId === item.id}
                    onDragStart=${(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd=${(e) => {
                        e.currentTarget.style.opacity = '1';
                        setDragActiveId(null);
                    }}
                    onDragOver=${(e) => e.preventDefault()}
                    onDrop=${(e) => {
                        handleDrop(e, index);
                        setDragActiveId(null);
                    }}
                >
                    <${LinkItem} 
                        item=${item} 
                        settings=${settings}
                        updateItem=${onUpdateItem} 
                        removeItem=${onRemoveItem}
                        onMove=${(dir) => moveItem(item.id, dir)}
                        isFirst=${index === 0}
                        isLast=${index === content.length - 1}
                        onGrab=${() => setDragActiveId(item.id)}
                    />
                </div>
            `)}
            <button 
                onClick=${onAddItem}
                style=${{ padding: '16px', border: '2px dashed #333', borderRadius: '12px', color: 'var(--text-secondary)' }}
            >
                + Add Link
            </button>
        </div>
    `;
};