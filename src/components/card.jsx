// src/components/Card.jsx
export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}