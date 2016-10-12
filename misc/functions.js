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

    var chatScrolled = false;
    var loopEvent = new Event("appTick");
    var self = this;

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

    function tick() {
        refreshAll();
        this.dispatchEvent(loopEvent);
    }

    function chatButtonClick() {
        if(self.session !== undefined) {
            var message = $(self.chatMessageEl);
            if(message.val() != "") {
                API.Messages.addMessage(message, self.operator, self.session);
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
                        content.scrollTop = content.scrollHeight;
                    }
                });
            });
        }
    }

    function chatScroll() {
        chatScrolled = self.scrollTop != self.scrollHeight;
    }

    function bindEvents() {
        $(self.chatButtonEl).click(chatButtonClick);
        $(self.chatContentEl).on("scroll", chatScroll);
    }

}

function Map(elementid) {

    this.mapZoom = 15;
    this.markerIconUrl = "http://maps.google.com/mapfiles/kml/paddle/";
    this.clickFunction = function(){};

    var markers = [];
    var userMarker;
    var map = new google.maps.Map($(elementid)[0], {center: {lat: 50.5637379, lng: -46.0742299}, zoom: 3});
    var infoWindow = new google.maps.InfoWindow();
    var geoCoder = new google.maps.Geocoder();
    var self = this;

    google.maps.event.addListener(map, "click", function(data) {
        if(typeof self.clickFunction === "function") {
            self.clickFunction(data);
        }
    });

    this.applySessionMapPins = function(id) {
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
            userMarker = addMapMarker(pos, "red-circle", "User");
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

    this.getUserPosition = function() {
        return userMarker.getPosition();
    };

    function addMapMarker(pos, icon, text) {
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
        markers.push(marker);
    }

    function clearMapMarkers() {
        $.each(markers, function(i, marker) {
            marker.setMap(null);
        });
    }

}

var API = {
    url: "http://eps.ronnrein.com:8888",
    request: function(path, method, data, callback) {
        $.ajax({
            url: this.url+"/"+path,
            data: JSON.stringify(data),
            dataType: "json",
            type: method,
            success: function(data){
                if (typeof callback === "function") {
                    callback(data);
                }
            }
        });
    },
    Departments: {
        path: "departments",
        getDepartments: function(callback) {
            API.request(this.path, "GET", null, callback);
        },
        getDepartment: function(id, callback) {
            API.request(this.path+"/"+id, "GET", null, callback);
        },
        addDepartment: function(name, callback) {
            API.request(this.path, "POST", {name: name}, callback);
        },
        deleteDepartment: function(id, callback) {
            API.request(this.path+"/"+id, "DELETE", null, callback);
        },
        updateDepartment: function(id, data, callback) {
            API.request(this.path+"/"+id, "POST", data, callback);
        },
        getDepartmentSessions: function(id, callback) {
            API.request(this.path+"/"+id+"/sessions", "GET", null, callback);
        },
        getDepartmentOperators: function(id, callback) {
            API.request(this.path+"/"+id+"/operators", "GET", null, callback);
        }
    },
    MapPins: {
        path: "mappins",
        getMapPins: function(callback) {
            API.request(this.path, "GET", null, callback);
        },
        getMapPin: function(id, callback) {
            API.request(this.path+"/"+id, "GET", null, callback);
        },
        addMapPin: function(position, text, session, callback) {
            API.request(this.path, "POST",{
                latitude: position.lat().toFixed(6),
                longitude: position.lng().toFixed(6),
                text: text,
                sessionid: session
            }, callback);
        },
        deleteMapPin: function(id, callback) {
            API.request(this.path+"/"+id, "DELETE", null, callback);
        },
        updateMapPin: function(id, data, callback) {
            API.request(this.path+"/"+id, "POST", data, callback);
        }
    },
    Messages: {
        path: "messages",
        getMessages: function(callback) {
            API.request(this.path, "GET", null, callback);
        },
        getMessage: function(id, callback) {
            API.request(this.path+"/"+id, "GET", null, callback);
        },
        addMessage: function(message, operator, session, callback) {
            API.request(this.path, "POST",{
                message: message,
                operatorid: operator,
                sessionid: session
            }, callback);
        },
        deleteMessage: function(id, callback) {
            API.request(this.path+"/"+id, "DELETE", null, callback);
        },
        updateMessage: function(id, data, callback) {
            API.request(this.path+"/"+id, "POST", data, callback);
        }
    },
    Operators: {
        path: "operators",
        getOperators: function(callback) {
            API.request(this.path, "GET", null, callback);
        },
        getOperator: function(id, callback) {
            API.request(this.path+"/"+id, "GET", null, callback);
        },
        addOperator: function(name, username, password, department, callback) {
            API.request(this.path, "POST",{
                name: name,
                username: username,
                password: password,
                departmentid: department
            }, callback);
        },
        deleteOperator: function(id, callback) {
            API.request(this.path+"/"+id, "DELETE", null, callback);
        },
        updateOperator: function(id, data, callback) {
            API.request(this.path+"/"+id, "POST", data, callback);
        },
        getOperatorMessages: function(id, callback) {
            API.request(this.path+"/"+id+"/messages", "GET", null, callback);
        },
        getOperatorSessions: function(id, callback) {
            API.request(this.path+"/"+id+"/sessions", "GET", null, callback);
        }
    },
    Sessions: {
        path: "sessions",
        getSessions: function(callback) {
            API.request(this.path, "GET", null, callback);
        },
        getSession: function(id, callback) {
            API.request(this.path+"/"+id, "GET", null, callback);
        },
        addSession: function(position, department, callback) {
            API.request(this.path, "POST",{
                latitude: position.lat().toFixed(6),
                longitude: position.lng().toFixed(6),
                departmentid: department
            }, callback);
        },
        deleteSession: function(id, callback) {
            API.request(this.path+"/"+id, "DELETE", null, callback);
        },
        updateSession: function(id, data, callback) {
            API.request(this.path+"/"+id, "POST", data, callback);
        },
        getSessionMapPins: function(id, callback) {
            API.request(this.path+"/"+id+"/mappins", "GET", null, callback);
        },
        getSessionMessages: function(id, callback) {
            API.request(this.path+"/"+id+"/messages", "GET", null, callback);
        },
        getSessionOperators: function(id, callback) {
            API.request(this.path+"/"+id+"/operators", "GET", null, callback);
        }
    }
};