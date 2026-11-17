/* Vall Gonçalves — hero "a peça no quadro dourado": o decalque violeta aparece e a agulha
   enche a peça fine line a preto e cinza, escuros primeiro, em passadas que seguem a forma (WebGL).
   sombreadoHero(canvas) -> { carregar(imgTinta, imgFluxo), quadro(t), ok } ; DUR = fim da peça */
(function () {
  const VS = `#version 300 es
  layout(location=0) in vec2 p; out vec2 uv;
  void main(){ uv = p*.5+.5; uv.y = 1.-uv.y; gl_Position = vec4(p,0.,1.); }`;
  const FS = `#version 300 es
  precision highp float;
  in vec2 uv; out vec4 o;
  uniform sampler2D uT, uF; uniform float uTm, uAl; uniform vec2 uRes;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y); }
  void main(){
    vec4 tx = texture(uT, uv);
    float A = tx.r, lin = tx.g, ordem = tx.b;
    vec2 fl = texture(uF, uv).rg*2.-1.;
    float th = .5*atan(fl.y, fl.x);
    vec2 d = vec2(cos(th), sin(th)), n = vec2(-d.y, d.x);
    vec2 px = uv*vec2(1200.,1500.);
    vec2 q = vec2(dot(px,d), dot(px,n));
    /* passadas de agulha: traços compridos na direção da forma */
    float pas = vn(vec2(q.x/26., q.y/2.4))*.62 + vn(vec2(q.x/9., q.y/1.3)+17.)*.38;
    float t = uTm;
    /* estêncil: varre de cima para baixo em .45 s */
    float sw = uv.y*.8 + vn(uv*7.)*.2;
    float est = lin*smoothstep(sw - .02, sw + .08, t/.42);
    /* tinta: escuros e topo primeiro; cada zona leva .42 s a fechar */
    float d0 = .40 + 1.0*ordem;
    float c = clamp((t - d0)/.42, 0., 1.);
    float cob = smoothstep(pas - .18, pas + .06, c*1.22);
    float ink = A*cob*(.62 + .38*c);
    /* o estêncil some debaixo da tinta e é limpo no fim */
    est *= (1. - cob*.92) * (1. - smoothstep(1.55, 2.05, t)*.85);
    /* brilho da limpeza (papel a passar) */
    float bx = (uv.x*.55 + uv.y*.45) - (t - 1.55)*1.5;
    float br = exp(-bx*bx*90.)*step(1.5, t)*(1.-smoothstep(2.3, 2.6, t));
    vec3 tinta = vec3(.106, .090, .086) + vec3(.03)*(1.-A);
    vec3 viol = vec3(.37, .27, .59);
    float a = clamp(ink + est*.85*(1.-ink), 0., 1.);
    vec3 col = (tinta*ink + viol*est*.85*(1.-ink));
    col += vec3(.05)*br*ink;
    o = vec4(col, a)*uAl;
  }`;
  function sh(gl, t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; }
  window.sombreadoHero = function (cv) {
    const gl = cv.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
    if (!gl) return { ok: false };
    let P;
    try {
      P = gl.createProgram(); gl.attachShader(P, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(P, sh(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(P);
      if (!gl.getProgramParameter(P, gl.LINK_STATUS)) throw gl.getProgramInfoLog(P);
    } catch (e) { return { ok: false }; }
    const U = n => gl.getUniformLocation(P, n);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindAttribLocation(P, 0, 'p');
    function tex(img, mip) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    const PS = [];
    return {
      ok: true,
      /* i = índice da peça; pode chegar fora de ordem */
      carregar(i, imT, imF) { PS[i] = [tex(imT, true), tex(imF, false)]; },
      pronta: i => !!PS[i],
      quadro(t, i, al) {
        i = i || 0; if (!PS[i]) return false;
        const T = PS[i][0], F = PS[i][1];
        const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
        const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
        gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(P);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T); gl.uniform1i(U('uT'), 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, F); gl.uniform1i(U('uF'), 1);
        gl.uniform1f(U('uTm'), t); gl.uniform1f(U('uAl'), al == null ? 1 : al); gl.uniform2f(U('uRes'), w, h);
        gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return true;
      }
    };
  };
  window.sombreadoDur = 2.6;
  window.sombreadoCiclo = 5.6;   /* peça fecha em 1,6 s, fica à vista, some em .4 s */
  window.sombreadoPecas = [['mulher', 'Rosto e flores · coxa'], ['onca', 'Onça e lírios · braço'], ['leao', 'Leão com flores · antebraço'], ['india', 'Cocar e flores · braço']];
  /* tempo global -> peça, tempo local e opacidade */
  window.sombreadoEm = function (T) {
    const C = window.sombreadoCiclo, N = window.sombreadoPecas.length;
    const k = Math.floor(T / C), t = T - k * C;
    return { i: k % N, t: Math.min(t, window.sombreadoDur), al: Math.min(1, Math.max(0, (C - t) / .4)), fim: t > 1.8 && t < C - .35 };
  };
})();
