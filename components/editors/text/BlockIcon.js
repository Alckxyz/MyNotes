import React from 'react';
import * as Lucide from 'lucide-react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const BlockIcon = ({ type }) => {
    switch (type) {
        case 'subtitle': return html`<${Lucide.Heading3} size=${16} />`;
        case 'bullet': return html`<${Lucide.List} size=${16} />`;
        case 'number': return html`<${Lucide.ListOrdered} size=${16} />`;
        case 'letter': return html`<${Lucide.CaseSensitive} size=${16} />`;
        case 'todo': return html`<${Lucide.CheckSquare} size=${16} />`;
        case 'copyable': return html`<${Lucide.ClipboardCopy} size=${16} />`;
        default: return html`<${Lucide.Type} size=${16} />`;
    }
};