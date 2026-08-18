// src/components/AddShopkeeperModal.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { X, UserPlus, Phone, User } from 'lucide-react';

export default function AddShopkeeperModal({ onClose }) {
  const [form, setForm]       = useState({ name: '', phone: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim()))
      e.phone = 'Enter a valid phone number';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    try {
      await addDoc(collection(db, 'shopkeepers'), {
        name:       form.name.trim(),
        phone:      form.phone.trim(),
        totalSales: 0,
        totalPaid:  0,
        createdAt:  serverTimestamp(),
      });
      onClose();
    } catch (err) {
      console.error('Error adding shopkeeper:', err);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon"><UserPlus size={20} /></div>
            <div>
              <h2 className="modal-title">Add Shopkeeper</h2>
              <p className="modal-subtitle">Register a new customer to the ledger</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body" style={{ gap: '14px' }}>

          {/* Name */}
          <div className="modal-field">
            <label className="modal-label">Full Name / Shop Name <span className="req">*</span></label>
            <div className={`modal-input-wrap ${errors.name ? 'has-error' : ''}`}>
              <User size={16} className="input-icon" />
              <input
                className="modal-input"
                type="text"
                placeholder="e.g. Ali Poultry"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          {/* Phone */}
          <div className="modal-field">
            <label className="modal-label">Phone Number <span className="req">*</span></label>
            <div className={`modal-input-wrap ${errors.phone ? 'has-error' : ''}`}>
              <Phone size={16} className="input-icon" />
              <input
                className="modal-input"
                type="tel"
                placeholder="e.g. 0300-1234567"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          {errors.submit && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#ef4444',
              fontSize: '0.85rem',
            }}>
              {errors.submit}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="modal-submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span className="modal-spinner" />
            ) : (
              <UserPlus size={17} />
            )}
            {loading ? 'Saving...' : 'Add Shopkeeper'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
