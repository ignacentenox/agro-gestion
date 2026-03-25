"use client";

import { createContext, useContext } from "react";

interface UserData {
	id: string;
	email: string;
	name: string;
	role: "ADMIN" | "EMPLEADO";
}

const UserContext = createContext<UserData | null>(null);

export function UserProvider({
	user,
	children,
}: {
	user: UserData;
	children: React.ReactNode;
}) {
	return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) throw new Error("useUser must be used within UserProvider");
	return ctx;
}

export function useIsAdmin() {
	const user = useUser();
	return user.role === "ADMIN";
}
