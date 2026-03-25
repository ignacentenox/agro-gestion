"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
	const { theme, setTheme } = useTheme();

	const next = () => {
		const order: Array<"light" | "dark" | "system"> = [
			"light",
			"dark",
			"system",
		];
		const idx = order.indexOf(theme);
		setTheme(order[(idx + 1) % order.length]);
	};

	const icon =
		theme === "dark" ? (
			<Moon className="h-4 w-4" />
		) : theme === "light" ? (
			<Sun className="h-4 w-4" />
		) : (
			<Monitor className="h-4 w-4" />
		);

	const label =
		theme === "dark" ? "Oscuro" : theme === "light" ? "Claro" : "Sistema";

	return (
		<Button
			variant="ghost"
			size={collapsed ? "icon" : "default"}
			onClick={next}
			className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
			title={collapsed ? `Tema: ${label}` : undefined}
		>
			{icon}
			{!collapsed && <span>Tema: {label}</span>}
		</Button>
	);
}
