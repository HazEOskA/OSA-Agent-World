"use client";

import { districtById, districts, type DistrictId, type WorldEvent } from "../lib/world";

export function ProtocolOverlay({
  activeDistrict,
  event,
  onTeleport
}: {
  activeDistrict: DistrictId;
  event: WorldEvent;
  onTeleport: (district: DistrictId) => void;
}) {
  const active = districtById(activeDistrict);

  return (
    <>
      <header className="world-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="eyebrow">OSA // CRYPTO WORLD</div>
            <div className="brand-title">WEB4 ALPHA</div>
          </div>
        </div>

        <div className="network-rail" aria-label="Alpha network state">
          <span className="status-dot" />
          <span>WORLD SHELL</span>
          <b>REAL</b>
          <span className="rail-divider" />
          <span>ECONOMY</span>
          <b className="simulated">SIMULATED</b>
        </div>
      </header>

      <aside className="district-copy">
        <div className="district-code">{active.code}</div>
        <div className="district-eyebrow">{active.eyebrow}</div>
        <h1>{active.title}</h1>
        <p>{active.description}</p>

        <div className="world-signal">
          <span>STATE</span>
          <strong>{active.metric}</strong>
          <i>{active.status}</i>
        </div>
      </aside>

      <div className="event-telemetry" aria-live="polite">
        <div className="telemetry-kicker">WORLD EVENT</div>
        <strong>{event.label}</strong>
        <span>{event.mode}</span>
      </div>

      <nav className="portal-nav" aria-label="Teleport to district">
        {districts.map((district) => (
          <button
            type="button"
            key={district.id}
            className={activeDistrict === district.id ? "portal-link active" : "portal-link"}
            onClick={() => onTeleport(district.id)}
          >
            <span>{district.code}</span>
            <strong>{district.title.replace(" DISTRICT", "")}</strong>
            <i>{district.status}</i>
          </button>
        ))}
      </nav>

      <div className="command-hint">
        <span>WORLD COMMAND</span>
        <kbd>/</kbd>
        <strong>TELEPORT</strong>
      </div>
    </>
  );
}
