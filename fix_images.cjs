const fs = require('fs');

function addReferrerPolicy(file) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/<img(.*?)>/g, (match, p1) => {
        if (!p1.includes('referrerPolicy')) {
             if (p1.endsWith('/')) {
                return `<img${p1.slice(0, -1)} referrerPolicy="no-referrer" />`;
            } else {
                return `<img${p1} referrerPolicy="no-referrer" />`;
            }
        }
        return match;
    });
    fs.writeFileSync(file, content);
}

addReferrerPolicy('components/AuthModal.tsx');
addReferrerPolicy('components/pages/BookAStayPage.tsx');
addReferrerPolicy('components/pages/FindWellnessPage.tsx');
addReferrerPolicy('components/pages/RentACarPage.tsx');
console.log('Fixed images');
