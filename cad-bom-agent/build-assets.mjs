import {cpSync} from 'node:fs';
cpSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','dist/pdf.worker.min.mjs');
for(const dir of ['cmaps','standard_fonts','wasm'])cpSync('node_modules/pdfjs-dist/'+dir,'dist/'+dir,{recursive:true});
