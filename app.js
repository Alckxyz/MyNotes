import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom';
import * as htmlToImage from 'html-to-image';
import htm from 'htm';
import * as Lucide from 'lucide-react';

// New Modular Imports
import { NoteType, AUDIO_CLICK, AUDIO_DELETE, playSound, decryptNote } from './constants.js';
import { ListView } from './components/ListView.js';
import { TypePicker } from './components/TypePicker.js';
import { NoteEditor } from './components/NoteEditor.js';
import { UnlockModal } from './components/UnlockModal.js';
import { 
    auth, 
    loginGoogle, 
    logout, 
    subscribeToNotes, 
    createFirebaseNote, 
    updateFirebaseNote, 
    deleteFirebaseNote 
} from './firebase.js';

const html = htm.bind(React.createElement);
// removed const AUDIO_DELETE = new Audio('delete.mp3');
// removed const playSound = (audio) => { ... };
// removed const NoteType = { ... };

const App = () => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [notes, setNotes] = useState([]);
    const [localNotes, setLocalNotes] = useState([]);
    const [history, setHistory] = useState([]);
    const [view, setView] = useState('list'); // list, create-picker, edit
    const [editingNote, setEditingNote] = useState(null);
    const [unlockingNote, setUnlockingNote] = useState(null);
    const [sessionPin, setSessionPin] = useState(null);
    const autoLockTimer = useRef(null);
    const exportRef = useRef(null);

    // Auth monitor
    useEffect(() => {
        return auth.onAuthStateChanged((u) => {
            setUser(u);
            setAuthLoading(false);
        });
    }, []);

    // Load local notes on mount
    useEffect(() => {
        const saved = localStorage.getItem('local_notes_pro');
        if (saved) {
            try {
                setLocalNotes(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading local notes", e);
            }
        }
    }, []);

    // Save local notes when they change
    useEffect(() => {
        if (!user) {
            localStorage.setItem('local_notes_pro', JSON.stringify(localNotes));
        }
    }, [localNotes, user]);

    // Notes subscription
    useEffect(() => {
        if (!user) {
            setNotes([]);
            return;
        }
        return subscribeToNotes(user.uid, (fetchedNotes) => {
            setNotes(fetchedNotes);
        });
    }, [user]);

    const currentNotes = user ? notes : localNotes;

    const pushHistory = () => {
        setHistory(prev => [JSON.parse(JSON.stringify(currentNotes)), ...prev].slice(0, 50));
    };

    const undo = () => {
        if (history.length === 0) return;
        const [lastState, ...rest] = history;
        if (user) {
            setNotes(lastState);
        } else {
            setLocalNotes(lastState);
        }
        setHistory(rest);
        playSound(AUDIO_CLICK);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (view === 'list' && (e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, currentNotes, view, user]);

    const startCreate = () => {
        playSound(AUDIO_CLICK);
        setView('create-picker');
    };

    const createNote = (type) => {
        playSound(AUDIO_CLICK);
        const newNote = {
            id: Date.now(), // Local temporary ID
            type,
            title: '',
            subtitle: '',
            content: [],
        };
        setEditingNote(newNote);
        setView('edit');
    };

    const saveNote = async (updatedNote) => {
        pushHistory();
        if (user) {
            try {
                if (updatedNote.id && typeof updatedNote.id === 'string' && updatedNote.id.length > 15) {
                    await updateFirebaseNote(user.uid, updatedNote.id, updatedNote);
                } else {
                    await createFirebaseNote(user.uid, updatedNote);
                }
            } catch (e) {
                console.error("Error saving to Firebase:", e);
                alert("Error al sincronizar con la nube.");
            }
        } else {
            // Local save
            setLocalNotes(prev => {
                const existingIndex = prev.findIndex(n => n.id === updatedNote.id);
                if (existingIndex > -1) {
                    const next = [...prev];
                    next[existingIndex] = updatedNote;
                    return next;
                }
                return [updatedNote, ...prev];
            });
        }
        setView('list');
        setEditingNote(null);
    };

    const deleteNote = async (id) => {
        pushHistory();
        playSound(AUDIO_DELETE);
        if (user) {
            try {
                await deleteFirebaseNote(user.uid, id);
            } catch (e) {
                console.error("Error deleting from Firebase:", e);
            }
        } else {
            setLocalNotes(prev => prev.filter(n => n.id !== id));
        }
    };

    const reorderNotes = (newNotes) => {
        if (user) {
            setNotes(newNotes);
        } else {
            setLocalNotes(newNotes);
        }
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

    if (authLoading) {
        return html`
            <div style=${{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
                <div style=${{ textAlign: 'center' }}>
                    <${Lucide.Loader2} className="animate-spin" size=${48} style=${{ marginBottom: '16px', color: 'var(--accent)' }} />
                    <p>Cargando...</p>
                </div>
            </div>
        `;
    }

    return html`
        <div style=${{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            ${view === 'list' && html`
                <${ListView} 
                    notes=${currentNotes} 
                    user=${user}
                    onLogin=${async () => {
                        try {
                            await loginGoogle();
                        } catch (e) {
                            console.error(e);
                            if (e.code === 'auth/unauthorized-domain') {
                                alert("Error: Dominio no autorizado. Debes agregar 'websim.ai' (o el dominio actual) a la lista de 'Dominios autorizados' en tu Consola de Firebase > Authentication > Settings.");
                            } else {
                                alert("Error al iniciar sesión: " + e.message);
                            }
                        }
                    }}
                    onLogout=${logout}
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