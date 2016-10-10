// Common functions for app and dashboard

// Options

var url = "http://eps.ronnrein.com:8888";
var emergencies = ["Crime", "Fire", "Health"];
var mapZoom = 15;

// Variables

var map;
var infoWindow;
var geoCoder;
var currentSession;
var markers = [];
var userMarker;
var pinTempLatLng;
var pinTempClickPos;
var currentMousePos;
var operatorId = 0;

// Init

$(document).ready(function(){
    google.maps.event.addListener(map, "mousedown", mapMouseDown);
    google.maps.event.addListener(map, "mouseup", mapMouseUp);
});

// Functions

function getMapPins(map, id, callback){
    $.getJSON(url+"/sessions/"+id+"/mappins", function(data){
        var markers = [];
        $.each(data, function(i, item){
            var pos = new google.maps.LatLng(item.Latitude, item.Longitude);
            markers.push(addMapMarker(map, pos, "blu-blank", item.Text));
        });
        if(typeof callback === "function"){
            callback(markers);
        }
    });
}

function addMapMarker(map, pos, icon, text){
    var iconUrl = "http://maps.google.com/mapfiles/kml/paddle/";
    var marker = new google.maps.Marker({position: pos, icon: iconUrl+icon+".png", title: text, map: map});
    marker.addListener("click", function(){
        infoWindowClick(this);
    });
    return marker;
}

function clearMarkers(markers){
    $.each(markers, function(i, marker){
        marker.setMap(null);
    });
    if(userMarker !== undefined){
        userMarker.setMap(null);
    }
    return [];
}

function infoWindowClick(data){
    infoWindow.close();
    infoWindow.setContent(data.title);
    infoWindow.open(map, data);
    $("#pin-dialog").slideUp();
}

function initMap(){
    map = new google.maps.Map($("#map")[0], {center: {lat: 50.5637379, lng: -46.0742299}, zoom: 3});
    infoWindow = new google.maps.InfoWindow();
    geoCoder = new google.maps.Geocoder();
}

function getFormattedAddress(geoCoder, latitude, longitude, callback){
    geoCoder.geocode({"location": {lat: parseFloat(latitude), lng: parseFloat(longitude)}}, function(results, status){
        if(typeof callback === "function"){
            callback(status === "OK" ? results[0].formatted_address : "No address available");
        }
    });
}

function postJson(path, data) {
    $.post(url+"/"+path, JSON.stringify(data), "json");
}

function getChat(id){
    $.getJSON(url+"/sessions/"+id+"/messages", function(data){
        $("#chat-content").html("");
        $.each(data, function(i, item){
            var c = item.OperatorID == 0 ? "message-client" : "message-operator";
            var html = "<div class='message "+c+"'>"+item.Message+"</div>";
            $("#chat-content").append(html);
        });
    });
}

function getSession(id){
    $.getJSON(url+"/sessions/"+id, function(data){
        var newPos = new google.maps.LatLng(data.Latitude, data.Longitude);
        google.maps.event.trigger(map, 'resize');
        map.setCenter(newPos);
        map.setZoom(mapZoom);
        $("#chat-header > h1").html("Session "+data.ID);
        getFormattedAddress(geoCoder, newPos.lat(), newPos.lng(), function(address){
            $("#chat-header > p").html(address);
        });
        clearMarkers(markers);
        getMapPins(map, id, function(m){
            markers = m;
            userMarker = addMapMarker(map, newPos, "red-circle", "Emergency ("+emergencies[data.DepartmentID-1]+")");
        });
        getChat(id);
    });
}

function sendMessage(message){
    postJson("messages", {message: message, operatorid: operatorId, sessionid: currentSession});
}

function addMapPin(message){
    postJson("mappins", {latitude: pinTempLatLng.lat().toString(), longitude: pinTempLatLng.lng().toString(), text: message, sessionid: currentSession});
}

function mapMouseDown(data){
    pinTempClickPos = currentMousePos;
}

function mapMouseUp(data){
    if(currentSession !== undefined && currentMousePos.pageX == pinTempClickPos.pageX && currentMousePos.pageY == pinTempClickPos.pageY){
        infoWindow.close();
        pinTempLatLng = data.latLng;
        $("#pin-dialog").hide();
        $("#pin-dialog").css({"left": currentMousePos.pageX, "top": currentMousePos.pageY});
        $("#pin-dialog").slideDown();
    }
    else{
        $("#pin-dialog").slideUp();
    }
}

function getAppLocation(callback) {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos){
            if(typeof callback === "function"){
                callback(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            }
        });
    }
}

function userLocationChange(pos) {
    map.setCenter(pos);
    userMarker.setPosition(pos);
}

// Events

$("#chat-button").click(function(){
    var message = $("#chat-message").val();
    if(message != ""){
        sendMessage();
        getChat(currentSession);
    }
});

$("#map").mousemove(function(data){
    currentMousePos = data;
});

$("#pin-dialog-cancel").click(function(){
    $("#pin-dialog").slideUp();
});

$("body").click(function(data){
    if($(data.target).closest('#map').length || $(data.target).closest('#pin-dialog').length){
        return;
    }
    $("#pin-dialog").slideUp();
});

$("#pin-dialog-post").click(function(){
    var message = $("#pin-message").val();
    if(message != ""){
        addMapPin(message);
        $("#pin-dialog").slideUp();
        getMapPins(currentSession);
    }
});