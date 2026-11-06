;(function(){
    "use strict"

    var Z = window.Zenkai;

    /*-------------------------------------------------------------------------------
	  Titulos de secao letra a letra (o hero tem a propria entrada em hero.js)
	-------------------------------------------------------------------------------*/
    Z.splitTitles = function(){
        if (!window.SplitText) { return; }
        var sel = ".section_title h2, .about_content h2";
        document.querySelectorAll(sel).forEach(function(el){
            SplitText.create(el, {
                type: "words,chars",
                autoSplit: true,
                onSplit: function(self){
                    return gsap.from(self.chars, {
                        yPercent: 110, rotate: 6, autoAlpha: 0, duration: 0.7,
                        ease: "back.out(1.6)", stagger: 0.025,
                        scrollTrigger: { trigger: el, start: "top 88%", once: true }
                    });
                }
            });
        });
    };

    /*-------------------------------------------------------------------------------
	  Entradas com stagger no scroll
	-------------------------------------------------------------------------------*/
    Z.revealBatches = function(){
        var groups = [
            ".accomodation_item", ".facilities_item", ".single-recent-blog-post",
            ".blog_item", ".categories_post", ".gallery_item", ".single_sidebar_widget",
            ".single-footer-widget", ".about_content", ".contact_info .info_item"
        ];
        groups.forEach(function(sel){
            var items = Array.prototype.filter.call(document.querySelectorAll(sel), function(n){
                return !n.closest("#gallery");
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
    };

    /*-------------------------------------------------------------------------------
	  Fotos com mascara (clip-path) e zoom suave ligado ao scroll
	-------------------------------------------------------------------------------*/
    Z.imageMasks = function(){
        var imgs = document.querySelectorAll(
            ".about_history_area img.img-fluid, .single-recent-blog-post .thumb img, .feature-img img, .blog_post > img, .single-post .col-6 img"
        );
        imgs.forEach(function(img, i){
            var holder = img.parentElement;
            holder.style.overflow = "hidden";
            var dir = i % 2 ? "inset(0 100% 0 0)" : "inset(0 0 100% 0)";
            gsap.fromTo(holder, { clipPath: dir }, {
                clipPath: "inset(0 0% 0% 0)", duration: 1.2, ease: "power4.inOut",
                scrollTrigger: { trigger: holder, start: "top 85%", once: true }
            });
            gsap.fromTo(img, { scale: 1.25 }, {
                scale: 1, ease: "none",
                scrollTrigger: { trigger: holder, start: "top bottom", end: "bottom top", scrub: true }
            });
        });
    };

    // Galeria em "tetris": as fotos (250 e 380 de altura) se encaixam numa grade densa e caem na vertical
    Z.horizontalScroll = function(){
        var items = gsap.utils.toArray("#gallery .gallery_item");
        if (!items.length) { return; }
        var mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference)", function(){
            gsap.set(items, { autoAlpha: 0, y: -260, rotation: function(i){ return (i % 2 ? 1 : -1) * 4; } });
            ScrollTrigger.batch(items, {
                start: "top 92%",
                once: true,
                onEnter: function(batch){
                    gsap.to(batch, {
                        autoAlpha: 1, y: 0, rotation: 0, duration: 0.9, ease: "bounce.out",
                        stagger: 0.14, overwrite: true
                    });
                }
            });
        });
    };

    // versao leve (reduzir movimento): so um fade simples
    Z.lightMode = function(){
        Z.endCover();
        gsap.utils.toArray(".accomodation_item, .facilities_item, .single-recent-blog-post, .blog_item, .gallery_item").forEach(function(n){
            gsap.from(n, { autoAlpha: 0, duration: 0.5, scrollTrigger: { trigger: n, start: "top 92%", once: true } });
        });
    };
})();
