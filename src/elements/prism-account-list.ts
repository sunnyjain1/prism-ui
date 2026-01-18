import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { accountService } from '../lib/services/context';
import type { Account } from '../lib/core/models';

import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';

@customElement('prism-account-list')
export class PrismAccountList extends LitElement {
  @state() private accounts: Account[] = [];
  @state() private newAccountName = '';
  @state() private newAccountType: Account['type'] = 'checking';

  async connectedCallback() {
    super.connectedCallback();
    await this.loadAccounts();
  }

  async loadAccounts() {
    try {
      this.accounts = await accountService.getAccounts();
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  }

  async handleCreateAccount(e: Event) {
    e.preventDefault();
    if (!this.newAccountName) return;

    try {
      await accountService.createAccount(this.newAccountName, this.newAccountType);
      this.newAccountName = '';
      await this.loadAccounts();
    } catch (e) {
      console.error('Failed to create account', e);
    }
  }

  render() {
    return html`
      <div class="account-section">
        <h3>Accounts</h3>
        
        <form @submit=${this.handleCreateAccount} class="add-account-form">
          <md-outlined-text-field
            label="Account Name"
            .value=${this.newAccountName}
            @input=${(e: any) => this.newAccountName = e.target.value}
          ></md-outlined-text-field>
          
          <md-outlined-select
            label="Type"
            .value=${this.newAccountType}
            @change=${(e: any) => this.newAccountType = e.target.value}
          >
            <md-select-option value="checking">Checking</md-select-option>
            <md-select-option value="savings">Savings</md-select-option>
            <md-select-option value="credit">Credit Card</md-select-option>
            <md-select-option value="investment">Investment</md-select-option>
            <md-select-option value="cash">Cash</md-select-option>
          </md-outlined-select>

          <md-filled-button type="submit">Add</md-filled-button>
        </form>

        <md-list>
          ${this.accounts.map(account => html`
            <md-list-item headline="${account.name}" supporting-text="${account.type.toUpperCase()}">
              <div slot="end">$${account.balance.toFixed(2)}</div>
            </md-list-item>
          `)}
        </md-list>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      margin-bottom: 2rem;
    }
    .account-section {
      background: var(--md-sys-color-surface-container);
      padding: 1rem;
      border-radius: 16px;
    }
    .add-account-form {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    md-outlined-text-field {
      flex: 2;
    }
    md-outlined-select {
      flex: 1;
    }
  `;
}
