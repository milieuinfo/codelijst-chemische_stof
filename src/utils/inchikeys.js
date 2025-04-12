import csv from 'csvtojson';
import {
    config
} from './variables.js';

async function inchikeys_from_csv() {
    console.log("inchikeys_from_csv");
    var inchikeys = [];
    var re = new RegExp("^..............-..........-.$");
    await csv({
        ignoreEmpty:true,
        flatKeys:true
    })
        .fromFile(config.source.path + config.source.codelijst_csv)
        .then((jsonObj)=>{
            for(var i = 0; i < jsonObj.length; i++){
                Object.keys(jsonObj[i]).forEach(function(key) {
                    if (key === 'uri_inchikey' && re.test(jsonObj[i][key])  ) {
                        inchikeys.push(jsonObj[i][key])
                    }
                })
            }
        })
    return inchikeys
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