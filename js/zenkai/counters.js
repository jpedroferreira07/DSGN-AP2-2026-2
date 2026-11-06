;(function(){
    "use strict"

    var Z = window.Zenkai;

    /*-------------------------------------------------------------------------------
	  Contadores animados ([data-count]) disparados ao entrar na tela
	-------------------------------------------------------------------------------*/
    Z.counters = function(){
        gsap.utils.toArray("[data-count]").forEach(function(el){
            var end = parseFloat(el.getAttribute("data-count"));
            var suffix = el.getAttribute("data-suffix") || "";
            var obj = { v: 0 };
            ScrollTrigger.create({
                trigger: el, start: "top 90%", once: true,
                onEnter: function(){
                    gsap.to(obj, {
                        v: end, duration: 2, ease: "power2.out",
                        onUpdate: function(){ el.textContent = Z.fmt(obj.v) + suffix; }
                    });
                }
            });
        });
    };

    /*-------------------------------------------------------------------------------
	  Faixa em marquee: duplica o conteudo e acelera conforme a velocidade do scroll
	-------------------------------------------------------------------------------*/
    Z.marquee = function(){
        gsap.utils.toArray(".zk-marquee__track").forEach(function(track){
            track.innerHTML = track.innerHTML + track.innerHTML;
            var tween = gsap.to(track, { xPercent: -50, ease: "none", duration: 28, repeat: -1 });
            ScrollTrigger.create({
                start: 0, end: "max",
                onUpdate: function(self){
                    var boost = Math.min(6, Math.abs(self.getVelocity()) / 400);
                    gsap.to(tween, { timeScale: 1 + boost, duration: 0.2, overwrite: true });
                    gsap.to(tween, { timeScale: 1, duration: 1, delay: 0.2 });
                }
            });
        });
    };
})();
