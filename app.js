import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom';
import * as htmlToImage from 'html-to-image';
import htm from 'htm';

// New Modular Imports
import { NoteType, AUDIO_CLICK, AUDIO_DELETE, playSound, decryptNote } from './constants.js';
import { ListView } from './components/ListView.js';
import { TypePicker } from './components/TypePicker.js';
import { NoteEditor } from './components/NoteEditor.js';
import { UnlockModal } from './components/UnlockModal.js';

const html = htm.bind(React.createElement);

// removed const AUDIO_CLICK = new Audio('click.mp3');
// removed const AUDIO_DELETE = new Audio('delete.mp3');
// removed const playSound = (audio) => { ... };
// removed const NoteType = { ... };

const App = () => {
    const [notes, setNotes] = useState([]);
    const [history, setHistory] = useState([]);
    const [view, setView] = useState('list'); // list, create-picker, edit
    const [editingNote, setEditingNote] = useState(null);
    const [unlockingNote, setUnlockingNote] = useState(null);
    const [sessionPin, setSessionPin] = useState(null);
    const autoLockTimer = useRef(null);
    const exportRef = useRef(null);

    const pushHistory = () => {
        setHistory(prev => [JSON.parse(JSON.stringify(notes)), ...prev].slice(0, 50));
    };

    const undo = () => {
        if (history.length === 0) return;
        const [lastState, ...rest] = history;
        setNotes(lastState);
        setHistory(rest);
        playSound(AUDIO_CLICK);
    };

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle undo in list view here. 
            // Editor handles its own undo for internal changes.
            if (view === 'list' && (e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, notes, view]);

    const startCreate = () => {
        playSound(AUDIO_CLICK);
        setView('create-picker');
    };

    const createNote = (type) => {
        pushHistory();
        playSound(AUDIO_CLICK);
        const newNote = {
            id: Date.now(),
            type,
            title: '',
            subtitle: '',
            content: [],
            createdAt: new Date()
        };
        setEditingNote(newNote);
        setView('edit');
    };

    const saveNote = (updatedNote) => {
        // We push history here because we are modifying the global note list
        pushHistory();
        setNotes(prev => {
            const exists = prev.find(n => n.id === updatedNote.id);
            if (exists) {
                return prev.map(n => n.id === updatedNote.id ? updatedNote : n);
            }
            return [updatedNote, ...prev];
        });
        setView('list');
        setEditingNote(null);
    };

    const deleteNote = (id) => {
        pushHistory();
        playSound(AUDIO_DELETE);
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const reorderNotes = (newNotes) => {
        pushHistory();
        setNotes(newNotes);
    };

    const handleUnlock = async (pin) => {
        // If pin is AUTO_BIO, we use the sessionPin or ask for one if it's the first time
        const pinToUse = pin === 'AUTO_BIO' ? sessionPin : pin;
        
        if (!pinToUse) {
            alert("Por favor ingresa el PIN primero.");
            return;
        }

        try {
            const decryptedContent = await decryptNote(unlockingNote.encryptedContent, pinToUse);
            setSessionPin(pinToUse); // Cache for session
            const unlockedNote = { ...unlockingNote, content: decryptedContent };
            setEditingNote(unlockedNote);
            setUnlockingNote(null);
            setView('edit');
            startAutoLockTimer();
        } catch (e) {
            alert("PIN Incorrecto");
        }
    };

    const startAutoLockTimer = () => {
        if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
        autoLockTimer.current = setTimeout(() => {
            if (view === 'edit' && editingNote?.isLocked) {
                setView('list');
                setEditingNote(null);
                setSessionPin(null);
                alert("Nota bloqueada por inactividad");
            }
        }, 2 * 60 * 1000); // 2 minutes
    };

    const editNote = (note) => {
        playSound(AUDIO_CLICK);
        if (note.isLocked) {
            setUnlockingNote(note);
        } else {
            setEditingNote({ ...note });
            setView('edit');
        }
    };

    const exportAsImage = async (note) => {
        if (!exportRef.current) return;
        
        try {
            const dataUrl = await htmlToImage.toPng(exportRef.current, {
                backgroundColor: '#ffffff',
                style: {
                    position: 'static',
                    left: '0',
                    top: '0',
                    display: 'block'
                }
            });
            const link = document.createElement('a');
            link.download = `${note.title || 'nota'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Error exporting image', err);
        }
    };

    return html`
        <div style=${{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            ${view === 'list' && html`
                <${ListView} 
                    notes=${notes} 
                    onAdd=${startCreate} 
                    onEdit=${editNote} 
                    onDelete=${deleteNote}
                    onReorder=${reorderNotes}
                    onUndo=${undo}
                    hasHistory=${history.length > 0}
                />
            `}
            
            ${view === 'create-picker' && html`
                <${TypePicker} 
                    onSelect=${createNote} 
                    onCancel=${() => setView('list')} 
                />
            `}

            ${view === 'edit' && editingNote && html`
                <${NoteEditor} 
                    note=${editingNote} 
                    onSave=${saveNote} 
                    onCancel=${() => setView('list')}
                    onExport=${exportAsImage}
                    exportRef=${exportRef}
                />
            `}

            ${unlockingNote && html`
                <${UnlockModal} 
                    noteTitle=${unlockingNote.title}
                    onUnlock=${handleUnlock}
                    onCancel=${() => setUnlockingNote(null)}
                />
            `}
        </div>
    `;
};

// removed const ListView = ({ notes, onAdd, onEdit, onDelete }) => { ... };
// removed const TypePicker = ({ onSelect, onCancel }) => { ... };
// removed const TypeButton = ({ title, desc, icon, color, onClick }) => { ... };
// removed const NoteEditor = ({ note, onSave, onCancel, onExport, exportRef }) => { ... };

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(html`<${App} />`);