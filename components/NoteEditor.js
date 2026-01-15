import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { NoteType, AUDIO_CLICK, AUDIO_DELETE, playSound, DEFAULT_SETTINGS } from '../constants.js';
import { LinkSettings } from './LinkSettings.js';
import { NoteHeader } from './NoteHeader.js';
import { ColorPicker } from './ColorPicker.js';
import { LockSetupModal } from './LockSetupModal.js';
import { TextEditor } from './editors/TextEditor.js';
import { ChecklistEditor } from './editors/ChecklistEditor.js';
import { LinkEditor } from './editors/LinkEditor.js';
import { WorkoutEditor } from './editors/WorkoutEditor.js';
import { TasksEditor } from './editors/TasksEditor.js';

const html = htm.bind(React.createElement);

export const NoteEditor = ({ note, onSave, onCancel, onExport, exportRef }) => {
    // Ensure default settings exist
    const initialNote = {
        ...note,
        settings: note.settings || { ...DEFAULT_SETTINGS }
    };
    
    // Migration: ensure TEXT note content is an array for the new block editor
    const migratedNote = {
        ...initialNote,
        content: (initialNote.type === NoteType.TEXT && typeof initialNote.content === 'string') 
            ? (initialNote.content ? [{ id: Date.now(), type: 'text', text: initialNote.content }] : [])
            : initialNote.content
    };
    const [localNote, setLocalNote] = useState(migratedNote);
    const [history, setHistory] = useState([]);
    const [showHidden, setShowHidden] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isLocking, setIsLocking] = useState(false);

    const pushHistory = () => {
        setHistory(prev => [JSON.parse(JSON.stringify(localNote)), ...prev].slice(0, 50));
    };

    const undo = () => {
        if (history.length === 0) return;
        const [lastState, ...rest] = history;
        setLocalNote(lastState);
        setHistory(rest);
        playSound(AUDIO_CLICK);
    };

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, localNote]);

    const updateField = (field, value) => {
        // Only push history for title/subtitle if it's the first change in a while to avoid character-by-character undo
        // but for now let's keep it simple
        setLocalNote(prev => ({ ...prev, [field]: value }));
    };

    const updateSettings = (setting, value) => {
        pushHistory();
        setLocalNote(prev => ({
            ...prev,
            settings: { ...prev.settings, [setting]: value }
        }));
    };

    const handleCheckItem = (id) => {
        if (localNote.type === NoteType.CHECKLIST) {
            pushHistory();
            setLocalNote(prev => ({
                ...prev,
                content: prev.content.map(item => 
                    item.id === id ? { ...item, checked: !item.checked } : item
                )
            }));
        }
    };

    const restoreChecklist = () => {
        pushHistory();
        playSound(AUDIO_CLICK);
        setLocalNote(prev => ({
            ...prev,
            content: prev.content.map(item => ({ 
                ...item, 
                checked: false,
                quantity: item.originalQuantity || '',
                unit: item.originalUnit || ''
            }))
        }));
    };

    const addItem = () => {
        pushHistory();
        playSound(AUDIO_CLICK);
        const newItem = localNote.type === NoteType.CHECKLIST 
            ? { 
                id: Date.now(), 
                text: '', 
                checked: false, 
                quantity: '', 
                unit: '', 
                originalQuantity: '', 
                originalUnit: '',
                extraText: '',
                isTextMode: false
              }
            : { id: Date.now(), imageUrl: '', linkUrl: '', siteName: '', description: '' };
        
        setLocalNote(prev => ({
            ...prev,
            content: [...prev.content, newItem]
        }));
    };

    const updateItem = (id, field, value) => {
        // To avoid history bloat on typing, we don't push history for text/quantity updates here
        // usually structural changes (reorder, delete, add) are prioritized for "undo button"
        setLocalNote(prev => ({
            ...prev,
            content: prev.content.map(item => 
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const toggleLock = async () => {
        playSound(AUDIO_CLICK);
        if (localNote.isLocked) {
            // Unlocking while in editor just marks it as not locked for next save
            setLocalNote(prev => ({ ...prev, isLocked: false, encryptedContent: null }));
        } else {
            setIsLocking(true);
        }
    };

    const handleConfirmLock = async (pin) => {
        try {
            const { encryptNote } = await import('../constants.js');
            const encrypted = await encryptNote(localNote.content, pin);
            setLocalNote(prev => ({
                ...prev,
                isLocked: true,
                encryptedContent: encrypted,
                content: [], // Clear plain content
                lastPinUsed: pin // Temporary for this save session
            }));
            setIsLocking(false);
        } catch (e) {
            alert("Error al bloquear: " + e.message);
        }
    };

    const removeItem = (id) => {
        pushHistory();
        playSound(AUDIO_DELETE);
        setLocalNote(prev => ({
            ...prev,
            content: prev.content.filter(item => item.id !== id)
        }));
    };

    const handleExport = () => {
        setShowHidden(true);
        setTimeout(async () => {
            await onExport(localNote);
            setShowHidden(false);
        }, 100);
    };

    return html`
        <div style=${{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
            <${NoteHeader} 
                note=${localNote} 
                onSave=${() => onSave(localNote)} 
                onCancel=${onCancel} 
                onUndo=${undo}
                canUndo=${history.length > 0}
                onToggleLock=${toggleLock}
                onToggleColorPicker=${() => setShowColorPicker(!showColorPicker)}
                onToggleSettings=${() => setShowSettings(true)}
                onExport=${handleExport}
            />

            ${showSettings && html`
                <${LinkSettings} 
                    settings=${localNote.settings} 
                    updateSettings=${updateSettings} 
                    onClose=${() => setShowSettings(false)} 
                />
            `}

            ${isLocking && html`
                <${LockSetupModal} 
                    onConfirm=${handleConfirmLock} 
                    onCancel=${() => setIsLocking(false)} 
                />
            `}

            ${showColorPicker && html`
                <${ColorPicker} 
                    currentColor=${localNote.color} 
                    onSelect=${(color) => updateField('color', color)} 
                    onClose=${() => setShowColorPicker(false)} 
                />
            `}

            <div className="scroll-container" style=${{ opacity: localNote.isLocked ? 0.3 : 1, pointerEvents: localNote.isLocked ? 'none' : 'auto' }}>
                <input 
                    placeholder="Note Title" 
                    value=${localNote.title}
                    onChange=${(e) => updateField('title', e.target.value)}
                    style=${{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.5px' }}
                />
                <input 
                    placeholder="Subtitle" 
                    value=${localNote.subtitle}
                    onChange=${(e) => updateField('subtitle', e.target.value)}
                    style=${{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '24px' }}
                />

                ${localNote.type === NoteType.TEXT && html`
                    <${TextEditor} 
                        content=${localNote.content} 
                        onChange=${(val) => updateField('content', val)} 
                    />
                `}

                ${localNote.type === NoteType.CHECKLIST && html`
                    <${ChecklistEditor} 
                        content=${localNote.content}
                        onUpdateItem=${updateItem}
                        onRemoveItem=${removeItem}
                        onAddItem=${addItem}
                        onRestore=${restoreChecklist}
                        onReorder=${(newContent) => { pushHistory(); updateField('content', newContent); }}
                    />
                `}

                ${localNote.type === NoteType.LINKS && html`
                    <${LinkEditor} 
                        content=${localNote.content}
                        settings=${localNote.settings}
                        onUpdateItem=${updateItem}
                        onRemoveItem=${removeItem}
                        onAddItem=${addItem}
                        onUpdateContent=${(newContent) => { pushHistory(); updateField('content', newContent); }}
                    />
                `}

                ${localNote.type === NoteType.WORKOUT && html`
                    <${WorkoutEditor} 
                        content=${localNote.content}
                        onUpdateContent=${(newContent) => { pushHistory(); updateField('content', newContent); }}
                    />
                `}

                ${localNote.type === NoteType.TASKS && html`
                    <${TasksEditor} 
                        content=${localNote.content}
                        onUpdateContent=${(newContent) => { pushHistory(); updateField('content', newContent); }}
                    />
                `}
            </div>

            <div className="export-hidden" ref=${exportRef}>
                <div style=${{ display: 'flex', flexDirection: 'column' }}>
                    ${localNote.type === NoteType.CHECKLIST && localNote.content
                        .filter(item => !item.checked)
                        .map(item => html`
                        <div key=${item.id} className="item" style=${{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '4px',
                            marginBottom: '2px'
                        }}>
                           <span style=${{ 
                                fontWeight: '400', 
                                color: '#000000',
                                wordBreak: 'break-word',
                                lineHeight: '1.2'
                           }}>${item.text || ''}</span>
                           ${item.isTextMode && item.extraText ? html`
                             <span style=${{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', marginLeft: '6px' }}>${item.extraText}</span>
                           ` : (item.quantity && html`
                             <div style=${{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                marginLeft: '6px'
                             }}>
                                <span style=${{ fontSize: '18px', fontWeight: '400', color: '#000000' }}>${item.quantity}</span>
                                <span style=${{ fontSize: '18px', color: '#000000' }}>${item.unit}</span>
                             </div>
                           `)}
                        </div>
                    `)}
                    ${localNote.type === NoteType.TEXT && Array.isArray(localNote.content) && localNote.content.map((block, idx) => html`
                        <div key=${block.id} style=${{ marginBottom: '10px', color: '#000000' }}>
                            ${block.type === 'subtitle' && html`<h3 style=${{ fontSize: '18px', fontWeight: 'bold', color: '#000000' }}>${block.text}</h3>`}
                            ${block.type === 'text' && html`<p>${block.text}</p>`}
                            ${block.type === 'bullet' && html`• ${block.text}`}
                            ${block.type === 'number' && html`${idx + 1}. ${block.text}`}
                            ${block.type === 'letter' && html`${String.fromCharCode(97 + (idx % 26))}. ${block.text}`}
                            ${block.type === 'todo' && html`${block.checked ? '☑' : '☐'} ${block.text}`}
                        </div>
                    `)}
                    ${localNote.type === NoteType.WORKOUT && Array.isArray(localNote.content) && localNote.content.map(routine => html`
                        <div key=${routine.id} style=${{ marginBottom: '20px' }}>
                            <h3 style=${{ fontSize: '18px', fontWeight: 'bold', color: '#b45309' }}>${routine.name}</h3>
                            ${routine.exercises.map(ex => html`
                                <div key=${ex.id} style=${{ borderBottom: '1px solid #f0f0f0', padding: '8px 0' }}>
                                    <div style=${{ fontWeight: 'bold', color: '#000000' }}>${ex.name || 'Ejercicio'}</div>
                                    <div style=${{ fontSize: '14px', color: '#333333' }}>
                                        ${ex.sets} series x ${ex.reps} reps @ ${ex.weight}kg
                                    </div>
                                </div>
                            `)}
                        </div>
                    `)}
                </div>
            </div>
        </div>
    `;
};