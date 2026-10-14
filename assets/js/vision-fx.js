/* 시각 체험(vision.html)과 일상생활 체험(games.html)이 함께 쓰는 시각 효과.
   두 페이지가 같은 질환을 같은 모습으로 보여주도록, 질환 모양을 정하는
   계산은 여기 한 곳에만 둔다. 전역은 window.VisionFx 하나만 만든다. */
(function(){
  "use strict";

  function clamp01(v){ return Math.max(0, Math.min(1, v)); }

  // 녹내장 — 코 쪽과 위·아래 활 모양(궁상) 부위부터 불규칙하게 지워지고,
  // 말기에야 중심의 작은 섬만 남는다. 중심 시력은 끝까지 또렷하게 둔다.
  // 망막색소변성증(사방이 고르게 좁아짐)과 구분되도록 균일한 고리는 말기에만 더한다.
  // fx, fy: 또렷하게 보이는 중심 위치(%). 반환값은 CSS background 문자열.
  function glaucomaBackground(t, fx, fy){
    if(fx===undefined) fx = 50;
    if(fy===undefined) fy = 50;
    var dx = fx-50, dy = fy-50;
    function patch(w, h, x, y, a){
      a = Math.min(0.95, Math.max(0, a));
      return 'radial-gradient(ellipse '+w+'% '+h+'% at '+(x+dx)+'% '+(y+dy)+'%, '+
        'rgba(6,6,6,'+a.toFixed(3)+') 0%, rgba(6,6,6,'+(a*0.85).toFixed(3)+') 45%, rgba(6,6,6,0) 100%)';
    }
    // 코 쪽은 화면 오른쪽(왼눈 기준)에 둔다 — 시각 체험은 기본적으로 화면 오른쪽 절반에
    // 체험 화면을 보여주므로, 가장 먼저 생기는 손상이 처음부터 눈에 보이도록.
    var layers = [
      patch(38, 46, 94, 48, 0.1+t*1.4),      // 코 쪽 — 가장 먼저
      patch(46, 20, 62, 14, (t-0.15)*1.5),   // 위쪽 활 모양
      patch(40, 18, 40, 84, (t-0.30)*1.5),   // 아래쪽 활 모양
      patch(22, 16, 82, 20, (t-0.25)*1.6),   // 불규칙한 얼룩들
      patch(24, 18, 84, 78, (t-0.40)*1.6),
      patch(20, 22, 10, 16, (t-0.55)*1.8)    // 귀 쪽은 가장 늦게
    ];
    var s = clamp01((t-0.6)/0.4);
    if(s>0){
      var inner = 40 - 14*s;
      layers.push('radial-gradient(circle at '+fx+'% '+fy+'%, rgba(6,6,6,0) '+inner+'%, rgba(6,6,6,'+(0.95*s).toFixed(3)+') '+(inner+22)+'%)');
    }
    return layers.join(',');
  }

  // 적록색맹(제1색맹 계열) 색 변환 행렬 — t(0~1)만큼 정상 색에서 섞는다.
  var IDENTITY_3 = [1,0,0, 0,1,0, 0,0,1];
  var PROTANOPIA_3 = [
    0.152,1.053,-0.205,
    0.115,0.786,0.099,
    -0.004,-0.048,1.052
  ];
  function protanopiaMatrix(t){
    return IDENTITY_3.map(function(v,i){ return v + (PROTANOPIA_3[i]-v)*t; });
  }
  function applyColorMatrix(imgData, m){
    var d = imgData.data;
    for(var i=0;i<d.length;i+=4){
      var r=d[i], g=d[i+1], b=d[i+2];
      d[i]   = m[0]*r + m[1]*g + m[2]*b;
      d[i+1] = m[3]*r + m[4]*g + m[5]*b;
      d[i+2] = m[6]*r + m[7]*g + m[8]*b;
    }
    return imgData;
  }
  // SVG feColorMatrix values 문자열(4x5)
  function protanopiaSvgValues(t){
    var m = protanopiaMatrix(t);
    return [m[0],m[1],m[2],0,0, m[3],m[4],m[5],0,0, m[6],m[7],m[8],0,0, 0,0,0,1,0].join(' ');
  }

  // 황반변성 변시증 — (cx,cy) 주변 반지름 r 안의 글자·선이 물결처럼 휘어 보이게
  // src 캔버스의 픽셀을 옮겨 dst에 그린다. 가장자리로 갈수록 휘는 정도가 0이 되어
  // 원 바깥과 이음매 없이 이어진다. src와 dst가 같은 캔버스여도 된다.
  function warpPatch(srcCtx, dstCtx, cx, cy, r, amp, phase){
    var W = srcCtx.canvas.width, H = srcCtx.canvas.height;
    var x0 = Math.max(0, Math.floor(cx-r)), y0 = Math.max(0, Math.floor(cy-r));
    var x1 = Math.min(W, Math.ceil(cx+r)), y1 = Math.min(H, Math.ceil(cy+r));
    var w = x1-x0, h = y1-y0;
    if(w<=2 || h<=2) return;
    var src = srcCtx.getImageData(x0, y0, w, h), sd = src.data;
    var out = srcCtx.createImageData(w, h), od = out.data;
    var lambda = Math.max(8, r*0.5), k = 2*Math.PI/lambda;
    phase = phase||0;
    for(var y=0;y<h;y++){
      for(var x=0;x<w;x++){
        var ax = x0+x, ay = y0+y;
        var ddx = (ax-cx)/r, ddy = (ay-cy)/r, d2 = ddx*ddx+ddy*ddy;
        var o = (y*w+x)*4;
        if(d2>=1){ od[o+3] = 0; continue; }
        var f = (1-d2)*(1-d2);
        var sx = x + amp*f*Math.sin(ay*k + phase);
        var sy = y + amp*f*Math.sin(ax*k*0.8 + phase*1.3);
        sx = Math.max(0, Math.min(w-1, Math.round(sx)));
        sy = Math.max(0, Math.min(h-1, Math.round(sy)));
        var so = (sy*w+sx)*4;
        od[o]=sd[so]; od[o+1]=sd[so+1]; od[o+2]=sd[so+2]; od[o+3]=sd[so+3];
      }
    }
    // 원 바깥(투명 부분)은 건드리지 않도록 임시 캔버스를 거쳐 덮어 그린다
    var tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    tmp.getContext('2d').putImageData(out, 0, 0);
    dstCtx.drawImage(tmp, x0, y0);
  }

  // 굴절장애(난시) — 한 방향(가로)으로만 상이 번져 보이게, 조금씩 비켜 그린
  // 사본을 겹친다. ctx.filter(blur)는 iOS Safari에서 동작하지 않아 쓰지 않는다.
  function smearCanvas(ctx, len, alpha){
    var c = ctx.canvas, tmp = document.createElement('canvas');
    tmp.width = c.width; tmp.height = c.height;
    tmp.getContext('2d').drawImage(c, 0, 0);
    var steps = 4;
    ctx.save();
    for(var i=1;i<=steps;i++){
      var off = len*i/steps;
      ctx.globalAlpha = alpha*(1-(i-1)/steps)*0.6;
      ctx.drawImage(tmp, off, 0);
      ctx.drawImage(tmp, -off, 0);
    }
    ctx.restore();
  }

  // 광각장애 — 밝은 곳만 골라 크게 번진 빛을 screen으로 더한다. 작게 줄였다가
  // 다시 키우면(부드럽게 보간) 큰 블러와 같은 효과가 나서 iOS에서도 동작한다.
  function bloomCanvas(ctx, strength){
    var c = ctx.canvas, W = c.width, H = c.height;
    var sw = Math.max(8, Math.round(W/24)), sh = Math.max(8, Math.round(H/24));
    var small = document.createElement('canvas'); small.width = sw; small.height = sh;
    var sc = small.getContext('2d');
    sc.drawImage(c, 0, 0, sw, sh);
    var img = sc.getImageData(0, 0, sw, sh), d = img.data, thr = 0.62 - 0.12*strength;
    for(var i=0;i<d.length;i+=4){
      var lum = (0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])/255;
      var v = Math.max(0, (lum-thr)/(1-thr));
      v = Math.min(255, 255*Math.pow(v, 0.7));
      d[i]=v; d[i+1]=v; d[i+2]=Math.min(255, v*0.97); d[i+3]=255;
    }
    sc.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'screen';
    // 노선도처럼 바탕이 흰 그림은 거의 전체가 '밝은 곳'이라, 세게 더하면 화면이 통째로
    // 하얗게 날아가 게임을 할 수 없다 — 글씨·선이 흐릿하게 남는 정도로 더한다.
    ctx.globalAlpha = 0.2+0.35*strength;
    ctx.drawImage(small, -W*0.04, -H*0.04, W*1.08, H*1.08);
    ctx.restore();
  }

  window.VisionFx = {
    glaucomaBackground: glaucomaBackground,
    protanopiaMatrix: protanopiaMatrix,
    applyColorMatrix: applyColorMatrix,
    protanopiaSvgValues: protanopiaSvgValues,
    warpPatch: warpPatch,
    smearCanvas: smearCanvas,
    bloomCanvas: bloomCanvas
  };
})();
