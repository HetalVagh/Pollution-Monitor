import React, { useState } from 'react';

export default function AIInsights({ insights }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? insights : insights.filter(i => i.severity === filter || i.type === filter);

  const typeConfig = {
    TREND_ALERT:       { icon:'📈', color:'#f59e0b', label:'Trend Alert' },
    PATTERN_ANOMALY:   { icon:'🔍', color:'#8b5cf6', label:'Pattern Anomaly' },
    CORRELATION_ALERT: { icon:'🔗', color:'#ef4444', label:'Correlation Alert' },
    PREDICTION:        { icon:'🎯', color:'#3b82f6', label:'AI Prediction' }
  };

  const typeCounts = {};
  insights.forEach(i => { typeCounts[i.type] = (typeCounts[i.type]||0)+1; });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header */}
      <div className="card" style={{ background:'linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)', border:'1px solid #4c1d95' }}>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ fontSize:40 }}>🤖</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#a78bfa' }}>Agentic AI Monitoring Engine</div>
            <div style={{ fontSize:12, color:'#7c3aed', marginTop:2 }}>
              Continuous trend analysis • Pattern anomaly detection • Multi-unit correlation • Predictive alerts
            </div>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ fontSize:28, fontWeight:800, color:'#a78bfa' }}>{insights.length}</div>
            <div style={{ fontSize:11, color:'#7c3aed' }}>AI Insights Generated</div>
          </div>
        </div>
      </div>

      {/* Type Summary */}
      <div className="grid-4">
        {Object.entries(typeConfig).map(([type, cfg]) => (
          <div key={type} className="card" style={{ borderColor: typeCounts[type] ? cfg.color : '#334155', cursor:'pointer' }} onClick={() => setFilter(filter===type?'all':type)}>
            <div style={{ fontSize:24, marginBottom:4 }}>{cfg.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:cfg.color }}>{typeCounts[type]||0}</div>
            <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.4px' }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Insights</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="TREND_ALERT">Trend Alerts</option>
          <option value="PATTERN_ANOMALY">Pattern Anomalies</option>
          <option value="CORRELATION_ALERT">Correlations</option>
        </select>
        <span style={{ fontSize:13, color:'#94a3b8' }}>Showing {filtered.length} insights</span>
      </div>

      {/* Insights */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🤖</div>
          <p>No AI insights available yet. Monitoring in progress…</p>
        </div>
      ) : filtered.map(insight => {
        const cfg = typeConfig[insight.type] || { icon:'💡', color:'#3b82f6', label:insight.type };
        return (
          <div key={insight.id} className={`insight-card severity-${insight.severity}`}>
            <div className="insight-header">
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:20 }}>{cfg.icon}</span>
                <div>
                  <div className="insight-type" style={{ color: cfg.color }}>{cfg.label}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{insight.unitName} — {insight.location}</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <span className={`badge badge-${insight.severity}`}>{insight.severity}</span>
                <div className="insight-confidence">🎯 {insight.confidence}% confidence</div>
              </div>
            </div>
            <div className="insight-message">{insight.message}</div>
            <div className="insight-meta">
              <span>🕐 {new Date(insight.timestamp).toLocaleString()}</span>
              &nbsp;|&nbsp;
              <span style={{ color:cfg.color }}>⚙️ {insight.type.replace(/_/g,' ')}</span>
            </div>
          </div>
        );
      })}

      {/* AI Explanation */}
      <div className="card" style={{ borderColor:'#4c1d95' }}>
        <div className="card-title" style={{ color:'#a78bfa' }}>🧠 How the AI Engine Works</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { icon:'📈', title:'Trend Analysis', desc:'Monitors consecutive sensor readings to detect consistent upward trends in pollutant levels, predicting threshold breaches 30+ minutes in advance.' },
            { icon:'🔍', title:'Pattern Anomaly', desc:'Identifies unusual discharge patterns by comparing current readings against historical baselines using statistical deviation analysis.' },
            { icon:'🔗', title:'Cross-Unit Correlation', desc:'Analyzes simultaneous violations across multiple industrial units to detect systemic events or regional pollution incidents.' },
            { icon:'⚡', title:'Automated Response', desc:'Triggers multi-channel alerts (SMS, Email, Siren, App) to GPCB regulators, community officers, and industry compliance teams in real-time.' }
          ].map(item => (
            <div key={item.title} style={{ display:'flex', gap:12 }}>
              <div style={{ fontSize:24, flexShrink:0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#c4b5fd', marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
