// How many pixels can each flight shift per interval?
var variation = 8;
// Interval speed in milliseconds. 1 second is typical for a radar.
var speed = 1000;
// The display density of planes on a given surface.
var density = 40000;
// Which fonts to select?
var fontsGoogle = [
'Roboto',
'Roboto Mono',
'Fira Sans',
'Fira Mono',
'Ubuntu',
'Ubuntu Mono',
'IBM Plex Sans',
'IBM Plex Mono',
'Source Code Pro',
'Open Sans',
'Exo'
];
var fontsExt = [
    'Inter',
    'Lucida Grande',
    'Verdana'
];

var fonts = fontsGoogle.concat(fontsExt);

// Load all the fonts!
WebFont.load({
    google: {
      families: fontsGoogle
    }
});

$(document).ready(function() {
    var inputFont = $("#inputFont");
    var inputSize = $("#inputSize");
    var inputBlur = $("#inputBlur");
    var inputTheme = $("#inputTheme");
    var inputMovement = $("#inputMovement");
    var movementInterval = false;
    var resizeInterval;
 
    // How many planes to show? Results in 20 - 50 planes on a typical display
    var maxPlanes = (document.body.clientWidth * document.body.clientHeight / density).toFixed();

    // Get the flights data, in this case arrivals
    $.ajax({
        url: 'https://developer.fraport.de/api/flights/1.0/flight/FRA/arrival',
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Bearer a01c8b71-9627-3f15-a86e-fde8aaec7bbc")
        },
        success: function(data){
            $('.loading').hide();
            $.each(data, function(index, item) {
                flightNumber = item.flight.flightNumber.airlineCode + item.flight.flightNumber.trackNumber;
                aircraftType = item.flight.aircraftType.icaoCode == "undefined" ? '' : item.flight.aircraftType.icaoCode;

                $('main').append($('<div>', {
                    html: flightNumber + "<br>" + aircraftType,
                    class: "flight"
                }));
                return index < maxPlanes;
            });
            // Position flights randomly on the page
            positionFlights();
        },
        error: function(jqXHR, textStatus, errorThrown)   {
            console.log(textStatus);
            // Alternatively use a local file
            $.getJSON('flights.json', function(data) {
                $('.loading').hide();
                $.each(data, function(index, item) {
                    flightNumber = item.flight.flightNumber.airlineCode + item.flight.flightNumber.trackNumber;
                    aircraftType = item.flight.aircraftType.icaoCode == "undefined" ? '' : item.flight.aircraftType.icaoCode;
                    $('main').append($('<div>', {
                        html: flightNumber + "<br>" + aircraftType,
                        class: "flight"
                    }));
                    return index < maxPlanes;
                });
                // Position flights randomly on the page
                positionFlights();
            });
        }
    });

    // Remove loading fonts message
    $('#inputFont option').remove();
    $.each(fonts, function(i, val) {
        inputFont.append($("<option />").val(val).text(val));
    });

    var selectedFont = $('#inputFont option:selected').text();

    inputFont.change(function() {
        selectedFont = $('#inputFont option:selected').text();
        $('main').css('font-family', selectedFont);
    });

    inputSize.change(function() {
        $('main').css('font-size', inputSize.val() + "px");
    });

    inputBlur.change(function() {
        $('main').css('filter', "blur(" + inputBlur.val() + "px)");
    });

    inputTheme.change(function() {
        document.documentElement.classList.add('color-theme-in-transition');
        document.documentElement.setAttribute('data-theme', inputTheme.val());
        window.setTimeout(function() {
            document.documentElement.classList.remove('color-theme-in-transition');
        }, 1000);
    });

    inputMovement.change(function() {
        if(inputMovement.prop("checked")) {
            movementInterval = setInterval(moveFlights, speed);
        } else {
            clearInterval(movementInterval);
        }
    });
    
    // Detect if the user has Dark mode on and set theme to Dark
    if ( window.matchMedia("(prefers-color-scheme: dark)").matches ) {
        inputTheme.val("dark");
    }

    inputFont.trigger('change');
    inputSize.trigger('change');
    inputBlur.trigger('change');
    inputTheme.trigger('change');
    inputMovement.trigger('change');
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

// Wait until the resizing is done to reposition the flights
$( window ).resize(function() {
    positionFlights();
});

function positionFlights() {
    $('.flight').each(function( index ) {
        var minX = 0;
        var maxX = document.body.clientWidth;
        var minY = 0;
        var maxY = document.body.clientHeight;

        // if we have the header on top
        if ( $('aside').outerWidth() == document.body.clientWidth ) {
            minY = $('aside').outerHeight();
        } else {
            minX = $('aside').outerWidth();
        }

        $(this).css({
            'left': getRandomInt(minX, maxX) + "px",
            'top': getRandomInt(minY, maxY) + "px"
        })
    });
}

function moveFlights() {
    $('.flight').each(function( index ) {
        var position = $(this).position();
        posX = position.left + getRandomInt(-variation, variation);
        posY = position.top + getRandomInt(-variation, variation);

        // if we have the aside on top
        if ( $('aside').outerWidth() == document.body.clientWidth ) {
            while(posY < ($('aside').outerHeight() + 8)) {
                posY++;
            }
        } else {
            while(posX < ($('aside').outerWidth() + 8)) {
                posX++;
            }
        }

        while(posY > (document.body.clientHeight - $('.flight').outerHeight())) {
            posY--;
        }
        
        $(this).css({
            'left': Math.abs(posX) + "px",
            'top': Math.abs(posY) + "px"
        })
    });
}