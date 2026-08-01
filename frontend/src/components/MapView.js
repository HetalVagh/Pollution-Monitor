import React, { useMemo } from 'react';

export default function MapView({ units, readings, onUnitSelect }) {
  // Latest readings per unit
  const latestByUnit = useMemo(() => {
    const map = {};
    [...readings].reverse().forEach(r => {
      const key = `${r.unitId}-${r.type}`;
      if (!map[key]) map[key] = r;
    });
    return map;
  }, [readings]);

  const getStatus = (unitId) => {
    const air   = latestByUnit[`${unitId}-air`];
    const water = latestByUnit[`${unitId}-water`];
    if (air?.status === 'critical' || water?.status === 'critical') return 'critical';
    if (air?.status === 'warning'  || water?.status === 'warning')  return 'warning';
    return 'normal';
  };

  const statusColor = { critical: '#ef4444', warning: '#f59e0b', normal: '#10b981' };
  const statusLabel = { critical: '🔴 CRITICAL', warning: '🟡 WARNING', normal: '🟢 NORMAL' };

  // Vapi/Ankleshwar/Vatva approximate grid layout (since we can't use Leaflet without CDN)
  const locationGroups = {
    Vapi:       { label: 'Vapi (20.37°N, 72.90°E)',       top: '72%', left: '20%' },
    Ankleshwar: { label: 'Ankleshwar (21.63°N, 73.00°E)', top: '38%', left: '55%' },
    Vatva:      { label: 'Vatva (22.98°N, 72.60°E)',       top: '10%', left: '42%' }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #334155', background:'#1e293b' }}>
          <div className="card-title" style={{ margin:0 }}>🗺️ Live Industrial Map — Golden Corridor (Gujarat, India)</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Real-time pollution status. Click a unit for details.</div>
        </div>

        {/* Custom SVG Map */}
        <div style={{ position:'relative', background:'#0d1929', minHeight:520 }}>
          <svg width="100%" viewBox="0 0 900 550" style={{ display:'block' }}>
            {/* Background */}
            <rect width="900" height="550" fill="#0d1929" />

            {/* Gujarat outline (simplified) */}
            <polygon points="100,480 150,500 250,510 350,490 400,470 450,450 500,430 550,400 600,370 630,340 650,300 620,260 580,240 540,220 510,200 490,180 470,160 440,140 410,130 380,120 350,130 320,150 300,170 280,200 260,230 240,260 220,290 200,320 180,350 160,380 140,410 120,440 100,480" fill="#1a2744" stroke="#2d4070" strokeWidth="2" />

            {/* Rivers */}
            <path d="M 280 420 Q 350 380 420 330 Q 480 280 540 240" stroke="#1e40af" strokeWidth="2" fill="none" strokeDasharray="6,3" opacity="0.6"/>
            <text x="360" y="365" fill="#3b82f6" fontSize="11" opacity="0.7">Narmada River</text>

            <path d="M 200 500 Q 260 460 300 420" stroke="#1e40af" strokeWidth="1.5" fill="none" strokeDasharray="4,2" opacity="0.5"/>
            <text x="200" y="495" fill="#3b82f6" fontSize="10" opacity="0.6">Ambica R.</text>

            {/* Arabian Sea */}
            <ellipse cx="120" cy="420" rx="80" ry="50" fill="#0c2340" opacity="0.8" />
            <text x="60" y="425" fill="#3b82f6" fontSize="13" opacity="0.7">Arabian</text>
            <text x="73" y="441" fill="#3b82f6" fontSize="13" opacity="0.7">Sea</text>

            {/* GIDC zone highlights */}
            <ellipse cx="240" cy="405" rx="55" ry="35" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="4,2"/>
            <text x="195" y="448" fill="#ef444488" fontSize="10">VAPI GIDC</text>

            <ellipse cx="480" cy="275" rx="55" ry="32" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" strokeDasharray="4,2"/>
            <text x="432" y="316" fill="#f59e0b88" fontSize="10">ANKLESHWAR GIDC</text>

            <ellipse cx="530" cy="165" rx="50" ry="28" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1" strokeDasharray="4,2"/>
            <text x="490" y="204" fill="#3b82f688" fontSize="10">VATVA GIDC</text>

            {/* Location labels */}
            {Object.entries(locationGroups).map(([loc, _]) => null)}

            {/* Unit markers */}
            {units.map((unit, i) => {
              const air   = latestByUnit[`${unit.id}-air`];
              const water = latestByUnit[`${unit.id}-water`];
              const status = getStatus(unit.id);
              const color  = statusColor[status];
              const aqi    = air?.aqi || 0;

              // Map lat/lng to SVG coords
              // Lat range: 20.3 - 23.1 → y: 480 - 100
              // Lng range: 72.5 - 73.2 → x: 180 - 680
              const x = ((unit.lng - 72.5) / 0.7) * 500 + 180 + (i % 2 === 0 ? 10 : -10);
              const y = ((23.1 - unit.lat) / 2.8) * 380 + 100 + (i % 3 === 0 ? 8 : -8);

              return (
                <g key={unit.id} style={{ cursor:'pointer' }} onClick={() => onUnitSelect(unit)}>
                  {/* Pulse ring for critical */}
                  {status === 'critical' && (
                    <circle cx={x} cy={y} r="22" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="r" from="16" to="28" dur="1.5s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
                    </circle>
                  )}
                  {/* Marker circle */}
                  <circle cx={x} cy={y} r="14" fill={color} opacity="0.2" />
                  <circle cx={x} cy={y} r="10" fill={color} />
                  <text x={x} y={y+4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                    {unit.id.slice(1)}
                  </text>
                  {/* Label */}
                  <rect x={x-40} y={y+14} width="80" height="28" rx="4" fill="#1e293b" stroke={color} strokeWidth="0.8" opacity="0.95"/>
                  <text x={x} y={y+26} textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="bold">
                    {unit.name.split(' ').slice(0,2).join(' ')}
                  </text>
                  <text x={x} y={y+37} textAnchor="middle" fill={color} fontSize="8">
                    AQI:{aqi} • {status.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <rect x="10" y="10" width="160" height="90" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="20" y="28" fill="#94a3b8" fontSize="11" fontWeight="bold">STATUS LEGEND</text>
            {[['critical','#ef4444','Critical — Action Required'],['warning','#f59e0b','Warning — Monitor Closely'],['normal','#10b981','Normal — Compliant']].map(([s,c,l],i)=>(
              <g key={s}>
                <circle cx="26" cy={46+i*20} r="7" fill={c} />
                <text x="40" y={50+i*20} fill="#e2e8f0" fontSize="10">{l}</text>
              </g>
            ))}

            {/* Title */}
            <text x="450" y="28" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="bold">GOLDEN CORRIDOR — GUJARAT INDUSTRIAL BELT</text>
            <text x="450" y="44" textAnchor="middle" fill="#475569" fontSize="10">Real-time Pollution Monitoring • GPCB/CPCB Standards</text>
          </svg>
        </div>
      </div>

      {/* Unit Grid */}
      <div className="grid-3">
        {units.map(unit => {
          const air    = latestByUnit[`${unit.id}-air`];
          const water  = latestByUnit[`${unit.id}-water`];
          const status = getStatus(unit.id);
          return (
            <div key={unit.id} className={`unit-card status-${status}`} onClick={() => onUnitSelect(unit)}>
              <div className="unit-header">
                <div>
                  <div className="unit-name">{unit.name}</div>
                  <div className="unit-location">📍 {unit.location}</div>
                  <div className="unit-type">⚙️ {unit.type}</div>
                </div>
                <div>
                  <span className={`badge badge-${status}`}>{status}</span>
                  <div style={{ marginTop:6, textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>Risk</div>
                    <div style={{ fontSize:12, fontWeight:700, color: unit.riskLevel==='High'?'#ef4444':unit.riskLevel==='Medium'?'#f59e0b':'#10b981' }}>
                      {unit.riskLevel}
                    </div>
                  </div>
                </div>
              </div>
              {air && (
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:8 }}>
                  <div style={{ fontSize:11 }}>
                    <span style={{ color:'#94a3b8' }}>AQI: </span>
                    <strong style={{ color: air.aqi>100?'#ef4444':air.aqi>50?'#f59e0b':'#10b981' }}>{air.aqi}</strong>
                  </div>
                  <div style={{ fontSize:11 }}>
                    <span style={{ color:'#94a3b8' }}>SO₂: </span>
                    <strong style={{ color:'#e2e8f0' }}>{air.pollutants?.SO2} µg/m³</strong>
                  </div>
                  <div style={{ fontSize:11 }}>
                    <span style={{ color:'#94a3b8' }}>PM2.5: </span>
                    <strong style={{ color:'#e2e8f0' }}>{air.pollutants?.PM25} µg/m³</strong>
                  </div>
                  {water && (
                    <div style={{ fontSize:11 }}>
                      <span style={{ color:'#94a3b8' }}>COD: </span>
                      <strong style={{ color:'#e2e8f0' }}>{water.pollutants?.COD} mg/L</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
