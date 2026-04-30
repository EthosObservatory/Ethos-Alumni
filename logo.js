/* ETHOS — Logo transparency processing (shared across all pages) */
(async function () {
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'ethos-logo.png'; });
    const scale = Math.min(1, 900 / img.naturalWidth);
    const W = Math.round(img.naturalWidth * scale), H = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H), px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const s = px[i] + px[i+1] + px[i+2];
      if (s < 35) px[i+3] = 0; else if (s < 90) px[i+3] = Math.round((s - 35) / 55 * 255);
    }
    ctx.putImageData(d, 0, 0);
    let x0=W, y0=H, x1=0, y1=0;
    for (let y=0; y<H; y++) for (let x=0; x<W; x++)
      if (d.data[(y*W+x)*4+3] > 8) { if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    const p=6;
    x0=Math.max(0,x0-p); y0=Math.max(0,y0-p);
    x1=Math.min(W-1,x1+p); y1=Math.min(H-1,y1+p);
    const cw=x1-x0+1, ch=y1-y0+1, crop=document.createElement('canvas');
    crop.width=cw; crop.height=ch;
    crop.getContext('2d').drawImage(canvas, x0,y0,cw,ch, 0,0,cw,ch);
    const url = await new Promise(r => crop.toBlob(b => r(URL.createObjectURL(b)), 'image/png'));
    document.querySelectorAll('img.logo-img, img.logo-h1').forEach(el => {
      el.src = url;
      el.style.visibility = 'visible';
    });
  } catch {
    document.querySelectorAll('img.logo-img, img.logo-h1').forEach(el => {
      el.style.visibility = 'visible';
    });
  }
})();
