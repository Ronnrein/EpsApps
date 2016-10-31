// Functions for dashboard

function init() {
    new DashboardApp();
}

function DashboardApp() {

    this.sessionEl = "#sessions";
    this.chatEl = "#chat";
    this.mapEl = "#map";
    this.animateSpeed = 350;
    this.statusTime = {
        online: 1800,
        idle: 3600
    };
    var app = new SharedApp();
    var self = this;
    var mapPinDialog = $("#mappin-form").dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            "Add pin": addPinClick,
            Cancel: function() {
                mapPinDialog.dialog("close");
            }
        },
        close: function() {
            $("#mappin-message").val("");
        }
    });
    var loginDialog = $("#login-form").dialog({
        autoOpen: true,
        height: 350,
        width: 450,
        modal: true,
        closeOnEscape: false,
        dialogClass: "no-close",
        buttons: {
            "Login": loginClick
        }
    });

    bindEvents();
    refreshSessions();

    function refreshSessions() {
        if($("#search-box").val() == ""){
            API.Sessions.getSessions(function(data){
                applySessions(data);
            });
        }
    }

    function refreshUserMarker() {
        if(app.session !== undefined) {
            API.Sessions.getSession(app.session, function(data){
                var pos = new google.maps.LatLng(data.Latitude, data.Longitude);
                app.map.setUserMarkerPosition(pos);
            });
        }
    }

    function applySessions(sessions) {
        $(self.sessionEl).html("");
        $.each(sessions, function(i, item){
            var image = "../misc/icons/departments/"+item.DepartmentID+".png";
            var sessionTime = new Date(item.UpdatedAt).getTime()/1000;
            var currentTime = (new Date().getTime()/1000)-app.timeDiff;
            var time = Math.floor(currentTime - sessionTime);
            var icon = "status-icon-offline";
            if(time < self.statusTime.online){
                icon = "status-icon-online";
            }
            else if(time < self.statusTime.idle){
                icon = "status-icon-idle";
            }
            var html = "" +
                "<div id='session"+item.ID+"'>" +
                "<div class='icon "+icon+"'></div>" +
                "<div class='icon' style='background-image:url("+image+");'></div>" +
                "<p>Session "+item.ID+"</p>" +
                "</div>";
            $(self.sessionEl).append(html);
        });
    }

    function searchBoxChange() {
        var search = $(this).val();
        if(search != "") {
            API.Sessions.getSearchSessions(search, function(data){
                applySessions(data);
            });
        }
        else{
            refreshSessions();
        }
    }

    function tick() {
        refreshSessions();
        refreshUserMarker();
    }

    function sessionClick() {
        var id = parseInt($(this).attr("id").replace("session", ""));
        if(app.session === undefined){
            $(self.chatEl).animate({width: "35%"}, self.animateSpeed);
            $(self.mapEl).animate({width: "50%"}, self.animateSpeed, function(){
                app.loadSession(id);
            });
        }
        else{
            app.loadSession(id);
        }
    }

    function mapClick(data) {
        mapPinDialog.dialog("open");
    }

    function addPinClick() {
        API.MapPins.addMapPin(app.map.lastClickPosition, $("#mappin-message").val(), app.session);
        mapPinDialog.dialog("close");
        app.map.applySessionMapPins(app.session);
    }

    function loginClick() {
        if($("#login-username").val() != "" && $("#login-password").val() != "") {
            API.Operators.logInOperator($("#login-username").val(), $("#login-password").val(), function(data){
                app.operator = data.ID;
                $("#operator-info h3").html("Logged in as: "+data.Name);
                loginDialog.dialog("close");
            }, function(){
                var msg = $("#login-message");
                msg.html("Wrong login information");
                msg.css({"color": "red"});
            });
        }
        else {
            var msg = $("#login-message");
            msg.html("Please fill both fields");
            msg.css({"color": "red"});
        }
    }

    function bindEvents() {
        this.addEventListener("appTick", tick);
        $(self.sessionEl).on("click", "div", sessionClick);
        $("#search-box").on("keyup change", searchBoxChange);
        app.map.clickFunction = mapClick;
    }

}