/* Vall Gonçalves — quadros do hero com a troca do Veríssimo: em cada quadro a peça seguinte cobre a anterior
   com tinta (borda molhada que se espalha, primeiro em cinza, depois a foto real), em onda entre os quadros.
   <canvas class="qv" data-artes="a,b,c" data-off="0" data-cap="id-da-legenda"> ; legendas em window.QV_NOMES */
(function () {
  "use strict";
  var cvs = document.querySelectorAll("canvas.qv");
  if (!cvs.length) return;
  var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var P = 7.2, TR = 4.4;
  var VS = "attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(p,0.,1.);}";
  var FS = [
    "precision highp float;varying vec2 uv;uniform sampler2D A,B;uniform float s;uniform vec2 c0;uniform float ar;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fb(vec2 p){float a=.5,r=0.;for(int k=0;k<5;k++){r+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return r;}",
    "const vec3 LUM=vec3(.299,.587,.114);",
    "vec3 cinza(vec3 c){float l=dot(c,LUM);l=smoothstep(-.02,1.03,l);return vec3(pow(l,1.1))*vec3(1.,.985,.96);}",
    "void main(){",
    " vec3 a=texture2D(A,uv).rgb; if(s<0.){gl_FragColor=vec4(a,1.);return;}",
    " vec3 b=texture2D(B,uv).rgb;",
    " vec2 q=(uv-c0)*vec2(.8,1.); float di=length(q)*2.;",
    " float r1=pow(clamp(s/2.9,0.,1.),.85)*2.15, r2=pow(clamp((s-1.15)/2.9,0.,1.),.85)*2.15;",
    " float e1=di+(fb(q*3.6+vec2(2.,7.))-.5)*.42+(fb(q*16.)-.5)*.07;",
    " float e2=di+(fb(q*3.1+vec2(9.,1.))-.5)*.46+(fb(q*14.+3.)-.5)*.08;",
    " float m1=(1.-smoothstep(r1-.045,r1,e1))*step(.001,r1);",
    " float m2=(1.-smoothstep(r2-.07,r2,e2))*step(.001,r2);",
    " vec3 o=mix(a,cinza(b),m1); o=mix(o,b,m2);",
    " float viva=step(.001,r1)*(1.-smoothstep(1.85,2.15,r1));",
    " float rim=exp(-pow((e1-r1+.03)/.028,2.))*viva, bri=exp(-pow((e1-r1+.012)/.006,2.))*viva;",
    " o*=1.-.5*rim; o+=bri*.1;",
    " float vc=step(.001,r2)*(1.-smoothstep(1.85,2.15,r2)); float rc=exp(-pow((e2-r2+.04)/.05,2.))*vc;",
    " o+=(o-vec3(dot(o,LUM)))*.25*rc;",
    " gl_FragColor=vec4(o,1.);}"
  ].join("\n");
  var NOMES = window.QV_NOMES || {};
  var cache = {};
  function carrega(n) {
    if (!cache[n]) cache[n] = new Promise(function (ok, er) { var i = new Image(); i.decoding = "async"; i.onload = function () { ok(i); }; i.onerror = er; i.src = "assets/quadros/" + n + ".webp?v=1"; });
    return cache[n];
  }
  var lista = [];
  cvs.forEach(function (cv) {
    var artes = cv.dataset.artes.split(","), off = parseFloat(cv.dataset.off || "0"), cap = cv.dataset.cap ? document.getElementById(cv.dataset.cap) : null;
    function estatica() { cv.hidden = true; }
    if (reduz) { estatica(); return; }
    var gl = cv.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: true });
    if (!gl) { estatica(); return; }
    var hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var fs = hp && hp.precision ? FS : FS.replace("precision highp float;", "precision mediump float;");
    function sh(t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(pr, 0, "p"); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { estatica(); return; }
    gl.useProgram(pr);
    var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var U = function (n) { return gl.getUniformLocation(pr, n); };
    gl.uniform1i(U("A"), 0); gl.uniform1i(U("B"), 1);
    var TX = [];
    function textura(img) {
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    var ok = artes.map(function (n, i) { return carrega(n).then(function (im) { TX[i] = textura(im); }); });
    var visivel = true, atual = -1;
    new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }).observe(cv);
    function quadro(T) {
      var r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      var W = Math.round(r.width * d), H = Math.round(r.height * d);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); }
      var N = artes.length, t = Math.max(0, T - off), i = Math.floor(t / P), si = t - i * P;
      var a = i % N, b = (i + 1) % N, s = T < off ? -1 : si - (P - TR);
      if (!TX[a] || (s >= 0 && !TX[b])) return;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, TX[a]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, TX[s >= 0 ? b : a]);
      gl.uniform1f(U("s"), s); gl.uniform2f(U("c0"), .5, .42);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      var mostra = s > 1.6 ? b : a;
      if (cap && mostra !== atual) { atual = mostra; cap.textContent = NOMES[artes[mostra]] || ""; }
      cv.classList.add("pronto");
    }
    ok[0].then(function () { lista.push({ q: quadro, vis: function () { return visivel; } }); });
  });
  var T = 0, ult = 0;
  function passo(ts) {
    var dt = ult ? Math.min((ts - ult) / 1000, .1) : 0; ult = ts;
    if (!document.hidden) { T += dt; lista.forEach(function (o) { if (o.vis()) o.q(T); }); }
    requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
})();
