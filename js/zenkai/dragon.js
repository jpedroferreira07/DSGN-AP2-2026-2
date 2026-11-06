;(function(){
    "use strict"

    var Z = window.Zenkai;

    // F5? (usado no <head> e no main para decidir entre preloader e Shenlong)
    try {
        var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
        Z.isReload = !!(nav && nav.type === "reload") || (performance.navigation && performance.navigation.type === 1);
    } catch (e) { Z.isReload = false; }

    var IMG_DRAGON = "imagensOtimizadas/shenlong-emblema-zenkai-sushi.webp";
    var IMG_BALLS = "imagensOtimizadas/esferas-do-dragao-sprite-zenkai-sushi.webp";

    // Medidas na arte original (554 x 554 px). As esferas estao num sprite de 7 celulas de 84 px.
    var ART = 554;
    var CELL = 84;
    var BALLS = [[193, 170], [391, 166], [125, 245], [437, 271], [148, 381], [364, 397], [225, 430]];
    var EYES = [[260.5, 228.5], [277.5, 228]];

    var MIN_HOLD = 0.35;   // pausa com o emblem completo antes dos olhos acenderem (s)
    var LOAD_WAIT = 4000;  // espera maxima pelo "load" da pagina (ms)

    function el(tag, cls, parent){
        var n = document.createElement(tag);
        if (cls) { n.className = cls; }
        if (parent) { parent.appendChild(n); }
        return n;
    }

    function whenImagesReady(urls, cb){
        var left = urls.length, finished = false;
        function finish(){ if (!finished) { finished = true; cb(); } }
        // se uma imagem falhar o site segue: a animacao so perde essa arte
        var timer = setTimeout(finish, 2500);
        urls.forEach(function(u){
            var im = new Image();
            im.onload = im.onerror = function(){ if (--left === 0) { clearTimeout(timer); finish(); } };
            im.src = u;
        });
    }

    function whenLoaded(cb){
        if (document.readyState === "complete") { cb(); return; }
        var once = function(){ clearTimeout(t); window.removeEventListener("load", once); cb(); };
        var t = setTimeout(once, LOAD_WAIT);
        window.addEventListener("load", once);
    }

    // Emblem do Shenlong. kind: "leave" (escurece a tela antes de navegar) ou "enter" (forma o emblem, acende os olhos e solta as esferas)
    Z.dragonSweep = function(kind, done){
        var W = window.innerWidth, H = window.innerHeight;

        var curtain = el("div", "zk-curtain", document.body);
        curtain.setAttribute("aria-hidden", "true");

        // ---------- saida: so escurece, o espetaculo fica para a pagina nova ----------
        if (kind === "leave") {
            gsap.set(curtain, { opacity: 0 });
            var out = gsap.to(curtain, { opacity: 1, duration: 0.3, ease: "power1.out", onComplete: function(){ if (done) { done(); } } });
            Z.dragonTl = out;
            return out;
        }

        // ---------- entrada ----------
        Z.lock();
        Z.endCover();

        var S = Math.round(Math.min(ART, Math.min(W, H) * 0.82));   // lado do emblem em px
        var k = S / ART;
        var ox = (W - S) / 2, oy = (H - S) / 2;
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        var stage = el("div", "zk-dragon", document.body);
        stage.setAttribute("aria-hidden", "true");

        var emblem = el("div", "zk-emblem", stage);
        emblem.style.cssText = "left:" + ox + "px;top:" + oy + "px;width:" + S + "px;height:" + S + "px;";
        var art = el("div", "zk-emblem__art", emblem);
        var img = el("img", "zk-emblem__img", art);
        img.src = IMG_DRAGON; img.alt = ""; img.draggable = false;

        var eyes = EYES.map(function(p){
            var e = el("span", "zk-eye", emblem);
            var d = S * 0.075;
            e.style.cssText = "left:" + (p[0] * k - d / 2) + "px;top:" + (p[1] * k - d / 2) + "px;width:" + d + "px;height:" + d + "px;";
            return e;
        });

        var trail = el("canvas", "zk-trail", stage);
        trail.width = Math.round(W * dpr); trail.height = Math.round(H * dpr);
        var tctx = trail.getContext("2d");
        tctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var cell = CELL * k;
        var balls = BALLS.map(function(p, i){
            var b = el("span", "zk-ball", stage);
            b.style.cssText = "left:" + (ox + p[0] * k - cell / 2) + "px;top:" + (oy + p[1] * k - cell / 2) + "px;width:" + cell +
                "px;height:" + cell + "px;background-image:url(" + IMG_BALLS + ");background-size:" + (cell * BALLS.length) + "px " + cell +
                "px;background-position:" + (-i * cell) + "px 0;";
            return { el: b, cx: ox + p[0] * k, cy: oy + p[1] * k, px: null, py: null };
        });

        gsap.set(curtain, { opacity: 1 });
        gsap.set(art, { "--r": 0, "--g": 0 });
        gsap.set(eyes, { scale: 0, opacity: 0 });
        gsap.set(balls.map(function(b){ return b.el; }), { scale: 0.4, opacity: 0 });

        var finished = false;
        function cleanup(){
            if (finished) { return; }
            finished = true;
            gsap.ticker.remove(drawTrail);
            [stage, curtain].forEach(function(n){ if (n.parentNode) { n.parentNode.removeChild(n); } });
            Z.markRevealed();
            Z.unlock();
            if (done) { done(); }
        }

        // rastro de luz: cada frame apaga um pouco do anterior e risca o trecho percorrido
        var tracing = false;
        function drawTrail(){
            if (!tracing) { return; }
            tctx.globalCompositeOperation = "destination-out";
            tctx.fillStyle = "rgba(0,0,0,0.16)";
            tctx.fillRect(0, 0, W, H);
            tctx.globalCompositeOperation = "lighter";
            tctx.lineCap = "round";
            balls.forEach(function(b){
                var x = b.cx + gsap.getProperty(b.el, "x");
                var y = b.cy + gsap.getProperty(b.el, "y");
                var sc = gsap.getProperty(b.el, "scale");
                if (b.px !== null) {
                    tctx.strokeStyle = "rgba(255,176,46,0.55)";
                    tctx.shadowColor = "rgba(247,127,0,0.9)";
                    tctx.shadowBlur = 20;
                    tctx.lineWidth = cell * 0.5 * sc;
                    tctx.beginPath(); tctx.moveTo(b.px, b.py); tctx.lineTo(x, y); tctx.stroke();
                    tctx.strokeStyle = "rgba(255,243,200,0.7)";
                    tctx.shadowBlur = 0;
                    tctx.lineWidth = cell * 0.16 * sc;
                    tctx.beginPath(); tctx.moveTo(b.px, b.py); tctx.lineTo(x, y); tctx.stroke();
                }
                b.px = x; b.py = y;
            });
        }
        gsap.ticker.add(drawTrail);
        // rede de seguranca: se algo travar (aba em segundo plano, imagem que nao carrega) a pagina nao fica presa na abertura
        setTimeout(cleanup, 9000);

        // parte 2: olhos vermelhos, esferas voam, tela abre. So roda quando a pagina terminou de carregar.
        var started = false;
        function release(){
            if (started) { return; }
            started = true;
            var tl2 = gsap.timeline({ onComplete: cleanup });
            Z.dragonTl = tl2;

            // olhos brilham em vermelho
            var GO = 0.35; // instante em que as esferas partem
            tl2.to(eyes, { scale: 1, opacity: 1, duration: 0.28, ease: "back.out(2.2)", stagger: 0.04 }, 0);
            tl2.to(eyes, { scale: 1.5, duration: 0.22, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.12);
            tl2.to(art, { "--g": 46, duration: 0.3, ease: "power2.out" }, 0);

            // esferas partem cada uma para um lado, com brilho e rastro
            tl2.call(function(){ tracing = true; }, null, GO);
            balls.forEach(function(b, i){
                var ang = Math.atan2(b.cy - H / 2, b.cx - W / 2) + (Math.random() - 0.5) * 0.6;
                var dist = Math.hypot(W, H) * 0.75;
                tl2.to(b.el, {
                    x: Math.cos(ang) * dist, y: Math.sin(ang) * dist,
                    scale: 1.35, rotation: (i % 2 ? 1 : -1) * 120,
                    boxShadow: "0 0 26px 10px rgba(255,170,40,0.9)",
                    duration: 1.0, ease: "power2.in"
                }, GO + i * 0.05);
            });
            // o dragao esmaece e a tela abre revelando a pagina
            tl2.to(art, { opacity: 0, scale: 1.06, duration: 0.6, ease: "power1.in" }, GO + 0.1);
            tl2.to(eyes, { opacity: 0, duration: 0.3 }, GO + 0.2);
            tl2.call(function(){ Z.markRevealed(); }, null, GO + 0.2);
            tl2.to(curtain, { opacity: 0, duration: 0.7, ease: "power1.inOut" }, GO + 0.2);
            tl2.to(trail, { opacity: 0, duration: 0.4 }, GO + 0.9);
        }

        // parte 1: o emblem se forma (revelacao do centro para fora + brilho dourado), esferas pulsam por ultimo
        var tl1 = gsap.timeline({ paused: true, onComplete: function(){
            // segura um instante e espera a pagina carregar
            gsap.delayedCall(MIN_HOLD, function(){ whenLoaded(release); });
        }});
        tl1.to(art, { "--r": 100, duration: 0.8, ease: "power2.out" });
        tl1.to(art, { "--g": 22, duration: 0.8, ease: "sine.inOut" }, "<");
        tl1.to(balls.map(function(b){ return b.el; }), { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.06 }, "<0.45");
        tl1.to(balls.map(function(b){ return b.el; }), { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: "sine.inOut", stagger: 0.04 }, ">-0.1");
        Z.dragonTl = tl1; // exposto para depuracao

        whenImagesReady([IMG_DRAGON, IMG_BALLS], function(){ tl1.play(); });
        return tl1;
    };
})();
