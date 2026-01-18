import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';

@customElement('prism-navigation')
export class PrismNavigation extends LitElement {
    @property({ type: String }) active = 'dashboard';

    static styles = css`
        :host {
            display: block;
            width: 280px;
            background: var(--md-sys-color-surface-container);
            border-right: 1px solid var(--md-sys-color-outline-variant);
            height: 100vh;
            padding: 12px;
            box-sizing: border-box;
        }
        .logo {
            padding: 16px;
            font-size: 24px;
            font-weight: bold;
            color: var(--md-sys-color-primary);
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }
        md-list-item {
            border-radius: 100px;
            margin-bottom: 4px;
            --md-list-item-container-color: transparent;
        }
        md-list-item[active] {
            --md-list-item-container-color: var(--md-sys-color-secondary-container);
            --md-list-item-label-text-color: var(--md-sys-color-on-secondary-container);
        }
    `;

    render() {
        return html`
            <div class="logo">
                <md-icon>insights</md-icon>
                Prism
            </div>
            <md-list>
                <md-list-item 
                    ?active=${this.active === 'dashboard'} 
                    @click=${() => this._navigate('dashboard')}
                >
                    <md-icon slot="start">dashboard</md-icon>
                    Dashboard
                </md-list-item>
                <md-list-item 
                    ?active=${this.active === 'accounts'} 
                    @click=${() => this._navigate('accounts')}
                >
                    <md-icon slot="start">account_balance</md-icon>
                    Accounts
                </md-list-item>
                <md-list-item 
                    ?active=${this.active === 'categories'} 
                    @click=${() => this._navigate('categories')}
                >
                    <md-icon slot="start">category</md-icon>
                    Categories
                </md-list-item>
                <md-list-item 
                    ?active=${this.active === 'settings'} 
                    @click=${() => this._navigate('settings')}
                >
                    <md-icon slot="start">settings</md-icon>
                    Settings
                </md-list-item>
            </md-list>
        `;
    }

    private _navigate(page: string) {
        this.active = page;
        this.dispatchEvent(new CustomEvent('navigate', { detail: page, bubbles: true, composed: true }));
    }
}
