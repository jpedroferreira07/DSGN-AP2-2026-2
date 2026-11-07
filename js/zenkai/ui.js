;(function(){
    "use strict"

    var Z = window.Zenkai;

    /*-------------------------------------------------------------------------------
	  Barra de progresso de leitura
	-------------------------------------------------------------------------------*/
    Z.progressBar = function(){
        var bar = document.createElement("div");
        bar.className = "zk-progress";
        bar.setAttribute("aria-hidden", "true");
        document.body.appendChild(bar);
        gsap.fromTo(bar, { scaleX: 0 }, {
            scaleX: 1, ease: "none",
            scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
        });
    };

    /*-------------------------------------------------------------------------------
	  Menu inteligente: some ao descer, volta ao subir
	-------------------------------------------------------------------------------*/
    Z.smartNav = function(){
        var header = document.querySelector(".header_area");
        if (!header) { return; }
        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: function(self){
                var y = self.scroll();
                var hide = self.direction === 1 && y > 320 && !header.matches(":hover, :focus-within");
                header.classList.toggle("zk-nav-hidden", hide);
                if (self.direction === -1) { header.classList.remove("zk-nav-hidden"); }
            }
        });
    };

    /*-------------------------------------------------------------------------------
	  Cursor customizado, tilt 3D nos cards e botoes magneticos
	-------------------------------------------------------------------------------*/
    Z.cursor = function(){
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
    };

    Z.tilt = function(){
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
    };
})();
