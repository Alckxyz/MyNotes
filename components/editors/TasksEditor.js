import React, { useState, useRef } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';


const html = htm.bind(React.createElement);

const TASK_TAG_COLORS = [
    { name: 'Urgente', value: '#ef4444' }, // Red
    { name: 'Medio', value: '#f59e0b' },   // Orange/Yellow
    { name: 'Normal', value: '#10b981' },   // Green
    { name: 'Opcional', value: '#3b82f6' }  // Blue
];

export const TasksEditor = ({ content, onUpdateContent }) => {
    const [dragActiveId, setDragActiveId] = useState(null);
    const [activeColorPicker, setActiveColorPicker] = useState(null);
    const [removingIds, setRemovingIds] = useState(new Set());
    const tasks = Array.isArray(content) ? content : [];

    const addTask = (afterId = null) => {
        const newTask = {
            id: Date.now(),
            text: '',
            checked: false,
            color: '#10b981' // Default Normal/Green
        };
        
        if (afterId) {
            const index = tasks.findIndex(t => t.id === afterId);
            const newTasks = [...tasks];
            newTasks.splice(index + 1, 0, newTask);
            onUpdateContent(newTasks);
        } else {
            onUpdateContent([...tasks, newTask]);
        }
        
        // Focus the new input in next tick
        setTimeout(() => {
            const el = document.getElementById(`task-input-${newTask.id}`);
            if (el) el.focus();
        }, 0);
    };

    const updateTask = (id, field, value) => {
        onUpdateContent(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const removeTask = (id) => {
        onUpdateContent(tasks.filter(t => t.id !== id));
    };

    const handleCheck = (id) => {
        setRemovingIds(prev => new Set(prev).add(id));
        
        // Wait for animation
        setTimeout(() => {
            onUpdateContent(tasks.filter(t => t.id !== id));
            setRemovingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 400);
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedIndex = tasks.findIndex(t => String(t.id) === draggedId);
        
        if (draggedIndex === -1 || draggedIndex === targetIndex) return;
        
        const newTasks = [...tasks];
        const [draggedTask] = newTasks.splice(draggedIndex, 1);
        newTasks.splice(targetIndex, 0, draggedTask);
        onUpdateContent(newTasks);
    };

    return html`
        <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            ${tasks.map((task, index) => {
                const isRemoving = removingIds.has(task.id);
                return html`
                <div 
                    key=${task.id}
                    draggable=${dragActiveId === task.id}
                    onDragStart=${(e) => {
                        e.dataTransfer.setData('text/plain', String(task.id));
                        e.currentTarget.style.opacity = '0.4';
                    }}
                    onDragEnd=${(e) => {
                        e.currentTarget.style.opacity = '1';
                        setDragActiveId(null);
                    }}
                    onDragOver=${(e) => e.preventDefault()}
                    onDrop=${(e) => handleDrop(e, index)}
                    style=${{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        background: '#1e1e1e', 
                        padding: '12px', 
                        borderRadius: '12px',
                        border: '1px solid #333',
                        opacity: isRemoving ? 0 : 1,
                        transform: isRemoving ? 'translateX(20px)' : 'none',
                        maxHeight: isRemoving ? '0' : '500px',
                        margin: isRemoving ? '0' : '0 0 4px 0',
                        overflow: isRemoving ? 'hidden' : 'visible',
                        transition: 'all 0.4s ease, z-index 0s',
                        position: 'relative',
                        zIndex: activeColorPicker === task.id ? 50 : 1
                    }}
                >
                    <button 
                        onClick=${() => handleCheck(task.id)}
                        style=${{ color: 'var(--text-secondary)', flexShrink: 0 }}
                    >
                        <${Lucide.Circle} size=${22} />
                    </button>

                    <input 
                        id=${`task-input-${task.id}`}
                        placeholder="Task..."
                        value=${task.text}
                        onChange=${(e) => updateTask(task.id, 'text', e.target.value)}
                        onKeyDown=${(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addTask(task.id);
                            }
                        }}
                        style=${{ 
                            flex: 1, 
                            fontSize: '16px',
                            color: 'var(--text-primary)'
                        }}
                    />

                    <div style=${{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <button 
                            onClick=${() => setActiveColorPicker(activeColorPicker === task.id ? null : task.id)}
                            style=${{ 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '9px', 
                                background: task.color || '#10b981',
                                border: '2px solid rgba(255,255,255,0.2)',
                                flexShrink: 0
                            }}
                        />
                        
                        ${activeColorPicker === task.id && html`
                            <div style=${{
                                position: 'absolute',
                                right: '0',
                                top: '30px',
                                background: '#2a2a2a',
                                padding: '8px',
                                borderRadius: '8px',
                                display: 'flex',
                                gap: '8px',
                                zIndex: 100,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                border: '1px solid #555'
                            }}>
                                ${TASK_TAG_COLORS.map(c => html`
                                    <button 
                                        key=${c.value}
                                        onClick=${() => {
                                            updateTask(task.id, 'color', c.value);
                                            setActiveColorPicker(null);
                                        }}
                                        style=${{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '12px',
                                            background: c.value,
                                            border: task.color === c.value ? '2px solid white' : 'none'
                                        }}
                                    />
                                `)}
                            </div>
                        `}
                    </div>

                    <div 
                        onPointerDown=${() => setDragActiveId(task.id)}
                        style=${{ cursor: 'grab', color: 'var(--text-secondary)', padding: '4px', flexShrink: 0 }}
                    >
                        <${Lucide.Menu} size=${20} />
                    </div>
                </div>
            `})}

            <button 
                onClick=${() => addTask()}
                style=${{ 
                    padding: '16px', 
                    border: '2px dashed #333', 
                    borderRadius: '12px', 
                    color: 'var(--text-secondary)',
                    marginTop: '8px'
                }}
            >
                + Add Task
            </button>
        </div>
    `;
};