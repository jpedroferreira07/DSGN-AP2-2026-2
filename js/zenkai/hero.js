;(function(){
    "use strict"

    var Z = window.Zenkai;

    /*-------------------------------------------------------------------------------
	  Brasas e faiscas de ki no banner da home (canvas 2D, leve)
	-------------------------------------------------------------------------------*/
    Z.embers = function(){
        var host = document.querySelector(".banner_area .booking_table");
        if (!host || !document.querySelector(".banner_area .hotel_booking_area") || !document.querySelector(".banner_content")) { return; }
        var canvas = document.createElement("canvas");
        canvas.className = "zk-embers";
        canvas.setAttribute("aria-hidden", "true");
        var ctx = canvas.getContext("2d");
        if (!ctx) { return; }
        host.insertBefore(canvas, host.querySelector(".container"));

        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        var w = 0, h = 0;
        var wind = 0, windTarget = 0;
        var visible = true, raf = 0;
        var COUNT = window.innerWidth < 768 ? 36 : 72;
        var parts = [];

        function resize(){
            w = host.clientWidth; h = host.clientHeight;
            canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
            canvas.style.width = w + "px"; canvas.style.height = h + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function spawn(p, initial){
            p.x = Math.random() * w;
            p.y = initial ? Math.random() * h : h + 10;
            p.r = 0.8 + Math.random() * 2.4;
            p.vy = 0.35 + Math.random() * 1.1;
            p.sway = Math.random() * Math.PI * 2;
            p.swaySpeed = 0.01 + Math.random() * 0.02;
            p.life = 0;
            p.max = 260 + Math.random() * 280;
            p.hue = 28 + Math.random() * 22; // laranja -> amarelo
        }

        resize();
        for (var i = 0; i < COUNT; i++) { var p = {}; spawn(p, true); parts.push(p); }
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", function(e){
            var r = host.getBoundingClientRect();
            windTarget = ((e.clientX - r.left) / r.width - 0.5) * 1.6;
        });

        function frame(){
            wind += (windTarget - wind) * 0.04;
            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = "lighter";
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                p.life++;
                p.sway += p.swaySpeed;
                p.y -= p.vy;
                p.x += Math.sin(p.sway) * 0.5 + wind;
                if (p.life > p.max || p.y < -10) { spawn(p, false); }
                var t = p.life / p.max;
                var a = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.9;
                var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
                g.addColorStop(0, "hsla(" + p.hue + ",100%,62%," + a + ")");
                g.addColorStop(0.35, "hsla(" + p.hue + ",100%,52%," + (a * 0.35) + ")");
                g.addColorStop(1, "hsla(" + p.hue + ",100%,50%,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
                ctx.fill();
            }
            raf = visible ? requestAnimationFrame(frame) : 0;
        }
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function(entries){
                visible = entries[0].isIntersecting;
                if (visible && !raf) { raf = requestAnimationFrame(frame); }
            }).observe(host);
        }
        raf = requestAnimationFrame(frame);
    };

    /*-------------------------------------------------------------------------------
	  Entrada do hero (banner da home, banners internos e cabecalho de pagina)
	-------------------------------------------------------------------------------*/
    Z.heroIntro = function(){
        var titles = document.querySelectorAll(".banner_content h1, .banner_content h2, .page-cover-tittle");
        var others = document.querySelectorAll(".banner_content h4, .banner_content h6, .banner_content p, .banner_content .btn, .breadcrumb, .hotel_booking_table");
        var header = document.querySelector(".header_area");

        gsap.set(others, { autoAlpha: 0, y: 30 });
        if (header) { gsap.set(header, { autoAlpha: 0, y: -40 }); }
        if (!window.SplitText) { gsap.set(titles, { autoAlpha: 1 }); }

        titles.forEach(function(el){ gsap.set(el, { autoAlpha: 0 }); });

        Z.whenRevealed(function(){
            var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            if (header) { tl.to(header, { autoAlpha: 1, y: 0, duration: 0.8 }, 0); }
            titles.forEach(function(el, idx){
                gsap.set(el, { autoAlpha: 1 });
                if (window.SplitText) {
                    SplitText.create(el, {
                        type: "words,chars",
                        autoSplit: true,
                        onSplit: function(self){
                            return gsap.from(self.chars, {
                                yPercent: 120, rotate: 8, autoAlpha: 0, duration: 0.8,
                                ease: "back.out(1.7)", stagger: 0.03, delay: 0.15 + idx * 0.1
                            });
                        }
                    });
                } else {
                    tl.from(el, { y: 40, autoAlpha: 0, duration: 0.8 }, 0.2);
                }
            });
            tl.to(others, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.35);
        });
    };

    /*-------------------------------------------------------------------------------
	  Parallax dos fundos
	-------------------------------------------------------------------------------*/
    Z.parallax = function(){
        gsap.utils.toArray(".bg-parallax").forEach(function(layer){
            gsap.fromTo(layer, { yPercent: 0 }, {
                yPercent: -16, ease: "none",
                scrollTrigger: { trigger: layer.parentElement, start: "top bottom", end: "bottom top", scrub: true }
            });
        });
    };
})();
