const bcrypt = require('bcryptjs');

// Change this to your desired admin password
const password = 'admin123';  // ← Change this to your new password
const hash = bcrypt.hashSync(password, 12);

console.log(`Generated hash for password "${password}":`);
console.log(hash);

// Test it immediately
const isValid = bcrypt.compareSync(password, hash);
console.log('Hash validation:', isValid);

// Save to environment format
console.log('\nAdd this to your .env.local:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
