import { protocolCategories } from "../../constants/modules";
import type { Protocol } from "../../types";
import { ToggleButton } from "../ui";

interface ProtocolPanelProps {
  protocols: Protocol[];
  visibleProtocols: Protocol[];
  selectedProtocolId: string;
  protocolCategory: string;
  query: string;
  onCategoryChange: (category: string) => void;
  onQueryChange: (query: string) => void;
  onApplyProtocol: (protocol: Protocol) => void;
}

export function ProtocolPanel({
  protocols,
  visibleProtocols,
  selectedProtocolId,
  protocolCategory,
  query,
  onCategoryChange,
  onQueryChange,
  onApplyProtocol,
}: ProtocolPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Protocolos</h2>
        <span>{protocols.length}</span>
      </div>
      <p className="panel-note">Los protocolos ajustan fondo, objetivo, frecuencia y metrónomo. No cambian duración, series ni descanso.</p>

      <div className="chip-grid two">
        {protocolCategories.map((category) => (
          <ToggleButton key={category} active={protocolCategory === category} onClick={() => onCategoryChange(category)}>
            {category}
          </ToggleButton>
        ))}
      </div>

      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar protocolo..."
        className="search-input"
      />

      <div className="protocol-list">
        {visibleProtocols.map((protocol) => (
          <button
            key={protocol.id}
            type="button"
            onClick={() => onApplyProtocol(protocol)}
            className={`protocol-item ${selectedProtocolId === protocol.id ? "selected" : ""}`}
          >
            <strong>{protocol.name}</strong>
            <span>
              {protocol.sourceVideo ? `Video ${protocol.sourceVideo}` : "Base"} · {protocol.category} · {protocol.level}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
