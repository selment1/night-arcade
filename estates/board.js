// Original game dataset. UNESCO listing names/links verified 2026-11-03.
// Values and color sets are fictional game balancing, not heritage valuations.
const locations = [
 ['アユタヤ','Historic City of Ayutthaya',576],['アヌラーダプラ','Sacred City of Anuradhapura',200],
 ['タオス・プエブロ','Taos Pueblo',492],['スカン・グアイ','SGang Gwaay',157],['ハル・サフリエニ','Ħal Saflieni Hypogeum',130],
 ['法隆寺','Buddhist Monuments in the Horyu-ji Area',660],['エローラ石窟群','Ellora Caves',243],['ヌビア遺跡群','Nubian Monuments from Abu Simbel to Philae',88],
 ['ダラム城と大聖堂','Durham Castle and Cathedral',370],['イスタンブル歴史地区','Historic Areas of Istanbul',356],['エルサレム旧市街','Old City of Jerusalem and its Walls',148],
 ['ウルル','Uluru-Kata Tjuta National Park',447],['ヨセミテ国立公園','Yosemite National Park',308],['シドニー・オペラハウス','Sydney Opera House',166],
 ['ペトラ','Petra',326],['アテネのアクロポリス','Acropolis, Athens',404],['万里の長城','The Great Wall',438],
 ['モン・サン・ミシェル','Mont-Saint-Michel and its Bay',80],['ローマ歴史地区','Historic Centre of Rome, the Properties of the Holy See in that City Enjoying Extraterritorial Rights and San Paolo Fuori le Mura',91],['ヴェルサイユ','Palace and Park of Versailles',83],
 ['タージ・マハル','Taj Mahal',252],['パリのセーヌ河岸','Paris, Banks of the Seine',600]
];
const groups=[['earth','#956349',2,50],['sky','#76c5e6',3,50],['rose','#da75ac',3,100],['citrus','#efa54a',3,100],['coral','#e66b69',3,150],['sun','#e0c741',3,150],['forest','#63a781',3,200],['ocean','#587bba',2,200]];
const positions=[1,3,6,8,9,11,13,14,16,18,19,21,23,24,26,27,29,31,32,34,37,39];
const prices=[60,60,100,100,120,140,140,160,180,180,200,220,220,240,260,260,280,300,300,320,350,400];
const rents=[[2,10,30,90,160,250],[4,20,60,180,320,450],[6,30,90,270,400,550],[6,30,90,270,400,550],[8,40,100,300,450,600],[10,50,150,450,625,750],[10,50,150,450,625,750],[12,60,180,500,700,900],[14,70,200,550,750,950],[14,70,200,550,750,950],[16,80,220,600,800,1000],[18,90,250,700,875,1050],[18,90,250,700,875,1050],[20,100,300,750,925,1100],[22,110,330,800,975,1150],[22,110,330,800,975,1150],[24,120,360,850,1025,1200],[26,130,390,900,1100,1275],[26,130,390,900,1100,1275],[28,150,450,1000,1200,1400],[35,175,500,1100,1300,1500],[50,200,600,1400,1700,2000]];
const board=Array.from({length:40},(_,id)=>({id,name:'',type:'parking'}));
let offset=0;
for(const [group,color,count,houseCost] of groups){for(let j=0;j<count;j++){const i=offset+j,[name,officialName,unescoId]=locations[i];board[positions[i]]={id:positions[i],name,officialName,type:'property',group,color,price:prices[i],rent:rents[i],houseCost,mortgage:prices[i]/2,source:`https://whc.unesco.org/en/list/${unescoId}/`};}offset+=count;}
for(const [id,name,type] of [[0,'旅の出発点','go'],[2,'旅人の手紙','chest'],[4,'旅の税金','tax'],[7,'旅のチャンス','chance'],[10,'休憩所・拘留','jail'],[17,'旅人の手紙','chest'],[20,'自由広場','parking'],[22,'旅のチャンス','chance'],[30,'拘留所へ','gotojail'],[33,'旅人の手紙','chest'],[36,'旅のチャンス','chance'],[38,'特別税','tax']])board[id]={id,name,type,...(type==='tax'?{amount:id===4?200:100}:{})};
for(const [id,name] of [[5,'東の鉄道'],[15,'南の港'],[25,'西の空港'],[35,'北の鉄道']])board[id]={id,name,type:'station',price:200,mortgage:100,rent:[25,50,100,200]};
for(const [id,name] of [[12,'クリーン電力'],[28,'水のネットワーク']])board[id]={id,name,type:'utility',price:150,mortgage:75,rent:[4,10]};
export const BOARD=Object.freeze(board.map(x=>Object.freeze({...x,...(x.rent?{rent:Object.freeze(x.rent)}:{})})));
