// Length of the interval in milliseconds. 1 second is typical for a radar.
var speed = 1000;
// The display density of planes on a given surface (higer value is... less planes.. uhm ok)
var density = 75000;

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
    'Exo',
    'Inter'
];
// Google fonts are loaded through the stylesheet link in index.html
var fontsExt = [
    'Arial',
    'Lucida Grande',
    'Verdana',
    'System Font'
];

// Seed the simplex noise generator
noise.seed(Math.random());
// A time value used for the Simplex algorithm
var start = Date.now();

// How many planes to show? Results in 20 - 50 planes on a typical display
// (at least 20, in case the page loads in a background tab with no size yet)
var maxPlanes = Math.max(20, Math.round($(window).width() * $(window).height() / density));

$(document).ready(function() {
    var inputFont = $("#inputFont");
    var inputFontSlider = $("#inputFontSlider");
    var inputSize = $("#inputSize");
    var inputSizeSlider = $("#inputSizeSlider");
    var inputBlur = $("#inputBlur");
    var inputBlurSlider = $("#inputBlurSlider");
    var inputTheme = $("#inputTheme");
    var inputMovement = $("#inputMovement");
    var inputBackground = $("#inputBackground");
    var movementInterval = false;

    // Get the flights data: a snapshot of real Frankfurt (FRA) arrivals
    $.getJSON('flights.json?v=14')
        .done(function(data) {
            $('.loading').fadeOut();
            // Show a different random selection of flights on every visit
            $.each(shuffle(data).slice(0, maxPlanes), positionFlight);

            // Position flights randomly on the page
            moveFlights();
        })
        .fail(function() {
            $('.loading .airplane').hide();
            $('.loading p').text("Couldn't load flight data.");
        });

    // Remove loading fonts message
    $('#inputFont option').remove();
    
    // Combine fonts from different sources and sort them alphabetically and populate the dropdown
    var fonts = fontsExt.concat(fontsGoogle).sort();
    $.each(fonts, function(i, val) {
        inputFont.append($("<option />").val(val).text(val));
        $("#fontSliderTicks").append($("<option />").val(i));
    });

    // One slider step per font in the dropdown
    inputFontSlider.attr("max", fonts.length - 1);

    inputFontSlider.on("input", function() {
        inputFont.prop("selectedIndex", inputFontSlider.val()).trigger("change");
    });

    inputFont.change(function() {
        let selectedFont = $('#inputFont option:selected').text();
        if(selectedFont == "System Font") {
            // Use native font stack
            $('main').css('font-family', '');
        } else {
            $('main').css('font-family', selectedFont);
        }
        inputFontSlider.val(inputFont.prop("selectedIndex"));
    });

    inputSize.change(function() {
        $('main').css('font-size', inputSize.val() + "px");
        inputSizeSlider.val(inputSize.val());
    });

    inputSizeSlider.on("input", function() {
        inputSize.val(inputSizeSlider.val()).trigger("change");
    });

    inputBlur.change(function() {
        $('main').css('filter', "blur(" + inputBlur.val() + "px)");
        inputBlurSlider.val(inputBlur.val());
    });

    inputBlurSlider.on("input", function() {
        inputBlur.val(inputBlurSlider.val()).trigger("change");
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
    
    inputBackground.change(function() {
        $('main').toggleClass('background');
    });
    
    // Detect if the user has Dark mode on and set theme to Dark
    if ( window.matchMedia("(prefers-color-scheme: dark)").matches ) {
        inputTheme.val("dark");
    }

    // Start without random movement if the user prefers reduced motion
    if ( window.matchMedia("(prefers-reduced-motion: reduce)").matches ) {
        inputMovement.prop("checked", false);
    }

    // Trigger the change event so we can set the default values
    inputFont.trigger("change");
    inputSize.trigger("change");
    inputBlur.trigger("change");
    inputTheme.trigger("change");
    inputMovement.trigger("change");
    inputBackground.trigger("change");
});

// Wait until the resizing is done to reposition the flights
$( window ).resize(function() {
    moveFlights();
});

// Fisher-Yates shuffle on a copy of the array
function shuffle(array) {
    var result = array.slice();
    for (var i = result.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = result[i];
        result[i] = result[j];
        result[j] = tmp;
    }
    return result;
}

function positionFlight(index, item) {
    // Callsign: airline code + flight number, e.g. "DE4891"
    var flightNumber = item.callsign;
    // Empty string when the aircraft type is unknown
    var aircraftType = item.type || "";

    // Add all the flights to the main element and give each one 3 random values that will be used for generating the Simplex noise
    $('main').append($('<div>', {
        html: flightNumber + "<br>" + aircraftType,
        class: "flight",
        'data-random-x': Math.random() * maxPlanes,
        'data-random-y': Math.random() * maxPlanes,
        'data-speed': Math.random() * 0.00001 + 0.000001
    }));
}

function moveFlights() {
    $('.flight').each(function( index ) {
        let randomSpeed = parseFloat($(this).attr('data-speed'));

        // Calculate new position with 3-dimensional Simplex noise
        // Shout-out to Louis https://css-tricks.com/simulating-mouse-movement/
        var x = ((noise.simplex3(parseFloat($(this).attr('data-random-x')), 0, (Date.now() - start) * randomSpeed) + 1) / 2) * $( window ).width();
        var y = ((noise.simplex3(parseFloat($(this).attr('data-random-y')), 0, (Date.now() - start) * randomSpeed) + 1) / 2) * $( window ).height();
        
        // Reposition the plane
        $(this).css({
            'left': x + "px",
            'top': y + "px"
        })
    });
}