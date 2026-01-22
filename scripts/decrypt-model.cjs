const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const password = "Character3D#@";
const inputPath = path.join(__dirname, '../public/models/character.enc');
const outputPath = path.join(__dirname, '../public/models/character.glb');

async function decrypt() {
    console.log(`Reading from ${inputPath}...`);
    const encryptedData = fs.readFileSync(inputPath);

    // The browser code slices the first 16 bytes for IV
    const iv = encryptedData.slice(0, 16);
    const data = encryptedData.slice(16);

    console.log('Deriving key...');
    // Node.js crypto equivalent of the Web Crypto API key derivation
    const key = crypto.createHash('sha256').update(password).digest().slice(0, 32);

    console.log('Decrypting...');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    console.log(`Writing to ${outputPath}...`);
    fs.writeFileSync(outputPath, decrypted);
    console.log('Done!');
}

decrypt().catch(console.error);
