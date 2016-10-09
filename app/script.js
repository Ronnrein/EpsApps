// Options

var loopInterval = 1000;

// Variables

// Init

$(document).ready(function() {
    if(navigator.geolocation) {
        setBrowserPosition();
        navigator.geolocation.watchPosition(function(pos){
            userLocationChange(new google.maps.LatLng(newPos.coords.latitude, newPos.coords.longitude));
        });
    }
});

// Loop

// Functions

function setBrowserPosition() {
    getAppLocation(function(pos){
        map.setCenter(pos);
        userMarker = addMapMarker(map, pos, "red-circle", "You");
        map.setZoom(15);
    });
}