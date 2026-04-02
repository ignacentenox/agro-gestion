"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
	theme: "dark",
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
	const [theme, setThemeState] = useState<Theme>("dark");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const stored = localStorage.getItem("agro-theme") as Theme | null;
		if (stored === "light" || stored === "dark") {
			setThemeState(stored);
		}
	}, []);

	useEffect(() => {
		const resolved = theme === "system" ? getSystemTheme() : theme;
		setResolvedTheme(resolved);

		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolved);

		return;
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
