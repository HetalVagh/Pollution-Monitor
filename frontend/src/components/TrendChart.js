import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';

const POLLUTANTS = {
  air:   ['SO2','NO2','PM25','PM10','CO','VOC','H2S','NH3'],
  water: ['COD','BOD','TSS','TDS','Lead','Mercury','Chromium']
};

const THRESHOLDS_DISPLAY = {
  SO2:     { warning:80,  critical:120, unit:'µg/m³' },
  NO2:     { warning:80,  critical:150, unit:'µg/m³' },
  PM25:    { warning:60,  critical:120, unit:'µg/m³' },
  PM10:    { warning:100, critical:200, unit:'µg/m³' },
  CO:      { warning:5,   critical:10,  unit:'mg/m³' },
  VOC:     { warning:500, critical:1000,unit:'µg/m³' },
  H2S:     { warning:14,  critical:28,  unit:'µg/m³' },
  NH3:     { warning:200, critical:400, unit:'µg/m³' },
  COD:     { warning:200, critical:400, unit:'mg/L' },
  BOD:     { warning:60,  critical:120, unit:'mg/L' },
  TSS:     { warning:200, critical:500, unit:'mg/L' },
  TDS:     { warning:1000,critical:2000,unit:'mg/L' },
  Lead:    { warning:0.05,critical:0.1, unit:'mg/L' },
  Mercury: { warning:0.01,critical:0.05,unit:'mg/L' },
  Chromium:{ warning:0.1, critical:0.5, unit:'mg/L' }
};

export default function TrendChart({ units, backendUrl }) {
  const [unitId,    setUnitId]    = useState(units[0]?.id || '');
  const [mediaType, setMediaType] = useState('air');
  const [pollutant, setPollutant] = useState('SO2');
  const [points,    setPoints]    = useState(20);
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (!unitId) return;
    setLoading(true);
    axios.get(`${backendUrl}/api/trend`, { params: { unitId, type: mediaType, pollutant, points } })
      .then(r => setData(r.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [unitId, mediaType, pollutant, points, backendUrl]);

  useEffect(() => {
    setPollutant(POLLUTANTS[mediaType][0]);
  }, [mediaType]);

  const threshold = THRESHOLDS_DISPLAY[pollutant];

  const chartData = data.map((d, i) => ({
    index:    i + 1,
    time:     new Date(d.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    value:    d.value,
    status:   d.status,
    warning:  threshold?.warning,
    critical: threshold?.critical
  }));

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const color = payload.status === 'critical' ? '#ef4444' : payload.status === 'warning' ? '#f59e0b' : '#10b981';
    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={color} stroke="none" />;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
      <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:8, padding:'8px 14px', fontSize:12 }}>
        <p style={{ color:'#94a3b8', marginBottom:4 }}>{p.payload.time}</p>
        <p style={{ color:'#e2e8f0', fontWeight:700 }}>{pollutant}: {p.payload.value} {threshold?.unit}</p>
        <p style={{ color: p.payload.status==='critical'?'#ef4444':p.payload.status==='warning'?'#f59e0b':'#10b981' }}>
          Status: {p.payload.status?.toUpperCase()}
        </p>
        {threshold && (
          <>
            <p style={{ color:'#f59e0b', fontSize:11 }}>⚠ Warning: {threshold.warning}</p>
            <p style={{ color:'#ef4444', fontSize:11 }}>🚨 Critical: {threshold.critical}</p>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Controls */}
      <div className="card">
        <div className="card-title">📈 Pollutant Trend Analysis</div>
        <div className="filter-bar">
          <select className="filter-select" value={unitId} onChange={e => setUnitId(e.target.value)}>
            {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.location})</option>)}
          </select>
          <select className="filter-select" value={mediaType} onChange={e => setMediaType(e.target.value)}>
            <option value="air">Air Emissions</option>
            <option value="water">Water Effluents</option>
          </select>
          <select className="filter-select" value={pollutant} onChange={e => setPollutant(e.target.value)}>
            {POLLUTANTS[mediaType].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="filter-select" value={points} onChange={e => setPoints(+e.target.value)}>
            <option value={10}>Last 10 readings</option>
            <option value={20}>Last 20 readings</option>
            <option value={50}>Last 50 readings</option>
          </select>
        </div>

        {threshold && (
          <div style={{ display:'flex', gap:20, marginBottom:12 }}>
            <div style={{ fontSize:12 }}>
              <span style={{ color:'#94a3b8' }}>Unit: </span>
              <strong>{threshold.unit}</strong>
            </div>
            <div style={{ fontSize:12 }}>
              <span style={{ color:'#f59e0b' }}>⚠ Warning threshold: </span>
              <strong>{threshold.warning} {threshold.unit}</strong>
            </div>
            <div style={{ fontSize:12 }}>
              <span style={{ color:'#ef4444' }}>🚨 Critical threshold: </span>
              <strong>{threshold.critical} {threshold.unit}</strong>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading trend data…</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top:10, right:20, bottom:10, left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill:'#94a3b8', fontSize:11 }} />
              <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} unit={` ${threshold?.unit || ''}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8' }} />
              {threshold && <ReferenceLine y={threshold.warning}  stroke="#f59e0b" strokeDasharray="6 3" label={{ value:`Warning (${threshold.warning})`, fill:'#f59e0b', fontSize:10, position:'right' }} />}
              {threshold && <ReferenceLine y={threshold.critical} stroke="#ef4444" strokeDasharray="6 3" label={{ value:`Critical (${threshold.critical})`, fill:'#ef4444', fontSize:10, position:'right' }} />}
              <Line
                type="monotone" dataKey="value" name={pollutant}
                stroke="#3b82f6" strokeWidth={2} dot={<CustomDot />}
                activeDot={{ r:6, fill:'#60a5fa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Multi-pollutant overview for selected unit */}
      <div className="card">
        <div className="card-title">🧪 All {mediaType === 'air' ? 'Air Pollutants' : 'Water Parameters'} — Quick View</div>
        <div className="grid-4">
          {POLLUTANTS[mediaType].map(pol => {
            const t = THRESHOLDS_DISPLAY[pol];
            const latest = data.length > 0 ? data[data.length - 1] : null;
            return (
              <div
                key={pol}
                className="card"
                style={{ cursor:'pointer', borderColor: pollutant === pol ? '#3b82f6' : '#334155', padding:12 }}
                onClick={() => setPollutant(pol)}
              >
                <div style={{ fontSize:13, fontWeight:700, color: pollutant===pol?'#60a5fa':'#e2e8f0' }}>{pol}</div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>{t?.unit}</div>
                {t && (
                  <div style={{ marginTop:4 }}>
                    <div style={{ fontSize:10, color:'#f59e0b' }}>⚠ {t.warning}</div>
                    <div style={{ fontSize:10, color:'#ef4444' }}>🚨 {t.critical}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
