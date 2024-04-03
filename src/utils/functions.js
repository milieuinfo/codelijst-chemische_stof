import fs from "fs";
import util from 'util'
import stream from 'stream'
const streamPipeline = util.promisify(stream.pipeline)
import mime from 'mime-types'
import fetch from 'node-fetch'

import Environment from '@zazuko/env/Environment.js'
import baseEnv from '@zazuko/env'
import { FsUtilsFactory } from '@zazuko/rdf-utils-fs'
import fromStream from 'rdf-dataset-ext/fromStream.js'
import formats from '@rdfjs/formats'

// create an environment by adding FsUtilsFactory
const env = new Environment([FsUtilsFactory], { parent: baseEnv })
// add parsers+serializers
env.formats.import(formats)



async function convert_file(input_file_path, output_file_path) {
    // parse
    const dataset = await env.dataset().import(env.fromFile(input_file_path))

// serialise
    await env.toFile(dataset.toStream(), output_file_path)
}

async function read_file_to_dataset(input_file_path) {
    // parse
    const dataset = await env.dataset().import(env.fromFile(input_file_path))
    return dataset
}

async function download(url, file_path) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
    const type = response.headers.get('Content-Type')
    await streamPipeline(response.body, fs.createWriteStream(file_path + `.${mime.extension(type)}`))
}



export { download , convert_file, read_file_to_dataset }