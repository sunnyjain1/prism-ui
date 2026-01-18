import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

@customElement('prism-month-selector')
export class PrismMonthSelector extends LitElement {
    @property({ type: Number }) month = new Date().getMonth() + 1;
    @property({ type: Number }) year = new Date().getFullYear();

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--md-sys-color-surface-container-high);
            padding: 4px 12px;
            border-radius: 100px;
        }
        .label {
            font-weight: 500;
            min-width: 140px;
            text-align: center;
        }
    `;

    render() {
        const date = new Date(this.year, this.month - 1);
        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        return html`
            <md-icon-button @click=${this._prev}>
                <md-icon>chevron_left</md-icon>
            </md-icon-button>
            <div class="label">${label}</div>
            <md-icon-button @click=${this._next}>
                <md-icon>chevron_right</md-icon>
            </md-icon-button>
        `;
    }

    private _prev() {
        if (this.month === 1) {
            this.month = 12;
            this.year--;
        } else {
            this.month--;
        }
        this._notify();
    }

    private _next() {
        if (this.month === 12) {
            this.month = 1;
            this.year++;
        } else {
            this.month++;
        }
        this._notify();
    }

    private _notify() {
        this.dispatchEvent(new CustomEvent('change', {
            detail: { month: this.month, year: this.year },
            bubbles: true,
            composed: true
        }));
    }
}
