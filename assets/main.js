// How many pixels can each flight shift per interval?
var variation = 8;
// Interval speed in milliseconds. 1 second is typical for a radar.
var speed = 1000;
// The display density of planes on a given surface.
var density = 50000;
// Which fonts to select?
var fonts = [
'Roboto',
'Roboto Mono',
'Fira Sans',
'Fira Mono',
'Ubuntu',
'Ubuntu Mono',
'Source Code Pro',
'Inter',
'Exo'
];

$(document).ready(function() {
    var inputFont = $("#inputFont");
    var inputSize = $("#inputSize");
    var inputBlur = $("#inputBlur");
    var inputTheme = $("#inputTheme");
    var inputMovement = $("#inputMovement");
    var interval = false;
 
    // How many planes to show? Results in 20 - 50 planes on a typical display
    var maxPlanes = (document.body.clientWidth * document.body.clientHeight / density).toFixed();
    
    console.log(maxPlanes);

    // Get the flights data, in this case arrivals
    $.ajax({
        url: 'https://developer.fraport.de/api/flights/1.0/flight/FRA/arrival',
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Bearer 84edc390-47e6-3f78-9c70-52145e61289f")
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
            $.getJSON('flights.json', { get_param: 'value' }, function(data) {
                $('.loading').hide();
                $.each(data, function(index, item) {
                    $('main').append($('<div>', {
                        html: item.flight.flightNumber.airlineCode + item.flight.flightNumber.trackNumber + "<br>" + item.flight.aircraftType.icaoCode,
                        class: "flight",
                        css: {
                            'left': getRandomInt($('aside').width(), $(document).width())+'px',
                            'top': getRandomInt(0, $(document).height())+'px'
                        }
                    }));
                    return index < maxPlanes;
                    });
            });
        }
    });

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
        $('body').removeClass().addClass(inputTheme.val());
    });

    inputMovement.change(function() {
        if(inputMovement.prop("checked")) {
            interval = setInterval(moveFlights, speed);
        } else {
            clearInterval(interval);
        }
    });
    
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

$( window ).resize(function() {

});

function positionFlights() {
    $('.flight').each(function( index ) {
        var offsetX = 0;
        var offsetY = 0;

        // if we have the header on top
        if ( $('aside').width() == document.body.clientWidth ) {
            offsetY = $('aside').height();
        } else {
            offsetX = $('aside').width();
        }
        $(this).css({
            'left': getRandomInt(offsetX, $(document).width())+'px',
            'top': getRandomInt(offsetY, $(document).height())+'px'
        })
    });
}

function moveFlights() {
    $('.flight').each(function( index ) {
        var position = $(this).position();
        $(this).css({
            'left': getRandomInt(position.left - variation, position.left + variation)+'px',
            'top': getRandomInt(position.top - variation, position.top + variation)+'px'
        })
    });
}