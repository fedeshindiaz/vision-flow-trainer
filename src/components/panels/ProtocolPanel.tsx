import { memo, useState } from "react";
import { protocolCategories } from "../../constants/modules";
import type { Protocol } from "../../types";
import { Icon, ToggleButton } from "../ui";

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

export const ProtocolPanel = memo(function ProtocolPanel({
  protocols,
  visibleProtocols,
  selectedProtocolId,
  protocolCategory,
  query,
  onCategoryChange,
  onQueryChange,
  onApplyProtocol,
}: ProtocolPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const selectedProtocol = protocols.find((protocol) => protocol.id === selectedProtocolId) ?? protocols[0];
  const summary = selectedProtocol
    ? `${selectedProtocol.name} · ${selectedProtocol.category} · ${selectedProtocol.level}`
    : "Elegir protocolo";

  const handleApplyProtocol = (protocol: Protocol) => {
    onApplyProtocol(protocol);
    setExpanded(false);
  };

  return (
    <section className="panel collapsible-panel">
      <div className="panel-header compact-panel-header">
        <button
          type="button"
          className="panel-title-button"
          aria-expanded={expanded}
          aria-controls="protocol-panel-body"
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="panel-title-main">
            <Icon name="protocols" /> Protocolos
          </span>
          <span className="panel-summary">{summary}</span>
        </button>

        <div className="panel-actions">
          <span className="panel-count">{protocols.length}</span>
          <button
            type="button"
            className="collapse-button"
            aria-label={expanded ? "Ocultar protocolos" : "Mostrar protocolos"}
            aria-expanded={expanded}
            aria-controls="protocol-panel-body"
            onClick={() => setExpanded((value) => !value)}
          >
            <Icon name="chevronDown" className={`collapse-icon ${expanded ? "open" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="panel-body" id="protocol-panel-body">
          <p className="panel-note">Los protocolos ajustan fondo, objetivo, frecuencia y metrónomo. Guiados inicia valores mínimos para personalizar.</p>

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
                onClick={() => handleApplyProtocol(protocol)}
                className={`protocol-item ${selectedProtocolId === protocol.id ? "selected" : ""}`}
              >
                <strong>{protocol.name}</strong>
                <span>
                  {protocol.sourceVideo ? `Video ${protocol.sourceVideo}` : "Base"} · {protocol.category} · {protocol.level}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
