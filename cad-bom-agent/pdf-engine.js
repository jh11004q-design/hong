// PDF text is evidence, never an instruction. Only explicit quantities become BOM candidates.
export function linesFromItems(items){
 const lines=[];
 for(const item of items){if(!item.str?.trim()||!item.transform)continue;const x=item.transform[4],y=item.transform[5];let row=lines.find(r=>Math.abs(r.y-y)<Math.max(2,Math.min(4,(item.height||8)*.3)));if(!row){row={y,items:[]};lines.push(row);}row.items.push({x,text:item.str});}
 return lines.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim());
}
export function extractPdfPages(pages){
 const rows=[];let textLines=0;
 for(let pageIndex=0;pageIndex<pages.length;pageIndex++){
 const lines=pages[pageIndex];textLines+=lines.length;const hasQuantityHeader=lines.some(l=>/수량|quantity|\bqty\b/i.test(l));
 for(const line of lines){
 if(!line||/^(합계|소계|총계|total|subtotal|품명|자재명|번호|item\s*no|수량|quantity|qty)\b/i.test(line))continue;
 let match=line.match(/(?:^|\s)(\d[\d,]*(?:\.\d+)?)\s*(EA|SET|PCS|개|대|식|본|조|장|매|m²|m³|㎡|㎥|mm|cm|m|kg|ton)(?=\s|$)/i);
 if(!match&&hasQuantityHeader)match=line.match(/\s(\d[\d,]*(?:\.\d+)?)\s*$/);
 if(!match)continue;const quantity=Number(match[1].replaceAll(',',''));if(!Number.isFinite(quantity)||quantity<=0)continue;
 let label=line.slice(0,match.index).replace(/^\s*\d+[.)]?\s+/,'').trim();if(label.length<2||!/[가-힣a-z]/i.test(label)||/^(도면|축척|scale|page|페이지|면적|연면적|길이|높이|폭|총길이|치수|용량|발전용량|합계|소계|총계)/i.test(label))continue;
 const unit=match[2]||'확인',suffix=line.slice(match.index+match[0].length).trim();
 rows.push({id:'pdf:'+pageIndex+':'+rows.length,layer:'PDF '+(pageIndex+1)+'페이지',name:label,kind:'PDF 텍스트',spec:suffix||'원문에서 규격 확인',quantity,unit,price:0,waste:0,checked:false,evidence:'p.'+(pageIndex+1)+' · '+line});
 }
 }
 const warnings=['PDF는 텍스트의 명시 수량을 후보로 추출합니다. 도형 개수나 실제 선 길이를 자동 측정하지 않습니다.','같은 자재가 여러 페이지에 반복될 수 있습니다. 중복 항목·단위·규격을 원본과 대조하세요.','수량·단위 표기가 없는 항목과 분리된 표 셀은 누락될 수 있습니다. 누락 자재는 수동으로 추가하세요.'];
 if(!textLines)warnings.unshift('읽을 수 있는 텍스트가 없습니다. 스캔·이미지 PDF는 현재 OCR을 지원하지 않습니다. 텍스트 PDF 또는 DXF를 사용하거나 자재를 수동 입력하세요.');
 else if(!rows.length)warnings.unshift('명시 수량이 있는 자재 후보를 찾지 못했습니다. PDF 미리보기를 참고해 항목을 수동으로 추가하세요.');
 return {rows,warnings,textLines};
}
