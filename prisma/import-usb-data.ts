import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL no esta definido");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Datos extraídos del USB /Volumes/POROTO/Users/ALVAROMORES/Documents
// Fuente: PDFs de FACTURAS + Excels de CUENTAS CORRIENTES y SOY AGRO LAND

const proveedores = [
	{
		razonSocial: "MORES SANTIAGO",
		cuit: "23331512249",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Emisor de facturas (cerealera, fertilizantes)",
	},
	{
		razonSocial: "MORES OMAR BAUTISTA",
		cuit: "20110860537",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Emisor de facturas",
	},
	{
		razonSocial: "AGROIN LAS PIEDRAS LTDA.",
		cuit: "30716497034",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Proveedor (cuenta corriente SOYAGRO LAND)",
	},
	{
		razonSocial: "SOYAGRO PROD S.A.S.",
		cuit: "30000122280",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Código interno 12228 - Producción Soja/Maíz/Sorgo",
	},
	{
		razonSocial: "AGRO GESTION PROD S.A.S.",
		cuit: "30000122281",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Código interno 12228 - Gestión de producción",
	},
];

const clientes = [
	{
		razonSocial: "CEREALERA PUNTANA S.R.L.",
		cuit: "30711515808",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Receptor de facturas (fertilizantes, productos agrícolas)",
	},
	{
		razonSocial: "THOREAU",
		cuit: "20333251540",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Receptor de facturas",
	},
	{
		razonSocial: "AYUSO",
		cuit: "20181052083",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Receptor de facturas",
	},
	{
		razonSocial: "GAUDE",
		cuit: "20233897591",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Receptor de facturas",
	},
	{
		razonSocial: "LA FLOR",
		cuit: "30714183458",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Receptor de facturas",
	},
	{
		razonSocial: "LOREA",
		cuit: "30643212397",
		condicionIva: "RESPONSABLE_INSCRIPTO" as const,
		observaciones: "Receptor de facturas",
	},
];

async function main() {
	console.log("🚜 Importando datos desde USB...\n");

	// Importar proveedores
	let createdProv = 0;
	let skippedProv = 0;
	for (const p of proveedores) {
		const exists = await prisma.proveedor.findUnique({ where: { cuit: p.cuit } });
		if (exists) {
			console.log(`  ⏭️  Proveedor ya existe: ${p.razonSocial} (${p.cuit})`);
			skippedProv++;
			continue;
		}
		await prisma.proveedor.create({ data: p });
		console.log(`  ✅ Proveedor creado: ${p.razonSocial} (${p.cuit})`);
		createdProv++;
	}

	// Importar clientes
	let createdCli = 0;
	let skippedCli = 0;
	for (const c of clientes) {
		const exists = await prisma.cliente.findUnique({ where: { cuit: c.cuit } });
		if (exists) {
			console.log(`  ⏭️  Cliente ya existe: ${c.razonSocial} (${c.cuit})`);
			skippedCli++;
			continue;
		}
		await prisma.cliente.create({ data: c });
		console.log(`  ✅ Cliente creado: ${c.razonSocial} (${c.cuit})`);
		createdCli++;
	}

	console.log(`\n📊 Resumen:`);
	console.log(`  Proveedores: ${createdProv} creados, ${skippedProv} ya existían`);
	console.log(`  Clientes: ${createdCli} creados, ${skippedCli} ya existían`);
	console.log(`\n✅ Importación completada.`);
}

main()
	.catch((e) => {
		console.error("❌ Error en importación:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
