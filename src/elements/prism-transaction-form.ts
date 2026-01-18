import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { transactionService, accountService } from '../lib/services/context';
import type { Account } from '../lib/core/models';

import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';

@customElement('prism-transaction-form')
export class PrismTransactionForm extends LitElement {
  @state() private input = '';
  @state() private amount = '';

  @state() private date = new Date().toISOString().split('T')[0];
  @state() private selectedAccountId = '';
  @state() private accounts: Account[] = [];

  async connectedCallback() {
    super.connectedCallback();
    try {
      this.accounts = await accountService.getAccounts();
      if (this.accounts.length > 0) {
        this.selectedAccountId = this.accounts[0].id;
      }
    } catch (e) {
      console.warn('Could not load accounts', e);
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.input || !this.amount) return;

    try {
      await transactionService.addTransaction({
        amount: parseFloat(this.amount),
        type: 'expense',

        description: this.input,
        date: new Date(this.date).toISOString(),
        account_id: this.selectedAccountId || undefined,
        merchant: undefined // Optional in interface
      });

      this.input = '';
      this.amount = '';
      this.dispatchEvent(new CustomEvent('transaction-added', { bubbles: true, composed: true }));
      this.requestUpdate();
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  }

  render() {
    return html`
      <form @submit=${this.handleSubmit}>
        <div class="row">
          <md-outlined-text-field
            label="Description"
            .value=${this.input}
            @input=${(e: any) => this.input = e.target.value}
          ></md-outlined-text-field>
          
          <md-outlined-text-field
            label="Amount"
            type="number"
            step="0.01"
            prefix-text="$"
            .value=${this.amount}
            @input=${(e: any) => this.amount = e.target.value}
          ></md-outlined-text-field>
        </div>

        <div class="row">
             <md-outlined-text-field
                label="Date"
                type="date"
                .value=${this.date}
                @input=${(e: any) => this.date = e.target.value}
            ></md-outlined-text-field>

            <md-outlined-select
                label="Account"
                .value=${this.selectedAccountId}
                @change=${(e: any) => this.selectedAccountId = e.target.value}
            >
                ${this.accounts.map(a => html`<md-select-option value="${a.id}">${a.name}</md-select-option>`)}
            </md-outlined-select>
        </div>

        <div class="actions">
          <md-filled-button type="submit">Add Transaction</md-filled-button>
        </div>
      </form>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      background: var(--md-sys-color-surface);
      border-radius: 16px;
      margin-bottom: 1rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .row {
      display: flex;
      gap: 1rem;
    }
    md-outlined-text-field, md-outlined-select {
      flex: 1;
    }
    md-outlined-select {
        min-width: 200px;
    }
  `;
}
