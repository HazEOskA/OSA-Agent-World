"use client";

import { districtById, districts, type DistrictId, type WorldEvent } from "../lib/world";

const icons: Record<DistrictId,string> = {
  nexus:"▲",
  agents:"◇",
  defi:"↯",
  bridge:"⇄",
  proof:"✓",
  chain:"▦",
  nodes:"⌘",
  market:"$"
};

const modeLabel: Record<WorldEvent["mode"],string> = {
  REAL:"REAL",
  TESTNET:"TESTNET",
  SIMULATED:"SYMULACJA"
};

export function ProtocolOverlay({
  activeDistrict,
  event,
  onTeleport,
  onIdentity
}: {
  activeDistrict: DistrictId;
  event: WorldEvent;
  onTeleport: (district: DistrictId) => void;
  onIdentity: () => void;
}) {
  const active = districtById(activeDistrict);

  return (
    <>
      <header className="world-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">▲</div>
          <div>
            <div className="eyebrow">OSA AGENT WORLD</div>
            <div className="brand-title">CONTROL PLANE</div>
          </div>
        </div>

        <div className="network-rail" aria-label="Stan systemu">
          <span className="status-dot" />
          <span>SYSTEM</span><b>ONLINE</b>
          <span className="rail-divider" />
          <span>CHAIN</span><b>DEVNET</b>
          <span className="rail-divider" />
          <span>RELEASE</span><b>60/60</b>
          <button type="button" className="identity-open" onClick={onIdentity}>TOŻSAMOŚĆ ↗</button>
        </div>
      </header>

      <section className="system-flow" aria-label="Główny przepływ systemu">
        {["AGENT","MISJA","AUTHORITY","EXECUTION","PROOF","SETTLEMENT"].map((step,index) => (
          <div className="flow-step" key={step}>
            <span>{String(index + 1).padStart(2,"0")}</span>
            <strong>{step}</strong>
            {index < 5 ? <i>→</i> : null}
          </div>
        ))}
      </section>

      <nav className="portal-nav" aria-label="Moduły systemu">
        {districts.map((district) => (
          <button
            type="button"
            key={district.id}
            className={activeDistrict === district.id ? "portal-link active" : "portal-link"}
            onClick={() => onTeleport(district.id)}
          >
            <span className="module-icon" aria-hidden="true">{icons[district.id]}</span>
            <span className="module-copy">
              <b>{district.code}</b>
              <strong>{district.title}</strong>
              <i>{district.status === "CORE" ? "RDZEŃ" : "SYMULACJA"}</i>
            </span>
          </button>
        ))}
      </nav>

      <section className="module-context">
        <div>
          <span className="district-eyebrow">{active.eyebrow}</span>
          <h1>{active.title}</h1>
          <p>{active.description}</p>
        </div>
        <div className="module-state">
          <span>STAN MODUŁU</span>
          <strong>{active.metric}</strong>
          <i>{active.status === "CORE" ? "RDZEŃ SYSTEMU" : "WARSTWA SYMULOWANA / TESTNET"}</i>
        </div>
      </section>

      <div className="event-telemetry" aria-live="polite">
        <div>
          <span>OSTATNIE ZDARZENIE</span>
          <strong>{event.label}</strong>
        </div>
        <code>{event.type}</code>
        <b>{modeLabel[event.mode]}</b>
      </div>
    </>
  );
}
