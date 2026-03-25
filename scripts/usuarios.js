#!/usr/bin/env node
// Script CLI para agregar, modificar o eliminar usuarios en PostgreSQL vía Prisma

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

function parseArgs() {
	const args = process.argv.slice(2);
	const cmd = args[0];
	const params = {};
	for (let i = 1; i < args.length; i++) {
		if (args[i].startsWith('--')) {
			params[args[i].replace('--', '')] = args[i + 1];
			i++;
		}
	}
	return { cmd, params };
}

async function prompt(question) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function main() {
	const { cmd, params } = parseArgs();
	if (!['add', 'edit', 'delete'].includes(cmd)) {
		console.log('Uso: node usuarios.js add|edit|delete --email EMAIL [--password PASS] [--role ROL] [--name NOMBRE]');
		process.exit(1);
	}

	let email = params.email;
	if (!email) email = await prompt('Email: ');
	email = email.toLowerCase().trim();

	if (cmd === 'add') {
		let password = params.password || await prompt('Contraseña: ');
		let role = params.role || await prompt('Rol (ADMIN/EMPLEADO): ');
		let name = params.name || await prompt('Nombre: ');
		const hashed = await bcrypt.hash(password, 12);
		await prisma.user.create({ data: { email, password: hashed, role, name, active: true } });
		console.log('Usuario creado.');
	} else if (cmd === 'edit') {
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) return console.log('Usuario no encontrado.');
		let updates = {};
		if (params.password) updates.password = await bcrypt.hash(params.password, 12);
		if (params.role) updates.role = params.role;
		if (params.name) updates.name = params.name;
		await prisma.user.update({ where: { email }, data: updates });
		console.log('Usuario actualizado.');
	} else if (cmd === 'delete') {
		await prisma.user.delete({ where: { email } });
		console.log('Usuario eliminado.');
	}
	await prisma.$disconnect();
}

main();
