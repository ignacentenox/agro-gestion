"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	FileText,
	FileInput,
	Receipt,
	BookOpen,
	Landmark,
	CreditCard,
	Users,
	LogOut,
	ChevronLeft,
	Menu,
	Truck,
	MapPin,
	Wheat,
	ShieldCheck,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ToastContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navigationBase = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Facturas Emitidas", href: "/dashboard/facturas-emitidas", icon: FileText },
	{ name: "Facturas Recibidas", href: "/dashboard/facturas-recibidas", icon: FileInput },
	{ name: "Liquidaciones", href: "/dashboard/liquidaciones", icon: Receipt },
	{ name: "Libro IVA", href: "/dashboard/libro-iva", icon: BookOpen },
	{ name: "Bancos", href: "/dashboard/bancos", icon: Landmark },
	{ name: "Cheques", href: "/dashboard/cheques", icon: CreditCard },
	{ name: "Cuentas Corrientes", href: "/dashboard/cuentas-corrientes", icon: Users },
	{ name: "Proveedores", href: "/dashboard/proveedores", icon: Truck },
	{ name: "Clientes", href: "/dashboard/clientes", icon: Users },
	{ name: "Campos", href: "/dashboard/campos", icon: MapPin },
	{ name: "Cartas de Porte", href: "/dashboard/cartas-porte", icon: Wheat },
	{ name: "Usuarios", href: "/dashboard/usuarios", icon: ShieldCheck, adminOnly: true },
];

function SidebarComponent({ userName, userRole }: { userName: string; userRole: string }) {
	const pathname = usePathname();
	const router = useRouter();
	const [collapsed, setCollapsed] = useState(false);
	const { showToast } = useToast();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const navigation = useMemo(() =>
		navigationBase.filter((item) => !item.adminOnly || userRole === "ADMIN"),
		[userRole]
	);

	async function handleLogout() {
		try {
			const res = await fetch("/api/auth/logout", { method: "POST" });
			if (res.ok) {
				showToast("Sesión cerrada correctamente", "success");
				window.location.href = "/login";
			} else {
				showToast("Error al cerrar sesión", "error");
			}
		} catch (e) {
			showToast("Error de red al cerrar sesión", "error");
		}
	}

	return (
		<aside
			className={cn(
				"flex h-screen flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 transition-all duration-300",
				mounted && collapsed ? "w-16" : "w-64"
			)}
			role="navigation"
			aria-label="Menú principal"
		>
			{/* Header con Logo */}
			<div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3" role="banner">
				{/* Para evitar hydration mismatch, renderizar ambos logos solo tras mounted. SSR muestra un placeholder invisible del mismo tamaño. */}
				{!mounted ? (
					<div style={{ width: 36, height: 36 }} />
				) : !collapsed ? (
					<div className="flex items-center gap-2">
						<Image
							src="/logo-icon.svg"
							alt="AG"
							width={36}
							height={36}
							className="flex-shrink-0"
						/>
						<span className="text-lg font-bold text-purple-700 dark:text-purple-400">
							Agro Gestión
						</span>
					</div>
				) : (
					<Image
						src="/logo-icon.svg"
						alt="AG"
						width={28}
						height={28}
						className="mx-auto"
					/>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setCollapsed(!collapsed)}
					className="h-8 w-8 flex-shrink-0 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					{mounted && collapsed ? (
						<Menu className="h-4 w-4" />
					) : (
						<ChevronLeft className="h-4 w-4" />
					)}
				</Button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto p-2" aria-label="Navegación lateral">
				<ul className="space-y-1">
					{navigation.map((item) => {
						const isActive = pathname?.startsWith(item.href);
						return (
							<li key={item.name}>
								<Link
									href={item.href}
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 border-l-4",
										isActive
											? "border-purple-600 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 shadow-sm"
											: "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
									)}
									title={mounted && collapsed ? item.name : undefined}
									aria-current={isActive ? "page" : undefined}
								>
									<item.icon
										className={cn(
											"h-5 w-5 flex-shrink-0",
											mounted && !isActive && "text-gray-400 dark:text-gray-500"
										)}
									/>
									{mounted && !collapsed && <span>{item.name}</span>}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			{/* Footer */}
			<div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-1" role="contentinfo">
				{mounted && !collapsed && (
					<div className="flex items-center gap-3 px-3 py-2 mb-1">
						<div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
							{userName?.[0]?.toUpperCase() || '?'}
						</div>
						<div>
							<p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{userName}</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">{userRole === 'ADMIN' ? 'Administrador' : 'Empleado'}</p>
						</div>
					</div>
				)}
				<ThemeToggle collapsed={mounted ? collapsed : false} />
				{mounted && (
					<Button
						onClick={handleLogout}
						variant="destructive"
						className="w-full flex items-center gap-3 px-3 py-2 font-semibold text-red-700 dark:text-white"
						title="Cerrar sesión"
						aria-label="Cerrar sesión"
					>
						<LogOut className="h-5 w-5 flex-shrink-0 text-red-700 dark:text-white" aria-hidden="true" />
						{!collapsed && <span className="text-red-700 dark:text-white">Cerrar sesión</span>}
					</Button>
				)}
			</div>
		</aside>
	);
}

const Sidebar = React.memo(SidebarComponent);
export { Sidebar };


