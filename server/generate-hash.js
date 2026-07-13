// generate-hash.js
const bcrypt = require('bcryptjs');

// Changez le mot de passe si vous voulez
const password = 'deptaudio2026'; 

const hash = bcrypt.hashSync(password, 10);

console.log('=================================');
console.log(' Mot de passe:', password);
console.log(' Hash généré:', hash);
console.log(' Longueur du hash:', hash.length);
console.log('=================================');