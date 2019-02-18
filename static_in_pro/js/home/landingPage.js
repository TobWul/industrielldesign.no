// Variabeldeklarasjon
let student = $('#student');
let prosjekter = $('#prosjekter');
let bedrift = $('#bedrift');
let kontakt = $('#kontakt');

// Hoverfunksjoner
function hoverIn() {
    $(this).parent().addClass('active');
    $(this).parent().siblings().addClass('blur');
    $(this).addClass('active');
    $(this).siblings().addClass('blur');
}

function hoverOut() {
    $(this).parent().removeClass('active');
    $(this).parent().siblings().removeClass('blur');
    $(this).removeClass('active');
    $(this).siblings().removeClass('blur');
}

// Initierer event listeners
student.hover(hoverIn, hoverOut);
prosjekter.hover(hoverIn, hoverOut);
bedrift.hover(hoverIn, hoverOut);
kontakt.hover(hoverIn, hoverOut);
