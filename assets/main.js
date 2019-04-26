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
    'Arial',
    'Inter',
    'Lucida Grande',
    'Verdana',
    'System Font'
];

var fonts = fontsExt.concat(fontsGoogle).sort();

// Load all the fonts!
WebFont.load({
    google: {
      families: fontsGoogle
    }
});

// Seed the simplex noise generator
noise.seed(Math.random());
// A time value used for the Simplex algorithm
var start = Date.now();

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
                    class: "flight",
                    'data-random-x': Math.random() * $('main').innerWidth(),
                    'data-random-y': Math.random() * $('main').innerHeight(),
                    'data-speed': Math.random() * 0.001 + 0.0001
                }));
                return index < maxPlanes;
            });
            // Position flights randomly on the page
            moveFlights();
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
                moveFlights();
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
        if(selectedFont == "System Font") {
            // Use native font stack
            $('main').css('font-family', '');
        } else {
            $('main').css('font-family', selectedFont);
        }
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
    moveFlights();
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
        let randomX = $(this).attr('data-random-x');
        let randomY = $(this).attr('data-random-y');
        let randomSpeed = $(this).attr('data-speed');
        console.log(randomX, randomY)
        var noiseX = (noise.simplex3(100, 0, (Date.now() - start) * randomSpeed) + 1) / 2;
        var noiseY = (noise.simplex3(randomY, 0, (Date.now() - start) * randomSpeed) + 1) / 2;

        var x = noiseX * $('main').innerWidth();
        var y = noiseY * $('main').innerHeight();

        console.log(noiseX,noiseY);
        $(this).css({
            'transform': `translate(${x}px, ${y}px)`
        });
    });
}