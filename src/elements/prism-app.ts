import { LitElement, css, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

import './prism-dashboard';
import './prism-navigation';
import './prism-transaction-dialog';
import './prism-account-list';
import '@material/web/fab/fab.js';
import '@material/web/icon/icon.js';
import { PrismTransactionDialog } from './prism-transaction-dialog';

@customElement('prism-app')
export class PrismApp extends LitElement {
  @state() private activePage = 'dashboard';
  @query('prism-transaction-dialog') private dialog!: PrismTransactionDialog;

  render() {
    return html`
      <div class="app-layout">
        <prism-navigation 
            .active=${this.activePage}
            @navigate=${(e: CustomEvent) => this.activePage = e.detail}
        ></prism-navigation>
        
        <main>
            <div class="page-content">
                ${this.activePage === 'dashboard' ? html`<prism-dashboard></prism-dashboard>` : ''}
                ${this.activePage === 'accounts' ? html`
                    <div style="padding: 16px;">
                        <h1>Accounts</h1>
                        <prism-account-list></prism-account-list>
                    </div>
                ` : ''}
                ${this.activePage === 'categories' ? html`<div style="padding: 32px; opacity: 0.5;">Category Management coming soon...</div>` : ''}
                ${this.activePage === 'settings' ? html`<div style="padding: 32px; opacity: 0.5;">Settings coming soon...</div>` : ''}
            </div>
        </main>

        <md-fab 
            label="Add" 
            variant="primary"
            @click=${() => this.dialog.open()}
        >
            <md-icon slot="icon">add</md-icon>
        </md-fab>

        <prism-transaction-dialog></prism-transaction-dialog>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      background: var(--md-sys-color-surface);
    }
    .app-layout {
        display: flex;
        height: 100%;
    }
    main {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: var(--md-sys-color-surface);
    }
    .page-content {
        max-width: 1200px;
        margin: 0 auto;
    }
    md-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
    }
    h1 {
        margin: 0 0 24px 0;
        font-size: 24px;
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
    }
  `;
}


declare global {
  interface HTMLElementTagNameMap {
    'prism-app': PrismApp;
  }
}
