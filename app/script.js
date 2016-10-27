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

    bindEvents();
    loadGpsPosition();

    function emergencyButtonClick() {
        var id = parseInt($(this).attr("id").slice(-1));
        API.Sessions.addSession(app.map.getUserPosition(), id, function(data){
            app.loadSession(data.ID);
            $("#page1content").css("bottom", "260px");
            $(".pagefooter").css("height", "260px");
            $(self.homePageEl).hide();
            $(self.chatEl).show();
        });
    }

    function gpsPositionChanged(geoPos) {
        var pos = new google.maps.LatLng(geoPos.coords.latitude, geoPos.coords.longitude);
        app.map.setUserMarkerPosition(pos);
        if(SharedApp.session !== undefined) {
            var data = {latitude: pos.lat(), longitude: pos.lng()};
            API.Sessions.updateSession(SharedApp.session, data);
        }
    }

    function loadGpsPosition() {
        $.mobile.loading("show", {text: "Loading GPS", textVisible: true});
        navigator.geolocation.getCurrentPosition(function(geoPos){
            var pos = new google.maps.LatLng(geoPos.coords.latitude, geoPos.coords.longitude)
            app.map.setCenter(pos);
            gpsPositionChanged(geoPos);
            $.mobile.loading("hide");
        })
    }

    function bindEvents() {
        $(self.emergencyButtonEl).click(emergencyButtonClick);
        navigator.geolocation.watchPosition(gpsPositionChanged, null, {
            enableHighAccuracy: true,
            maximumAge: self.geoMaximumAge,
            timeout: self.geoTimeout
        });
    }

}