"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
	theme: "system",
	resolvedTheme: "light",
	setTheme: () => { },
});

export function useTheme() {
	return useContext(ThemeContext);
}

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const stored = localStorage.getItem("agro-theme") as Theme | null;
		if (stored) {
			setThemeState(stored);
		}
	}, []);

	useEffect(() => {
		const resolved = theme === "system" ? getSystemTheme() : theme;
		setResolvedTheme(resolved);

		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolved);

		// Listen for system changes when in "system" mode
		if (theme === "system") {
			const media = window.matchMedia("(prefers-color-scheme: dark)");
			const handler = (e: MediaQueryListEvent) => {
				const newTheme = e.matches ? "dark" : "light";
				setResolvedTheme(newTheme);
				root.classList.remove("light", "dark");
				root.classList.add(newTheme);
			};
			media.addEventListener("change", handler);
			return () => media.removeEventListener("change", handler);
		}
	}, [theme]);

	function setTheme(t: Theme) {
		setThemeState(t);
		localStorage.setItem("agro-theme", t);
	}

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}
