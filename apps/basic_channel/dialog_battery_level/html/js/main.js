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

//////////////////////////
// Set up for initial values

function setLevel(level) {
    console.debug("Setting level to " + level);

    if (!isNaN(level)) {
        $(".batteryslider").css("width", "" + level + "%");

        var color = "lime";
        if (level <= 5) {
            color = "red";
        } else if (level <= 25) {
            color = "yellow";
        } else {
            $(".batteryslider").addClass("greenbars");
        }
        $(".batteryslider").css("background-color", color);
    }
}

setLevel(parseInt(getParameterByName("level")));

if (parseInt(getParameterByName("charging"))) {
    $(".charging").show();
}
