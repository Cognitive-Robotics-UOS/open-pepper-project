//////////////////////////
// Utils

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#/]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function nearest5(value) {
    value = Math.floor(value);
    var mod = value % 5;
    var floor = value - mod;
    if (mod <= 2) {
        // round down
        return floor;
    } else {
        // round up
        return floor + 5;
    }
}

//////////////////////////
// Setting volume - only works if connected to robot.

var lastVolume = null;
function setVolume(volume) {
    if (window.ALVolumeSlider && (lastVolume != volume)) {
        window.ALVolumeSlider.setVolume(volume);
        lastVolume = volume;
    }
}

//////////////////////////
// Animation state

var target_value;

function clampVolume(value) {
    if (value > 100) {
        return 100;
    } else if (value < 20) {
        return 20;
    } else {
        return value;
    }
}

function jumpTo(value) {
    value = clampVolume(value);
    target_value = value;
    updateDisplay(value);
}

function animateTo(value) {
    $(".animatable").addClass("animatedslide")
    value = clampVolume(value);
    setVolume(value);
    jumpTo(value);
}

function updateDisplay(value) {
    $(".rightnumber").css("left", "" + value + "%");
    if (value <= 25) {
        $(".leftnumber").hide();
        $(".rightnumber").html(nearest5(value));
        $(".rightnumber").css("opacity", 1);
    } else {
        $(".leftnumber").show();
        $(".leftnumber").html(nearest5(value));
        $(".rightnumber").css("opacity", 0);
    }
    $(".volumeslider").css("width", "" + value + "%");
}

//////////////////////////
// Set up for initial values

var param_from = parseInt(getParameterByName("from"));
var param_to = parseInt(getParameterByName("to"));

// Set param
$(".volumenumber").html(param_from);
$(".volumenumber").prop('number', param_from);
$(".volumeslider").css("width", "" + param_from + "%");

jumpTo(param_from);
setTimeout(function() {
    animateTo(param_to);
});

$(".volumecontrol").show();

//////////////////////////
// Input handling

var snapping = false;
var lastX = null
var timeoutId = null;

function updateSnapping(x) {
    if (snapping) {
        // TODO: force set depending on the mouse position.
        var advance = x / 1280; // someday maybe: dynamic width
        var targetVolume = nearest5(100 * advance);
        //console.debug([x, targetVolume]);
        $(".animatable").removeClass("animatedslide")
        jumpTo(targetVolume);
        setVolume(targetVolume);
    }
}

function startCheckSlide(x) {
    lastX = x;
    timeoutId = setTimeout(function() {
        //console.debug("long");
        snapping = true;
        updateSnapping(lastX);
    }, 500);
}

function stopCheckSlide() {
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    snapping = false;
}

$(".volumeslider").on("mousedown", function(event) {
    startCheckSlide(event.clientX);
    animateTo(target_value - 5);
});
$(".volumeback").on("mousedown", function(event) {
    startCheckSlide(event.clientX);
    animateTo(target_value + 5);
});

$(".slidable").on("touchmove", function(event) {
    lastX = event.originalEvent.touches[0].clientX;
    if (snapping) {
        updateSnapping(lastX);
    }
});

$("body").on("mouseup", function(event) {
    stopCheckSlide();
});

//////////////////////////
// Deactivate existing context menu

window.oncontextmenu = function(event) {
     event.preventDefault();
     event.stopPropagation();
     return false;
};

//////////////////////////
// Communication with robot

RobotUtils.onService(function(ALVolumeSlider) {
    window.ALVolumeSlider = ALVolumeSlider;
});
