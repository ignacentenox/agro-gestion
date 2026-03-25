import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
	}).format(num);
}

export function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("es-AR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(d);
}

export function formatCuit(cuit: string): string {
	const clean = cuit.replace(/\D/g, "");
	if (clean.length !== 11) return cuit;
	return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
}

export function getMonthName(month: number): string {
	const months = [
		"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
		"Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
	];
	return months[month - 1] || "";
}
