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

    function bindEvents() {
        this.addEventListener("appTick", tick);
        $(self.sessionEl).on("click", "div", sessionClick);
    }

}