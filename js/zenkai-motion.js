;(function(){
    "use strict"

    var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var doc = document.documentElement;

    function endLoading(){
        doc.classList.remove("zk-loading");
    }

    // sem GSAP o site continua funcionando, so sem os efeitos
    if (!hasGsap) { endLoading(); return; }

    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) { gsap.registerPlugin(SplitText); }

    var lenis = null;

    /*-------------------------------------------------------------------------------
	  Lenis (scroll suave) ligado ao ScrollTrigger
	-------------------------------------------------------------------------------*/
    function smoothScroll(){
        if (reduce || typeof window.Lenis === "undefined") { return; }
        lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
        // links internos do tipo #id passam pelo Lenis
        document.querySelectorAll('a[href^="#"]').forEach(function(a){
            var id = a.getAttribute("href");
            if (id.length > 1 && document.querySelector(id)) {
                a.addEventListener("click", function(e){
                    e.preventDefault();
                    lenis.scrollTo(id, { offset: -80 });
                });
            }
        });
    }

    /*-------------------------------------------------------------------------------
	  Preloader: poder de luta + 7 esferas do dragao
	-------------------------------------------------------------------------------*/
    function preloader(done){
        var seen = false;
        try { seen = !!sessionStorage.getItem("zk-pre"); } catch (e) {}
        if (reduce || seen) { endLoading(); done(); return; }

        var el = document.createElement("div");
        el.className = "zk-preloader";
        el.setAttribute("aria-hidden", "true");
        var orbs = "";
        for (var i = 0; i < 7; i++) { orbs += '<span class="zk-orb"></span>'; }
        el.innerHTML = '<div class="zk-preloader__label">Poder de luta</div>' +
            '<div class="zk-preloader__count">0</div>' +
            '<div class="zk-preloader__orbs">' + orbs + '</div>';
        document.body.appendChild(el);

        var count = el.querySelector(".zk-preloader__count");
        var orbEls = el.querySelectorAll(".zk-orb");
        var state = { v: 0 };
        var lit = 0;

        var tl = gsap.timeline({
            onComplete: function(){
                try { sessionStorage.setItem("zk-pre", "1"); } catch (e) {}
                el.parentNode.removeChild(el);
                done();
            }
        });
        endLoading(); // o preloader assume o lugar da capa preta
        tl.to(state, {
            v: 9001,
            duration: 2.2,
            ease: "power2.inOut",
            onUpdate: function(){
                count.textContent = Math.round(state.v).toLocaleString("pt-BR");
                var n = Math.floor(state.v / 9001 * 7);
                while (lit < n && lit < 7) { orbEls[lit++].classList.add("is-on"); }
            }
        });
        tl.call(function(){ while (lit < 7) { orbEls[lit++].classList.add("is-on"); } });
        tl.to(count, { scale: 1.12, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" });
        tl.to(el, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "+=0.2");
    }

    /*-------------------------------------------------------------------------------
	  Titulos letra a letra (SplitText)
	-------------------------------------------------------------------------------*/
    function splitTitles(){
        if (!window.SplitText) { return; }
        var sel = ".banner_content h2, .section_title h2, .page-cover-tittle, .about_content h2, .hotel_booking_table h2";
        document.querySelectorAll(sel).forEach(function(el){
            var inBanner = !!el.closest(".banner_content");
            SplitText.create(el, {
                type: "words,chars",
                autoSplit: true,
                onSplit: function(self){
                    return gsap.from(self.chars, {
                        yPercent: 110,
                        rotate: 6,
                        autoAlpha: 0,
                        duration: 0.7,
                        ease: "back.out(1.6)",
                        stagger: 0.025,
                        scrollTrigger: inBanner ? null : { trigger: el, start: "top 88%", once: true },
                        delay: inBanner ? 0.1 : 0
                    });
                }
            });
        });
    }

    /*-------------------------------------------------------------------------------
	  Entradas com stagger no scroll
	-------------------------------------------------------------------------------*/
    function revealBatches(){
        var groups = [
            ".accomodation_item", ".facilities_item", ".single-recent-blog-post",
            ".blog_item", ".categories_post", ".gallery_item", ".single_sidebar_widget",
            ".single-footer-widget", ".about_content", ".contact_info .info_item"
        ];
        groups.forEach(function(sel){
            var items = Array.prototype.filter.call(document.querySelectorAll(sel), function(n){
                return !n.closest(".zk-hscroll");
            });
            if (!items.length) { return; }
            gsap.set(items, { autoAlpha: 0, y: 60 });
            ScrollTrigger.batch(items, {
                start: "top 90%",
                once: true,
                onEnter: function(batch){
                    gsap.to(batch, {
                        autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out",
                        stagger: 0.12, overwrite: true
                    });
                }
            });
        });
        // imagem de destaque do "sobre" sobe suavemente (sem deslocar no eixo x, para nao gerar rolagem horizontal)
        gsap.utils.toArray(".about_history_area img.img-fluid").forEach(function(img){
            gsap.from(img, {
                y: 70, scale: 0.94, autoAlpha: 0, duration: 1.1, ease: "power3.out",
                scrollTrigger: { trigger: img, start: "top 85%", once: true }
            });
        });
    }

    /*-------------------------------------------------------------------------------
	  Parallax dos fundos (substitui o stellar)
	-------------------------------------------------------------------------------*/
    function parallax(){
        gsap.utils.toArray(".bg-parallax").forEach(function(layer){
            var host = layer.parentElement;
            gsap.fromTo(layer, { yPercent: 0 }, {
                yPercent: -16, ease: "none",
                scrollTrigger: { trigger: host, start: "top bottom", end: "bottom top", scrub: true }
            });
        });
    }

    /*-------------------------------------------------------------------------------
	  Scroll horizontal com pin (galeria e "Pratos do Dia")
	-------------------------------------------------------------------------------*/
    function horizontalScroll(){
        var targets = [];
        var gallery = document.querySelector("#gallery");
        if (gallery) { targets.push(gallery); }
        var two = document.querySelector(".accomodation_two");
        if (two) { targets.push(two); }
        if (!targets.length) { return; }

        var mm = gsap.matchMedia();
        mm.add("(min-width: 992px) and (prefers-reduced-motion: no-preference)", function(){
            targets.forEach(function(row){
                var section = row.closest("section");
                section.classList.add("zk-hscroll-section");
                row.classList.add("zk-hscroll");
                var dist = function(){ return Math.max(0, row.scrollWidth - row.parentElement.clientWidth); };
                gsap.to(row, {
                    x: function(){ return -dist(); },
                    ease: "none",
                    scrollTrigger: {
                        trigger: section,
                        pin: true,
                        scrub: 0.6,
                        start: "top top+=80",
                        end: function(){ return "+=" + (dist() + 200); },
                        invalidateOnRefresh: true,
                        anticipatePin: 1
                    }
                });
            });
            return function(){
                targets.forEach(function(row){
                    row.classList.remove("zk-hscroll");
                    row.closest("section").classList.remove("zk-hscroll-section");
                    gsap.set(row, { clearProps: "transform" });
                });
            };
        });
    }

    /*-------------------------------------------------------------------------------
	  Cursor customizado + tilt 3D + botoes magneticos
	-------------------------------------------------------------------------------*/
    function cursor(){
        var c = document.createElement("div");
        c.className = "zk-cursor";
        c.setAttribute("aria-hidden", "true");
        document.body.appendChild(c);
        var xTo = gsap.quickTo(c, "x", { duration: 0.35, ease: "power3" });
        var yTo = gsap.quickTo(c, "y", { duration: 0.35, ease: "power3" });
        window.addEventListener("mousemove", function(e){
            c.classList.add("is-visible");
            xTo(e.clientX); yTo(e.clientY);
        });
        document.addEventListener("mouseleave", function(){ c.classList.remove("is-visible"); });
        var hoverSel = "a, button, .btn, input, textarea, select, .nice-select, .gallery_img";
        document.addEventListener("mouseover", function(e){
            gsap.to(c, { scale: e.target.closest(hoverSel) ? 1.9 : 1, duration: 0.25 });
        });
    }

    function tilt(){
        document.querySelectorAll(".accomodation_item, .single-recent-blog-post, .facilities_item").forEach(function(card){
            card.addEventListener("mousemove", function(e){
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                gsap.to(card, {
                    rotationY: px * 12, rotationX: -py * 12,
                    transformPerspective: 900, duration: 0.4, ease: "power2.out", overwrite: "auto"
                });
            });
            card.addEventListener("mouseleave", function(){
                gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
            });
        });
        document.querySelectorAll(".banner_content .theme_btn, .book_now_btn").forEach(function(btn){
            btn.addEventListener("mousemove", function(e){
                var r = btn.getBoundingClientRect();
                gsap.to(btn, {
                    x: (e.clientX - r.left - r.width / 2) * 0.25,
                    y: (e.clientY - r.top - r.height / 2) * 0.25,
                    duration: 0.3, overwrite: "auto"
                });
            });
            btn.addEventListener("mouseleave", function(){
                gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
            });
        });
    }

    /*-------------------------------------------------------------------------------
	  Versao leve (reduzir movimento): so um fade simples
	-------------------------------------------------------------------------------*/
    function lightMode(){
        endLoading();
        gsap.utils.toArray(".accomodation_item, .facilities_item, .single-recent-blog-post, .blog_item, .gallery_item").forEach(function(n){
            gsap.from(n, { autoAlpha: 0, duration: 0.5, scrollTrigger: { trigger: n, start: "top 92%", once: true } });
        });
    }

    function start(){
        if (reduce) { lightMode(); return; }
        smoothScroll();
        preloader(function(){
            document.dispatchEvent(new CustomEvent("zk:ready"));
        });
        var go = function(){
            horizontalScroll();   // primeiro, para o reveal ignorar os itens dos trilhos
            splitTitles();
            revealBatches();
            parallax();
            if (finePointer) { cursor(); tilt(); }
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
