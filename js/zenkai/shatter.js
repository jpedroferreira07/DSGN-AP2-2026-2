;(function(){
    "use strict"

    var Z = window.Zenkai;

    function rnd(a, b){ return a + Math.random() * (b - a); }

    // rachaduras: linhas irregulares saindo do centro (coordenadas em % da tela)
    function crackPaths(){
        var paths = [];
        var rays = 11;
        for (var i = 0; i < rays; i++) {
            var ang = (i / rays) * Math.PI * 2 + rnd(-0.18, 0.18);
            var x = 50 + rnd(-2, 2), y = 50 + rnd(-2, 2);
            var d = "M" + x.toFixed(1) + " " + y.toFixed(1);
            var steps = Math.round(rnd(5, 8));
            for (var s = 0; s < steps; s++) {
                var len = rnd(8, 15);
                ang += rnd(-0.35, 0.35);
                x += Math.cos(ang) * len * 1.45; // proporcao 16:9 aproximada
                y += Math.sin(ang) * len;
                d += " L" + x.toFixed(1) + " " + y.toFixed(1);
                // ramificacao curta
                if (s > 1 && Math.random() < 0.4) {
                    var ba = ang + rnd(0.5, 1.0) * (Math.random() < 0.5 ? -1 : 1);
                    var bx = x + Math.cos(ba) * rnd(5, 10) * 1.45, by = y + Math.sin(ba) * rnd(5, 10);
                    paths.push("M" + x.toFixed(1) + " " + y.toFixed(1) + " L" + bx.toFixed(1) + " " + by.toFixed(1));
                }
            }
            paths.push(d);
        }
        return paths;
    }

    Z.buildCracks = function(){
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "zk-cracks");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("aria-hidden", "true");
        crackPaths().forEach(function(d){
            var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
            p.setAttribute("d", d);
            p.setAttribute("pathLength", "1");
            svg.appendChild(p);
        });
        return svg;
    };

    // cacos: grade irregular dividida em triangulos, cada um um <div> com clip-path
    Z.buildShards = function(){
        var cols = 4, rows = 3;
        var W = window.innerWidth, H = window.innerHeight;
        var pts = [];
        for (var r = 0; r <= rows; r++) {
            pts[r] = [];
            for (var c = 0; c <= cols; c++) {
                var x = c / cols * 100, y = r / rows * 100;
                if (c > 0 && c < cols) { x += rnd(-9, 9); }
                if (r > 0 && r < rows) { y += rnd(-12, 12); }
                pts[r][c] = [x, y];
            }
        }
        var wrap = document.createElement("div");
        wrap.className = "zk-shards";
        wrap.setAttribute("aria-hidden", "true");
        var shards = [];
        function add(a, b, c){
            var el = document.createElement("div");
            el.className = "zk-shard";
            el.style.clipPath = "polygon(" + [a, b, c].map(function(p){ return p[0].toFixed(2) + "% " + p[1].toFixed(2) + "%"; }).join(",") + ")";
            // gira em torno do proprio centro do caco
            var cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
            el.style.transformOrigin = cx.toFixed(1) + "% " + cy.toFixed(1) + "%";
            wrap.appendChild(el);
            shards.push({ el: el, cx: cx, cy: cy });
        }
        for (var r2 = 0; r2 < rows; r2++) {
            for (var c2 = 0; c2 < cols; c2++) {
                var p00 = pts[r2][c2], p10 = pts[r2][c2 + 1], p01 = pts[r2 + 1][c2], p11 = pts[r2 + 1][c2 + 1];
                if (Math.random() < 0.5) { add(p00, p10, p11); add(p00, p11, p01); }
                else { add(p00, p10, p01); add(p10, p11, p01); }
            }
        }
        return { el: wrap, shards: shards, w: W, h: H };
    };

    // queda dos cacos a partir do centro; onStart dispara quando o primeiro caco comeca a cair
    Z.dropShards = function(built, onStart, onDone){
        var H = built.h;
        var maxD = 0;
        built.shards.forEach(function(s){
            s.d = Math.sqrt(Math.pow(s.cx - 50, 2) + Math.pow(s.cy - 50, 2));
            if (s.d > maxD) { maxD = s.d; }
        });
        var tl = gsap.timeline({ onComplete: onDone });
        tl.call(onStart, null, 0);
        built.shards.forEach(function(s){
            var delay = (s.d / maxD) * 0.55 + rnd(0, 0.12);
            var dir = s.cx < 50 ? -1 : 1;
            tl.to(s.el, {
                y: H * rnd(1.15, 1.5),
                x: dir * rnd(10, 160),
                rotation: dir * rnd(25, 140),
                duration: rnd(0.85, 1.25),
                ease: "power2.in"
            }, delay);
        });
        return tl;
    };
})();
