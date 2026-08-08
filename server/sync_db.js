const fs = require('fs');
const path = require('path');
const { defaultSeedData } = require('./src/services/seedData');

const dbFile = path.join(__dirname, './src/db/data.json');
fs.writeFileSync(dbFile, JSON.stringify(defaultSeedData, null, 2), 'utf8');
console.log('data.json updated with Web Pros Africa branding and product logos!');
