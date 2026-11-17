/* Vall Gonçalves: fundo único do site. Mármore de nanquim que corre devagar atrás de tudo (princípio da Aisora:
   um canvas fixo, apagado, sem cortes por seção), feito na qualidade da fumaça do Taffa:
   simplex em alta precisão, torção dupla (domain warp), resolução real da tela, fios finos com antisserrilhado
   por derivada e dither por pixel para não aparecer degrau no cinza. Desenha a 30 qps e baixa a resolução
   sozinho se a máquina sofrer. */
(function () {
  "use strict";
  var cv = document.getElementById("fundo");
  if (!cv) return;
  var gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: "high-performance" });
  if (!gl) { cv.remove(); return; }
  var der = gl.getExtension("OES_standard_derivatives");
  var hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  var reduz = matchMedia("(prefers-reduced-motion: reduce)");
  var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  var FS = (der ? "#extension GL_OES_standard_derivatives : enable\n#define DER 1\n" : "") +
    ((hp && hp.precision) ? "precision highp float;\n" : "precision mediump float;\n") + [
    "uniform vec2 uRes; uniform float uT;",
    /* simplex 2D (Ashima / Stefan Gustavson) */
    "vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}",
    "vec2 m289(vec2 x){return x-floor(x*(1./289.))*289.;}",
    "vec3 perm(vec3 x){return m289(((x*34.)+1.)*x);}",
    "float sn(vec2 v){",
    " const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);",
    " vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);",
    " vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);",
    " vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=m289(i);",
    " vec3 p=perm(perm(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));",
    " vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;",
    " vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;",
    " m*=1.79284291400159-.85373472095314*(a0*a0+h*h);",
    " vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;",
    " return 130.*dot(m,g);}",
    "mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}",
    "float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*sn(p);p=rot(.57)*p*1.93+vec2(3.1,1.7);a*=.48;}return .5+.5*s;}",
    "float fb3(vec2 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*sn(p);p=rot(.57)*p*1.9+vec2(3.1,1.7);a*=.45;}return .5+.5*s/.875;}",
    "void main(){",
    " vec2 fc=gl_FragCoord.xy; float esc=max(uRes.x,uRes.y);",
    " vec2 p=(fc-.5*uRes)/esc*1.25; float t=uT*.014;",
    /* torção dupla em ruído de poucas oitavas: as dobras ficam longas e lisas, como tinta puxada na água */
    " vec2 q=vec2(fb3(p*.8+vec2(0.,t)),fb3(p*.8+vec2(5.2,1.3)-vec2(t*.8,0.)));",
    " vec2 r=vec2(fb3(p+1.9*q+vec2(1.7,9.2)+vec2(t*.6,-t*.3)),fb3(p+1.9*q+vec2(8.3,2.8)+vec2(t*.4,t*.5)));",
    " float d=fb3(p*.9+2.1*r);",
    /* véu: massas suaves, com um grão fino de fumaça por dentro */
    " float veu=smoothstep(.5,.86,d); veu=veu*veu*(3.-2.*veu);",
    " float fumo=fbm(p*3.+r*2.);",
    " veu*=.75+.5*fumo;",
    /* fios: curvas de nível paralelas da mesma tinta, finas e lisas, antisserrilhadas pela derivada */
    " float k=d*30.; float s=abs(fract(k)-.5);",
    "#ifdef DER",
    " float fw=max(fwidth(k),1e-4);",
    "#else",
    " float fw=.03;",
    "#endif",
    " float fio=1.-smoothstep(.0,fw*1.4,.5-s-.02);",
    " fio*=smoothstep(.36,.66,d)*(1.-smoothstep(.12,.3,fw));",
    " float onda=.5+.5*sin(d*9.+r.x*6.);",
    /* luz rasante: um lado de cada dobra mais escuro, dá volume sem contraste */
    " float relevo=clamp(.5+(r.x-r.y)*1.6,0.,1.);",
    " float a=veu*(.5+.5*relevo)*.2+fio*(.05+.13*onda)*(.4+.6*smoothstep(.4,.75,d));",
    /* dither por pixel contra degrau no cinza claro */
    " a+=(fract(52.9829189*fract(dot(fc,vec2(.06711056,.00583715))))-.5)/255.;",
    " a=clamp(a,0.,1.);",
    " vec3 tinta=vec3(.105,.088,.084);",
    " gl_FragColor=vec4(tinta*a,a);}"
  ].join("\n");
  function sh(tp, src) { var o = gl.createShader(tp); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn("fundo:", gl.getShaderInfoLog(o)); return o; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(pr, 0, "a"); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(pr, "uRes"), uT = gl.getUniformLocation(pr, "uT");
  var toque = matchMedia("(pointer: coarse)").matches;
  var esc = Math.min(devicePixelRatio || 1, toque ? 1.5 : 1.25), T = 30, ult = 0, acum = 0, amostras = [];
  function medir() {
    var w = Math.max(1, Math.round(cv.clientWidth * esc)), h = Math.max(1, Math.round(cv.clientHeight * esc));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    desenhar();
  }
  function desenhar() { gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, T); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  function passo(ts) {
    var dt = ult ? Math.min((ts - ult) / 1000, .1) : 0; ult = ts;
    if (!document.hidden && !reduz.matches) {
      T += dt; acum += dt;
      if (acum >= 1 / 31) {
        var t0 = performance.now(); desenhar(); acum = 0;
        if (amostras.length < 40) {
          amostras.push(dt);
          if (amostras.length === 40) {
            amostras.sort(function (a, b) { return a - b; });
            if (amostras[20] > 0.045 && esc > 0.5) { esc = Math.max(0.5, esc * 0.7); medir(); amostras = []; }
          }
        }
      }
    }
    requestAnimationFrame(passo);
  }
  var esp; addEventListener("resize", function () { clearTimeout(esp); esp = setTimeout(medir, 150); });
  medir(); cv.classList.add("pronto");
  requestAnimationFrame(passo);
})();
