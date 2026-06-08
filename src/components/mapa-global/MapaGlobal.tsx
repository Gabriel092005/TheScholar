import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { motion } from "framer-motion";
import type { MapaGlobalItem } from "@/api/mapa-global";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props {
  items: MapaGlobalItem[];
}

export function MapaGlobal({ items }: Props) {
  const [selected, setSelected] = useState<MapaGlobalItem | null>(null);
  const [tooltip, setTooltip] = useState<{ item: MapaGlobalItem; x: number; y: number } | null>(null);

  return (
    <div className="relative w-full">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 130 }}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={5}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e2e8f0"
                  stroke="#cbd5e1"
                  strokeWidth={0.5}
                  style={{
                    default: { fill: "#e2e8f0", outline: "none" },
                    hover: { fill: "#cbd5e1", outline: "none" },
                    pressed: { fill: "#94a3b8", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {items.map((item) => (
            <Marker
              key={item.id}
              coordinates={[item.longitude, item.latitude]}
            >
              <g
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGGElement).closest("svg")?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      item,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top - 10,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => setSelected(item)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  r={8}
                  fill="#10b981"
                  stroke="#fff"
                  strokeWidth={2}
                  className="drop-shadow-lg"
                />
                <circle
                  r={12}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={1}
                  opacity={0.4}
                />
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.item.bandeira && <span className="mr-1">{tooltip.item.bandeira}</span>}
          {tooltip.item.nome} — {tooltip.item.pais}
        </div>
      )}

      {/* Selected modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#111113] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-100 dark:border-white/[0.06]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                {selected.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{selected.nome}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {selected.bandeira} {selected.pais} — {selected.curso}
                </p>
              </div>
            </div>
            {selected.texto && (
              <p className="text-sm text-gray-600 dark:text-zinc-300 italic mb-3">
                &ldquo;{selected.texto}&rdquo;
              </p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
