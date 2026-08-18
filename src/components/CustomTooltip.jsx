// src/components/CustomTooltip.jsx
export default function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#18181b',
        padding: '10px',
        border: '1px solid #27272a',
        borderRadius: '8px',
      }}>
        <p style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#fafafa', fontWeight: 'bold' }}>
          {`₨ ${payload[0].value.toLocaleString()}`}
        </p>
      </div>
    );
  }
  return null;
}
