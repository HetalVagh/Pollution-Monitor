import React, { useState, useMemo } from 'react';

export default function AlertsPanel({ alerts, onAcknowledge }) {
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [locFilter, setLocFilter] = useState('all');

  const filtered = useMemo(() => {
    let data = [...alerts];
    if (filter === 'pending')      data = data.filter(a => !a.acknowledged);
    if (filter === 'acknowledged') data = data.filter(a => a.acknowledged);
    if (filter === 'critical')     data = data.filter(a => a.severity === 'critical');
    if (filter === 'P1')           data = data.filter(a => a.priority === 'P1');
    if (locFilter !== 'all')       data = data.filter(a => a.location === locFilter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(a =>
        a.unitName?.toLowerCase().includes(s) ||
        a.pollutant?.toLowerCase().includes(s) ||
        a.message?.toLowerCase().includes(s)
      );
    }
    return data;
  }, [alerts, filter, search, locFilter]);

  const counts = useMemo(() => ({
    total:        alerts.length,
    pending:      alerts.filter(a => !a.acknowledged).length,
    acknowledged: alerts.filter(a => a.acknowledged).length,
    p1:           alerts.filter(a => a.priority === 'P1').length
  }), [alerts]);

  const channelIcon = { SMS:'📱', Email:'📧', App:'🔔', Siren:'🚨' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Stats */}
      <div className="grid-4">
        {[
          { label:'Total Alerts',      val:counts.total,        cls:'c-accent' },
          { label:'Pending',           val:counts.pending,      cls:'c-warning' },
          { label:'Acknowledged',      val:counts.acknowledged, cls:'c-normal' },
          { label:'P1 Priority',       val:counts.p1,           cls:'c-critical' }
        ].map(c => (
          <div key={c.label} className={`stat-card ${c.cls}`}>
            <div className="stat-card-val">{c.val}</div>
            <div className="stat-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔍 Search alerts…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Alerts</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="critical">Critical</option>
          <option value="P1">Priority P1</option>
        </select>
        <select className="filter-select" value={locFilter} onChange={e => setLocFilter(e.target.value)}>
          <option value="all">All Locations</option>
          <option value="Vapi">Vapi</option>
          <option value="Ankleshwar">Ankleshwar</option>
          <option value="Vatva">Vatva</option>
        </select>
        <button
          className="btn btn-ack"
          onClick={() => alerts.filter(a => !a.acknowledged).forEach(a => onAcknowledge(a.id))}
          style={{ whiteSpace:'nowrap' }}
        >
          ✓ Acknowledge All
        </button>
      </div>

      <div style={{ fontSize:13, color:'#94a3b8' }}>
        Showing <strong style={{ color:'#e2e8f0' }}>{filtered.length}</strong> alerts
      </div>

      {/* Alerts */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <p>No alerts match your filters</p>
        </div>
      ) : filtered.map(a => (
        <div key={a.id} className={`list-item`} style={{ borderLeft:`3px solid ${a.severity==='critical'?'#ef4444':'#f59e0b'}`, opacity: a.acknowledged ? 0.6 : 1 }}>
          <div className="list-item-header">
            <div>
              <div className="list-item-title">
                {a.severity === 'critical' ? '🚨' : '⚠️'} {a.unitName}
                <span style={{ marginLeft:8, fontSize:11, color:'#3b82f6' }}>Priority: {a.priority}</span>
              </div>
              <div className="list-item-meta">
                📍 {a.location} &nbsp;|&nbsp; 🧪 {a.pollutant}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
              <span className={`badge badge-${a.severity}`}>{a.severity}</span>
              <span className={`badge ${a.acknowledged ? 'badge-normal' : 'badge-warning'}`}>
                {a.acknowledged ? '✓ ACK' : 'PENDING'}
              </span>
            </div>
          </div>

          <div className="list-item-desc" style={{ marginBottom:10 }}>{a.message}</div>

          {/* Notification Channels */}
          <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'#94a3b8', marginRight:4 }}>Sent via:</span>
            {(a.channels || []).map(ch => (
              <span key={ch} style={{ background:'#1e3a5f', color:'#93c5fd', fontSize:11, padding:'2px 8px', borderRadius:12, border:'1px solid #1e40af' }}>
                {channelIcon[ch] || '📡'} {ch}
              </span>
            ))}
          </div>

          {/* Recipients */}
          <div style={{ background:'#0f172a', borderRadius:6, padding:'8px 12px', marginBottom:10 }}>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:4 }}>Recipients:</div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'.5px' }}>Regulatory</div>
                {(a.recipients?.regulatory || []).map(r => (
                  <div key={r} style={{ fontSize:11, color:'#6366f1' }}>{r}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'.5px' }}>Community</div>
                {(a.recipients?.community || []).map(r => (
                  <div key={r} style={{ fontSize:11, color:'#10b981' }}>{r}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:11, color:'#94a3b8' }}>
              🕐 {new Date(a.timestamp).toLocaleString()}
              {a.acknowledgedAt && ` → Acknowledged: ${new Date(a.acknowledgedAt).toLocaleString()}`}
            </div>
            {!a.acknowledged && (
              <button className="btn btn-ack" onClick={() => onAcknowledge(a.id)}>
                ✓ Acknowledge
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
