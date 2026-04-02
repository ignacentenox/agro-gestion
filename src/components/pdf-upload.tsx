"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ParsedInvoice {
	tipoComprobante?: string;
	puntoVenta?: number;
	numero?: number;
	fecha?: string;
	cuitEmisor?: string;
	cuitReceptor?: string;
	razonSocial?: string;
	condicionIva?: string;
	netoGravado?: number | null;
	netoNoGravado?: number | null;
	netoExento?: number | null;
	alicuotaIva?: number | null;
	montoIva?: number | null;
	percepcionIva?: number | null;
	percepcionIIBB?: number | null;
	otrosImpuestos?: number | null;
	total?: number | null;
	descripcion?: string | null;
}

interface PdfUploadProps {
	onParsed: (data: ParsedInvoice) => void | Promise<void>;
}

type Status = "idle" | "uploading" | "success" | "error";

export function PdfUpload({ onParsed }: PdfUploadProps) {
	const [status, setStatus] = useState<Status>("idle");
	const [message, setMessage] = useState("");
	const [fileName, setFileName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const VALID_TYPES = [
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-excel",
	];

	async function handleFile(file: File) {
		const isValid = VALID_TYPES.includes(file.type) ||
			file.name.toLowerCase().endsWith(".pdf") ||
			file.name.toLowerCase().endsWith(".xlsx") ||
			file.name.toLowerCase().endsWith(".xls");

		if (!isValid) {
			setStatus("error");
			setMessage("Solo se permiten archivos PDF o Excel (.xlsx/.xls)");
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			setStatus("error");
			setMessage("El archivo no puede superar 10MB");
			return;
		}

		const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
		setFileName(file.name);
		setStatus("uploading");
		setMessage(isPdf ? "Analizando PDF..." : "Analizando Excel...");

		try {
			const formData = new FormData();
			formData.append("file", file);

			const res = await fetch("/api/parse-pdf", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();

			if (!res.ok) {
				setStatus("error");
				setMessage(data.error || "Error al procesar el archivo");
				return;
			}

			const parsed = data.parsed;
			const fieldsFound = Object.entries(parsed).filter(
				([, v]) => v !== null && v !== undefined && v !== 0 && v !== ""
			).length;

			if (fieldsFound === 0) {
				setStatus("error");
				setMessage("No se pudo extraer información del archivo. Intentá con otro formato.");
				return;
			}

			setStatus("success");
			setMessage(`${fieldsFound} campos detectados de "${file.name}"`);
			await onParsed(parsed);
		} catch {
			setStatus("error");
			setMessage("Error de conexión al procesar el archivo");
		}
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	}

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) handleFile(file);
		// Reset para permitir re-subir el mismo archivo
		e.target.value = "";
	}

	const statusConfig = {
		idle: { icon: Upload, color: "border-gray-300 bg-gray-50 hover:bg-gray-100", textColor: "text-gray-500" },
		uploading: { icon: Loader2, color: "border-blue-300 bg-blue-50", textColor: "text-blue-600" },
		success: { icon: CheckCircle, color: "border-green-300 bg-green-50", textColor: "text-green-600" },
		error: { icon: AlertCircle, color: "border-red-300 bg-red-50", textColor: "text-red-600" },
	};

	const config = statusConfig[status];
	const Icon = config.icon;

	return (
		<div className="space-y-2">
			<div
				className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${config.color}`}
				onDrop={handleDrop}
				onDragOver={(e) => e.preventDefault()}
				onClick={() => inputRef.current?.click()}
			>
				<input
					ref={inputRef}
					type="file"
					accept="application/pdf,.pdf,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
					className="hidden"
					onChange={handleChange}
				/>
				<Icon
					className={`mx-auto h-8 w-8 mb-2 ${config.textColor} ${status === "uploading" ? "animate-spin" : ""}`}
				/>
				{status === "idle" ? (
					<>
						<p className="text-sm font-medium text-gray-700">
							Arrastrá un PDF o Excel, o hacé clic para cargar
						</p>
						<p className="text-xs text-gray-400 mt-1">
							Se extraerán automáticamente los datos de la factura (PDF o .xlsx)
						</p>
					</>
				) : (
					<>
						{fileName && (
							<p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
								<FileText className="h-3 w-3" /> {fileName}
							</p>
						)}
						<p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
					</>
				)}
			</div>
			{(status === "success" || status === "error") && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="w-full text-xs"
					onClick={() => {
						setStatus("idle");
						setMessage("");
						setFileName("");
					}}
				>
					Cargar otro archivo
				</Button>
			)}
		</div>
	);
}
