/* Vall Gonçalves: fundo único do site, um mármore de tinta preta bem apagado que corre devagar atrás de tudo
   (mesmo princípio do site da Aisora: um canvas fixo em baixa resolução, suave, sem cortes por seção). */
(function () {
  "use strict";
  var cv = document.getElementById("fundo");
  if (!cv) return;
  var gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) { cv.remove(); return; }
  var reduz = matchMedia("(prefers-reduced-motion: reduce)");
  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = [
    "precision mediump float;uniform vec2 r;uniform float t;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fb(vec2 p){float a=.5,s=0.;for(int k=0;k<5;k++){s+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s;}",
    "void main(){",
    " vec2 p=gl_FragCoord.xy/r.y*.95; float T=t*.018;",
    " vec2 q=vec2(fb(p+vec2(0.,T)),fb(p+vec2(5.2,1.3)-T));",
    " vec2 w=vec2(fb(p+3.2*q+vec2(1.7,9.2)+T*.7),fb(p+3.2*q+vec2(8.3,2.8)-T*.6));",
    " float f=fb(p+3.4*w);",
    " float veia=pow(1.-abs(sin(f*13.)),9.)*smoothstep(.3,.6,f);",       // fios finos do mármore
    " float mancha=smoothstep(.6,.9,f);",            // nuvens de tinta mais cheias
    " float a=clamp(veia*.55+mancha*.5,0.,1.);",
    " vec3 tinta=vec3(.106,.09,.086);",
    " gl_FragColor=vec4(tinta*a,a);}"
  ].join("\n");
  function sh(tp, src) { var o = gl.createShader(tp); gl.shaderSource(o, src); gl.compileShader(o); return o; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(pr, 0, "p"); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t");
  var ESC = 0.34, T = 40, ult = 0;
  function medir() {
    var w = Math.max(1, Math.round(innerWidth * ESC)), h = Math.max(1, Math.round(innerHeight * ESC));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    desenhar();
  }
  function desenhar() { gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, T); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  function passo(ts) {
    var dt = ult ? Math.min((ts - ult) / 1000, .1) : 0; ult = ts;
    if (!document.hidden && !reduz.matches) { T += dt; desenhar(); }
    requestAnimationFrame(passo);
  }
  var esp; addEventListener("resize", function () { clearTimeout(esp); esp = setTimeout(medir, 120); });
  medir(); cv.classList.add("pronto");
  requestAnimationFrame(passo);
})();
