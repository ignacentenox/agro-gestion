import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "@/components/user-provider";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getCurrentUser();
	if (!user) redirect("/login");

	return (
		<UserProvider user={{ id: user.id, email: user.email, name: user.name, role: user.role as "ADMIN" | "EMPLEADO" }}>
			<div className="flex h-screen bg-gray-50 dark:bg-slate-900">
				<Sidebar userName={user.name} userRole={user.role} />
				<main className="flex-1 overflow-y-auto">
					<div className="p-6">{children}</div>
				</main>
			</div>
		</UserProvider>
	);
}
