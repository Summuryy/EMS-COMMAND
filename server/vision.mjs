import zlib from 'node:zlib';
export function imageInfo(buffer){
  if(buffer.length>=24 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
    const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20);
    if(!width||!height)throw Error('Неверный размер PNG');
    return {mime:'image/png',width,height};
  }
  if(buffer[0]===255&&buffer[1]===216){
    let i=2;
    while(i+9<buffer.length){
      if(buffer[i]!==255){i++;continue;}
      const marker=buffer[i+1];i+=2;
      if(marker===0xd8||marker===0x01)continue;
      if(marker===0xda||marker===0xd9) break;
      const len=buffer.readUInt16BE(i);
      if(len<2||i+len>buffer.length) break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
        return {mime:'image/jpeg',width:buffer.readUInt16BE(i+5),height:buffer.readUInt16BE(i+3)};
      }
      i+=len;
    }
    throw Error('Не удалось прочитать размер JPEG');
  }
  throw Error('Допускаются только настоящие PNG/JPEG изображения');
}
export function decodePng(buffer){
  const info=imageInfo(buffer);
  if(info.mime!=='image/png')return null;
  const {width:w,height:h}=info;
  if(w*h>24_000_000) throw Error('Изображение слишком большое');
  let p=8,depth=0,type=0,interlace=0;const data=[];
  while(p+12<=buffer.length){
    const len=buffer.readUInt32BE(p), tag=buffer.toString('ascii',p+4,p+8);
    if(len>12_000_000||p+len+12>buffer.length) throw Error('Повреждён PNG');
    if(tag==='IHDR'){depth=buffer[p+16];type=buffer[p+17];interlace=buffer[p+20];}
    if(tag==='IDAT')data.push(buffer.subarray(p+8,p+8+len));
    p+=len+12;if(tag==='IEND')break;
  }
  if(depth!==8||![0,2,6].includes(type)||interlace!==0) return null;
  const bpp=type===6?4:type===2?3:1, stride=w*bpp;
  const raw=zlib.inflateSync(Buffer.concat(data),{maxOutputLength:(stride+1)*h});
  if(raw.length!==(stride+1)*h) throw Error('Повреждён PNG: размер данных');
  const pixels=Buffer.allocUnsafe(w*h*3), prev=Buffer.alloc(stride),row=Buffer.alloc(stride);
  let src=0,dst=0;
  for(let y=0;y<h;y++){
    const filter=raw[src++];
    if(filter>4)throw Error('Повреждён PNG: фильтр');
    for(let x=0;x<stride;x++){
      const left=x>=bpp?row[x-bpp]:0,up=prev[x],ul=x>=bpp?prev[x-bpp]:0;
      let v=raw[src++];
      if(filter===1)v+=left;
      if(filter===2)v+=up;
      if(filter===3)v+=Math.floor((left+up)/2);
      if(filter===4){const pred=left+up-ul,pa=Math.abs(pred-left),pb=Math.abs(pred-up),pc=Math.abs(pred-ul);v+=pa<=pb&&pa<=pc?left:pb<=pc?up:ul;}
      row[x]=v&255;
    }
    for(let x=0;x<w;x++){
      const s=x*bpp;
      if(type===0){pixels[dst++]=row[s];pixels[dst++]=row[s];pixels[dst++]=row[s];}
      else {pixels[dst++]=row[s];pixels[dst++]=row[s+1];pixels[dst++]=row[s+2];}
    }
    row.copy(prev);
  }
  return {width:w,height:h,rgb:pixels};
}
export function cropPPM(image,roi,scale=2){
  const w=image.width,h=image.height;
  const x0=Math.max(0,Math.floor(roi[0]*w)),y0=Math.max(0,Math.floor(roi[1]*h));
  const x1=Math.min(w,Math.ceil(roi[2]*w)),y1=Math.min(h,Math.ceil(roi[3]*h));
  const cw=Math.max(1,x1-x0),ch=Math.max(1,y1-y0);
  const ow=cw*scale,oh=ch*scale;
  const header=Buffer.from(`P6\n${ow} ${oh}\n255\n`);
  const out=Buffer.allocUnsafe(header.length+ow*oh*3);header.copy(out);let offset=header.length;
  for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){
    const sy=Math.min(h-1,y0+Math.floor(y/scale)),sx=Math.min(w-1,x0+Math.floor(x/scale));
    const s=(sy*w+sx)*3;
    // Color-to-grayscale with contrast enhancement to help OCR small text
    const luminance=Math.round(image.rgb[s]*.299+image.rgb[s+1]*.587+image.rgb[s+2]*.114);
    const value=luminance>148?0:255;
    out[offset++]=value;out[offset++]=value;out[offset++]=value;
  }
  return out;
}
export function redBodycam(image){
  if(!image)return {state:'unknown',pixels:0};
  const w=image.width,h=image.height;
  const x0=Math.floor(w*.185),x1=Math.ceil(w*.207),y0=Math.floor(h*.724),y1=Math.ceil(h*.772);
  let count=0,maxCluster=0;
  for(let y=y0;y<y1;y++){
    let run=0;
    for(let x=x0;x<x1;x++){
      const s=(y*w+x)*3,r=image.rgb[s],g=image.rgb[s+1],b=image.rgb[s+2];
      if(r>165&&r>g*1.5&&r>b*1.34&&g<155){count++;run++;maxCluster=Math.max(maxCluster,run);}else run=0;
    }
  }
  return {state:count>=15&&maxCluster>=3?'on':'not_found',pixels:count};
}
export function greenToast(image){
  if(!image)return false;
  const {width:w,height:h,rgb}=image;
  let count=0;
  for(let y=Math.floor(h*.915);y<Math.floor(h*.973);y+=2){
    for(let x=Math.floor(w*.382);x<Math.floor(w*.630);x+=2){
      const s=(y*w+x)*3,r=rgb[s],g=rgb[s+1],b=rgb[s+2];
      if(g>140&&g>r*1.25&&g>b*1.05)count++;
    }
  }
  return count>=5;
}
