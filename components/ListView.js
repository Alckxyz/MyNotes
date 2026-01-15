import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { NoteType, AUDIO_CLICK, playSound } from '../constants.js';

const html = htm.bind(React.createElement);

export const ListView = ({ notes, onAdd, onEdit, onDelete, onReorder, onUndo, hasHistory }) => {
    const [dragActiveId, setDragActiveId] = useState(null);

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedIndex = notes.findIndex(n => String(n.id) === draggedId);
        
        if (draggedIndex === -1 || draggedIndex === targetIndex) return;
        
        const newNotes = [...notes];
        const [draggedNote] = newNotes.splice(draggedIndex, 1);
        newNotes.splice(targetIndex, 0, draggedNote);
        onReorder(newNotes);
    };

    return html`
        <${React.Fragment}>
            <div style=${{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style=${{ fontSize: '24px' }}>My Notes</h1>
                <div style=${{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        onClick=${onUndo} 
                        disabled=${!hasHistory}
                        title="Undo (Ctrl+Z)"
                        style=${{ color: hasHistory ? 'var(--text-primary)' : '#333', opacity: hasHistory ? 1 : 0.5 }}
                    >
                        <${Lucide.Undo2} size=${22} />
                    </button>
                    <span style=${{ color: 'var(--text-secondary)', fontSize: '14px' }}>${notes.length} notes</span>
                </div>
            </div>
            
            <div className="scroll-container">
                ${notes.length === 0 ? html`
                    <div style=${{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>
                        <${Lucide.FileText} size=${48} style=${{ opacity: 0.3, marginBottom: '16px' }} />
                        <p>No notes yet</p>
                    </div>
                ` : html`
                    <div style=${{ display: 'grid', gap: '12px' }}>
                        ${notes.map((note, index) => html`
                            <div 
                                key=${note.id} 
                                draggable=${dragActiveId === note.id}
                                onDragStart=${(e) => {
                                    e.dataTransfer.setData('text/plain', String(note.id));
                                    e.currentTarget.style.opacity = '0.4';
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
                                onClick=${() => {
                                    playSound(AUDIO_CLICK);
                                    onEdit(note);
                                }}
                                style=${{ 
                                    background: note.color || 'var(--card-bg)', 
                                    padding: '16px', 
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: note.color ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'
                                }}
                            >
                                <div style=${{ flex: 1, overflow: 'hidden' }}>
                                    <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        ${note.type === NoteType.TEXT && html`<${Lucide.Type} size=${16} color="var(--accent)" />`}
                                        ${note.type === NoteType.CHECKLIST && html`<${Lucide.CheckSquare} size=${16} color="var(--success)" />`}
                                        ${note.type === NoteType.LINKS && html`<${Lucide.Link} size=${16} color="#a855f7" />`}
                                        ${note.type === NoteType.WORKOUT && html`<${Lucide.Dumbbell} size=${16} color="#f59e0b" />`}
                                        ${note.type === NoteType.TASKS && html`<${Lucide.ListTodo} size=${16} color="#ef4444" />`}
                                        <h3 style=${{ fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            ${note.title || 'Untitled'}
                                            ${note.isLocked && html`<${Lucide.Lock} size=${14} style=${{ marginLeft: '8px', opacity: 0.6 }} />`}
                                        </h3>
                                    </div>
                                    <p style=${{ color: note.color ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        ${note.isLocked ? 'Contenido oculto 🔒' : (note.subtitle || 'No subtitle')}
                                    </p>
                                </div>
                                <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button 
                                        onClick=${(e) => { e.stopPropagation(); onDelete(note.id); }}
                                        style=${{ padding: '8px', color: note.color ? 'rgba(255,255,255,0.5)' : 'var(--danger)' }}
                                    >
                                        <${Lucide.Trash2} size=${20} />
                                    </button>
                                    <div 
                                        onPointerDown=${(e) => {
                                            e.stopPropagation();
                                            setDragActiveId(note.id);
                                        }}
                                        onClick=${(e) => e.stopPropagation()}
                                        style=${{ color: note.color ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', cursor: 'grab', padding: '8px' }}
                                    >
                                        <${Lucide.Menu} size=${20} />
                                    </div>
                                </div>
                            </div>
                        `)}
                    </div>
                `}
            </div>

            <button 
                onClick=${onAdd}
                style=${{
                    position: 'absolute',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    background: 'var(--accent)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
            >
                <${Lucide.Plus} size=${32} />
            </button>
        </${React.Fragment}>
    `;
};