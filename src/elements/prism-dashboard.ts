import { LitElement, html, css, type PropertyValueMap } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { transactionService, categoryService } from '../lib/services/context';
import type { Transaction, Category } from '../lib/core/models';
import * as Plot from '@observablehq/plot';

import './prism-month-selector';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';

@customElement('prism-dashboard')
export class PrismDashboard extends LitElement {
  @state() private transactions: Transaction[] = [];
  @state() private categories: Category[] = [];
  @state() private summary = { income: 0, expense: 0, balance: 0 };
  @state() private month = new Date().getMonth() + 1;
  @state() private year = new Date().getFullYear();

  @state() private selectedCategoryId = '';
  @state() private chartType: 'income' | 'expense' = 'expense';

  @query('#chart-container') private chartContainer!: HTMLElement;

  async connectedCallback() {
    super.connectedCallback();
    await Promise.all([
      this.loadData(),
      this.loadCategories()
    ]);
    window.addEventListener('transaction-added', this.loadData);
  }

  private async loadCategories() {
    try {
      this.categories = await categoryService.getCategories();
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  }

  private loadData = async () => {
    try {
      this.transactions = await transactionService.getTransactionsByMonth(this.month, this.year);
      this.summary = await transactionService.getMonthSummary(this.month, this.year);
      this.renderChart();
    } catch (e) {
      console.error('Failed to load data', e);
    }
  }

  private _handleMonthChange(e: CustomEvent) {
    this.month = e.detail.month;
    this.year = e.detail.year;
    this.loadData();
  }

  updated(changedProperties: PropertyValueMap<any>) {
    if (changedProperties.has('transactions') ||
      changedProperties.has('chartType') ||
      changedProperties.has('selectedCategoryId')) {
      this.renderChart();
    }
  }

  private renderChart() {
    if (!this.chartContainer) return;

    // Filter transactions based on type and category
    let filtered = this.transactions.filter(t => t.type === this.chartType);
    if (this.selectedCategoryId) {
      filtered = filtered.filter(t => t.category?.id === this.selectedCategoryId);
    }

    if (filtered.length === 0) {
      this.chartContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.5;">No data for current filters</div>';
      return;
    }

    // Process data for daily aggregation
    const dataMap = new Map<string, number>();
    filtered.forEach(t => {
      const dateStr = t.date.split('T')[0];
      const current = dataMap.get(dateStr) || 0;
      dataMap.set(dateStr, current + t.amount);
    });

    const data = Array.from(dataMap.entries())
      .map(([date, amount]) => ({
        date: new Date(date),
        amount: amount
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const color = this.chartType === 'income' ? '#10b981' : '#ef4444';

    const chart = Plot.plot({
      style: {
        background: "transparent",
        color: "var(--md-sys-color-on-surface)"
      },
      height: 300,
      y: { grid: true, label: "Amount" },
      x: { label: "Date" },
      marks: [
        Plot.ruleY([0]),
        Plot.lineY(data, { x: "date", y: "amount", stroke: color, strokeWidth: 2.5, curve: "catmull-rom" }),
        Plot.dot(data, { x: "date", y: "amount", fill: color, r: 4, tip: true })
      ]
    });

    this.chartContainer.innerHTML = '';
    this.chartContainer.appendChild(chart);
  }

  render() {
    return html`
      <div class="header">
        <h1>Monthly Overview</h1>
        <prism-month-selector 
          .month=${this.month} 
          .year=${this.year}
          @change=${this._handleMonthChange}
        ></prism-month-selector>
      </div>

      <div class="summary-cards">
        <div class="card income">
          <div class="label">Income</div>
          <div class="amount">+$${this.summary.income.toFixed(2)}</div>
        </div>
        <div class="card expense">
          <div class="label">Expenses</div>
          <div class="amount">-$${this.summary.expense.toFixed(2)}</div>
        </div>
        <div class="card balance">
          <div class="label">Net Balance</div>
          <div class="amount">$${this.summary.balance.toFixed(2)}</div>
        </div>
      </div>

      <div class="grid">
        <div class="chart-section card-surface">
            <div class="header-with-actions">
              <h3>Trends</h3>
              <div class="filters">
                <div class="type-toggles">
                  <md-filter-chip 
                    label="Expense" 
                    ?selected=${this.chartType === 'expense'}
                    @click=${() => this.chartType = 'expense'}
                  ></md-filter-chip>
                  <md-filter-chip 
                    label="Income" 
                    ?selected=${this.chartType === 'income'}
                    @click=${() => this.chartType = 'income'}
                  ></md-filter-chip>
                </div>
                
                <md-outlined-select
                  class="category-select"
                  .value=${this.selectedCategoryId}
                  @change=${(e: any) => this.selectedCategoryId = e.target.value}
                >
                  <md-select-option value="">All Categories</md-select-option>
                  ${this.categories.map(c => html`
                    <md-select-option value="${c.id}">${c.name}</md-select-option>
                  `)}
                </md-outlined-select>
              </div>
            </div>
            <div id="chart-container"></div>
        </div>

        <div class="transactions-section card-surface">
          <h3>Recent Transactions</h3>
          <md-list>
            ${this.transactions.length === 0 ? html`<div style="padding: 16px; opacity: 0.5;">No transactions</div>` : ''}
            ${this.transactions.map(t => html`
              <md-list-item>
                <md-icon slot="start">${t.type === 'income' ? 'arrow_upward' : t.type === 'expense' ? 'arrow_downward' : 'swap_horiz'}</md-icon>
                <div slot="headline">${t.description}</div>
                <div slot="supporting-text">${new Date(t.date).toLocaleDateString()} • ${t.category?.name || 'General'}</div>
                <div slot="end" class="amount ${t.type}">
                  ${t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}$${t.amount.toFixed(2)}
                </div>
              </md-list-item>
            `)}
          </md-list>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 0 16px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header h1 {
        margin: 0;
        font-size: 24px;
        color: var(--md-sys-color-on-surface);
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      padding: 24px;
      border-radius: 24px;
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface-variant);
    }
    .card .amount {
      font-size: 24px;
      font-weight: bold;
      margin-top: 8px;
    }
    .card.income .amount { color: #10b981; }
    .card.expense .amount { color: #ef4444; }
    .card.balance {
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
    }

    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
    }
    .card-surface {
        background: var(--md-sys-color-surface-container-low);
        border-radius: 24px;
        padding: 20px;
        border: 1px solid var(--md-sys-color-outline-variant);
    }
    .card-surface h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
    }
    
    #chart-container {
      height: 300px;
    }

    .amount.expense { color: var(--md-sys-color-error); }
    .amount.income { color: #10b981; }
    .amount.transfer { color: #3b82f6; }

    .header-with-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-with-actions h3 {
      margin: 0;
    }
    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .type-toggles {
      display: flex;
      gap: 8px;
    }
    .category-select {
      min-width: 150px;
      --md-outlined-select-container-height: 32px;
    }
  `;
}

