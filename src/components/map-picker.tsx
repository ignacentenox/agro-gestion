"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface MapPickerProps {
	lat: number | null;
	lng: number | null;
	onChange: (lat: number | null, lng: number | null) => void;
}

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapInstance = useRef<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const markerRef = useRef<any>(null);
	const [latInput, setLatInput] = useState(lat?.toString() ?? "");
	const [lngInput, setLngInput] = useState(lng?.toString() ?? "");
	const [ready, setReady] = useState(false);

	// Default center: Argentina center
	const defaultLat = -31.4;
	const defaultLng = -64.2;

	useEffect(() => {
		setLatInput(lat?.toString() ?? "");
		setLngInput(lng?.toString() ?? "");
	}, [lat, lng]);

	useEffect(() => {
		if (!mapRef.current) return;

		// Cleanup any previous instance on the same container
		if (mapInstance.current) {
			mapInstance.current.remove();
			mapInstance.current = null;
			markerRef.current = null;
		}

		// Dynamic import to avoid SSR issues
		import("leaflet").then((L) => {
			// Fix default icon
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			delete (L.Icon.Default.prototype as any)._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
				iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
				shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
			});

			const initLat = lat ?? defaultLat;
			const initLng = lng ?? defaultLng;
			const zoom = lat && lng ? 13 : 6;

			const map = L.map(mapRef.current!, { attributionControl: false }).setView([initLat, initLng], zoom);
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				maxZoom: 18,
			}).addTo(map);

			if (lat && lng) {
				markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
				markerRef.current.on("dragend", () => {
					const pos = markerRef.current.getLatLng();
					onChange(parseFloat(pos.lat.toFixed(7)), parseFloat(pos.lng.toFixed(7)));
				});
			}

			map.on("click", (e: L.LeafletMouseEvent) => {
				const { lat: clickLat, lng: clickLng } = e.latlng;
				const newLat = parseFloat(clickLat.toFixed(7));
				const newLng = parseFloat(clickLng.toFixed(7));

				if (markerRef.current) {
					markerRef.current.setLatLng([newLat, newLng]);
				} else {
					markerRef.current = L.marker([newLat, newLng], { draggable: true }).addTo(map);
					markerRef.current.on("dragend", () => {
						const pos = markerRef.current.getLatLng();
						onChange(parseFloat(pos.lat.toFixed(7)), parseFloat(pos.lng.toFixed(7)));
					});
				}
				onChange(newLat, newLng);
			});

			mapInstance.current = map;
			setReady(true);

			// Fix tiles not loading in dialog
			setTimeout(() => map.invalidateSize(), 200);
		});

		return () => {
			if (mapInstance.current) {
				mapInstance.current.remove();
				mapInstance.current = null;
				markerRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function handleCoordsSubmit() {
		const la = parseFloat(latInput);
		const ln = parseFloat(lngInput);
		if (isNaN(la) || isNaN(ln)) return;
		onChange(la, ln);

		if (mapInstance.current) {
			import("leaflet").then((L) => {
				mapInstance.current.setView([la, ln], 13);
				if (markerRef.current) {
					markerRef.current.setLatLng([la, ln]);
				} else {
					markerRef.current = L.marker([la, ln], { draggable: true }).addTo(mapInstance.current);
					markerRef.current.on("dragend", () => {
						const pos = markerRef.current.getLatLng();
						onChange(parseFloat(pos.lat.toFixed(7)), parseFloat(pos.lng.toFixed(7)));
					});
				}
			});
		}
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<MapPin className="h-4 w-4 text-green-600" />
				<span>Ubicación en Mapa</span>
				{!ready && <span className="text-xs text-gray-400">Cargando mapa...</span>}
			</div>

			{/* CSS for leaflet */}
			<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

			<div
				ref={mapRef}
				className="w-full h-[250px] rounded-md border border-gray-200 dark:border-gray-700 z-0"
			/>

			<div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
				<div>
					<Label className="text-xs">Latitud</Label>
					<Input
						type="number"
						step="any"
						placeholder="-31.4201"
						value={latInput}
						onChange={(e) => setLatInput(e.target.value)}
						className="h-8 text-xs"
					/>
				</div>
				<div>
					<Label className="text-xs">Longitud</Label>
					<Input
						type="number"
						step="any"
						placeholder="-64.1888"
						value={lngInput}
						onChange={(e) => setLngInput(e.target.value)}
						className="h-8 text-xs"
					/>
				</div>
				<Button type="button" size="sm" variant="outline" className="h-8" onClick={handleCoordsSubmit}>
					Ir
				</Button>
			</div>
			<p className="text-xs text-gray-400">Hacé click en el mapa o ingresá coordenadas manualmente</p>
		</div>
	);
}
