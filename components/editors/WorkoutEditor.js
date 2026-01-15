import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { playSound, AUDIO_CLICK, AUDIO_DELETE } from '../../constants.js';

const html = htm.bind(React.createElement);

export const WorkoutEditor = ({ content, onUpdateContent }) => {
    const [dragActiveId, setDragActiveId] = useState(null);
    const routines = Array.isArray(content) ? content : [];

    const addRoutine = () => {
        playSound(AUDIO_CLICK);
        const routineLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const nextLetter = routineLetters[routines.length] || `Extra ${routines.length + 1}`;
        const newRoutine = {
            id: Date.now(),
            name: `Routine ${nextLetter}`,
            exercises: []
        };
        onUpdateContent([...routines, newRoutine]);
    };

    const updateRoutine = (id, field, value) => {
        onUpdateContent(routines.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const removeRoutine = (id) => {
        playSound(AUDIO_DELETE);
        onUpdateContent(routines.filter(r => r.id !== id));
    };

    const addExercise = (routineId) => {
        playSound(AUDIO_CLICK);
        onUpdateContent(routines.map(r => {
            if (r.id === routineId) {
                return {
                    ...r,
                    exercises: [...r.exercises, { id: Date.now(), name: '', sets: '', reps: '', weight: '', completed: false, setStates: [] }]
                };
            }
            return r;
        }));
    };

    const updateExercise = (routineId, exerciseId, field, value) => {
        onUpdateContent(routines.map(r => {
            if (r.id === routineId) {
                return {
                    ...r,
                    exercises: r.exercises.map(ex => {
                        if (ex.id === exerciseId) {
                            let updatedEx = { ...ex, [field]: value };
                            if (field === 'sets') {
                                const numSets = parseInt(value) || 0;
                                const currentStates = ex.setStates || [];
                                if (numSets > currentStates.length) {
                                    updatedEx.setStates = [...currentStates, ...Array(numSets - currentStates.length).fill(false)];
                                } else {
                                    updatedEx.setStates = currentStates.slice(0, numSets);
                                }
                            }
                            return updatedEx;
                        }
                        return ex;
                    })
                };
            }
            return r;
        }));
    };

    const toggleSet = (routineId, exerciseId, setIndex) => {
        playSound(AUDIO_CLICK);
        onUpdateContent(routines.map(r => {
            if (r.id === routineId) {
                return {
                    ...r,
                    exercises: r.exercises.map(ex => {
                        if (ex.id === exerciseId) {
                            const newSetStates = [...(ex.setStates || [])];
                            newSetStates[setIndex] = !newSetStates[setIndex];
                            return { ...ex, setStates: newSetStates };
                        }
                        return ex;
                    })
                };
            }
            return r;
        }));
    };

    const toggleExercise = (routineId, exerciseId) => {
        playSound(AUDIO_CLICK);
        onUpdateContent(routines.map(r => {
            if (r.id === routineId) {
                return {
                    ...r,
                    exercises: r.exercises.map(ex => 
                        ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
                    )
                };
            }
            return r;
        }));
    };

    const removeExercise = (routineId, exerciseId) => {
        playSound(AUDIO_DELETE);
        onUpdateContent(routines.map(r => {
            if (r.id === routineId) {
                return {
                    ...r,
                    exercises: r.exercises.filter(ex => ex.id !== exerciseId)
                };
            }
            return r;
        }));
    };

    const handleExerciseDrop = (e, targetRoutineId, targetExerciseIndex) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const { sourceRoutineId, sourceExerciseId } = data;

            const newRoutines = [...routines];
            const sourceRoutine = newRoutines.find(r => r.id === sourceRoutineId);
            if (!sourceRoutine) return;
            
            const exerciseIndex = sourceRoutine.exercises.findIndex(ex => ex.id === sourceExerciseId);
            if (exerciseIndex === -1) return;
            
            const [draggedExercise] = sourceRoutine.exercises.splice(exerciseIndex, 1);

            const targetRoutine = newRoutines.find(r => r.id === targetRoutineId);
            if (targetExerciseIndex === null) {
                targetRoutine.exercises.push(draggedExercise);
            } else {
                targetRoutine.exercises.splice(targetExerciseIndex, 0, draggedExercise);
            }

            onUpdateContent(newRoutines);
            playSound(AUDIO_CLICK);
        } catch (err) {
            console.error("Drop failed", err);
        }
    };

    return html`
        <div style=${{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            ${routines.map(routine => html`
                <div 
                    key=${routine.id} 
                    onDragOver=${(e) => e.preventDefault()}
                    onDrop=${(e) => handleExerciseDrop(e, routine.id, null)}
                    style=${{ background: '#1a1a1a', borderRadius: '16px', padding: '16px', border: '1px solid #333' }}
                >
                    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <input 
                            value=${routine.name}
                            onChange=${(e) => updateRoutine(routine.id, 'name', e.target.value)}
                            style=${{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b', width: 'auto' }}
                        />
                        <button onClick=${() => removeRoutine(routine.id)} style=${{ color: 'var(--danger)', opacity: 0.5 }}>
                            <${Lucide.Trash2} size=${18} />
                        </button>
                    </div>

                    <div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        ${routine.exercises.map((ex, index) => html`
                            <div 
                                key=${ex.id} 
                                draggable=${dragActiveId === ex.id}
                                onDragStart=${(e) => {
                                    e.dataTransfer.setData('text/plain', JSON.stringify({ sourceRoutineId: routine.id, sourceExerciseId: ex.id }));
                                    e.currentTarget.style.opacity = '0.4';
                                }}
                                onDragEnd=${(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    setDragActiveId(null);
                                }}
                                onDragOver=${(e) => e.preventDefault()}
                                onDrop=${(e) => {
                                    e.stopPropagation();
                                    handleExerciseDrop(e, routine.id, index);
                                    setDragActiveId(null);
                                }}
                                style=${{ 
                                    background: '#252525', 
                                    borderRadius: '12px', 
                                    padding: '12px',
                                    opacity: ex.completed ? 0.6 : 1,
                                    transition: 'opacity 0.2s',
                                    cursor: 'default',
                                    border: '1px solid #333'
                                }}
                            >
                                <div style=${{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                    <button 
                                        onClick=${() => toggleExercise(routine.id, ex.id)}
                                        style=${{ color: ex.completed ? 'var(--success)' : 'var(--text-secondary)' }}
                                    >
                                        <${ex.completed ? Lucide.CheckCircle2 : Lucide.Circle} size=${20} />
                                    </button>
                                    <input 
                                        placeholder="Exercise name..."
                                        value=${ex.name}
                                        onChange=${(e) => updateExercise(routine.id, ex.id, 'name', e.target.value)}
                                        style=${{ 
                                            flex: 1, 
                                            fontWeight: '600',
                                            textDecoration: ex.completed ? 'line-through' : 'none'
                                        }}
                                    />
                                    <div style=${{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <button onClick=${() => removeExercise(routine.id, ex.id)} style=${{ color: 'var(--danger)', opacity: 0.3, padding: '4px' }}>
                                            <${Lucide.X} size=${14} />
                                        </button>
                                        <div 
                                            onPointerDown=${() => setDragActiveId(ex.id)}
                                            style=${{ cursor: 'grab', color: 'var(--text-secondary)', padding: '4px' }}
                                        >
                                            <${Lucide.Menu} size=${18} />
                                        </div>
                                    </div>
                                </div>
                                <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: (ex.setStates && ex.setStates.length > 0) ? '12px' : '0' }}>
                                    <div style=${{ background: '#333', padding: '8px', borderRadius: '8px' }}>
                                        <div style=${{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Sets</div>
                                        <input 
                                            placeholder="0"
                                            value=${ex.sets}
                                            onChange=${(e) => updateExercise(routine.id, ex.id, 'sets', e.target.value)}
                                            style=${{ textAlign: 'center' }}
                                        />
                                    </div>
                                    <div style=${{ background: '#333', padding: '8px', borderRadius: '8px' }}>
                                        <div style=${{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Reps</div>
                                        <input 
                                            placeholder="0"
                                            value=${ex.reps}
                                            onChange=${(e) => updateExercise(routine.id, ex.id, 'reps', e.target.value)}
                                            style=${{ textAlign: 'center' }}
                                        />
                                    </div>
                                    <div style=${{ background: '#333', padding: '8px', borderRadius: '8px' }}>
                                        <div style=${{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Weight (kg)</div>
                                        <input 
                                            placeholder="0"
                                            value=${ex.weight}
                                            onChange=${(e) => updateExercise(routine.id, ex.id, 'weight', e.target.value)}
                                            style=${{ textAlign: 'center' }}
                                        />
                                    </div>
                                </div>

                                ${ex.setStates && ex.setStates.length > 0 && html`
                                    <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                                        ${ex.setStates.map((checked, idx) => html`
                                            <button 
                                                key=${idx}
                                                onClick=${() => toggleSet(routine.id, ex.id, idx)}
                                                style=${{ 
                                                    width: '24px', 
                                                    height: '24px', 
                                                    borderRadius: '12px', 
                                                    background: checked ? 'var(--success)' : '#444',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    color: checked ? 'white' : 'var(--text-secondary)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                ${idx + 1}
                                            </button>
                                        `)}
                                    </div>
                                `}
                            </div>
                        `)}
                        
                        <button 
                            onClick=${() => addExercise(routine.id)}
                            style=${{ padding: '12px', borderRadius: '12px', border: '1px dashed #444', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}
                        >
                            + Add Exercise
                        </button>
                    </div>
                </div>
            `)}

            <button 
                onClick=${addRoutine}
                style=${{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    background: '#252525', 
                    color: '#f59e0b', 
                    border: '1px solid #333',
                    fontWeight: 'bold',
                    display: 'flex',
                    gap: '8px'
                }}
            >
                <${Lucide.Plus} size=${20} /> New Routine
            </button>
        </div>
    `;
};