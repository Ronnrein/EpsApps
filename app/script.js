// Options

var loopInterval = 1000;
var geoMaximumAge = 3000;
var geoTimeout = 15000;
var telephone = "+4797003306";

// Variables

var currentPos;

// Init

$(document).ready(function() {
    currentPos = map.getCenter();
    if(navigator.geolocation) {
        setBrowserPosition();
        navigator.geolocation.watchPosition(function(pos){
            userLocationChange(new google.maps.LatLng(newPos.coords.latitude, newPos.coords.longitude));
            setTextPosition(pos);
        }, function(error){
            console.log("Wath position error: "+error);
        }, {enableHighAccuracy: true, maximumAge: geoMaximumAge, timeout: geoTimeout});
    }
});

// Loop

// Functions

function setBrowserPosition() {
    getAppLocation(function(pos){
        map.setCenter(pos);
        currentPos = pos;
        userMarker = addMapMarker(map, pos, "red-circle", "You");
        map.setZoom(mapZoom);
        setTextPosition(pos);
    });
}

function setTextPosition(pos) {
    $("#textButton").attr("href", "sms:"+telephone+"?body=Need help%0D%0ALat: "+pos.lat()+"%0D%0ALng: "+pos.lng()+"%0D%0A%0D%0A");
}

// Events

$("#callButton").click(function(){

});