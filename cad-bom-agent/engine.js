import DxfParser from 'dxf-parser';
export function parse(text){return new DxfParser().parseSync(text)}
const dist=(a,b)=>Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));
export function length(e){
 if(e.type==='LINE')return dist(e.vertices[0],e.vertices[1]);
 if(e.type==='CIRCLE')return 2*Math.PI*e.radius;
 if(e.type==='ARC'){let d=e.endAngle-e.startAngle;while(d<0)d+=Math.PI*2;return d*e.radius;}
 if(['LWPOLYLINE','POLYLINE'].includes(e.type)){
 let n=0,v=e.vertices||[];for(let i=0;i<v.length-(e.shape?0:1);i++){let a=v[i],b=v[(i+1)%v.length],c=dist(a,b),bulge=a.bulge||0;n+=bulge?c*(1+bulge*bulge)/(4*Math.abs(bulge))*Math.abs(4*Math.atan(bulge)):c;}return n;}
 return null;
}
export function extract(dxf,unit='mm'){
 const scale={mm:.001,cm:.01,m:1,in:.0254,ft:.3048}[unit],groups=new Map(),warnings=new Set();let ignored=0;
 for(const e of dxf.entities||[]){
 if(e.inPaperSpace){warnings.add('배치 공간 객체는 집계에서 제외했습니다.');continue;}
 if(e.type==='INSERT'){let name=e.name||'이름 없는 블록',count=(e.columnCount||1)*(e.rowCount||1),key='block:'+e.layer+':'+name;
 let r=groups.get(key)||{id:key,layer:e.layer||'0',name,kind:'블록',spec:'규격 확인 필요',quantity:0,unit:'EA',price:0,waste:0,checked:false,evidence:'INSERT · '+name};r.quantity+=count;groups.set(key,r);
 if(dxf.blocks?.[name]?.entities?.some(x=>x.type==='INSERT'))warnings.add('중첩 블록은 상위 블록 단위로 집계합니다. 내부 구성품은 별도 검토하세요.');
 }else {const n=length(e);if(n===null){ignored++;continue;}if(!Number.isFinite(n)){warnings.add('길이를 계산할 수 없는 도형이 있습니다.');continue;}
 let key='length:'+(e.layer||'0'),r=groups.get(key)||{id:key,layer:e.layer||'0',name:e.layer==='0'?'미지정 선재':e.layer,kind:'길이',spec:'자재 매핑 필요',quantity:0,unit:'m',price:0,waste:0,checked:false,evidence:'레이어 내 LINE / POLYLINE / ARC / CIRCLE'};r.quantity+=n*scale;groups.set(key,r);}
 }
 if(ignored)warnings.add(`문자·치수·해치·스플라인 등 ${ignored}개 객체는 수량 집계에서 제외했습니다.`);
 warnings.add('모델 공간 도형을 집계합니다. 중복선·보조선·상세도·배치 공간 혼입 여부를 확인하세요.');
 return {rows:[...groups.values()],warnings:[...warnings],entities:(dxf.entities||[]).filter(e=>!e.inPaperSpace)};
}
