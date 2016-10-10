// Options

var loopInterval = 10000;
var animateSpeed = 350;

// Init

$(document).ready(function(){
    refreshSessions();
    //TODO: OperatorId Login
    //setInterval(loop, loopInterval);
});

// Loop

function loop(){
    if(currentSession != 0){
        getMapPins(map, currentSession);
        getChat(currentSession);
    }
}

// Functions

function refreshSessions(){
    $.getJSON(url+"/sessions", function(data){
        $.each(data, function(i, item){
            getFormattedAddress(geoCoder, item.Latitude, item.Longitude, function(address){
                var image = "../misc/icons/departments/"+item.DepartmentID+".png";
                var html = "<div id='session"+item.ID+"'><div class='icon status-icon-online'></div><div class='icon' style='background-image:url("+image+");'></div><p>Session "+item.ID+"</p><p class='address'>"+address+"</p></div>";
                $("#sessions").append(html);
            });
        });
    });
}

// Events

$("#sessions").on("click", "div", function(){
    var id = $(this).attr("id").replace("session", "");
    if(currentSession === undefined){
        $("#chat").animate({width: "35%"}, animateSpeed);
        $("#map").animate({width: "50%"}, animateSpeed, function(){
            getSession(id);
        });
    }
    else{
        getSession(id);
    }
    currentSession = parseInt(id);
});


