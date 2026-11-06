;(function(){
    "use strict"

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { return; }

    var VERT = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";

    function compile(gl, type, src){
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
        return s;
    }

    function program(gl, frag){
        var vs = compile(gl, gl.VERTEX_SHADER, VERT);
        var fs = compile(gl, gl.FRAGMENT_SHADER, frag);
        if (!vs || !fs) { return null; }
        var pr = gl.createProgram();
        gl.attachShader(pr, vs);
        gl.attachShader(pr, fs);
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { return null; }
        gl.useProgram(pr);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(pr, "p");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        return pr;
    }

    function getGl(canvas, opts){
        try { return canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts); }
        catch (e) { return null; }
    }

    /*-------------------------------------------------------------------------------
	  Aura de ki no banner da home
	-------------------------------------------------------------------------------*/
    var AURA = [
        "precision mediump float;varying vec2 v;uniform float t;uniform vec2 m;uniform float asp;",
        "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
        "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
        "return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
        "float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}",
        "void main(){",
        " vec2 uv=v;vec2 p=vec2(uv.x*asp,uv.y);",
        " float cx=mix(.5,m.x,.55)*asp;",
        " float d=abs(p.x-cx);",
        " float flame=fbm(vec2(p.x*2.2,p.y*1.6-t*.55)+vec2(0.,fbm(p*3.+t*.2)));",
        " float shape=smoothstep(.95,.0,d*1.25+uv.y*.55-flame*.85);",
        " float pulse=.75+.25*sin(t*2.2);",
        " vec3 core=vec3(1.,.82,.25);vec3 edge=vec3(.97,.5,0.);",
        " vec3 col=mix(edge,core,smoothstep(.2,1.,shape))*shape*pulse;",
        " float glow=exp(-d*2.2)*(1.-uv.y)*.35;",
        " col+=vec3(.97,.5,0.)*glow;",
        " col*=.85;",
        " gl_FragColor=vec4(col,max(col.r,max(col.g,col.b)));",
        "}"
    ].join("\n");

    function aura(){
        var host = document.querySelector(".banner_area .booking_table");
        if (!host || !document.querySelector(".banner_area .hotel_booking_area")) { return; }
        // so na home (banner com formulario de reserva e foto do restaurante)
        if (!document.querySelector(".banner_content")) { return; }
        var canvas = document.createElement("canvas");
        canvas.className = "zk-aura";
        canvas.setAttribute("aria-hidden", "true");
        var gl = getGl(canvas, { alpha: true, premultipliedAlpha: false, antialias: false });
        if (!gl) { return; }
        var pr = program(gl, AURA);
        if (!pr) { return; }
        host.insertBefore(canvas, host.querySelector(".container"));

        var uT = gl.getUniformLocation(pr, "t");
        var uM = gl.getUniformLocation(pr, "m");
        var uA = gl.getUniformLocation(pr, "asp");
        var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
        var visible = true, raf = 0, start = performance.now();
        var scale = 0.5; // renderiza em meia resolucao: e so um brilho

        function resize(){
            var w = Math.max(2, Math.round(host.clientWidth * scale));
            var h = Math.max(2, Math.round(host.clientHeight * scale));
            canvas.width = w; canvas.height = h;
            gl.viewport(0, 0, w, h);
            gl.uniform1f(uA, w / h);
        }
        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", function(e){
            var r = host.getBoundingClientRect();
            mouse.tx = (e.clientX - r.left) / r.width;
            mouse.ty = 1 - (e.clientY - r.top) / r.height;
        });

        function frame(now){
            mouse.x += (mouse.tx - mouse.x) * 0.06;
            mouse.y += (mouse.ty - mouse.y) * 0.06;
            gl.uniform1f(uT, (now - start) / 1000);
            gl.uniform2f(uM, mouse.x, mouse.y);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            raf = visible ? requestAnimationFrame(frame) : 0;
        }
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function(entries){
                visible = entries[0].isIntersecting;
                if (visible && !raf) { raf = requestAnimationFrame(frame); }
            }).observe(host);
        }
        raf = requestAnimationFrame(frame);
    }

    /*-------------------------------------------------------------------------------
	  Hover com distorcao nas fotos (um unico contexto WebGL compartilhado)
	-------------------------------------------------------------------------------*/
    var HOVER = [
        "precision mediump float;varying vec2 v;uniform sampler2D tex;uniform vec2 m;uniform float prog;uniform vec2 scl;uniform float t;",
        "void main(){",
        " vec2 uv=vec2(v.x,1.-v.y);",
        " uv=(uv-.5)*scl+.5;",
        " vec2 q=vec2(v.x,1.-v.y);",
        " float d=distance(q,m);",
        " float wave=sin(d*28.-t*6.)*exp(-d*3.2)*prog;",
        " vec2 dir=normalize(q-m+.0001);",
        " vec2 off=dir*wave*.035;",
        " float sp=prog*.012;",
        " float r=texture2D(tex,uv+off+vec2(sp,0.)).r;",
        " float g=texture2D(tex,uv+off).g;",
        " float b=texture2D(tex,uv+off-vec2(sp,0.)).b;",
        " vec3 col=vec3(r,g,b);",
        " col+=vec3(.97,.5,0.)*exp(-d*5.)*prog*.35;",
        " gl_FragColor=vec4(col,1.);",
        "}"
    ].join("\n");

    function hover(){
        var imgs = document.querySelectorAll(".hotel_img img, .gallery_img img");
        if (!imgs.length) { return; }
        var canvas = document.createElement("canvas");
        canvas.className = "zk-fx-canvas";
        canvas.setAttribute("aria-hidden", "true");
        var gl = getGl(canvas, { alpha: false, antialias: false, preserveDrawingBuffer: false });
        if (!gl) { return; }
        var pr = program(gl, HOVER);
        if (!pr) { return; }
        var u = {
            tex: gl.getUniformLocation(pr, "tex"), m: gl.getUniformLocation(pr, "m"),
            prog: gl.getUniformLocation(pr, "prog"), scl: gl.getUniformLocation(pr, "scl"),
            t: gl.getUniformLocation(pr, "t")
        };
        gl.uniform1i(u.tex, 0);
        var failed = false;
        var textures = new WeakMap();
        var current = null, progress = 0, target = 0, mouse = [0.5, 0.5], raf = 0, t0 = performance.now();

        function textureFor(img){
            if (textures.has(img)) { return textures.get(img); }
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            } catch (e) {
                // file:// ou imagem sem CORS: mantem a foto estatica
                failed = true;
                return null;
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            textures.set(img, tex);
            return tex;
        }

        function draw(now){
            progress += (target - progress) * 0.12;
            if (current) {
                gl.uniform1f(u.prog, progress);
                gl.uniform2f(u.m, mouse[0], mouse[1]);
                gl.uniform1f(u.t, (now - t0) / 1000);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                canvas.style.opacity = Math.min(1, progress * 3);
            }
            if (target === 0 && progress < 0.01) {
                canvas.style.opacity = 0;
                raf = 0;
                return;
            }
            raf = requestAnimationFrame(draw);
        }

        function enter(img){
            if (failed) { return; }
            if (!img.complete || !img.naturalWidth) { return; }
            var holder = img.parentElement;
            var tex = textureFor(img);
            if (!tex) { return; }
            if (canvas.parentElement !== holder) { holder.insertBefore(canvas, img.nextSibling); }
            var w = Math.max(2, Math.round(img.clientWidth)), h = Math.max(2, Math.round(img.clientHeight));
            var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            // "cover": ajusta o recorte se a proporcao do elemento for diferente da imagem
            var ia = img.naturalWidth / img.naturalHeight, ca = w / h;
            gl.uniform2f(u.scl, ca > ia ? 1 : ca / ia, ca > ia ? ia / ca : 1);
            current = img; target = 1; progress = Math.max(progress, 0.001);
            if (!raf) { raf = requestAnimationFrame(draw); }
        }

        imgs.forEach(function(img){
            var holder = img.parentElement;
            holder.addEventListener("mouseenter", function(){ enter(img); });
            holder.addEventListener("mousemove", function(e){
                var r = img.getBoundingClientRect();
                mouse = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
            });
            holder.addEventListener("mouseleave", function(){ target = 0; });
        });
    }

    function init(){
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            aura();
            return;
        }
        aura();
        hover();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
