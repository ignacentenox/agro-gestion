"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
	const { theme, resolvedTheme, setTheme } = useTheme();

	const next = () => {
		const order: Array<"light" | "dark"> = ["light", "dark"];
		const current = theme === "system" ? resolvedTheme : theme;
		const idx = order.indexOf(current);
		setTheme(order[(idx + 1) % order.length]);
	};

	const icon =
		(theme === "system" ? resolvedTheme : theme) === "dark" ? (
			<Moon className="h-4 w-4" />
		) : (
			<Sun className="h-4 w-4" />
		);

	const label = (theme === "system" ? resolvedTheme : theme) === "dark" ? "Oscuro" : "Claro";

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
