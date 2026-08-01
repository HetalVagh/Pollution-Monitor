import React, { useState, useMemo } from 'react';

export default function ViolationsPanel({ violations, onResolve }) {
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [sortBy, setSortBy]   = useState('newest');
  const [locFilter, setLocFilter] = useState('all');

  const filtered = useMemo(() => {
    let data = [...violations];
    if (filter   !== 'all') data = data.filter(v => v.severity === filter || v.status === filter);
    if (locFilter !== 'all') data = data.filter(v => v.location === locFilter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(v =>
        v.unitName?.toLowerCase().includes(s) ||
        v.pollutant?.toLowerCase().includes(s) ||
        v.location?.toLowerCase().includes(s) ||
        v.description?.toLowerCase().includes(s)
      );
    }
    if (sortBy === 'newest')   data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (sortBy === 'oldest')   data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (sortBy === 'severity') data.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
    return data;
  }, [violations, filter, search, sortBy, locFilter]);

  const counts = useMemo(() => ({
    all:      violations.length,
    critical: violations.filter(v => v.severity === 'critical').length,
    warning:  violations.filter(v => v.severity === 'warning').length,
    active:   violations.filter(v => v.status === 'active').length,
    resolved: violations.filter(v => v.status === 'resolved').length
  }), [violations]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Summary Cards */}
      <div className="grid-4">
        {[
          { label:'Total Violations', val:counts.all,      cls:'c-accent' },
          { label:'Critical',          val:counts.critical, cls:'c-critical' },
          { label:'Warnings',          val:counts.warning,  cls:'c-warning' },
          { label:'Active',            val:counts.active,   cls:'c-critical' }
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
          placeholder="🔍 Search violations…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>
        <select className="filter-select" value={locFilter} onChange={e => setLocFilter(e.target.value)}>
          <option value="all">All Locations</option>
          <option value="Vapi">Vapi</option>
          <option value="Ankleshwar">Ankleshwar</option>
          <option value="Vatva">Vatva</option>
        </select>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="severity">By Severity</option>
        </select>
      </div>

      {/* Count */}
      <div style={{ fontSize:13, color:'#94a3b8' }}>
        Showing <strong style={{ color:'#e2e8f0' }}>{filtered.length}</strong> violations
      </div>

      {/* Violations List */}
      <div className="scroll-list" style={{ maxHeight:'none' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <p>No violations match your filters</p>
          </div>
        ) : filtered.map(v => (
          <div key={v.id} className={`list-item ${v.status === 'resolved' ? 'resolved' : ''}`}>
            <div className="list-item-header">
              <div>
                <div className="list-item-title">
                  🏭 {v.unitName}
                  <span style={{ marginLeft:8, fontSize:11, color:'#8b5cf6' }}>• {v.type}</span>
                </div>
                <div className="list-item-meta">
                  📍 {v.location} &nbsp;|&nbsp; 🧪 Pollutant: <strong style={{ color:'#e2e8f0' }}>{v.pollutant}</strong>
                  &nbsp;|&nbsp; 📋 {v.regulatoryRef}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                <span className={`badge badge-${v.severity}`}>{v.severity}</span>
                <span className={`badge ${v.status === 'resolved' ? 'badge-normal' : 'badge-critical'}`}>{v.status}</span>
              </div>
            </div>

            {/* Measurement vs threshold */}
            <div style={{ display:'flex', gap:20, padding:'8px 0', borderTop:'1px solid #334155', borderBottom:'1px solid #334155', margin:'8px 0' }}>
              <div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>MEASURED</div>
                <div style={{ fontSize:18, fontWeight:800, color: v.severity==='critical'?'#ef4444':'#f59e0b' }}>
                  {v.measuredValue} <span style={{ fontSize:12 }}>{v.unit}</span>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', fontSize:20, color:'#94a3b8' }}>→</div>
              <div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>THRESHOLD</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#10b981' }}>
                  {v.threshold} <span style={{ fontSize:12 }}>{v.unit}</span>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', fontSize:20, color:'#94a3b8' }}>|</div>
              <div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>EXCESS</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#ef4444' }}>
                  +{((v.measuredValue / v.threshold - 1) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="list-item-desc">{v.description}</div>
            <div className="list-item-action">⚡ Required Action: {v.actionRequired}</div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
              <div style={{ fontSize:11, color:'#94a3b8' }}>
                🕐 {new Date(v.timestamp).toLocaleString()}
                {v.resolvedAt && ` → Resolved: ${new Date(v.resolvedAt).toLocaleString()}`}
              </div>
              {v.status === 'active' && (
                <button className="btn btn-resolve" onClick={() => onResolve(v.id)}>
                  ✓ Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
