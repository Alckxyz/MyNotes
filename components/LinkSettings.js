import React from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';
import { LinkItem } from './LinkItem.js';

const html = htm.bind(React.createElement);

export const LinkSettings = ({ settings, updateSettings, onClose }) => {
    return html`
        <div style=${{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style=${{ background: '#1e1e1e', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style=${{ fontSize: '20px' }}>View Settings</h3>
                    <button onClick=${onClose}><${Lucide.X} size=${24} /></button>
                </div>

                <div style=${{ marginBottom: '20px' }}>
                    <div style=${{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '1px' }}>Preview</div>
                    <${LinkItem} 
                        isPreview=${true}
                        settings=${settings}
                        item=${{
                            id: 'preview',
                            siteName: 'Site Name',
                            linkUrl: 'www.example.com',
                            description: 'This is a preview of how the text and image will look with the current settings.'
                        }}
                    />
                </div>
                
                <div style=${{ marginBottom: '24px', background: '#252525', padding: '16px', borderRadius: '12px' }}>
                    <div style=${{ marginBottom: '16px' }}>
                        <label style=${{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            <span>Image Size</span>
                            <span>${settings.imageSize}px</span>
                        </label>
                        <input 
                            type="range" 
                            min="40" max="200" 
                            value=${settings.imageSize} 
                            onChange=${(e) => updateSettings('imageSize', parseInt(e.target.value))}
                            style=${{ width: '100%', accentColor: 'var(--accent)' }}
                        />
                    </div>

                    <div>
                        <label style=${{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            <span>Text Size</span>
                            <span>${settings.textSize}px</span>
                        </label>
                        <input 
                            type="range" 
                            min="12" max="28" 
                            value=${settings.textSize} 
                            onChange=${(e) => updateSettings('textSize', parseInt(e.target.value))}
                            style=${{ width: '100%', accentColor: 'var(--accent)' }}
                        />
                    </div>
                </div>

                <button 
                    onClick=${onClose}
                    style=${{ width: '100%', background: 'var(--accent)', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}
                >
                    Done
                </button>
            </div>
        </div>
    `;
};