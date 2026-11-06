;(function(){
    "use strict"

    var Z = window.Zenkai;

    // Saida: ao clicar num link interno o Shenlong desce cobrindo a tela e so entao navega.
    // A chegada (Shenlong revelando a pagina nova) e feita pelo main.js via Z.dragonSweep("enter").
    Z.pageLeave = function(){
        if (Z.reduce) { return; }
        var leaving = false;

        document.addEventListener("click", function(e){
            if (leaving) { e.preventDefault(); return; }
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
            leaving = true;
            Z.store.set("zk-nav", "1");
            if (Z.lenis) { Z.lenis.stop(); }
            Z.dragonSweep("leave", function(){ location.href = a.href; });
        });

        // voltar pelo historico (bfcache): tira o Shenlong/cortina que ficaram na tela
        window.addEventListener("pageshow", function(e){
            if (e.persisted) {
                leaving = false;
                document.querySelectorAll(".zk-dragon, .zk-curtain").forEach(function(n){ n.parentNode.removeChild(n); });
                if (Z.lenis) { Z.lenis.start(); }
            }
        });
    };
})();
