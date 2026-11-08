const fs = require('fs');
let s = fs.readFileSync('constants.ts', 'utf8');

const titleToImage = {
    'Modern Family Home in Suburbs': '/src/assets/images/house_suburbs_1779978598551.png',
    'Luxury Penthouse in the City': '/src/assets/images/luxury_kitchen_living_1779978720358.png',
    'Cozy Seaside Cottage': '/src/assets/images/modern_house_tan_1779978632706.png',
    'Off-Grid Eco Cabin': '/src/assets/images/house_pool_1779978750296.png',
    'Downtown Co-Working Space': '/src/assets/images/interior_beanbags_1779978650034.png',
    'Beachfront Villa': '/src/assets/images/coastal_mansion_1779978805301.png',
    'Shared Student Apartment': '/src/assets/images/apartment_block_1779978678706.png',
    'Premium Studio Apartment': '/src/assets/images/loft_interior_1779978697203.png',
    'Charming Parisian Apartment': '/src/assets/images/apartment_dining_1779978782850.png',
    'Modern Tokyo Micro-Loft': '/src/assets/images/loft_interior_1779978697203.png',
    'Sydney Harbour View House': '/src/assets/images/harbour_house_1779978766107.png',
    'Winelands Wellness & Yoga Retreat': '/src/assets/images/spa_wellness_1779978823248.png',
    'Chic City Studio for Weekend Getaway': '/src/assets/images/apartment_dining_1779978782850.png',
    'Luxury SUV Rental - Cape Town': '/src/assets/images/house_pool_1779978750296.png'
};

const defaultImage = '/src/assets/images/apartment_block_1779978678706.png';

let currentTitle = null;
let lines = s.split('\n');
for (let i = 0; i < lines.length; i++) {
    const titleMatch = lines[i].match(/title:\s*'(.*?)'/);
    if (titleMatch) {
        currentTitle = titleMatch[1];
    }
    
    if (lines[i].includes('images: [')) {
        if (currentTitle) {
            const img = titleToImage[currentTitle] || defaultImage;
            lines[i+1] = `    '${img}',`;
        }
    }
}

fs.writeFileSync('constants.ts', lines.join('\n'));
console.log('Done mapping images by title.');
