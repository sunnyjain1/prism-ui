import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
    month: number;
    year: number;
    onChange: (month: number, year: number) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ month, year, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentDate = new Date(year, month - 1);

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const toggleOpen = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthSelect = (mIndex: number) => {
        onChange(mIndex + 1, year);
    };

    const handleYearChange = (delta: number) => {
        onChange(month, year + delta);
    };

    return (
        <div className="date-picker-container" ref={containerRef} style={{ position: 'relative' }}>
            <button
                onClick={toggleOpen}
                className="card"
                style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 2px var(--primary-light)' : 'var(--shadow-sm)',
                    minWidth: '170px'
                }}
            >
                <div style={{ color: 'var(--primary)', display: 'flex' }}>
                    <CalendarIcon size={18} />
                </div>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {format(currentDate, 'MMMM yyyy')}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            zIndex: 100,
                            width: '280px',
                            background: 'var(--bg-card)',
                            borderRadius: '20px',
                            border: '1px solid var(--border-soft)',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '20px',
                            marginTop: '8px'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <button
                                onClick={() => handleYearChange(-1)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-main)' }}>{year}</span>
                            <button
                                onClick={() => handleYearChange(1)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {months.map((m, idx) => (
                                <button
                                    key={m}
                                    onClick={() => handleMonthSelect(idx)}
                                    style={{
                                        padding: '10px 0',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: (idx + 1 === month) ? 'var(--primary)' : 'transparent',
                                        color: (idx + 1 === month) ? 'white' : 'var(--text-main)',
                                        fontWeight: (idx + 1 === month) ? '700' : '500',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (idx + 1 !== month) {
                                            e.currentTarget.style.background = 'var(--border-soft)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (idx + 1 !== month) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DatePicker;
