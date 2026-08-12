import React from 'react';
export default function StatusBadge({ children = '' }) { return <span className={`badge ${String(children).toLowerCase().replaceAll('_', '-').replaceAll(' ', '-')}`}>{String(children).replaceAll('_', ' ')}</span>; }
