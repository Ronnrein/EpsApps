// Functions for mobile app

function init() {
    new MobileApp();
}

function MobileApp() {

    this.emergencyButtonEl = ".emergency-button";
    this.homePageEl = "#homepagecontent";
    this.chatEl = "#chatpagecontent";
    this.geoMaximumAge = 3000;
    this.geoTimeout = 15000;
    this.telephone = "+4797003306";

    var app = new SharedApp();
    var self = this;
    var newPosition = undefined;

    bindEvents();
    loadGpsPosition();

    function tick() {
        updateUserPosition();
    }

    function emergencyButtonClick() {
        var id = parseInt($(this).attr("id").slice(-1));
        API.Sessions.addSession(app.map.getUserMarkerPosition(), id, function(data){
            app.loadSession(data.ID);
            $("#page1content").css("bottom", "260px");
            $(".pagefooter").css("height", "260px");
            $(self.homePageEl).hide();
            $(self.chatEl).show();
        });
    }

    function gpsPositionChanged(pos) {
        app.map.setUserMarkerPosition(pos);
        newPosition = pos;
    }

    function updateUserPosition() {
        if(newPosition !== undefined && app.session !== undefined) {
            var data = {latitude: newPosition.lat().toFixed(6), longitude: newPosition.lng().toFixed(6)};
            API.Sessions.updateSession(app.session, data);
            newPosition = undefined;
        }
    }

    function loadGpsPosition() {
        app.map.getUserLocation(function(pos){
            app.map.setCenter(pos);
            gpsPositionChanged(pos);
        });
    }

    function bindEvents() {
        this.addEventListener("appTick", tick);
        $(self.emergencyButtonEl).click(emergencyButtonClick);
        navigator.geolocation.watchPosition(function(data) {
            gpsPositionChanged(new google.maps.LatLng(data.coords.latitude, data.coords.longitude));
        }, null, {
            enableHighAccuracy: true,
            maximumAge: self.geoMaximumAge,
            timeout: self.geoTimeout
        });
    }

}