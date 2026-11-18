/* Vall Gonçalves: fundo único do site. Mármore de tinta no princípio do Bernardo (faixas largas e espalhadas,
   com um veio fino ao lado), só que apagado e atrás do site inteiro, como na Aisora: um canvas fixo,
   sem cortes por seção, que desliza devagar com a rolagem (parallax leve), então a página toda parece
   estar sobre a mesma folha marmorizada.
   Qualidade: simplex em alta precisão, resolução real da tela, bordas antisserrilhadas por derivada,
   dither contra degrau no cinza. Baixa a resolução sozinho se a máquina sofrer. */
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
    "uniform vec2 uRes; uniform float uT; uniform float uS;",
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
    /* 3 oitavas suaves: o mármore fica de curvas longas, sem granulado */
    "float fb(vec2 p){float v=0.,a=.5;mat2 k=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<3;i++){v+=a*sn(p);p=k*p;a*=.5;}return .5+.5*v/.875;}",
    "void main(){",
    " vec2 fc=gl_FragCoord.xy; float mn=min(uRes.x,uRes.y);",
    " vec2 c0=(fc-vec2(0.,uS*.18)-.5*uRes)/mn;",
    /* tela em pé: gira o desenho para manter a composição da tela deitada */
    " if(uRes.y>uRes.x*1.05) c0=vec2(c0.y,-c0.x)*.8;",
    /* a folha desliza com a rolagem a 18% da velocidade do conteúdo */
    " vec2 p=c0*.42+vec2(2.3,1.1);",
    " float T=uT*.022; vec2 o1=vec2(0.,T),o2=vec2(-T*.7),o3=vec2(T*.6),o4=vec2(-T*.4,T*.2);",
    " vec2 a=vec2(fb(p+o1),fb(p+vec2(5.2,1.3)+o2));",
    " vec2 b=vec2(fb(p+1.5*a+vec2(1.7,9.2)+o3),fb(p+1.5*a+vec2(8.3,2.8)+o4));",
    " float w=fb(p+1.7*b);",
    /* faixas de mármore: seno sobre a coordenada torcida; limiar alto deixa as manchas espaçadas */
    " float v=sin((p.x*1.1+p.y*.55+w*3.4)*1.55);",
    "#ifdef DER",
    " float aa=clamp(fwidth(v),1e-4,.08)*1.2;",
    "#else",
    " float aa=.02;",
    "#endif",
    " float faixa=smoothstep(.8-aa,.8+aa,v);",
    /* miolo da faixa um pouco mais denso que a borda, como tinta que assentou */
    " float miolo=smoothstep(.8,1.,v);",
    " float tom=.07+.04*miolo+.018*(w-.5);",
    /* veio fino que acompanha a faixa por fora, afinando nas pontas */
    " float lw=.035*smoothstep(.25,.7,w);",
    " float veio=smoothstep(.62-aa,.62+aa,v)*(1.-smoothstep(.62+lw-aa,.62+lw+aa,v))*clamp(lw/(aa*2.5+1e-4),0.,1.);",
    " float al=faixa*tom+veio*.1*(1.-faixa);",
    /* cimento queimado: nuvens largas, manchas médias, pontinhos finos e um grão estático; mais claro no centro, como fundo de estúdio */
    " vec2 cp=(fc-vec2(0.,uS*.18))/mn;",
    " float n1=fb(cp*1.1+vec2(11.,3.)), n2=fb(cp*4.2+vec2(2.,17.)), n3=.5+.5*sn(cp*19.+vec2(7.,1.)), n4=.5+.5*sn(cp*58.);",
    " float cim=.585+.13*(n1-.5)+.06*(n2-.5)+.03*(n3-.5)+.018*(n4-.5);",
    " cim+=.07*smoothstep(.62,.9,n2)*(n1-.35);",
    " vec2 vq=(fc-vec2(.5,.56)*uRes)/uRes; vq.x*=uRes.x/max(uRes.y,1.)*.7;",
    " float vg=smoothstep(.1,.95,length(vq)); cim*=1.06-.3*vg;",
    " float gr=fract(sin(dot(floor(fc),vec2(12.9898,78.233)))*43758.5453);",
    " cim+=(gr-.5)*.035;",
    " vec3 cimento=vec3(cim)*vec3(.995,.995,1.);",
    " al=clamp(al,0.,1.);",
    /* dither por pixel contra degrau nos cinzas */
    " vec3 o=mix(cimento,vec3(.07,.068,.072),al)+(fract(52.9829189*fract(dot(fc,vec2(.06711056,.00583715))))-.5)/255.;",
    " gl_FragColor=vec4(o,1.);}"
  ].join("\n");
  function sh(tp, src) { var o = gl.createShader(tp); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn("fundo:", gl.getShaderInfoLog(o)); return o; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(pr, 0, "a"); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(pr, "uRes"), uT = gl.getUniformLocation(pr, "uT"), uS = gl.getUniformLocation(pr, "uS");
  var toque = matchMedia("(pointer: coarse)").matches;
  var esc = Math.min(devicePixelRatio || 1, 1.5), k = 1;
  var T = 20, ult = 0, inicio = 0, amostras = [], ajustes = 0, rol = scrollY, rolA = scrollY;
  function medir() {
    var w = Math.max(1, Math.round(cv.clientWidth * esc)), h = Math.max(1, Math.round(cv.clientHeight * esc));
    k = w / Math.max(1, cv.clientWidth);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    desenhar();
  }
  function desenhar() { gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, T); gl.uniform1f(uS, rolA * k); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  function passo(ts) {
    var bruto = ult ? ts - ult : 16.7, dt = Math.min(bruto / 1000, .05); ult = ts;
    if (!inicio) inicio = ts;
    if (!document.hidden) {
      if (!reduz.matches) T += dt;
      rol = scrollY;
      /* a rolagem chega amaciada: sem tranco quando a roda do mouse pula */
      rolA += (rol - rolA) * Math.min(1, dt * 9);
      if (Math.abs(rol - rolA) < .05) rolA = rol;
      desenhar();
      if (ajustes < 3 && ts - inicio > 2500) {
        amostras.push(bruto);
        if (amostras.length === 60) {
          amostras.sort(function (a, b) { return a - b; });
          if (amostras[30] > 24 && esc > .6) { esc = Math.max(.6, esc * .75); ajustes++; medir(); }
          amostras = [];
        }
      }
    }
    requestAnimationFrame(passo);
  }
  var esp; addEventListener("resize", function () { clearTimeout(esp); esp = setTimeout(medir, 150); });
  medir(); cv.classList.add("pronto");
  requestAnimationFrame(passo);
})();
