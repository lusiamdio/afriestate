const fs = require('fs');
let s = fs.readFileSync('constants.ts', 'utf8');

const images = [
    'https://images.unsplash.com/photo-1502672260266-1c1de24220e8?w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1529290076292-698f121d58c8?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1524813686514-a57563d77965?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09c15468?w=800&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    'https://images.unsplash.com/photo-1502602891460-0d7055745145?w=800&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c0d588fa?w=800&q=80'
];

let propIndex = 0;
// We will replace images array for each prop
s = s.replace(/images:\s*\[[\s\S]*?\],/g, (match) => {
    let img = images[propIndex % images.length];
    propIndex++;
    return `images: [\n    '${img}',\n],`;
});

fs.writeFileSync('constants.ts', s);
console.log('Images replaced!');
