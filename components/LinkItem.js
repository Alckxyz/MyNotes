import React, { useState, useRef } from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const LinkItem = ({ item, updateItem, removeItem, settings, isPreview = false, onMove, isFirst, isLast, onGrab }) => {
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);
    const [orientation, setOrientation] = useState('square');

    const longPressTimer = useRef(null);
    const isLongPressActive = useRef(false);
    const urlInputRef = useRef(null);
    const { textSize, imageSize } = settings;

    React.useEffect(() => {
        if (isEditingUrl && urlInputRef.current) {
            urlInputRef.current.focus();
            urlInputRef.current.select();
            // Robust selection for various mobile browsers
            urlInputRef.current.setSelectionRange(0, 9999);
        }
    }, [isEditingUrl]);

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        const ratio = naturalWidth / naturalHeight;
        if (ratio > 1.2) {
            setOrientation('landscape');
        } else if (ratio < 0.8) {
            setOrientation('portrait');
        } else {
            setOrientation('square');
        }
    };

    const handleUrlClick = (e) => {
        if (isPreview || isEditingUrl) return;
        e.stopPropagation();

        // If it was a long press, the pointer up/click shouldn't trigger copy
        if (isLongPressActive.current) {
            isLongPressActive.current = false;
            return;
        }
        
        if (!item.linkUrl) {
            // Empty state: single click to edit
            setIsEditingUrl(true);
        } else {
            // Existing URL: single click to copy
            navigator.clipboard.writeText(item.linkUrl);
            setShowCopyFeedback(true);
            setTimeout(() => setShowCopyFeedback(false), 800);
        }
    };

    const handlePointerDown = () => {
        if (isPreview || isEditingUrl || !item.linkUrl) return;
        isLongPressActive.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPressActive.current = true;
            setIsEditingUrl(true);
        }, 600); // 600ms long press threshold
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return html`
        <div style=${{ 
            background: isPreview ? 'transparent' : '#1a1a1a', 
            padding: '12px', 
            borderRadius: '16px', 
            position: 'relative',
            border: isPreview ? '1px dashed #444' : '1px solid #2a2a2a',
            marginBottom: '8px',
            overflow: orientation === 'landscape' ? 'visible' : 'hidden',
            '--image-size': `${imageSize}px`
        }}>
            <div className="link-item-content-row" style=${{ 
                display: 'flex', 
                gap: orientation === 'landscape' ? '32px' : '16px', 
                alignItems: 'center'
            }}>
                <div className=${`mobile-img-container ${orientation}`} style=${{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px', 
                    flexShrink: 0,
                    width: orientation === 'landscape' ? 'auto' : `${imageSize}px`,
                    transition: 'all 0.3s ease'
                }}>
                    <div 
                        className=${orientation === 'landscape' ? 'landscape-container' : ''}
                        onClick=${() => !isPreview && setIsEditingImage(!isEditingImage)}
                        style=${{ 
                            background: (orientation === 'portrait' || orientation === 'landscape') ? 'transparent' : '#2a2a2a', 
                            borderRadius: '10px', 
                            overflow: 'hidden', 
                            cursor: isPreview ? 'default' : 'pointer',
                            border: isEditingImage ? '2px solid var(--accent)' : '1px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            width: '100%'
                        }}
                    >
                        ${item.imageUrl ? html`
                            <img 
                                src=${item.imageUrl} 
                                onLoad=${handleImageLoad}
                                className=${orientation === 'landscape' ? 'landscape' : (orientation === 'portrait' ? 'img-vertical' : 'img-square')}
                                style=${orientation === 'landscape' ? {
                                    height: `${imageSize}px`,
                                    width: 'auto',
                                    maxWidth: 'none',
                                    objectFit: 'cover',
                                    display: 'block',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    transition: 'all 0.3s ease'
                                } : (orientation === 'portrait' ? {
                                    width: '100%',
                                    height: 'auto',
                                    objectFit: 'cover',
                                    display: 'block',
                                    transition: 'all 0.3s ease'
                                } : {
                                    width: '100%',
                                    height: 'auto',
                                    objectFit: 'cover',
                                    display: 'block',
                                    transition: 'all 0.3s ease'
                                })} 
                            />
                        ` : html`
                            <div style=${{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                                <${Lucide.Image} size=${Math.max(16, imageSize / 4)} />
                            </div>
                        `}
                    </div>
                    ${!isPreview && isEditingImage && html`
                        <input 
                            autoFocus
                            placeholder="URL de imagen..." 
                            value=${item.imageUrl}
                            onChange=${(e) => updateItem(item.id, 'imageUrl', e.target.value)}
                            style=${{ fontSize: '9px', background: '#000', padding: '4px', borderRadius: '4px', width: '100%', marginTop: '4px' }}
                        />
                    `}
                </div>
                
                <div style=${{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px', 
                    overflow: 'hidden',
                    marginLeft: orientation === 'landscape' ? '4px' : '0'
                }}>
                    <input 
                        readOnly=${isPreview}
                        placeholder="Site Name" 
                        value=${item.siteName}
                        onChange=${(e) => updateItem(item.id, 'siteName', e.target.value)}
                        style=${{ 
                            fontSize: `${textSize}px`, 
                            fontWeight: '600', 
                            background: 'transparent', 
                            padding: '0',
                            color: 'var(--text-primary)'
                        }}
                    />

                    <div 
                        onClick=${handleUrlClick}
                        onPointerDown=${handlePointerDown}
                        onPointerUp=${handlePointerUp}
                        onPointerLeave=${handlePointerUp}
                        style=${{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            position: 'relative',
                            cursor: isEditingUrl ? 'text' : 'pointer',
                            userSelect: 'none',
                            touchAction: 'none' // Prevent scrolling or default context menu while trying to long press
                        }}
                    >
                        <div style=${{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                            <${showCopyFeedback ? Lucide.Check : Lucide.Globe} 
                                size=${10} 
                                color=${showCopyFeedback ? 'var(--success)' : 'var(--accent)'} 
                                style=${{ flexShrink: 0, transition: 'color 0.2s' }} 
                            />
                            <input 
                                ref=${urlInputRef}
                                readOnly=${!isEditingUrl}
                                autoFocus=${isEditingUrl}
                                onBlur=${() => setIsEditingUrl(false)}
                                onKeyDown=${(e) => e.key === 'Enter' && setIsEditingUrl(false)}
                                placeholder="Link (URL)" 
                                value=${item.linkUrl}
                                onChange=${(e) => updateItem(item.id, 'linkUrl', e.target.value)}
                                style=${{ 
                                    fontSize: `${Math.max(10, textSize - 5)}px`, 
                                    color: showCopyFeedback ? 'var(--success)' : 'var(--accent)',
                                    background: 'transparent',
                                    padding: '0',
                                    textOverflow: 'ellipsis',
                                    transition: 'color 0.2s',
                                    pointerEvents: isEditingUrl ? 'auto' : 'none'
                                }}
                            />
                        </div>

                        ${showCopyFeedback && html`
                            <div style=${{
                                position: 'absolute',
                                left: '20px',
                                top: '-20px',
                                background: 'var(--success)',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                animation: 'fadeInOut 0.8s ease forwards',
                                pointerEvents: 'none',
                                zIndex: 10
                            }}>
                                Copied!
                            </div>
                        `}
                    </div>

                    <style>${`
                        @keyframes fadeInOut {
                            0% { opacity: 0; transform: translateY(5px); }
                            20% { opacity: 1; transform: translateY(0); }
                            80% { opacity: 1; transform: translateY(0); }
                            100% { opacity: 0; transform: translateY(-5px); }
                        }
                    `}</style>

                    <input 
                        readOnly=${isPreview}
                        placeholder="Short description..." 
                        value=${item.description || item.text}
                        onChange=${(e) => updateItem(item.id, 'description', e.target.value)}
                        style=${{ 
                            fontSize: `${Math.max(10, textSize - 4)}px`, 
                            background: 'transparent', 
                            padding: '0',
                            color: 'var(--text-secondary)',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                        }}
                    />
                </div>
            </div>
            
            ${!isPreview && html`
                <div style=${{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    <button 
                        onClick=${() => removeItem(item.id)}
                        style=${{ color: 'var(--danger)', opacity: 0.4 }}
                    >
                        <${Lucide.Trash2} size=${14} />
                    </button>
                    
                    <div style=${{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '4px', 
                        background: '#222', 
                        borderRadius: '8px', 
                        padding: '6px 4px',
                        cursor: 'grab',
                        alignItems: 'center',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
                    }}>
                        <button 
                            disabled=${isFirst}
                            onClick=${(e) => { e.stopPropagation(); onMove('up'); }}
                            style=${{ color: isFirst ? '#333' : 'var(--text-secondary)', opacity: isFirst ? 0.3 : 1, padding: '2px' }}
                        >
                            <${Lucide.ChevronUp} size=${14} />
                        </button>
                        
                        <div 
                            title="Arrastrar para mover" 
                            onPointerDown=${onGrab}
                            style=${{ color: 'var(--accent)', display: 'flex', justifyContent: 'center', margin: '2px 0' }}
                        >
                            <${Lucide.Menu} size=${18} />
                        </div>

                        <button 
                            disabled=${isLast}
                            onClick=${(e) => { e.stopPropagation(); onMove('down'); }}
                            style=${{ color: isLast ? '#333' : 'var(--text-secondary)', opacity: isLast ? 0.3 : 1, padding: '2px' }}
                        >
                            <${Lucide.ChevronDown} size=${14} />
                        </button>
                    </div>
                </div>
            `}
        </div>
    `;
};