;(function(){
    "use strict"

    var hasGsap = typeof window.gsap !== "undefined";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Todos os formularios sao simulados: validam e mostram a confirmacao, sem enviar nada.
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var FORMS = {
        contato: {
            fields: [
                { name: "name", min: 2, empty: "Diga seu nome, guerreiro!", short: "O nome precisa ter pelo menos 2 letras." },
                { name: "email", email: true, empty: "Informe seu e-mail para responder.", bad: "Esse e-mail não parece válido." },
                { name: "subject", min: 4, empty: "Informe o assunto da mensagem.", short: "O assunto precisa ter pelo menos 4 letras." },
                { name: "message", min: 20, empty: "Escreva sua mensagem.", short: "Conte um pouco mais (mínimo de 20 caracteres)." }
            ],
            title: "Mensagem recebida, guerreiro!",
            text: function(){ return "Vamos responder em breve, com a energia de um Kamehameha."; },
            button: "Enviando..."
        },
        reserva: {
            fields: [
                { name: "data", empty: "Escolha a data da reserva." },
                { name: "horario", empty: "Escolha o horário." },
                { name: "adultos", select: true, empty: "Quantos adultos?" },
                { name: "mesas", select: true, empty: "Escolha o número de mesas." }
            ],
            title: "Mesa reservada!",
            text: function(f){
                return "Esperamos você dia " + val(f, "data") + " às " + val(f, "horario") + ". Que o seu ki esteja alto!";
            },
            button: "Reservando..."
        },
        newsletter: {
            fields: [
                { name: "EMAIL", email: true, empty: "Informe seu e-mail.", bad: "Esse e-mail não parece válido." }
            ],
            title: "Você entrou para a Patrulha Zenkai!",
            text: function(){ return "Novidades e promoções vão chegar ao seu e-mail."; },
            button: ""
        },
        comentario: {
            fields: [
                { name: "name", min: 2, empty: "Diga seu nome.", short: "O nome precisa ter pelo menos 2 letras." },
                { name: "email", email: true, empty: "Informe seu e-mail.", bad: "Esse e-mail não parece válido." },
                { name: "message", min: 5, empty: "Escreva seu comentário.", short: "Escreva um pouco mais." }
            ],
            title: "Comentário enviado!",
            text: function(){ return "Ele aparece no post depois da análise do chef Kuririn."; },
            button: "Publicando..."
        }
    };

    function val(form, name){
        var el = form.querySelector('[name="' + name + '"]');
        return el ? String(el.value).trim() : "";
    }

    function holderOf(el){
        var h = el.closest(".form-group, .input-group") || el.parentElement;
        // em linhas flex sem quebra (ex.: newsletter do rodape) a mensagem vai para fora da linha
        var cs = window.getComputedStyle(h);
        if (cs.display.indexOf("flex") > -1 && cs.flexWrap === "nowrap") { h = h.parentElement; }
        return h;
    }

    function clearError(el){
        el.removeAttribute("aria-invalid");
        var h = holderOf(el);
        var msg = h.querySelector(".zk-field-error");
        if (msg) { msg.parentNode.removeChild(msg); }
    }

    function showError(el, text){
        clearError(el);
        el.setAttribute("aria-invalid", "true");
        var msg = document.createElement("span");
        msg.className = "zk-field-error";
        msg.setAttribute("role", "alert");
        msg.textContent = text;
        holderOf(el).appendChild(msg);
    }

    function validate(form, cfg){
        var first = null;
        cfg.fields.forEach(function(f){
            var el = form.querySelector('[name="' + f.name + '"]');
            if (!el) { return; }
            var v = String(el.value).trim();
            var err = "";
            if (f.select) {
                if (el.selectedIndex < 1) { err = f.empty; }
            } else if (!v) {
                err = f.empty;
            } else if (f.email && !EMAIL.test(v)) {
                err = f.bad;
            } else if (f.min && v.length < f.min) {
                err = f.short;
            }
            if (err) {
                showError(el, err);
                if (!first) { first = el; }
            } else {
                clearError(el);
            }
        });
        return first;
    }

    /*-------------------------------------------------------------------------------
	  Toast da Esfera do Dragao
	-------------------------------------------------------------------------------*/
    var toast = null, toastTimer = 0;

    function buildToast(){
        toast = document.createElement("div");
        toast.className = "zk-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.innerHTML =
            '<div class="zk-toast__orb"><svg viewBox="0 0 34 34" aria-hidden="true"><path d="M7 18 L14 25 L27 9"/></svg></div>' +
            '<div class="zk-toast__body"><strong></strong><span></span></div>' +
            '<button type="button" class="zk-toast__close" aria-label="Fechar">&times;</button>';
        document.body.appendChild(toast);
        toast.querySelector(".zk-toast__close").addEventListener("click", closeToast);
    }

    function closeToast(){
        clearTimeout(toastTimer);
        if (!toast) { return; }
        if (hasGsap && !reduce) {
            gsap.to(toast, { x: 40, autoAlpha: 0, duration: 0.35, onComplete: function(){ toast.classList.remove("is-open"); } });
        } else {
            toast.classList.remove("is-open");
        }
    }

    function openToast(title, text){
        if (!toast) { buildToast(); }
        clearTimeout(toastTimer);
        toast.querySelector("strong").textContent = title;
        toast.querySelector("span").textContent = text;
        toast.classList.remove("is-open");
        void toast.offsetWidth; // reinicia a animacao do check
        toast.classList.add("is-open");
        if (hasGsap && !reduce) {
            gsap.killTweensOf(toast);
            gsap.fromTo(toast, { x: 120, autoAlpha: 0, scale: 0.85 }, { x: 0, autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" });
            gsap.fromTo(toast.querySelector(".zk-toast__orb"), { rotationY: -360 }, { rotationY: 0, duration: 0.9, ease: "power3.out" });
        } else {
            toast.style.visibility = "visible";
            toast.style.opacity = 1;
        }
        toastTimer = setTimeout(closeToast, 5500);
    }

    /*-------------------------------------------------------------------------------
	  Ligacao dos formularios
	-------------------------------------------------------------------------------*/
    function submitButton(form){
        return form.querySelector('button[type="submit"], button:not([type]), .book_now_btn, .primary-btn');
    }

    function bind(form){
        var key = form.getAttribute("data-zk-form");
        var cfg = FORMS[key];
        if (!cfg) { return; }
        form.noValidate = true;
        form.removeAttribute("action");
        form.removeAttribute("target");

        // limpa o erro assim que o visitante corrige o campo
        form.addEventListener("input", function(e){ if (e.target.name) { clearError(e.target); } });
        form.addEventListener("change", function(e){ if (e.target.name) { clearError(e.target); } });
        // datepicker dispara dp.change no jQuery
        if (window.jQuery) {
            window.jQuery(form).on("dp.change", "input", function(){ clearError(this); });
        }

        form.addEventListener("submit", function(e){
            e.preventDefault();
            var first = validate(form, cfg);
            if (first) {
                form.classList.remove("zk-shake");
                void form.offsetWidth;
                form.classList.add("zk-shake");
                if (first.focus) { try { first.focus({ preventScroll: false }); } catch (err) { first.focus(); } }
                return;
            }
            var btn = submitButton(form);
            var label = btn ? btn.innerHTML : "";
            if (btn) {
                btn.classList.add("is-loading");
                if (cfg.button) { btn.textContent = cfg.button; }
            }
            // envio simulado: nada sai do navegador
            setTimeout(function(){
                var message = cfg.text(form);
                if (btn) {
                    btn.classList.remove("is-loading");
                    btn.innerHTML = label;
                }
                form.reset();
                // reseta os selects estilizados (nice-select)
                if (window.jQuery && window.jQuery.fn.niceSelect) { window.jQuery(form).find("select").niceSelect("update"); }
                openToast(cfg.title, message);
            }, 1200);
        });
    }

    function init(){
        document.querySelectorAll("form[data-zk-form]").forEach(bind);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
