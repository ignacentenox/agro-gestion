"use client";
import { createContext, useContext, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

const ToastContext = createContext({
	showToast: (_msg: string, _type: ToastType = "info") => { },
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	function showToast(message: string, type: ToastType = "info") {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 3000);
	}

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={`px-4 py-2 rounded shadow-lg text-white font-medium animate-fade-in-up transition-all
              ${toast.type === "success" ? "bg-green-600" : ""}
              ${toast.type === "error" ? "bg-red-600" : ""}
              ${toast.type === "info" ? "bg-slate-800" : ""}
            `}
					>
						{toast.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	return useContext(ToastContext);
}
