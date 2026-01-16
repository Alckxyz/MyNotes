import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';


const html = htm.bind(React.createElement);

export const ChecklistEditor = ({ content, onUpdateItem, onRemoveItem, onAddItem, onRestore, onReorder }) => {
    const [dragActiveId, setDragActiveId] = useState(null);
    const [activeTextId, setActiveTextId] = useState(null);

    const handleQuantityChange = (id, field, value, item) => {
        onUpdateItem(id, field, value);
        // If this is the first time setting a value, set it as original too
        if (field === 'quantity' && !item.originalQuantity && value) {
            onUpdateItem(id, 'originalQuantity', value);
        }
        if (field === 'unit' && !item.originalUnit && value) {
            onUpdateItem(id, 'originalUnit', value);
        }
    };

    const clearQuantity = (id) => {
        onUpdateItem(id, 'quantity', '');
        onUpdateItem(id, 'unit', '');
        onUpdateItem(id, 'originalQuantity', '');
        onUpdateItem(id, 'originalUnit', '');
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedIndex = content.findIndex(item => String(item.id) === draggedId);
        
        if (draggedIndex === -1 || draggedIndex === targetIndex) return;
        
        const newContent = [...content];
        const [draggedItem] = newContent.splice(draggedIndex, 1);
        newContent.splice(targetIndex, 0, draggedItem);
        onReorder(newContent);
    };

    return html`
        <div className="checklist-container">
            <div style=${{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                    onClick=${onRestore}
                    style=${{ flex: 1, background: '#333', padding: '12px', borderRadius: '8px', fontSize: '14px' }}
                >
                    <${Lucide.RefreshCcw} size=${16} style=${{ marginRight: '8px' }} /> Restore list
                </button>
            </div>
            <div style=${{ display: 'grid', gap: '8px' }}>
                ${content.map((item, index) => !item.checked && html`
                    <div 
                        key=${item.id} 
                        draggable=${dragActiveId === item.id}
                        onDragStart=${(e) => {
                            e.dataTransfer.setData('text/plain', String(item.id));
                            e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEnd=${(e) => {
                            e.currentTarget.style.opacity = '1';
                            setDragActiveId(null);
                        }}
                        onDragOver=${(e) => e.preventDefault()}
                        onDrop=${(e) => handleDrop(e, index)}
                        style=${{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '8px', 
                            alignItems: 'flex-start', 
                            background: '#252525', 
                            padding: '8px 12px', 
                            borderRadius: '12px',
                            border: '1px solid #333'
                        }}
                    >
                        <div style=${{ display: 'flex', gap: '8px', alignItems: 'flex-start', flex: '1 1 180px' }}>
                            <button onClick=${() => onUpdateItem(item.id, 'checked', true)} style=${{ color: 'var(--text-secondary)' }}>
                                <${Lucide.Square} size=${20} />
                            </button>
                            <textarea 
                                value=${item.text}
                                placeholder="Task..."
                                onChange=${(e) => onUpdateItem(item.id, 'text', e.target.value)}
                                onInput=${(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                rows=${1}
                                style=${{ 
                                    width: '180px', 
                                    fontWeight: '500', 
                                    resize: 'none', 
                                    minHeight: '24px', 
                                    height: 'auto',
                                    lineHeight: '1.2',
                                    padding: '2px 0',
                                    overflow: 'hidden'
                                }}
                            />
                        </div>

                        <div style=${{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            flexShrink: 0
                        }}>
                            ${item.isTextMode ? html`
                                <div style=${{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    background: '#1a1a1a', 
                                    padding: '4px 8px', 
                                    borderRadius: '6px',
                                    border: '1px solid #3b82f6'
                                }}>
                                    <input 
                                        ref=${el => {
                                            if (el && activeTextId === item.id) {
                                                el.focus();
                                                setActiveTextId(null);
                                            }
                                        }}
                                        placeholder="Nota..."
                                        value=${item.extraText || ''}
                                        onChange=${(e) => onUpdateItem(item.id, 'extraText', e.target.value)}
                                        style=${{ width: '70px', fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}
                                    />
                                </div>
                            ` : html`
                                <div style=${{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '2px', 
                                    background: '#1a1a1a', 
                                    padding: '4px 6px', 
                                    borderRadius: '6px',
                                    border: '1px solid #333'
                                }}>
                                    <input 
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value=${item.quantity || ''}
                                        onChange=${(e) => handleQuantityChange(item.id, 'quantity', e.target.value, item)}
                                        style=${{ width: '30px', fontSize: '13px', textAlign: 'right', color: 'var(--accent)' }}
                                    />
                                    <input 
                                        placeholder="unit"
                                        value=${item.unit || ''}
                                        onChange=${(e) => handleQuantityChange(item.id, 'unit', e.target.value, item)}
                                        style=${{ width: '35px', fontSize: '12px', color: 'var(--text-secondary)' }}
                                    />
                                    
                                    ${(!item.quantity && item.originalQuantity) && html`
                                        <button 
                                            onClick=${() => clearQuantity(item.id)}
                                            style=${{ color: 'var(--danger)', marginLeft: '4px' }}
                                        >
                                            <${Lucide.X} size=${14} />
                                        </button>
                                    `}
                                </div>
                            `}
                            
                            <button 
                                onClick=${() => {
                                    const nextMode = !item.isTextMode;
                                    onUpdateItem(item.id, 'isTextMode', nextMode);
                                    if (nextMode) setActiveTextId(item.id);
                                }}
                                title="Toggle Number/Text"
                                style=${{ color: item.isTextMode ? '#3b82f6' : 'var(--text-secondary)', opacity: 0.6 }}
                            >
                                <${item.isTextMode ? Lucide.Hash : Lucide.Type} size=${16} />
                            </button>
                        </div>

                        <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                            <button onClick=${() => onRemoveItem(item.id)} style=${{ color: 'var(--danger)', opacity: 0.3, padding: '4px' }}>
                                <${Lucide.Trash} size=${16} />
                            </button>
                            <div 
                                onPointerDown=${() => setDragActiveId(item.id)}
                                style=${{ cursor: 'grab', color: 'var(--text-secondary)', padding: '4px' }}
                            >
                                <${Lucide.Menu} size=${18} />
                            </div>
                        </div>
                    </div>
                `)}
                <button 
                    onClick=${onAddItem}
                    style=${{ padding: '16px', border: '2px dashed #333', borderRadius: '12px', color: 'var(--text-secondary)' }}
                >
                    + Add Item
                </button>
            </div>
        </div>
    `;
};