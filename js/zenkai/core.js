;(function(){
    "use strict"

    // Namespace compartilhado pelos modulos de js/zenkai/. A ordem de carga esta nas paginas:
    // core -> shatter -> preloader -> hero -> reveal -> ui -> counters -> transitions -> main
    var Z = window.Zenkai = window.Zenkai || {};

    Z.doc = document.documentElement;
    Z.hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
    Z.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Z.finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    Z.lenis = null;
    Z.revealed = false;
    var queue = [];

    // chaves do sessionStorage (sempre dentro de try/catch: pode estar bloqueado)
    Z.store = {
        get: function(k){ try { return sessionStorage.getItem(k); } catch (e) { return null; } },
        set: function(k, v){ try { sessionStorage.setItem(k, v); } catch (e) {} },
        del: function(k){ try { sessionStorage.removeItem(k); } catch (e) {} }
    };

    // tira a capa preta colocada no <head> enquanto o JS carrega
    Z.endCover = function(){ Z.doc.classList.remove("zk-loading"); };

    // "revelado" = abertura terminou (preloader ou transicao de pagina). O hero entra nesse momento.
    Z.whenRevealed = function(fn){
        if (Z.revealed) { fn(); } else { queue.push(fn); }
    };
    Z.markRevealed = function(){
        if (Z.revealed) { return; }
        Z.revealed = true;
        Z.endCover();
        queue.splice(0).forEach(function(fn){ fn(); });
    };

    Z.lock = function(){
        Z.doc.classList.add("zk-lock");
        if (Z.lenis) { Z.lenis.stop(); }
    };
    Z.unlock = function(){
        Z.doc.classList.remove("zk-lock");
        if (Z.lenis) { Z.lenis.start(); }
    };

    // Lenis (scroll suave) ligado ao ScrollTrigger
    Z.smoothScroll = function(){
        if (Z.reduce || typeof window.Lenis === "undefined") { return; }
        Z.lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
        Z.lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function(time){ Z.lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
        document.querySelectorAll('a[href^="#"]').forEach(function(a){
            var id = a.getAttribute("href");
            if (id.length > 1 && document.querySelector(id)) {
                a.addEventListener("click", function(e){
                    e.preventDefault();
                    Z.lenis.scrollTo(id, { offset: -80 });
                });
            }
        });
    };

    // numero no formato brasileiro (8001 -> "8.001")
    Z.fmt = function(n){ return Math.round(n).toLocaleString("pt-BR"); };

    // parametro ?preloader=1 rever a abertura completa (util na apresentacao)
    Z.forcePreloader = /[?&]preloader=1\b/.test(location.search);
})();
