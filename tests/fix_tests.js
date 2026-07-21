import fs from 'fs';
import path from 'path';

const testFile = path.resolve('tests/avatar-maker.test.jsx');
let content = fs.readFileSync(testFile, 'utf8');

content = content.replace(/glasses/g, 'accessories_1');
content = content.replace(/hats/g, 'accessories_2');
content = content.replace(/base/g, 'skin');
content = content.replace(/hair/g, 'hair_back');

fs.writeFileSync(testFile, content);
console.log('Tests updated!');
