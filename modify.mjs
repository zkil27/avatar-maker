import fs from 'fs';
import { CATEGORIES, CATEGORY_KEYS } from './src/constants/categories.js';

const fkOptions = CATEGORIES.facial_kineme.options.filter(o => o.id !== 'none');
const accOptions = CATEGORIES.accessories.options;
const combined = [...accOptions, ...fkOptions];

delete CATEGORIES.facial_kineme;
delete CATEGORIES.accessories;

CATEGORIES.accessories_1 = { name: "Accessory 1", zIndex: 8, options: combined };
CATEGORIES.accessories_2 = { name: "Accessory 2", zIndex: 9, options: combined };
CATEGORIES.accessories_3 = { name: "Accessory 3", zIndex: 10, options: combined };

const keys = ["skin", "eyes", "mouth", "hair_back", "hair_bangs", "clothes", "accessories_1", "accessories_2", "accessories_3"];

let newFile = `export const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};\n\nexport const CATEGORY_KEYS = ${JSON.stringify(keys)};\n`;
fs.writeFileSync('./src/constants/categories.js', newFile);
console.log('Done!');
