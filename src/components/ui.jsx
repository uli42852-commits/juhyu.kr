import React from 'react';
import { fmt } from '../lib/pay.js';

export function Card({ title, step, aside, children, id, className = '' }) {
  return (
    <section className={`card ${className}`} id={id}>
      {title && (
        <h2 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {step && <span className="step">{step}</span>}
            {title}
          </span>
          {aside && <small>{aside}</small>}
        </h2>
      )}
      {children}
    </section>
  );
}

export function Field({ label, aside, hint, children, htmlFor }) {
  return (
    <div className="field">
      {label && (
        <div className="field-label">
          <label htmlFor={htmlFor}>{label}</label>
          {aside}
        </div>
      )}
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/* 숫자 입력 — 쉼표를 붙여 보여주고 값은 숫자 문자열로 저장 */
export function MoneyInput({ id, value, onChange, placeholder, suffix = '원', decimal = false, small = false, ariaLabel }) {
  const display = value === '' || value === undefined || value === null
    ? ''
    : decimal ? String(value) : fmt(Number(String(value).replace(/,/g, '')) || 0);
  return (
    <div className="input-affix">
      <input
        id={id}
        className={`input num ${small ? 'sm' : ''}`}
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={display}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, '');
          const clean = decimal ? raw.replace(/(\..*)\./g, '$1') : raw.replace(/\./g, '');
          onChange(clean);
        }}
      />
      {suffix && <span className="affix">{suffix}</span>}
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />
    </div>
  );
}

export function Notice({ level = 'info', children }) {
  return <div className={`notice ${level}`} role={level === 'danger' ? 'alert' : undefined}>{children}</div>;
}

export function Basis({ basis, prefix = '근거' }) {
  if (!basis) return null;
  return (
    <span className="basis">
      {prefix}: {basis.url ? <a href={basis.url} target="_blank" rel="noopener noreferrer">{basis.label}</a> : basis.label}
      {basis.checkedAt && ` · 확인일 ${basis.checkedAt}`}
    </span>
  );
}

export function Won({ value, className = '' }) {
  return <span className={`num ${className}`}>{fmt(value)}<span className="unit">원</span></span>;
}

export function PrivacyNote() {
  return (
    <p className="privacy-note">
      <span aria-hidden>🔒</span>
      <span>입력한 정보는 서버로 보내지 않고 이 브라우저 안에서만 계산·저장돼요. 로그인도 필요 없어요.</span>
    </p>
  );
}

/* 광고 슬롯: 콘텐츠 사이에만 둔다. 슬롯 ID가 없으면 아무것도 그리지 않는다(빈 박스 노출 금지). */
export const AD_SLOTS = { content: '' };
export function AdSlot({ slot = 'content' }) {
  const id = AD_SLOTS[slot];
  React.useEffect(() => {
    if (!id) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* ignore */ }
  }, [id]);
  if (!id) return null;
  return (
    <div className="ad-slot" aria-label="광고">
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-7203340671121056" data-ad-slot={id} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
