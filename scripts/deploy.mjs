// Publish only the static public/ allowlist. No personal workspace files.
import {mkdtemp,cp,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
const run=(cmd,args,cwd=process.cwd())=>execFileSync(cmd,args,{cwd,stdio:'inherit'});
const repo='https://github.com/selment1/night-arcade.git';
run('npm',['test']);
for(const name of ['care-coins','id-care','id-ui','estates-engine','estates-solo','pet-core','shogi','reversi','recall','stack','quiz','pet-journey']) run('node',['scripts/verify-'+name+'.mjs',...(name==='shogi'?['--ui']:[])]);

run('git',['add','public','scripts','package.json','package-lock.json','README.md','docs','.gitignore','server.mjs']);
try{execFileSync('git',['diff','--cached','--quiet'])}catch{run('git',['commit','-m','Improve and verify five browser games'])}
run('git',['push','origin','main']);
const dir=await mkdtemp(join(tmpdir(),'night-arcade-public-'));
run('git',['init','-b','gh-pages'],dir);run('git',['config','user.name','Night Arcade'],dir);run('git',['config','user.email','271698725+selment1@users.noreply.github.com'],dir);run('git',['remote','add','origin',repo],dir);
const exists=execFileSync('git',['ls-remote','--heads',repo,'gh-pages'],{encoding:'utf8'}).trim();
if(exists){run('git',['fetch','origin','gh-pages'],dir);run('git',['reset','--hard','FETCH_HEAD'],dir)}
for(const name of await readdir('public'))await cp(join('public',name),join(dir,name),{recursive:true});
await writeFile(join(dir,'.nojekyll'),'');
run('git',['add','.'],dir);
try{execFileSync('git',['diff','--cached','--quiet'],{cwd:dir})}catch{run('git',['commit','-m','Publish verified arcade'],dir)}
run('git',['push','origin','HEAD:gh-pages'],dir);
console.log('Uploaded. Verify Pages deployment and https://selment1.github.io/night-arcade/ before reporting published.');
