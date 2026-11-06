;(function(){
    "use strict"

    var Z = window.Zenkai;

    // Abertura: poder de luta sobe ate 8.001, estoura "E MAIS DE 8 MIL!!", a tela racha e cai em cacos.
    Z.preloader = function(done){
        var seen = !!Z.store.get("zk-pre") && !Z.forcePreloader;
        if (Z.reduce || seen) { done(); return; }

        var root = document.createElement("div");
        root.className = "zk-preloader";
        root.setAttribute("aria-hidden", "true");
        // esfera n tem n estrelas (1 a 7), posicoes em -1..1 dentro da esfera
        var P = {
            1: [[0, 0]],
            2: [[-0.3, 0], [0.3, 0]],
            3: [[0, -0.3], [-0.3, 0.22], [0.3, 0.22]],
            4: [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]],
            5: [[-0.38, -0.38], [0.38, -0.38], [0, 0], [-0.38, 0.38], [0.38, 0.38]],
            6: [[-0.32, -0.46], [0.32, -0.46], [-0.32, 0], [0.32, 0], [-0.32, 0.46], [0.32, 0.46]],
            7: [[-0.34, -0.48], [0.34, -0.48], [-0.4, 0], [0, 0], [0.4, 0], [-0.34, 0.48], [0.34, 0.48]]
        };
        var orbs = "";
        for (var i = 1; i <= 7; i++) {
            orbs += '<span class="zk-orb">' + P[i].map(function(s){
                return '<i style="left:' + (50 + s[0] * 50) + '%;top:' + (50 + s[1] * 50) + '%">★</i>';
            }).join("") + '</span>';
        }
        root.innerHTML =
            '<div class="zk-preloader__stage">' +
                '<div class="zk-preloader__label">Poder de luta</div>' +
                '<div class="zk-preloader__count">0</div>' +
                '<div class="zk-preloader__phrase"><span>É MAIS DE</span><strong>8 MIL!!</strong></div>' +
                '<div class="zk-preloader__orbs">' + orbs + '</div>' +
            '</div>' +
            '<div class="zk-preloader__flash"></div>';
        document.body.appendChild(root);
        Z.lock();
        Z.endCover(); // o preloader assume o lugar da capa do <head>

        var stage = root.querySelector(".zk-preloader__stage");
        var count = root.querySelector(".zk-preloader__count");
        var phrase = root.querySelector(".zk-preloader__phrase");
        var label = root.querySelector(".zk-preloader__label");
        var flash = root.querySelector(".zk-preloader__flash");
        var orbEls = root.querySelectorAll(".zk-orb");
        var state = { v: 0 };
        var lit = 0;
        var cracks = Z.buildCracks();
        root.appendChild(cracks);
        var paths = cracks.querySelectorAll("path");
        gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(phrase, { autoAlpha: 0 });
        gsap.set(flash, { autoAlpha: 0 });

        function shake(k){
            gsap.set(stage, { x: (Math.random() - 0.5) * k, y: (Math.random() - 0.5) * k });
        }

        var tl = gsap.timeline();
        Z.preloaderTl = tl; // exposto para depuracao (tl.pause().time(s, false))

        // 1) contador + tremor crescente + esferas
        tl.to(state, {
            v: 8001,
            duration: 2.6,
            ease: "power3.in",
            onUpdate: function(){
                var p = state.v / 8001;
                count.textContent = Z.fmt(state.v);
                shake(2 + p * 14);
                var n = Math.floor(p * 7);
                while (lit < n && lit < 7) { orbEls[lit++].classList.add("is-on"); }
            }
        });
        tl.call(function(){ while (lit < 7) { orbEls[lit++].classList.add("is-on"); } });

        // 2) a frase estoura
        tl.to(flash, { autoAlpha: 1, duration: 0.08 });
        tl.set(count, { display: "none" }, "<");
        tl.set(label, { display: "none" }, "<");
        tl.fromTo(phrase, { autoAlpha: 1, scale: 3.2 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "expo.out", immediateRender: false }, "<");
        tl.to(flash, { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, "<0.08");
        tl.to(stage, { x: 0, y: 0, duration: 0.01 }, "<");
        tl.to({}, { duration: 1.1, onUpdate: function(){ shake(6); } });
        tl.set(stage, { x: 0, y: 0 });

        // 3) rachaduras saindo do centro
        tl.to(paths, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out", stagger: { each: 0.02, from: "random" } });
        tl.to(flash, { autoAlpha: 0.9, duration: 0.07 });

        // 4) vira cacos e cai
        tl.call(function(){
            var built = Z.buildShards();
            root.insertBefore(built.el, flash);
            root.classList.add("is-shattering");
            gsap.set(stage, { autoAlpha: 0 });
            gsap.to(cracks, { autoAlpha: 0, duration: 0.25 });
            gsap.to(flash, { autoAlpha: 0, duration: 0.35 });
            Z.dropTl = Z.dropShards(built, function(){
                // o hero comeca a entrar assim que os primeiros cacos caem
                Z.store.set("zk-pre", "1");
                Z.unlock();
                Z.markRevealed();
            }, function(){
                if (root.parentNode) { root.parentNode.removeChild(root); }
                done();
            });
        });
    };
})();
