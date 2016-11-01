// Functions for mobile app

function init() {
    new MobileApp();
}

function MobileApp() {

    this.emergencyButtonEl = ".emergency-button";
    this.homePageEl = "#front-page-content";
    this.chatEl = "#chat-page-content";
    this.geoMaximumAge = 3000;
    this.geoTimeout = 15000;
    this.telephone = "+4797003306";

    var app = new SharedApp();
    var self = this;
    var newPosition = undefined;
    var gpsOn = true;

    bindEvents();
    loadGpsPosition();

    $("#map").resizable({
        handleSelector: "#resize-handler",
        resizeWidth: false,
        onDrag: function(e, $el, newWidth, newHeight, opt) {
            var diff = $("#content").height() - newHeight;
            if(diff < 150) {
                newHeight = newHeight - (150 - diff);
            }
            else if(newHeight < 150) {
                newHeight = 150;
            }
            $el.height(newHeight);
            return false;
        }
    });

    function tick() {
        if(gpsOn) {
            updateUserPosition();
        }
    }

    function emergencyButtonClick() {
        var id = parseInt($(this).attr("id").slice(-1));
        API.Sessions.addSession(app.map.getUserMarkerPosition(), id, function(data){
            app.loadSession(data.ID);
            var map = $("#map");
            map.css("height", map.height()+"px");
            map.css("flex", "0 0 auto");
            $("#options").css("flex", "1 1 auto");
            $("#resize-handler").show();
            $(self.homePageEl).fadeOut(function(){
                $(self.chatEl).fadeIn(function(){
                    $(self.chatEl).css("display", "flex");
                });
            });
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

    function setCustomPosition() {
        gpsPositionChanged(app.map.lastClickPosition);
        updateUserPosition();
        $("#gps-switch").val("off").slider("refresh");
        gpsOn = false;
        closeDialog();
    }

    function loadGpsPosition() {
        app.map.getUserLocation(function(pos, isGps){
            app.map.setCenter(pos);
            gpsPositionChanged(pos);
            if(!isGps){
                $("#gps-switch").val("off").slider("refresh");
                gpsOn = false;
            }
        });
    }

    function mapClick() {
        if(app.session !== undefined) {
            $.mobile.changePage("#map-pin-dialog");
        }
    }

    function closeDialog() {
        $.mobile.changePage("#home-page");
        $("#mappin-message").val("");
    }

    function addPinClick() {
        API.MapPins.addMapPin(app.map.lastClickPosition, $("#mappin-message").val(), app.session);
        app.map.applySessionMapPins(app.session);
        closeDialog();
    }

    function gpsSwitchChange() {
        gpsOn = $(this).val() == "on";
    }

    function bindEvents() {
        this.addEventListener("appTick", tick);
        $(self.emergencyButtonEl).click(emergencyButtonClick);
        $("#mappin-close-button").click(closeDialog);
        $("#mappin-add-button").click(addPinClick);
        $("#set-position-button").click(setCustomPosition);
        $("#gps-switch").change(gpsSwitchChange);
        navigator.geolocation.watchPosition(function(data) {
            if(gpsOn){
                gpsPositionChanged(new google.maps.LatLng(data.coords.latitude, data.coords.longitude));
            }
        }, null, {
            enableHighAccuracy: true,
            maximumAge: self.geoMaximumAge,
            timeout: self.geoTimeout
        });
        app.map.clickFunction = mapClick;
    }

}