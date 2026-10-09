// generate-hash.js
const bcrypt = require('bcryptjs');

const password = process.env.ADMIN_PASSWORD;

if (!password) {
	console.error('Définissez ADMIN_PASSWORD avant de générer son hash.');
	process.exit(1);
}

console.log(bcrypt.hashSync(password, 10));