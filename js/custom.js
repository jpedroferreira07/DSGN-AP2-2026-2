;(function($){
    "use strict"
    var nav_offset_top = $('.header_area').height()+50; 
    /*-------------------------------------------------------------------------------
	  Navbar 
	-------------------------------------------------------------------------------*/

	//* Navbar Fixed  
    function navbarFixed(){
        if ( $('.header_area').length ){ 
            $(window).scroll(function() {
                var scroll = $(window).scrollTop();   
                if (scroll >= nav_offset_top ) {
                    $(".header_area").addClass("navbar_fixed");
                } else {
                    $(".header_area").removeClass("navbar_fixed");
                }
            });
        };
    };
    navbarFixed();
    
    function testimonialSlider(){
        if ( $('.testimonial_slider').length ){
            $('.testimonial_slider').owlCarousel({
                loop:true,
                margin: 30,
                items: 2,
                nav:false,
                autoplay: true,
                dots: true,
                smartSpeed: 1500,
                responsiveClass: true,
                responsive: {
                    0: {
                        items: 1,
                    },
                    768: {
                        items: 2,
                    },
                }
            })
        }
    }
    testimonialSlider();
    
    // parallax dos fundos: ver js/zenkai-motion.js (GSAP)

    $('select').niceSelect();
    // reserva de mesa: data e horario (o restaurante fecha as segundas)
    // o plugin e o smalot (formato dd/mm/yyyy, hh:ii): o formato antigo "DD/MM/YYYY" era lido como nome do dia e do mes por extenso
    $.fn.datetimepicker.dates['pt-BR'] = {
        days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
        daysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        daysMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
        months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        today: 'Hoje',
        clear: 'Limpar',
        suffix: [],
        meridiem: []
    };
    $('#datetimepicker11').datetimepicker({
        language: 'pt-BR',
        format: 'dd/mm/yyyy',
        startView: 2,
        minView: 2,
        maxView: 4,
        autoclose: true,
        todayHighlight: true,
        startDate: new Date(),
        fontAwesome: true,
        daysOfWeekDisabled: [1],
        pickerPosition: 'bottom-left'
    });
    $('#datetimepicker1').datetimepicker({
        language: 'pt-BR',
        format: 'hh:ii',
        startView: 1,
        minView: 0,
        maxView: 1,
        minuteStep: 15,
        autoclose: true,
        fontAwesome: true,
        pickerPosition: 'bottom-left'
    });
    
    // galeria: o trilho horizontal fica em js/zenkai-motion.js
	
	/*----------------------------------------------------*/
    /*  Simple LightBox js
    /*----------------------------------------------------*/
    $('.imageGallery1 .light').simpleLightbox();
    

})(jQuery)