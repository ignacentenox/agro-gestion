"use client";
import { useEffect, useState } from "react";

export default function WelcomeToast() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const alreadyShown = window.localStorage.getItem("agro-toast-shown");
		if (!alreadyShown) {
			setShow(true);
			const timeout = setTimeout(() => {
				setShow(false);
				window.localStorage.setItem("agro-toast-shown", "1");
			}, 2000);
			return () => clearTimeout(timeout);
		}
	}, []);

	if (!show) return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: 24,
				right: 24,
				minWidth: 320,
				maxWidth: 400,
				background: "rgba(30,32,40,0.97)",
				color: "#fff",
				borderRadius: 12,
				boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
				padding: "20px 28px",
				zIndex: 9999,
				opacity: show ? 1 : 0,
				transition: "opacity 0.7s",
				fontSize: 16,
				pointerEvents: "none"
			}}
		>
			<div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Bienvenid@ a Agro Gestión</div>
			<div style={{ color: "#cbd5e1", fontSize: 15 }}>
				Sistema de gestión contable y administrativa para empresas agropecuarias.
			</div>
		</div>
	);
}
