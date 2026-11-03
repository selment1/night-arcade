export const directions=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
export function initial(){const b=Array(64).fill(0);b[27]=b[36]=2;b[28]=b[35]=1;return b}
export function flips(b,i,p){if(!Number.isInteger(i)||i<0||i>63||b[i])return [];const r=i>>3,c=i%8,out=[];for(const[dr,dc]of directions){let y=r+dr,x=c+dc,a=[];while(y>=0&&y<8&&x>=0&&x<8&&b[y*8+x]===3-p){a.push(y*8+x);y+=dr;x+=dc}if(a.length&&y>=0&&y<8&&x>=0&&x<8&&b[y*8+x]===p)out.push(...a)}return out}
export function moves(b,p){return b.map((_,i)=>i).filter(i=>flips(b,i,p).length)}
export function play(b,i,p){const f=flips(b,i,p);if(!f.length)return null;const board=b.slice();board[i]=p;f.forEach(j=>board[j]=p);const other=moves(board,3-p).length,own=moves(board,p).length;return {board,turn:other?3-p:p,pass:!other&&!!own,ended:!other&&!own}}
