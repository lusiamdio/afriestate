import { saveProperties } from './lib/data.ts';
import { ALL_PROPERTIES } from './constants.ts';

async function seed() {
    await saveProperties(ALL_PROPERTIES);
    console.log('Seeded properties into DB.');
}

seed();
