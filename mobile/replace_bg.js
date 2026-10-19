const fs = require('fs');
let data = fs.readFileSync('mobile/src/data/jobCategories.ts', 'utf8');
data = data.replace(/bgColor: '#[A-Fa-f0-9]+'/g, "bgColor: '#FFFFFF'");
fs.writeFileSync('mobile/src/data/jobCategories.ts', data);

let catData = fs.readFileSync('mobile/src/components/CategoryIcon.tsx', 'utf8');
catData = catData.replace(/bgColor: '#[A-Fa-f0-9]+'/g, "bgColor: '#FFFFFF'");
fs.writeFileSync('mobile/src/components/CategoryIcon.tsx', catData);
console.log('done');
