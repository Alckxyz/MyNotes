import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom';
import * as htmlToImage from 'html-to-image';
import htm from 'htm';
import * as Lucide from 'lucide-react';

// New Modular Imports
import { NoteType, decryptNote } from './constants.js';
import { ListView } from './components/ListView.js';
import { TypePicker } from './components/TypePicker.js';
import { NoteEditor } from './components/NoteEditor.js';
import { UnlockModal } from './components/UnlockModal.js';
import { LockSetupModal } from './components/LockSetupModal.js';
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
    const [history, setHistory] = useState([]);
    const [view, setView] = useState('list'); // list, create-picker, edit
    const [editingNote, setEditingNote] = useState(null);
    const [appUnlocked, setAppUnlocked] = useState(false);
    const [hasStoredPin, setHasStoredPin] = useState(!!localStorage.getItem('app_pin'));
    const exportRef = useRef(null);

    // Auth monitor
    useEffect(() => {
        return auth.onAuthStateChanged(async (u) => {
            setUser(u);
            if (!u) {
                setAppUnlocked(false);
            }
            setAuthLoading(false);
        });
    }, []);



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

    const currentNotes = notes;

    const pushHistory = () => {
        setHistory(prev => [JSON.parse(JSON.stringify(currentNotes)), ...prev].slice(0, 50));
    };

    const undo = () => {
        if (history.length === 0) return;
        const [lastState, ...rest] = history;
        setNotes(lastState);
        setHistory(rest);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (view === 'list' && (e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
        };
        const handlePinChangeRequest = () => handleChangePin();
        const handleManualLockRequest = () => setAppUnlocked(false);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('change-pin', handlePinChangeRequest);
        window.addEventListener('manual-lock', handleManualLockRequest);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('change-pin', handlePinChangeRequest);
            window.removeEventListener('manual-lock', handleManualLockRequest);
        };
    }, [history, currentNotes, view, user, editingNote]);

    const startCreate = () => {
        if (!user) return alert("Inicia sesión para crear notas.");
        setView('create-picker');
    };

    const createNote = (type) => {
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
        if (!user) return alert("Debes iniciar sesión para guardar.");
        
        pushHistory();
        setView('list');
        setEditingNote(null);

        try {
            if (updatedNote.id && typeof updatedNote.id === 'string' && updatedNote.id.length > 15) {
                await updateFirebaseNote(user.uid, updatedNote.id, updatedNote);
            } else {
                await createFirebaseNote(user.uid, updatedNote);
            }
        } catch (e) {
            console.error("Error saving to Firebase:", e);
        }
    };

    const deleteNote = async (id) => {
        if (!user) return;
        pushHistory();
        try {
            await deleteFirebaseNote(user.uid, id);
        } catch (e) {
            console.error("Error deleting from Firebase:", e);
        }
    };

    const reorderNotes = (newNotes) => {
        if (user) {
            setNotes(newNotes);
        }
    };

    const handleUnlock = (pin) => {
        const stored = localStorage.getItem('app_pin');
        if (pin === stored) {
            setAppUnlocked(true);
        } else {
            alert("PIN Incorrecto");
        }
    };

    const editNote = (note) => {
        setEditingNote(note);
        setView('edit');
    };

    const handleChangePin = () => {
        const newPin = prompt("Ingresa el nuevo PIN (4+ dígitos):");
        if (!newPin || newPin.length < 4) return alert("PIN no válido");
        localStorage.setItem('app_pin', newPin);
        setHasStoredPin(true);
        alert("PIN actualizado correctamente.");
    };

    const handleInitialPinSetup = (pin) => {
        localStorage.setItem('app_pin', pin);
        setHasStoredPin(true);
        setAppUnlocked(true);
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
                    <p>Cargando sesión...</p>
                </div>
            </div>
        `;
    }

    return html`
        <div style=${{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            ${!appUnlocked && user ? html`
                ${!hasStoredPin ? html`
                    <${LockSetupModal} 
                        onConfirm=${handleInitialPinSetup}
                        onCancel=${logout}
                    />
                ` : html`
                    <${UnlockModal} 
                        onUnlock=${handleUnlock}
                        onCancel=${logout}
                    />
                `}
            ` : html`
                ${view === 'list' && html`
                    <${ListView} 
                        notes=${user ? currentNotes : []} 
                        user=${user}
                        onLogin=${async () => {
                            try {
                                await loginGoogle();
                            } catch (e) {
                                console.error(e);
                                if (e.code === 'auth/unauthorized-domain') {
                                    alert("Error: Dominio no autorizado.");
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
                        key=${editingNote.id}
                    />
                `}
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