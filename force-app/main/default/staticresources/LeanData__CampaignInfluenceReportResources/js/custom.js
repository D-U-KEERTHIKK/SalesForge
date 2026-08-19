$("#table-1").click(function(){
    $("#table-1-show").fadeToggle('fast');
	$(this).toggleClass('glyphicon-minus');
});

$("#table-2").click(function(){
    $("#table-2-show").fadeToggle('fast');
	$(this).toggleClass('glyphicon-minus');
});

$("#table-3").click(function(){
    $("#table-3-show").fadeToggle('fast');
	$(this).toggleClass('glyphicon-minus');
});

$("#table-4").click(function(){
    $("#table-4-show").fadeToggle('fast');
	$(this).toggleClass('glyphicon-minus');
});

/*** SCROLL ***/
var subCatContainer = $(".scroll-table");

subCatContainer.scroll(function() {
    subCatContainer.scrollLeft($(this).scrollLeft());
});

/*** MOBILE FILTERS ***/
$("#mobile-menu").click(function(){
    $("#filters").fadeToggle('slow');
});

/*** SELECT ***/
$(document).ready(function() {
	$('#select-1').multiselect({
            nonSelectedText: 'Campaign Type - All',
			numberDisplayed: 1
        });
	$('#select-2').multiselect({
            nonSelectedText: 'Contact w/Role',
			numberDisplayed: 1
        });
});
