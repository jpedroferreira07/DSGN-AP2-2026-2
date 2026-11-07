;(function(){
    "use strict"

    var Z = window.Zenkai;

    // sem GSAP o site continua funcionando, so sem os efeitos
    if (!Z.hasGsap) { Z.endCover(); return; }

    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) { gsap.registerPlugin(SplitText); }

    function start(){
        if (Z.reduce) {
            Z.lightMode();
            Z.markRevealed();
            return;
        }
        Z.smoothScroll();
        Z.heroIntro();   // deixa o hero escondido ate a abertura terminar
        Z.embers();

        // abertura: primeiro acesso = preloader com rachadura; troca de pagina ou F5 = Shenlong
        var arrivedByNav = !!Z.store.get("zk-nav");
        var reloaded = Z.isReload && !!Z.store.get("zk-pre") && !Z.forcePreloader;
        if (arrivedByNav || reloaded) {
            Z.store.del("zk-nav");
            Z.dragonSweep("enter");
        } else {
            Z.preloader(function(){ Z.markRevealed(); });
            // preloader ja visto (ou ?preloader ausente): revela na hora
            if (!document.querySelector(".zk-preloader")) { Z.markRevealed(); }
        }
        Z.pageLeave();

        var go = function(){
            Z.horizontalScroll(); // primeiro, para o reveal ignorar os itens dos trilhos
            Z.splitTitles();
            Z.revealBatches();
            Z.imageMasks();
            Z.parallax();
            Z.progressBar();
            Z.smartNav();
            Z.marquee();
            Z.counters();
            if (Z.finePointer) { Z.cursor(); Z.tilt(); }
            ScrollTrigger.refresh();
        };
        if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); } else { go(); }
        window.addEventListener("load", function(){ ScrollTrigger.refresh(); });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
