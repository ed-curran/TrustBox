import { compile } from 'json-schema-to-typescript';
import { writeFile } from 'fs/promises';
import { readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { readFile } from 'node:fs/promises';

const IN_SCHEMA_DIR = 'schemas';
const OUT_SCHEMA_DIR = 'generated';
async function compileAll(parent = '.') {
  const inDir = path.join(parent, IN_SCHEMA_DIR);
  const outDir = path.join(parent, OUT_SCHEMA_DIR);
  //rm(outDir, {recursive})
  if (!existsSync(outDir)) {
    mkdirSync(outDir);
  }
  //delete existing files
  //don't do this recursively because that scares me
  for (const file of readdirSync(outDir)) {
    await unlinkSync(path.join(outDir, file));
  }

  const files = readdirSync(inDir);
  const promises = files.map(async (fileName) => {
    if (fileName.endsWith('.json')) {
      const schemaName = fileName.slice(0, fileName.length - 5);
      const inFile = path.join(inDir, fileName)
      //write declaration file
      const declerationOutFile = path.join(outDir, `${schemaName}.ts`)
      console.log(`compiling ${inFile}`)
      const schemaContents = await readFile(inFile, {encoding: 'utf-8'})
      const schemaObject = JSON.parse(schemaContents)

      //write schema object file
      await compile(schemaObject, schemaName).then((ts) => {
        //export contents of the schema alongside the generated type
        const combined = ts + `\nexport const ${schemaName}Schema = ${schemaContents}`
        writeFile(declerationOutFile, combined)
      },);
      // const schemaOutFile = path.join(outDir, `${schemaName}Schema.ts`)
      // await writeFile(schemaOutFile, `export default ${schemaContents}`)
    }
  });
  await Promise.all(promises);
}
const dirs = ['src/trustlib', 'src/trustlib/trustframework'];
Promise.all(dirs.map((dir) => compileAll(dir))).then(() => {
  console.log('done');
});
