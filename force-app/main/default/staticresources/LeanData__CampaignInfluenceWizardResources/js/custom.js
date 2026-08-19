/*** MOBILE MENU ***/
$("#mobile-menu").click(function(){
    $("#right-sidebar").fadeToggle('slow');
});

/*** TABLE ***/
$(function() {
    $('td:first-child input').change(function() {
        $(this).closest('tr').toggleClass("colored", this.checked);
    });
});

$('#allcb-member').change(function(){
    if($(this).prop('checked')){
        $('.table-member tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', true);
			$(this).closest('tr').addClass("colored", this.checked);
        });
    }else{
        $('.table-member tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', false);
			$(this).closest('tr').removeClass("colored", this.checked);
        });
    }
});

$('#allcb-lead').change(function(){
    if($(this).prop('checked')){
        $('.table-lead tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', true);
			$(this).closest('tr').addClass("colored", this.checked);
        });
    }else{
        $('.table-lead tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', false);
			$(this).closest('tr').removeClass("colored", this.checked);
        });
    }
});

$('#allcb-names').change(function(){
    if($(this).prop('checked')){
        $('.table-names tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', true);
			$(this).closest('tr').addClass("colored", this.checked);
        });
    }else{
        $('.table-names tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', false);
			$(this).closest('tr').removeClass("colored", this.checked);
        });
    }
});

$('#allcb-type').change(function(){
    if($(this).prop('checked')){
        $('.table-type tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', true);
			$(this).closest('tr').addClass("colored", this.checked);
        });
    }else{
        $('.table-type tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', false);
			$(this).closest('tr').removeClass("colored", this.checked);
        });
    }
});

$('#allcb-opp').change(function(){
    if($(this).prop('checked')){
        $('.table-opp tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', true);
			$(this).closest('tr').addClass("colored", this.checked);
        });
    }else{
        $('.table-opp tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', false);
			$(this).closest('tr').removeClass("colored", this.checked);
        });
    }
});

$('#allcb-opp-types').change(function(){
    if($(this).prop('checked')){
        $('.table-opp-types tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', true);
			$(this).closest('tr').addClass("colored", this.checked);
        });
    }else{
        $('.table-opp-types tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', false);
			$(this).closest('tr').removeClass("colored", this.checked);
        });
    }
});


$('#allcb-opp-stages').change(function(){
    if($(this).prop('checked')){
        $('.table-opp-stages tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', true);
			$(this).closest('tr').addClass("colored", this.checked);
			$(this).removeAttr("disabled", this.checked);
        });
    }else{
        $('.table-opp-stages tbody tr td input[type="checkbox"]').each(function(){
            $(this).prop('checked', false);
			$(this).closest('tr').removeClass("colored", this.checked);
			$(this).closest('td:nth-child(2) input').prop("disabled", true);
			$(this).closest('td:nth-child(3) input').prop("disabled", true);
        });
    }
});

$(document).ready(function() {
    $('.table-opp-stages tbody tr').each(function() {
        $(this).find('input[type=checkbox]').first().click(function() {
            $(this).parents('tr')
                .find("input[type=checkbox]:gt(0)")
                .prop("disabled", !$(this).is(":checked"));
        });
    })
    .find('input[type=checkbox]:gt(0)').prop("disabled", true);
    
});

/*** TOOLTIP ***/
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});


/*** NAVIGATION ***/
$(document).ready(function(){	
	$('ul.tabs li').click(function(){
		var tab_id = $(this).prop('data-tab');

		$('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
	})
});

$(document).ready(function(){	
	$('.pagi').click(function(){
		var tab_id = $(this).prop('data-tab');

		$('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
	})
});

$(function(){
  $('#step-2').on('click',function(){
       $('#nav-2').addClass('current');
    });
});

$(function(){
  $('#step-2a').on('click',function(){
       $('#nav-2').addClass('current');
    });
});

$(function(){
  $('#step-1').on('click',function(){
       $('#nav-1').addClass('current');
    });
});

$(function(){
  $('#step-3').on('click',function(){
       $('#nav-3').addClass('current');
    });
});

$(function(){
  $('#step-3a').on('click',function(){
       $('#nav-3').addClass('current');
    });
});

$(function(){
  $('#step-4').on('click',function(){
       $('#nav-4').addClass('current');
    });
});

/*** TITLES ***/
$(".titles").each(function(){
     $(this).hide();
    if($(this).prop('id') == 'title_1') {
        $(this).show();
    }
});

$('li').on( "click", function(e) {
    e.preventDefault();
    var id = $(this).prop('data-related'); 
    $(".titles").each(function(){
        $(this).hide();
        if($(this).prop('id') == id) {
            $(this).show();
        }
    });
});

$(".titles").each(function(){
     $(this).hide();
    if($(this).prop('id') == 'title_1') {
        $(this).show();
    }
});

$('.pagi').on( "click", function(e) {
    e.preventDefault();
    var id = $(this).prop('data-related'); 
    $(".titles").each(function(){
        $(this).hide();
        if($(this).prop('id') == id) {
            $(this).show();
        }
    });
});


/*** SCROLL ***/
 $(".pagi").click(function(){
	 $("html, body").animate({
	 scrollTop:0
	 },"fast"); 
});


$(function(){
	$('#step-4').on('click',function(){
	   $('#right-sidebar').addClass('more-padding');
	});
	$('#nav-4').on('click',function(){
       $('#right-sidebar').addClass('more-padding');
    });
	$('#nav-3').on('click',function(){
       $('#right-sidebar').removeClass('more-padding');
    });
	$('#nav-2').on('click',function(){
       $('#right-sidebar').removeClass('more-padding');
    });
	$('#nav-1').on('click',function(){
       $('#right-sidebar').removeClass('more-padding');
    });
	$('#step-3a').on('click',function(){
	   $('#right-sidebar').removeClass('more-padding');
	});
	$('#mobile-menu').on('click',function(){
	   $('#right-sidebar').removeClass('more-padding');
	});
});