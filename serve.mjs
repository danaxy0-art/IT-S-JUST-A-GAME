import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('./',import.meta.url)),port=Number(process.env.PORT||8080);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer(async(req,res)=>{try{let requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+requested);if(file!==path.resolve(root)&&!file.startsWith(root)){res.writeHead(403);res.end('Forbidden');return}if((await stat(file)).isDirectory())file=path.join(file,'index.html');let data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Port '+port+' is in use. Stop the other server or set PORT to another number.':err.message);process.exitCode=1});
server.listen(port,'127.0.0.1',()=>console.log(`It's just a game.\nOpen http://localhost:${port}\nPress Ctrl+C to stop.`));
