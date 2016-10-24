// Functions for dashboard

function init() {
    new DashboardApp();
}

function DashboardApp() {

    this.sessionEl = "#sessions";
    this.chatEl = "#chat";
    this.mapEl = "#map";
    this.animateSpeed = 350;

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
        API.Sessions.getSessions(function(data){
            $(self.sessionEl).html("");
            $.each(data, function(i, item){
                var image = "../misc/icons/departments/"+item.DepartmentID+".png";
                var tempId = "address"+item.ID;
                var pos = new google.maps.LatLng(data.Latitude, data.Longitude);
                var html = "" +
                    "<div id='session"+item.ID+"'>" +
                        "<div class='icon status-icon-online'></div>" +
                        "<div class='icon' style='background-image:url("+image+");'></div>" +
                        "<p>Session "+item.ID+"</p>" +
                        "<p class='address' id='tempId'></p>" +
                    "</div>";
                $(self.sessionEl).append(html);
                app.map.getFormattedAddress(pos, function(address){
                    $("#"+tempId).html(address);
                });
            });
        });
    }

    function tick() {
        refreshSessions();
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
                loginDialog.dialog("close");
            }, function(data){
                var msg = $("#login-message");
                msg.html("Wrong login information");
                msg.css({"color": "red"});
            });
        }
        else {
            $("#login-message").html("Please fill both textboxes");
        }
    }

    function bindEvents() {
        this.addEventListener("appTick", tick);
        $(self.sessionEl).on("click", "div", sessionClick);
        app.map.clickFunction = mapClick;
    }

}