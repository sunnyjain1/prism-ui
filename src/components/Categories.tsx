import React, { useState, useEffect } from 'react';
import { categoryService } from '../lib/services/context';
import type { Category } from '../lib/core/models';
import { Plus, Trash2, Tag } from 'lucide-react';

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'income' | 'expense'>('expense');
    const [newColor, setNewColor] = useState('#6366f1');

    const loadCategories = async () => {
        try {
            const data = await categoryService.getCategories();
            setCategories(data);
        } catch (e) {
            console.error('Failed to load categories', e);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        try {
            await categoryService.createCategory({
                name: newName,
                type: newType,
                color: newColor
            } as any);
            setNewName('');
            setIsAdding(false);
            loadCategories();
        } catch (e) {
            console.error('Failed to create category', e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await categoryService.deleteCategory(id);
            loadCategories();
        } catch (e) {
            console.error('Failed to delete category', e);
        }
    };

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <div className="categories">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Categories</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Organize your transactions with custom categories.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                    <Plus size={18} />
                    Add Category
                </button>
            </header>

            {isAdding && (
                <div className="card" style={{ marginBottom: '32px', maxWidth: '500px' }}>
                    <h3 style={{ marginBottom: '16px' }}>New Category</h3>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Category Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Groceries"
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'inherit',
                                    fontFamily: 'inherit'
                                }}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Type</label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as any)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'inherit',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Color</label>
                                <input
                                    type="color"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    style={{
                                        width: '48px',
                                        height: '42px',
                                        padding: '2px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="submit" className="btn btn-primary">Create Category</button>
                            <button type="button" className="btn" onClick={() => setIsAdding(false)} style={{ border: '1px solid var(--border)' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <section>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--expense)' }}></span>
                        Expense Categories
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {expenseCategories.map(cat => (
                            <div key={cat.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cat.color + '20', color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Tag size={16} />
                                </div>
                                <span style={{ fontWeight: '500' }}>{cat.name}</span>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--income)' }}></span>
                        Income Categories
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {incomeCategories.map(cat => (
                            <div key={cat.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cat.color + '20', color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Tag size={16} />
                                </div>
                                <span style={{ fontWeight: '500' }}>{cat.name}</span>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Categories;
