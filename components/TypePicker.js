import React from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { NoteType } from '../constants.js';

const html = htm.bind(React.createElement);

const TypeButton = ({ title, desc, icon, color, onClick }) => html`
    <button 
        onClick=${onClick}
        style=${{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            textAlign: 'left',
            gap: '20px',
            border: `1px solid transparent`,
            transition: 'border-color 0.2s'
        }}
    >
        <div style=${{ color }}>${icon}</div>
        <div>
            <div style=${{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>${title}</div>
            <div style=${{ fontSize: '14px', color: 'var(--text-secondary)' }}>${desc}</div>
        </div>
    </button>
`;

export const TypePicker = ({ onSelect, onCancel }) => {
    return html`
        <div className="scroll-container" style=${{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style=${{ marginBottom: '32px' }}>
                <button onClick=${onCancel} style=${{ color: 'var(--text-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <${Lucide.ChevronLeft} size=${24} /> Back
                </button>
                <h1 style=${{ fontSize: '28px' }}>What to create?</h1>
            </div>

            <div style=${{ display: 'grid', gap: '16px' }}>
                <${TypeButton} 
                    title="Text Note" 
                    desc="Thoughts, ideas, paragraphs" 
                    icon=${html`<${Lucide.Type} size=${32} />`}
                    color="#3b82f6"
                    onClick=${() => onSelect(NoteType.TEXT)} 
                />
                <${TypeButton} 
                    title="Reusable List" 
                    desc="Shopping, tasks, checklist" 
                    icon=${html`<${Lucide.CheckSquare} size=${32} />`}
                    color="#10b981"
                    onClick=${() => onSelect(NoteType.CHECKLIST)} 
                />
                <${TypeButton} 
                    title="Link Collection" 
                    desc="Websites with images" 
                    icon=${html`<${Lucide.Link} size=${32} />`}
                    color="#a855f7"
                    onClick=${() => onSelect(NoteType.LINKS)} 
                />
                <${TypeButton} 
                    title="Workout Routine" 
                    desc="Sets, reps, and weights" 
                    icon=${html`<${Lucide.Dumbbell} size=${32} />`}
                    color="#f59e0b"
                    onClick=${() => onSelect(NoteType.WORKOUT)} 
                />
                <${TypeButton} 
                    title="Tasks" 
                    desc="Urgency-coded daily tasks" 
                    icon=${html`<${Lucide.ListTodo} size=${32} />`}
                    color="#ef4444"
                    onClick=${() => onSelect(NoteType.TASKS)} 
                />
            </div>
        </div>
    `;
};