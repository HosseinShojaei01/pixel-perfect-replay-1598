import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { colorFor, regionInfo, type Entry } from "@/lib/ancestry";

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 5, { duration: 1.2 }); }, [target, map]);
  return null;
}

export default function WorldMap({ entries, selected, onSelect, dark, label }: {
  entries: Entry[]; selected: string | null; onSelect: (id: string) => void; dark: boolean; label: (r: string) => string;
}) {
  const pts = entries.map((e, i) => ({ e, i, info: regionInfo(e.region) })).filter((p) => p.info);
  const sel = pts.find((p) => p.e.id === selected);
  const hub = pts[0]?.info;
  const tiles = dark
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
  return (
    <MapContainer center={[38, 35]} zoom={3} minZoom={2} scrollWheelZoom={false} className="h-full w-full rounded-2xl" worldCopyJump>
      <TileLayer url={tiles} attribution="Tiles &copy; Esri" maxZoom={16} />
      {hub && pts.slice(1).map((p) => (
        <Polyline key={`l${p.e.id}`} positions={[[hub.lat, hub.lng], [p.info!.lat, p.info!.lng]]} pathOptions={{ color: colorFor(p.i), weight: 1.5, opacity: 0.7, dashArray: "4 6" }} />
      ))}
      {pts.map((p) => (
        <Marker key={p.e.id} position={[p.info!.lat, p.info!.lng]} eventHandlers={{ click: () => onSelect(p.e.id) }}
          icon={L.divIcon({ className: "", html: `<div class="dna-marker" style="color:${colorFor(p.i)};transform:scale(${p.e.id === selected ? 1.6 : 1})"><span class="ring"></span><span></span></div>`, iconSize: [14, 14], iconAnchor: [7, 7] })}>
          <Tooltip className="dna-tip" direction="top" offset={[0, -8]}>{p.info!.flag} {label(p.e.region)} · <b>{p.e.percent}%</b></Tooltip>
        </Marker>
      ))}
      <FlyTo target={sel ? [sel.info!.lat, sel.info!.lng] : null} />
    </MapContainer>
  );
}
