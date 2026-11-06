;(function(){
    "use strict"

    var Z = window.Zenkai;

    // F5? (usado no <head> e no main para decidir entre preloader e Shenlong)
    try {
        var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
        Z.isReload = !!(nav && nav.type === "reload") || (performance.navigation && performance.navigation.type === 1);
    } catch (e) { Z.isReload = false; }

    var BODY_SEGMENTS = 46;
    var BODY_LEN = 0.38; // comprimento do corpo em "unidades de percurso"

    function rad(a){ return a * Math.PI / 180; }

    // Shenlong de cima para baixo. kind: "leave" (cobre a pagina antes de navegar) ou "enter" (revela a pagina nova)
    Z.dragonSweep = function(kind, done){
        var W = window.innerWidth, H = window.innerHeight;
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        var curtain = document.createElement("div");
        curtain.className = "zk-curtain";
        curtain.setAttribute("aria-hidden", "true");
        document.body.appendChild(curtain);

        var canvas = document.createElement("canvas");
        canvas.className = "zk-dragon";
        canvas.setAttribute("aria-hidden", "true");
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        document.body.appendChild(canvas);
        var ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var amp = Math.min(W * 0.28, 320);
        var phase = Math.random() * Math.PI * 2;

        // posicao do corpo no percurso t (t cresce para baixo)
        function pos(t){
            return {
                x: W / 2 + amp * Math.sin(t * Math.PI * 2 * 1.55 + phase),
                y: -110 + t * (H + 260)
            };
        }

        function drawDragon(t, clock){
            ctx.clearRect(0, 0, W, H);
            var pts = [];
            for (var i = 0; i <= BODY_SEGMENTS; i++) { pts.push(pos(t - i * (BODY_LEN / BODY_SEGMENTS))); }
            var head = pts[0], next = pts[1];
            var ang = Math.atan2(head.y - next.y, head.x - next.x); // direcao do movimento

            // corpo (da cauda para a cabeca)
            for (var s = BODY_SEGMENTS; s >= 1; s--) {
                var p = pts[s], q = pts[s - 1];
                var a = Math.atan2(q.y - p.y, q.x - p.x);
                var k = 1 - s / BODY_SEGMENTS;                 // 0 cauda .. 1 cabeca
                var r = 6 + 20 * Math.pow(k, 0.7);
                var nx = -Math.sin(a), ny = Math.cos(a);        // normal ao corpo
                // espinhos dorsais
                if (s % 3 === 0) {
                    ctx.fillStyle = "#f77f00";
                    ctx.beginPath();
                    ctx.moveTo(p.x + nx * r * 0.7 - Math.cos(a) * r * 0.5, p.y + ny * r * 0.7 - Math.sin(a) * r * 0.5);
                    ctx.lineTo(p.x + nx * (r + 11) , p.y + ny * (r + 11));
                    ctx.lineTo(p.x + nx * r * 0.7 + Math.cos(a) * r * 0.5, p.y + ny * r * 0.7 + Math.sin(a) * r * 0.5);
                    ctx.closePath(); ctx.fill();
                }
                // corpo verde
                var g = ctx.createRadialGradient(p.x - nx * r * 0.2, p.y - ny * r * 0.2, r * 0.1, p.x, p.y, r);
                g.addColorStop(0, "#52c46a"); g.addColorStop(1, "#1c7a37");
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
                // barriga clara
                ctx.fillStyle = "rgba(247, 233, 150, 0.9)";
                ctx.beginPath(); ctx.arc(p.x - nx * r * 0.45, p.y - ny * r * 0.45, r * 0.42, 0, Math.PI * 2); ctx.fill();
            }

            // cabeca
            ctx.save();
            ctx.translate(head.x, head.y);
            ctx.rotate(ang);
            ctx.scale(1.35, 1.35);
            ctx.shadowColor = "rgba(247,127,0,0.7)"; ctx.shadowBlur = 22;

            // bigodes (balancam com o tempo)
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#ffe08a"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
            for (var w = -1; w <= 1; w += 2) {
                ctx.beginPath();
                ctx.moveTo(34, w * 6);
                ctx.bezierCurveTo(10, w * (22 + 6 * Math.sin(clock * 9)), -40, w * (34 + 10 * Math.sin(clock * 7 + 1)), -86, w * (18 + 14 * Math.sin(clock * 8)));
                ctx.stroke();
            }
            // chifres
            ctx.fillStyle = "#ffb52e";
            for (var h = -1; h <= 1; h += 2) {
                ctx.beginPath();
                ctx.moveTo(-6, h * 13);
                ctx.quadraticCurveTo(-34, h * 22, -62, h * 14);
                ctx.quadraticCurveTo(-34, h * 12, -14, h * 7);
                ctx.closePath(); ctx.fill();
            }
            // juba
            ctx.fillStyle = "#f77f00";
            for (var m = 0; m < 4; m++) {
                ctx.beginPath();
                ctx.moveTo(-14 - m * 7, -4); ctx.lineTo(-30 - m * 8, -16 - m * 3); ctx.lineTo(-18 - m * 7, 6);
                ctx.closePath(); ctx.fill();
            }
            // cranio e focinho
            var hg = ctx.createLinearGradient(0, -18, 0, 20);
            hg.addColorStop(0, "#52c46a"); hg.addColorStop(1, "#1c7a37");
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.moveTo(-20, -4);
            ctx.quadraticCurveTo(-8, -22, 14, -16);
            ctx.quadraticCurveTo(34, -14, 50, -7);
            ctx.quadraticCurveTo(54, -2, 50, 4);
            ctx.quadraticCurveTo(30, 10, 14, 18);
            ctx.quadraticCurveTo(-8, 22, -20, 8);
            ctx.closePath(); ctx.fill();
            // mandibula clara
            ctx.fillStyle = "#f5e6a0";
            ctx.beginPath();
            ctx.moveTo(8, 14); ctx.quadraticCurveTo(30, 9, 49, 3); ctx.quadraticCurveTo(30, 18, 6, 20); ctx.closePath(); ctx.fill();
            // dentes
            ctx.fillStyle = "#fff";
            for (var d = 0; d < 4; d++) {
                ctx.beginPath(); ctx.moveTo(20 + d * 7, 8 - d * 0.6); ctx.lineTo(23 + d * 7, 14 - d * 0.6); ctx.lineTo(26 + d * 7, 7 - d * 0.6); ctx.closePath(); ctx.fill();
            }
            // narina
            ctx.fillStyle = "#0e4a21";
            ctx.beginPath(); ctx.arc(45, -4, 2.2, 0, Math.PI * 2); ctx.fill();
            // olho
            ctx.fillStyle = "#fff6c9";
            ctx.beginPath(); ctx.ellipse(10, -6, 7, 5, rad(-15), 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#d31f1f";
            ctx.beginPath(); ctx.arc(12, -6, 3.4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#1a0505";
            ctx.beginPath(); ctx.arc(12.8, -6, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            return head;
        }

        var L = BODY_LEN;
        var total = 1 + L;                   // ate a cauda sair da tela
        var state = { s: 0 };
        var revealedCalled = false;
        var duration = kind === "leave" ? 1.0 : 1.35;
        var clock = 0;

        if (kind === "enter") { Z.lock(); }

        function render(){
            var t = state.s * total;
            clock += 0.016;
            var head = drawDragon(t, clock);
            var hy = head.y;
            if (kind === "leave") {
                // cobre de cima para baixo: a borda inferior da cortina acompanha a cabeca
                gsap.set(curtain, { y: Math.min(0, hy - H) });
            } else {
                // revela de cima para baixo: a borda superior da cortina acompanha a cabeca
                gsap.set(curtain, { y: Math.max(0, hy) });
                if (!revealedCalled && hy > H * 0.25) { revealedCalled = true; Z.markRevealed(); }
            }
        }

        // estado inicial: "leave" comeca descoberta; "enter" comeca coberta
        gsap.set(curtain, { y: kind === "leave" ? -H : 0 });
        if (kind === "enter") { Z.endCover(); }
        render();

        var tl = gsap.timeline({
            onComplete: function(){
                if (kind === "enter") {
                    Z.markRevealed();
                    Z.unlock();
                    canvas.parentNode && canvas.parentNode.removeChild(canvas);
                    curtain.parentNode && curtain.parentNode.removeChild(curtain);
                }
                if (done) { done(); }
            }
        });
        tl.to(state, { s: 1, duration: duration, ease: kind === "leave" ? "power2.in" : "power1.inOut", onUpdate: render });
        Z.dragonTl = tl; // exposto para depuracao
        return tl;
    };
})();
