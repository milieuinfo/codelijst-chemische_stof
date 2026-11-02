import csv from 'csvtojson';
import {
    config
} from './variables.js';

const INCHIKEY = /^[A-Z]{14}-[A-Z]{10}-[A-Z]$/;

/**
 * Alle InChIKeys (kolom uri_inchikey) uit de codelijst-CSV's in config.source.codelijst_csv.
 * @returns {Promise<string[]>}
 */
async function inchikeys_from_csv() {
    console.log("inchikeys_from_csv");
    const files = [].concat(config.source.codelijst_csv);
    const inchikeys = new Set();
    for (const file of files) {
        const rows = await csv({ ignoreEmpty: true, flatKeys: true }).fromFile(config.source.path + file);
        for (const row of rows) {
            const key = (row.uri_inchikey ?? '').trim();
            if (INCHIKEY.test(key)) {
                inchikeys.add(key);
            }
        }
    }
    return [...inchikeys];
}

function clean_inchikey(key, value) {
    if (key === 'inchikey' && value.includes('=')) {
        return value.split('=')[1]; // return only inchikey
    }
    else {
        return value; //
    }
}
export { inchikeys_from_csv, clean_inchikey }
