import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Iniciando seed de la base de datos...");

	// ==========================================
	// Usuario Admin
	// ==========================================
	const hashedPassword = await bcrypt.hash("admin123", 12);

	const admin = await prisma.user.upsert({
		where: { email: "admin@agrogestion.com" },
		update: {},
		create: {
			email: "admin@agrogestion.com",
			name: "Administrador",
			password: hashedPassword,
			role: "ADMIN",
		},
	});
	console.log(`✅ Usuario admin creado: ${admin.email}`);

	// ==========================================
	// Bancos de ejemplo
	// ==========================================
	const bancoNacion = await prisma.banco.upsert({
		where: { cbu: "0110000000000000000001" },
		update: {},
		create: {
			nombre: "Banco de la Nación Argentina",
			sucursal: "Casa Central",
			numeroCuenta: "0000-0000000-00",
			cbu: "0110000000000000000001",
			tipoCuenta: "CUENTA_CORRIENTE",
			saldoInicial: 0,
		},
	});
	console.log(`✅ Banco creado: ${bancoNacion.nombre}`);

	const bancoGalicia = await prisma.banco.upsert({
		where: { cbu: "0070000000000000000001" },
		update: {},
		create: {
			nombre: "Banco Galicia",
			sucursal: "Sucursal Centro",
			numeroCuenta: "0000-0000000-01",
			cbu: "0070000000000000000001",
			tipoCuenta: "CUENTA_CORRIENTE",
			saldoInicial: 0,
		},
	});
	console.log(`✅ Banco creado: ${bancoGalicia.nombre}`);

	// ==========================================
	// Proveedores de ejemplo
	// ==========================================
	const proveedor1 = await prisma.proveedor.upsert({
		where: { cuit: "30712345678" },
		update: {},
		create: {
			razonSocial: "Semillas del Sur S.A.",
			cuit: "30712345678",
			condicionIva: "RESPONSABLE_INSCRIPTO",
			direccion: "Av. Corrientes 1234, CABA",
			telefono: "011-4567-8901",
			email: "contacto@semillasdelsur.com",
		},
	});
	console.log(`✅ Proveedor creado: ${proveedor1.razonSocial}`);

	const proveedor2 = await prisma.proveedor.upsert({
		where: { cuit: "20234567891" },
		update: {},
		create: {
			razonSocial: "Agroquímicos Norte",
			cuit: "20234567891",
			condicionIva: "RESPONSABLE_INSCRIPTO",
			direccion: "Ruta 9 Km 150, Córdoba",
			telefono: "0351-456-7890",
			email: "ventas@agroquimicosnorte.com",
		},
	});
	console.log(`✅ Proveedor creado: ${proveedor2.razonSocial}`);

	// ==========================================
	// Clientes de ejemplo
	// ==========================================
	const cliente1 = await prisma.cliente.upsert({
		where: { cuit: "30698765432" },
		update: {},
		create: {
			razonSocial: "Cereales Pampeanos S.R.L.",
			cuit: "30698765432",
			condicionIva: "RESPONSABLE_INSCRIPTO",
			direccion: "Calle 50 Nro 1234, La Plata",
			telefono: "0221-456-7890",
			email: "admin@cerealespampeanos.com",
		},
	});
	console.log(`✅ Cliente creado: ${cliente1.razonSocial}`);

	const cliente2 = await prisma.cliente.upsert({
		where: { cuit: "27345678901" },
		update: {},
		create: {
			razonSocial: "María García - Monotributista",
			cuit: "27345678901",
			condicionIva: "MONOTRIBUTISTA",
			direccion: "San Martín 567, Rosario",
			telefono: "0341-234-5678",
		},
	});
	console.log(`✅ Cliente creado: ${cliente2.razonSocial}`);

	console.log("\n🎉 Seed completado exitosamente!");
	console.log("📧 Login: admin@agrogestion.com / admin123");
}

main()
	.catch((e) => {
		console.error("❌ Error en seed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
