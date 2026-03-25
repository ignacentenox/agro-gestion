import { prisma } from "../lib/prisma";

export async function getFacturaEmitidaById(id: string | number | undefined) {
	if (id === undefined || id === null || id === "") {
		throw new Error("ID de factura inválido o no proporcionado");
	}
	// Si el modelo usa id numérico, descomenta la siguiente línea:
	// const idValue = typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id;
	// Si el modelo usa id string (UUID), usa directamente:
	const idValue = typeof id === "string" ? id : String(id);
	return await prisma.facturaEmitida.findUnique({
		where: { id: idValue },
		include: {
			cliente: true,
		},
	});
}
