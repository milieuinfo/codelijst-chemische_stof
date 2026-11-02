'use strict';
import { generate_skos } from '@milieuinfo/maven-metadata-generator-npm';
import { chemont_taxonomy_to_skos } from './utils/chemont_to_skos.js';
import { chebi_information } from './utils/chebi_to_skos.js';
import { skosOptions, skosSource } from './utils/variables.js';

// De codelijst en de twee verrijkingen (ChemOnt-taxonomie, ChEBI) zijn onafhankelijk van elkaar:
// een fout in de ene stap houdt de andere niet tegen, maar het script eindigt dan wel met exit code 1.
const steps = [
    ['codelijst', () => generate_skos(skosOptions, skosSource)],
    ['chemont-taxonomie', chemont_taxonomy_to_skos],
    ['chebi', chebi_information],
];

let failed = false;
for (const [name, step] of steps) {
    try {
        await step();
    } catch (err) {
        failed = true;
        console.error(`${name} mislukt: ${err.message}`);
    }
}
if (failed) process.exit(1);
