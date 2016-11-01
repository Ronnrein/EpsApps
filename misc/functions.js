// Shared app functions

function SharedApp() {

    this.chatButtonEl = "#chat-button";
    this.chatMessageEl = "#chat-message";
    this.chatContentEl = "#chat-content";
    this.sessionTitleEl = "#chat-header > h1";
    this.sessionAddressEl = "#chat-header > p";
    this.mapEl = "#map";
    this.loopTime = 10000;

    this.session = undefined;
    this.operator = 0;
    this.map = new Map(this.mapEl);
    this.timeDiff = 0;

    var chatScrolled = false;
    var loopEvent = new Event("appTick");
    var self = this;

    init();
    bindEvents();
    setInterval(tick, this.loopTime);

    this.loadSession = function(id) {
        API.Sessions.getSession(id, function(data){
            self.session = id;
            var pos = new google.maps.LatLng(data.Latitude, data.Longitude);
            self.map.setCenter(pos);
            $(self.sessionTitleEl).html("Session "+data.ID);
            self.map.getFormattedAddress(pos, function(address){
                $(self.sessionAddressEl).html(address);
            });
            refreshAll();
            self.map.setUserMarkerPosition(pos);
        });
    };

    function init() {
        API.getServerTime(function(data){
            var serverTime = new Date(data.Time).getTime()/1000;
            var browserTime = new Date().getTime()/1000;
            timeDiff = Math.floor(serverTime - browserTime);
        });
    }

    function tick() {
        refreshAll();
        this.dispatchEvent(loopEvent);
    }

    function chatButtonClick() {
        if(self.session !== undefined) {
            var message = $(self.chatMessageEl);
            if(message.val() != "") {
                API.Messages.addMessage(message.val(), self.operator, self.session);
            }
            message.val("");
            refreshChat();
        }
    }

    function refreshAll() {
        if(self.session !== undefined) {
            refreshChat();
            self.map.applySessionMapPins(self.session);
        }
    }

    function refreshChat() {
        if(self.session !== undefined) {
            API.Sessions.getSessionMessages(self.session, function(data) {
                $(self.chatContentEl).html("");
                $.each(data, function(i, item) {
                    var c = item.OperatorID == 0 ? "message-client" : "message-operator";
                    var html = "<div class='message "+c+"'>"+item.Message+"</div>";
                    var content = $(self.chatContentEl);
                    content.append(html);
                    if(!chatScrolled) {
                        content.scrollTop(content[0].scrollHeight);
                    }
                });
            });
        }
    }

    function chatScroll() {
        chatScrolled = $(this).scrollTop() + $(this).innerHeight() < $(this)[0].scrollHeight;
    }

    function bindEvents() {
        $(self.chatButtonEl).click(chatButtonClick);
        $(self.chatContentEl).on("scroll", chatScroll);
    }

}

function Map(elementid) {

    this.mapZoom = 15;
    this.markerIconUrl = "https://maps.google.com/mapfiles/kml/paddle/";
    this.clickFunction = function(){};
    this.lastClickPosition = new google.maps.LatLng(0, 0);

    var markers = [];
    var userMarker;
    var map = new google.maps.Map($(elementid)[0], {center: {lat: 50.5637379, lng: -46.0742299}, zoom: 3});
    var infoWindow = new google.maps.InfoWindow();
    var geoCoder = new google.maps.Geocoder();
    var self = this;

    bindEvents();

    this.applySessionMapPins = function(id) {
        if(isInfoWindowOpen()){
            return;
        }
        API.Sessions.getSessionMapPins(id, function(data) {
            clearMapMarkers();
            $.each(data, function(i, item) {
                var pos = new google.maps.LatLng(item.Latitude, item.Longitude);
                addMapMarker(pos, "blu-blank", item.Text);
            });
        });
    };

    this.setUserMarkerPosition = function(pos) {
        if(userMarker === undefined) {
            userMarker = addMapMarker(pos, "red-circle", "User", false);
        }
        else {
            userMarker.setPosition(pos);
        }
    };

    this.getFormattedAddress = function(pos, callback) {
        var latlng = {lat: parseFloat(pos.lat()), lng: parseFloat(pos.lng())};
        geoCoder.geocode({"location": latlng}, function(data, status){
            if(typeof callback === "function") {
                var reply = status === "OK" ? data[0].formatted_address : "No address available";
                callback(reply);
            }
        });
    };

    this.setCenter = function(pos) {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(pos);
        map.setZoom(self.mapZoom);
    };

    this.getCenter = function() {
        return map.getCenter();
    };

    this.getUserMarkerPosition = function() {
        return userMarker.getPosition();
    };

    this.getUserLocation = function(callback) {
        self.getGPSLocation(function(pos) {
            callback(pos, true);
        }, function(){
            self.getIPLocation(function(pos){
                callback(pos, false);
            }, function(){
                callback(self.getUserMarkerPosition(), false);
            });
        });
    };

    this.getGPSLocation = function(callback, errorCallback){
        if(typeof callback === "function") {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (geoPos) {
                    var pos = new google.maps.LatLng(geoPos.coords.latitude, geoPos.coords.longitude);
                    callback(pos);
                }, function () {
                    errorCallback();
                });
            }
            else {
                errorCallback();
            }
        }
    };

    this.getIPLocation = function(callback, errorCallback) {
        if(typeof callback === "function") {
            $.post("https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyA8MGsXKkjtuO3vTB7AZzQDmaC4w1xH4Ts", function(data){
                callback(new google.maps.LatLng(data.location.lat, data.location.lng));
            }).fail(function(){
                errorCallback();
            });
        }
    };

    function addMapMarker(pos, icon, text, addToList) {
        var marker = new google.maps.Marker({
            position: pos,
            icon: self.markerIconUrl+icon+".png",
            title: text,
            map: map
        });
        marker.addListener("click", function() {
            infoWindow.close();
            infoWindow.setContent(marker.title);
            infoWindow.open(map, marker);
        });
        if(typeof addToList !== "boolean" || addToList) {
            markers.push(marker);
        }
        return marker;
    }

    function clearMapMarkers() {
        $.each(markers, function(i, marker) {
            marker.setMap(null);
        });
    }

    function isInfoWindowOpen() {
        var m = infoWindow.getMap();
        return (m !== null && typeof m !== "undefined");
    }

    function mapClick(data) {
        self.lastClickPosition = data.latLng;
        self.clickFunction(data);
    }

    function bindEvents() {
        google.maps.event.addListener(map, "click", mapClick);
    }

}

var API = {
    url: "https://eps.ronnrein.com:4433",
    request: function(path, method, data, callback, errorCallback) {
        $.ajax({
            url: this.url+"/"+path,
            data: JSON.stringify(data),
            dataType: "json",
            type: method,
            success: function(data){
                if (typeof callback === "function") {
                    callback(data);
                }
            },
            error: function(data){
                if (typeof errorCallback === "function") {
                    errorCallback(data);
                }
            }
        });
    },
    getServerTime: function(callback, errorCallback) {
        API.request("time", "GET", null, callback, errorCallback);
    },
    Departments: {
        path: "departments",
        getDepartments: function(callback, errorCallback) {
            API.request(this.path, "GET", null, callback, errorCallback);
        },
        getDepartment: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "GET", null, callback, errorCallback);
        },
        addDepartment: function(name, callback, errorCallback) {
            API.request(this.path, "POST", {name: name}, callback, errorCallback);
        },
        deleteDepartment: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "DELETE", null, callback, errorCallback);
        },
        updateDepartment: function(id, data, callback, errorCallback) {
            API.request(this.path+"/"+id, "POST", data, callback, errorCallback);
        },
        getDepartmentSessions: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id+"/sessions", "GET", null, callback, errorCallback);
        },
        getDepartmentOperators: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id+"/operators", "GET", null, callback, errorCallback);
        }
    },
    MapPins: {
        path: "mappins",
        getMapPins: function(callback, errorCallback) {
            API.request(this.path, "GET", null, callback, errorCallback);
        },
        getMapPin: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "GET", null, callback, errorCallback);
        },
        addMapPin: function(position, text, session, callback, errorCallback) {
            API.request(this.path, "POST",{
                latitude: position.lat().toFixed(6),
                longitude: position.lng().toFixed(6),
                text: text,
                sessionid: session
            }, callback, errorCallback);
            API.Sessions.updateSession(session, {"id": session});
        },
        deleteMapPin: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "DELETE", null, callback, errorCallback);
        },
        updateMapPin: function(id, data, callback, errorCallback) {
            API.request(this.path+"/"+id, "POST", data, callback, errorCallback);
        }
    },
    Messages: {
        path: "messages",
        getMessages: function(callback, errorCallback) {
            API.request(this.path, "GET", null, callback, errorCallback);
        },
        getMessage: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "GET", null, callback, errorCallback);
        },
        addMessage: function(message, operator, session, callback, errorCallback) {
            API.request(this.path, "POST",{
                message: message,
                operatorid: operator,
                sessionid: session
            }, callback, errorCallback);
            API.Sessions.updateSession(session, {"id": session});
        },
        deleteMessage: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "DELETE", null, callback, errorCallback);
        },
        updateMessage: function(id, data, callback, errorCallback) {
            API.request(this.path+"/"+id, "POST", data, callback, errorCallback);
        }
    },
    Operators: {
        path: "operators",
        getOperators: function(callback, errorCallback) {
            API.request(this.path, "GET", null, callback, errorCallback);
        },
        getOperator: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "GET", null, callback, errorCallback);
        },
        addOperator: function(name, username, password, department, callback, errorCallback) {
            API.request(this.path, "POST",{
                name: name,
                username: username,
                password: password,
                departmentid: department
            }, callback, errorCallback);
        },
        deleteOperator: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "DELETE", null, callback, errorCallback);
        },
        updateOperator: function(id, data, callback, errorCallback) {
            API.request(this.path+"/"+id, "POST", data, callback, errorCallback);
        },
        getOperatorMessages: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id+"/messages", "GET", null, callback, errorCallback);
        },
        getOperatorSessions: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id+"/sessions", "GET", null, callback, errorCallback);
        },
        logInOperator: function(username, password, callback, errorCallback) {
            API.request(this.path+"/login", "POST", {username: username, password: password}, callback, errorCallback)
        }
    },
    Sessions: {
        path: "sessions",
        getSessions: function(callback, errorCallback) {
            API.request(this.path, "GET", null, callback, errorCallback);
        },
        getSession: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "GET", null, callback, errorCallback);
        },
        addSession: function(position, department, callback, errorCallback) {
            API.request(this.path, "POST",{
                latitude: position.lat().toFixed(6),
                longitude: position.lng().toFixed(6),
                departmentid: department
            }, callback, errorCallback);
        },
        deleteSession: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id, "DELETE", null, callback, errorCallback);
        },
        updateSession: function(id, data, callback, errorCallback) {
            API.request(this.path+"/"+id, "POST", data, callback, errorCallback);
        },
        getSessionMapPins: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id+"/mappins", "GET", null, callback, errorCallback);
        },
        getSessionMessages: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id+"/messages", "GET", null, callback, errorCallback);
        },
        getSessionOperators: function(id, callback, errorCallback) {
            API.request(this.path+"/"+id+"/operators", "GET", null, callback, errorCallback);
        },
        getSearchSessions: function(search, callback, errorCallback) {
            API.request(this.path+"/search/"+search, "GET", null, callback, errorCallback);
        }
    }
};
