// src/components/NewSaleModal.jsx
import { useState } from 'react';
import {
  X,
  Banknote,
  Scale,
  CheckCircle,
  AlertCircle,
  Plus,
  ChevronDown,
  Layers,
} from 'lucide-react';

export default function NewSaleModal({ onClose, onSave, batches, shopkeepers }) {
  const availableBatches = batches.filter(b => parseFloat(b.remaining) > 0);

  const [form, setForm] = useState({
    shopkeeper: '',
    batchId: '',
    weight: '',
    rate: '',
    paymentStatus: 'Paid',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const total =
    form.weight && form.rate
      ? parseFloat(form.weight) * parseFloat(form.rate)
      : 0;

  const selectedBatch = batches.find(b => b.id === form.batchId);
  const maxWeight = selectedBatch ? parseFloat(selectedBatch.remaining) : Infinity;

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.shopkeeper) e.shopkeeper = 'Select a shopkeeper';
    if (!form.batchId) e.batchId = 'Select a stock batch';
    if (!form.weight || isNaN(form.weight) || parseFloat(form.weight) <= 0)
      e.weight = 'Enter valid weight';
    else if (parseFloat(form.weight) > maxWeight)
      e.weight = `Max available: ${maxWeight} Mans`;
    if (!form.rate || isNaN(form.rate) || parseFloat(form.rate) <= 0)
      e.rate = 'Enter valid rate';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({ ...form, total });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon"><Banknote size={20} /></div>
            <div>
              <h2 className="modal-title">New Sale</h2>
              <p className="modal-subtitle">Record a chicken sale to shopkeeper</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body">

          {/* Row 1: Shopkeeper + Batch */}
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Shopkeeper <span className="req">*</span></label>
              <div className={`modal-input-wrap ${errors.shopkeeper ? 'has-error' : ''}`}>
                <input
                  className="modal-input"
                  type="text"
                  list="shopkeepers-datalist"
                  placeholder="Select or enter shopkeeper name"
                  value={form.shopkeeper}
                  onChange={e => handleChange('shopkeeper', e.target.value)}
                />
                <datalist id="shopkeepers-datalist">
                  {shopkeepers.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
              {errors.shopkeeper && <span className="field-error">{errors.shopkeeper}</span>}
            </div>

            <div className="modal-field">
              <label className="modal-label">Stock Batch <span className="req">*</span></label>
              <div className={`modal-select-wrap ${errors.batchId ? 'has-error' : ''}`}>
                <select
                  className="modal-select"
                  value={form.batchId}
                  onChange={e => handleChange('batchId', e.target.value)}
                >
                  <option value="">— Select Batch —</option>
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.supplier} ({b.remaining} Mans left)
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="select-arrow" />
              </div>
              {errors.batchId && <span className="field-error">{errors.batchId}</span>}
              {selectedBatch && (
                <div className="batch-info-pill">
                  <Layers size={12} />
                  {selectedBatch.remaining} Mans available from {selectedBatch.supplier}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Weight + Rate */}
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Weight (Mans) <span className="req">*</span></label>
              <div className={`modal-input-wrap ${errors.weight ? 'has-error' : ''}`}>
                <Scale size={16} className="input-icon" />
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 5"
                  value={form.weight}
                  onChange={e => handleChange('weight', e.target.value)}
                />
                <span className="input-suffix">Man</span>
              </div>
              {errors.weight && <span className="field-error">{errors.weight}</span>}
            </div>

            <div className="modal-field">
              <label className="modal-label">Rate / Man (₨) <span className="req">*</span></label>
              <div className={`modal-input-wrap ${errors.rate ? 'has-error' : ''}`}>
                <span className="input-prefix">₨</span>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 12000"
                  value={form.rate}
                  onChange={e => handleChange('rate', e.target.value)}
                />
              </div>
              {errors.rate && <span className="field-error">{errors.rate}</span>}
            </div>
          </div>

          {/* Total Banner */}
          <div className={`total-banner ${total > 0 ? 'total-active' : ''}`}>
            <span className="total-label">Total Amount</span>
            <span className="total-value">
              {total > 0 ? `₨ ${total.toLocaleString()}` : '—'}
            </span>
          </div>

          {/* Payment Status */}
          <div className="modal-field">
            <label className="modal-label">Payment Status</label>
            <div className="payment-toggle">
              <button
                className={`pay-btn ${form.paymentStatus === 'Paid' ? 'pay-active-paid' : ''}`}
                onClick={() => handleChange('paymentStatus', 'Paid')}
              >
                <CheckCircle size={16} /> Paid
              </button>
              <button
                className={`pay-btn ${form.paymentStatus === 'Pending' ? 'pay-active-pending' : ''}`}
                onClick={() => handleChange('paymentStatus', 'Pending')}
              >
                <AlertCircle size={16} /> Pending / Udhaar
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="modal-field">
            <label className="modal-label">Notes <span className="optional">(optional)</span></label>
            <textarea
              className="modal-textarea"
              placeholder="Any special instructions or remarks..."
              rows={2}
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-submit" onClick={handleSubmit}>
            <Plus size={18} /> Record Sale
          </button>
        </div>
      </div>
    </div>
  );
}
