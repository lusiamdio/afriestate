const fs = require('fs');

const updateFile = (filename) => {
    let content = fs.readFileSync(filename, 'utf-8');

    // Replace BookAStayPage specific colors
    content = content.replace(/bg-\[#F8F6F1\]/g, 'bg-brand-light');
    content = content.replace(/text-\[#1D1D1D\]/g, 'text-brand-dark');
    content = content.replace(/bg-\[#0B3B2E\]/g, 'bg-brand-primary');
    content = content.replace(/from-\[#0B3B2E\]/g, 'from-brand-primary');
    content = content.replace(/ring-\[#0B3B2E\]/g, 'ring-brand-primary');
    content = content.replace(/text-\[#D4A24C\]/g, 'text-brand-gold');
    content = content.replace(/hover:text-\[#b4863a\]/g, 'hover:text-brand-gold/80');
    content = content.replace(/text-\[#0B3B2E\]/g, 'text-brand-primary');
    content = content.replace(/bg-\[#1D1D1D\]/g, 'bg-brand-dark');
    content = content.replace(/hover:bg-\[#0B3B2E\]/g, 'hover:bg-brand-primary');
    content = content.replace(/bg-\[#D4A24C\]/g, 'bg-brand-secondary');
    content = content.replace(/hover:bg-\[#b4863a\]/g, 'hover:bg-brand-secondary/80');
    content = content.replace(/hover:bg-\[#07261d\]/g, 'hover:bg-brand-primary/90');
    content = content.replace(/border-\[#0B3B2E\]/g, 'border-brand-primary');
    content = content.replace(/group-hover:text-\[#D4A24C\]/g, 'group-hover:text-brand-gold');

    // Replace text typography (BookAStayPage)
    content = content.replace(/font-serif/g, 'font-heading');
    
    // Replace FindWellnessPage specific colors
    content = content.replace(/bg-\[#FbF9f6\]/g, 'bg-brand-light');
    content = content.replace(/from-\[#FbF9f6\]/g, 'from-brand-light');
    content = content.replace(/to-\[#FbF9f6\]/g, 'to-brand-light');
    content = content.replace(/bg-\[#F2EFEB\]/g, 'bg-brand-light\/50');
    content = content.replace(/text-\[#2B4032\]/g, 'text-brand-primary');
    content = content.replace(/ring-\[#a8b8a0\]/g, 'ring-brand-primary\/50');
    content = content.replace(/bg-\[#2B4032\]/g, 'bg-brand-primary');
    content = content.replace(/hover:bg-\[#1f2f24\]/g, 'hover:bg-brand-primary\/90');
    content = content.replace(/border-\[#2B4032\]/g, 'border-brand-primary');
    content = content.replace(/text-\[#E5DCC2\]/g, 'text-brand-gold');
    content = content.replace(/text-\[#8c9c8e\]/g, 'text-slate-500');
    content = content.replace(/hover:border-\[#D4A24C\]/g, 'hover:border-brand-gold');
    content = content.replace(/text-\[#D4A24C\]/g, 'text-brand-gold');

    // typography (FindWellnessPage) - actually nothing specified, maybe just font-heading where appropriate
    content = content.replace(/text-slate-800/g, 'text-brand-dark');
    content = content.replace(/font-bold/g, 'font-semibold');
    content = content.replace(/text-5xl md:text-7xl/g, 'text-5xl md:text-7xl font-heading');
    content = content.replace(/text-4xl/g, 'text-4xl font-heading');
    content = content.replace(/text-5xl/g, 'text-5xl font-heading');
    content = content.replace(/text-xl font-semibold mb-1/g, 'text-xl font-heading font-semibold mb-1');
    content = content.replace(/text-xl font-semibold mb-2/g, 'text-xl font-heading font-semibold mb-2');

    fs.writeFileSync(filename, content);
};

updateFile('./components/pages/BookAStayPage.tsx');
updateFile('./components/pages/FindWellnessPage.tsx');

console.log('Update generic hex classes done');
