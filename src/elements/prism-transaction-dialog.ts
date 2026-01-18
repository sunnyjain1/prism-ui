import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { transactionService, accountService, categoryService } from '../lib/services/context';
import type { Account, Category } from '../lib/core/models';

import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import { MdDialog } from '@material/web/dialog/dialog.js';

@customElement('prism-transaction-dialog')
export class PrismTransactionDialog extends LitElement {
    @state() private accounts: Account[] = [];
    @state() private categories: Category[] = [];
    @state() private type: 'income' | 'expense' | 'transfer' = 'expense';

    @query('md-dialog') private dialog!: MdDialog;

    static styles = css`
        md-dialog {
            --md-dialog-container-color: var(--md-sys-color-surface-container-high);
            width: 500px;
        }
        form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 8px 0;
        }
        .row {
            display: flex;
            gap: 16px;
        }
        .row > * {
            flex: 1;
        }
        md-tabs {
            margin-bottom: 8px;
            --md-primary-tab-active-indicator-color: var(--md-sys-color-primary);
        }
    `;

    async open() {
        this.accounts = await accountService.getAccounts();
        this.categories = await categoryService.getCategories();
        this.dialog.show();
    }

    private async _handleSubmit(e: Event) {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const amount = parseFloat(formData.get('amount') as string);
        const description = formData.get('description') as string;
        const date = formData.get('date') as string;
        const account_id = formData.get('account_id') as string;
        const category_id = formData.get('category_id') as string;
        const destination_account_id = formData.get('destination_account_id') as string;

        try {
            await transactionService.addTransaction({
                amount,
                type: this.type,
                description,
                date: new Date(date).toISOString(),
                account_id,
                category_id: this.type !== 'transfer' ? category_id : undefined,
                destination_account_id: this.type === 'transfer' ? destination_account_id : undefined,
            });
            this.dialog.close();
            this.dispatchEvent(new CustomEvent('transaction-added', { bubbles: true, composed: true }));
        } catch (err) {
            console.error('Failed to add transaction:', err);
        }
    }

    render() {
        return html`
            <md-dialog aria-label="Add Transaction">
                <div slot="headline">Add Transaction</div>
                <form slot="content" id="transaction-form" @submit=${this._handleSubmit}>
                    <md-tabs @change=${(e: any) => this.type = ['income', 'expense', 'transfer'][e.target.activeTabIndex] as any}>
                        <md-primary-tab ?active=${this.type === 'income'}>Income</md-primary-tab>
                        <md-primary-tab ?active=${this.type === 'expense'}>Expense</md-primary-tab>
                        <md-primary-tab ?active=${this.type === 'transfer'}>Transfer</md-primary-tab>
                    </md-tabs>

                    <div class="row">
                        <md-outlined-text-field
                            label="Amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            required
                            prefix-text="$"
                        ></md-outlined-text-field>
                        <md-outlined-text-field
                            label="Date"
                            name="date"
                            type="date"
                            value=${new Date().toISOString().split('T')[0]}
                            required
                        ></md-outlined-text-field>
                    </div>

                    <md-outlined-text-field
                        label="Description"
                        name="description"
                        required
                    ></md-outlined-text-field>

                    <md-outlined-select label="Source Account" name="account_id" required>
                        ${this.accounts.map(a => html`<md-select-option value=${a.id}>
                            <div slot="headline">${a.name}</div>
                        </md-select-option>`)}
                    </md-outlined-select>

                    ${this.type === 'transfer' ? html`
                        <md-outlined-select label="Destination Account" name="destination_account_id" required>
                            ${this.accounts.map(a => html`<md-select-option value=${a.id}>
                                <div slot="headline">${a.name}</div>
                            </md-select-option>`)}
                        </md-outlined-select>
                    ` : html`
                        <md-outlined-select label="Category" name="category_id" required>
                            ${this.categories.filter(c => c.type === this.type).map(c => html`
                                <md-select-option value=${c.id}>
                                    <div slot="headline">${c.name}</div>
                                </md-select-option>
                            `)}
                        </md-outlined-select>
                    `}
                </form>
                <div slot="actions">
                    <md-text-button @click=${() => this.dialog.close()}>Cancel</md-text-button>
                    <md-filled-button type="submit" form="transaction-form">Save</md-filled-button>
                </div>
            </md-dialog>
        `;
    }
}
