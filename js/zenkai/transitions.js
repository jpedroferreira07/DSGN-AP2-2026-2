;(function(){
    "use strict"

    var Z = window.Zenkai;
    var curtain = null;

    // uma unica cortina por pagina, compartilhada pela entrada e pela saida
    function getCurtain(){
        if (curtain) { return curtain; }
        curtain = document.createElement("div");
        curtain.className = "zk-curtain";
        curtain.setAttribute("aria-hidden", "true");
        curtain.innerHTML = '<span class="zk-curtain__line"></span>';
        document.body.appendChild(curtain);
        gsap.set(curtain, { yPercent: 100 }); // o GSAP passa a controlar a posicao (evita conflito com o translate do CSS)
        return curtain;
    }

    // chegada: se veio de outra pagina do site, a cortina ja cobre a tela e sobe revelando
    Z.pageEnter = function(done){
        if (Z.reduce || !Z.store.get("zk-nav")) { done(); return; }
        Z.store.del("zk-nav");
        getCurtain();
        gsap.set(curtain, { yPercent: 0 });
        Z.endCover();
        gsap.to(curtain, {
            yPercent: -100, duration: 0.8, ease: "power4.inOut", delay: 0.1,
            onStart: function(){ Z.markRevealed(); },
            onComplete: function(){ gsap.set(curtain, { yPercent: 100 }); done(); }
        });
    };

    // saida: cortina sobe cobrindo a tela e so entao navega
    Z.pageLeave = function(){
        if (Z.reduce) { return; }
        getCurtain(); // escondida (translateY(100%) no CSS); nao reposiciona se a entrada estiver em andamento

        document.addEventListener("click", function(e){
            var a = e.target.closest && e.target.closest("a[href]");
            if (!a || e.defaultPrevented || e.button !== 0) { return; }
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
            if (a.target && a.target !== "_self") { return; }
            if (a.hasAttribute("download")) { return; }
            var href = a.getAttribute("href");
            if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) { return; }
            var url;
            try { url = new URL(a.href, location.href); } catch (err) { return; }
            if (url.origin !== location.origin && url.protocol !== "file:") { return; }
            if (url.pathname === location.pathname && url.search === location.search) { return; }
            if (!/\.html?$/i.test(url.pathname) && !/\/$/.test(url.pathname)) { return; }
            e.preventDefault();
            Z.store.set("zk-nav", "1");
            if (Z.lenis) { Z.lenis.stop(); }
            gsap.to(curtain, {
                yPercent: 0, duration: 0.6, ease: "power4.inOut",
                onComplete: function(){ location.href = a.href; }
            });
        });

        // voltar pelo historico (bfcache): garante que a cortina nao fique cobrindo a tela
        window.addEventListener("pageshow", function(e){
            if (e.persisted) {
                gsap.set(curtain, { yPercent: 100 });
                if (Z.lenis) { Z.lenis.start(); }
            }
        });
    };
})();
