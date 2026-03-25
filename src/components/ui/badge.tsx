import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
	className,
	variant = "default",
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}) {
	const variants = {
		default: "bg-green-100 text-green-800",
		secondary: "bg-gray-100 text-gray-800",
		destructive: "bg-red-100 text-red-800",
		outline: "border border-gray-300 text-gray-700",
		success: "bg-emerald-100 text-emerald-800",
		warning: "bg-amber-100 text-amber-800",
	};

	return (
		<div
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
				variants[variant],
				className
			)}
			{...props}
		/>
	);
}

export { Badge };
