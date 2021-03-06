﻿/**
 * Authored by Amaya
 */
Ext.define("DoctorsNearMe.view.LocationMap", {
    extend: 'Ext.Map',
    xtype: 'locationmap',
    config: {
        layout: 'fit',
        
        /**
         * cfg {LatLng} the location of the user
         */
        userLocation: null,

        /**
         * cfg {Marker} marker of current location of the user 
         */
        userLocationMarker:null,

        /**
         * cfg {LatLng} the location relative to which search happens
         */
        baseLocation: null,

        /**
         * cfg {Marker} marker of the location relative to which search happens 
         */
        baseLocationMarker: null,

        /**
         * cfg [Marker] markers of the location relative to which search happens 
         */
        locationMarkers: [],

        /**
         * cfg [Marker] markers of direction service 
         */
        directionMarkers: [],

        /**
         * cfg [google.maps.DirectionsRenderer] routes of direction service 
         */
        routes: [],

        /**
         * cfg {Store} locations store.  
         */
        store: null,

        /**
         * cfg {Ext.util.Geolocation}   
         */
        geo: null,

        /**
         * cfg {Boolean} To keep track of the initial userlocation setting
         */
        initialUserLocationSetting: true,

        //a global infowindow
        infoWindow :null
                      
    },

    /**
     * Initialize
     * @method
    */
    initialize: function(){
        this.callParent();

        this.setInfoWindow(new google.maps.InfoWindow());

        //bubble these events to MapView
        this.enableBubble(['getdirections', 'moredetails', 'togglefavorite','basechanged','like']);

        //set location of the user and also this keeps track of base changes
        this.setLocationOfTheUser();

        var me = this;

        //handler for direction buttons on infowindows
        this.addListener({
            element: 'element',
            delegate: 'button.direction',
            tap: function (event, node, options, eOpts) {
                console.log("get directions");
                me.clearRoutes();
                me.clearMarkers(this.getDirectionMarkers());
                node.disabled = true;
                me.fireEvent('getdirections', me, node.id);
            }
        });

        //handler for more details icons on infowindows
        this.addListener({
            element: 'element',
            //delegate: 'button.more-details',
            delegate: 'img.more-details',
            tap: function (event, node, options, eOpts) {
                me.fireEvent('moredetails', node.id);
            }
        });

        //handler for like buttons on infowindows
        this.addListener({
            element: 'element',
            delegate: 'button.like-img',
            tap: function (event, node, options, eOpts) {

                var button = Ext.get(node.id);

                if (button.hasCls('like')) {
                    me.fireEvent('like', true, node.id.slice(0, -5),button);
                }
                else {
                    me.fireEvent('like', false, node.id.slice(0, -5),button);
                }                               
            }
        });
        
    },


    /**
    * Clear all markers and routes when store is cleared
    * @method
    * @public
    */
    onStoreClear: function(){
        this.clearMarkers(this.getLocationMarkers());
        this.clearMarkers(this.getDirectionMarkers());
        this.clearRoutes();
    },

    /**
    * Called when a location is added to the store
    * @method
    * @public
    * @param {String} type
    */
    onLocationAddition: function (type) {
        //var markerImg = 'Medical centers_small.png';
        var markerImg = 'hospital-icon.png';
        switch (type) {
            case 1: markerImg = 'Doctors_small.png'
                break;
            case 2: markerImg = 'Pharmacies_small.png'
                break;
        }

        var me = this;
        var record = this.getStore().last();

        // me.addLocationMarker(record.getData(), markerImg);
        //COMMENTED ABOVE LINE AND ADDDED THIS TO TEST FOR SENDING SEPARATE REQUESTS
        me.addLocationMarker(record, markerImg);

    },


    /**
    * Add a Marker
    * @method
    * @private
    * @param {Object} record
    * @param {String} makerIcon
    */
    addLocationMarker: function (record, markerIcon) {
        var me = this;

        //get the location
        var latlng = record.get('geometry').location;       

        //create a marker there
        var marker = new google.maps.Marker({
            map: me.getMap(),
            animation: null,
            position: latlng,
            icon: 'resources/icons/' + markerIcon
        });

        //add a listener to the marker to open infowindow
        google.maps.event.addListener(marker, 'click', function (pos) {
            var infowindow = new google.maps.InfoWindow();

             lang = DoctorsNearMe.config.getLanguage();

            var name = record.get('name');

            //if name is not null that means this record has been filled with 
            //all the data            
            if(name !=null)
            {
                //then just set the infowindow content with record's data
                me.setInfowindowContent(record, marker);
                
            }
           //if name is null that means due to OVER_QUERY_LIMIT this record hasn't been filled with 
           //all the data
            else
            {
                //send a separate request to get details of the record
                me.getStore().setDetailsForTheRecord(record,marker);
            }

            me.setMapOptions({
                center: marker.position,
                zoom: 20
            });
           
        });

        //push this marker to the array of location markers
        this.getLocationMarkers().push(marker);
    },


    /**
    * Set the contents of the infowindow
    * @method
    * @private
    * @param {Object} record
    * @param {Marker} marker
    */
    setInfowindowContent: function (record,marker) {

        var infowindow = this.getInfoWindow();

        var values = {
            id: record.get('id'),
            name: record.get('name'),
            isLiked: record.get('isLiked'),
            phoneNumber: record.get('international_phone_number'),
            loggedIn:DoctorsNearMe.config.getLoggedIn()
        }

        var tpl = new Ext.XTemplate(
            '<div>',
                '<div display="table-row-group">',
                     '<p class="wordstyle">{[this.getName(values.name)]}<img class="more-details" id ={id} src = "resources/icons/i_30_30.png"></p>',
                '</div>',
                '<tpl if="values.loggedIn==true">',
                     '<div display="table-row-group">',
                            '<tpl if="values.isLiked!=true">',
                                '<button class="like-img like" id={[this.getLikeId(values.id,"like")]}>',
                            '</tpl>',
                            '<tpl if="values.isLiked==true">',
                                '<button class="like-img dislike" id={[this.getLikeId(values.id,"like")]}>',
                            '</tpl>',
                    '</div>',
                    '<br>',
                '</tpl>',
                '<tpl if="values.loggedIn!=true">',
                     '<div display="table-row-group">',
                            '<br>',
                    '</div>',
                '</tpl>',
                '<tpl if="values.phoneNumber!=null">',
                    '<div display="table-row-group">',
                        '<div class="inlineblock">',
                            '<button class="call" style="padding-left:1px;"><img class="call-img" src = "resources/icons/Phone_40_40.png"><a href="tel:{phoneNumber}">{[this.getCallLabel()]}</a></button>',
                    '</div>',
                        '<div class="inlineblock">',
                            '<button class="direction" id={id}><img class="direction-img" src = "resources/icons/Arrow_40_40.png">{[this.getDirectionsLabel()]}</button>',
                        '</div>',
                    '</div>',                    
                '</tpl>',
                 '<tpl if="values.phoneNumber==null">',
                    '<div display="table-row-group">',
                        '<div class="inlineblock">',
                            '<button class="direction direction-full-width" id={id}><img class="direction-img" src = "resources/icons/Arrow_40_40.png">{[this.getDirectionsLabel()]}</button>',
                        '</div>',
                    '</div>',
                '</tpl>',
            '</div>', {
                getLikeId: function (id,like) {
                    return id + '-' + like;
                },
                getCallLabel: function () {
                    return lang.CALL;
                },
                getDirectionsLabel: function () {
                    return lang.GET_DIRECTIONS;
                },
                getName: function (name) {
                    var i=0,j=0,firstRow="",secondRow="";
                    if (name.length >= 28) {
                        var splitted = name.split(" ");
                        var noOfWords = splitted.length;                     

                        var noOfSpaces = noOfWords - 1;
                        if (noOfSpaces >= 4) {
                            secondRow = splitted[noOfWords - 2] + " " + splitted[noOfWords-1];
                            for (i = 0; i < noOfWords - 2; i++) {
                                firstRow += splitted[i] + " ";
                            }
                            return firstRow + '<br>' + secondRow;
                        } else {
                            return name;
                        }

                        
                    } else {
                        return name;
                    }
                   
                }
            }

            );

        infowindow.setContent(tpl.apply(values));
        infowindow.open(this.getMap(), marker);

    },

    /**
    * Clear the Markers
    * @method
    * @private
    * @param [Marker} markers
    */
    clearMarkers: function (markers) {
        Ext.Array.forEach(markers, function (marker) {
            marker.setMap(null);
        });
    },

    /**
    * Clear the routes
    * @method
    * @private
    */
    clearRoutes: function () {
        var me = this;
        Ext.Array.forEach(me.getRoutes(), function (route) {
            route.setMap(null);
        });
    },

    /**
     * Set the listener for the location of the user
     * @method
     * @private
    */
    setLocationOfTheUser: function () {
        var me = this;
        var geo = Ext.create('Ext.util.Geolocation', {
            autoUpdate: false,
            listeners: {
                locationupdate: function (geo) {
                    console.log("location update");

                    var user = me.getUserLocationMarker();
                    var base = me.getBaseLocationMarker();

                    //now this is a location update and auto update is set to false. 
                    //Therefore location update only happens if user clicks on the locator.
                    //In that case both user location and base location need to be updated.
                    //Therefore existing ones are removed
                    if (user != null) {
                        user.setMap(null);
                    }
                    if (base != null) {
                        base.setMap(null);
                    }

                    var currentLat = geo.getLatitude();
                    var currentLng = geo.getLongitude();

                    //get new location
                    var location = new google.maps.LatLng(currentLat, currentLng);

                    //set new location
                    me.setUserLocation(location);
                    me.setBaseLocation(location);


                    var markerIcon = {
                        url: 'resources/icons/bluedot1.png',
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(70, 70),
                        scaledSize: new google.maps.Size(140, 140)
                    };

                    var marker = new google.maps.Marker({
                        map: me.getMap(),
                        animation: null,
                        position: location,
                        draggable: true,
                        icon: markerIcon
                    });

                    //this event listener is for when user drags his marker to change the base location
                    google.maps.event.addListener(marker, 'dragend', function (event) {
                        me.setBaseLocation(me.getBaseLocationMarker().position);
                        //need to fire basechanged event
                        me.fireEvent('basechanged');
                    });

                    me.setMapOptions({
                        center: location,
                        zoom: 15
                    });

                    //set markers at new locations
                    me.setUserLocationMarker(marker);
                    me.setBaseLocationMarker(marker);

                    //fire basechanged event. If this is the initial location setting currentsearch config 
                    //of mapview is null. Therefore in mapview controller this is checked and set the choice 
                    //to 0
                    me.fireEvent('basechanged', me.getInitialUserLocationSetting());

                    //after initial one this config is set to false
                    if (me.getInitialUserLocationSetting()) {
                        me.setInitialUserLocationSetting(false);
                    }

                },
                locationerror: function (geo, bTimeout, bPermissionDenied, bLocationUnavailable, message) {
                   /* if (bTimeout)
                        Ext.Msg.alert('Timeout occurred', "Could not get current position");
                    else
                        alert('Error occurred.');*/
                }
            }
        });

        this.setGeo(geo);
    },

    /**
    * Calculates the route from start to end
    * @method
    * @public
    * @param {Latlng} start
    * @param {latlng} end
    * @param {Map} map
    */
    calcRoute:function (start,end,map) {
        var directionsService = new google.maps.DirectionsService();

        console.log(directionsService);
        console.log(start);
        console.log(end);

        var rendererOptions = {
            map: map
        };

        var polylineOptionsActual = new google.maps.Polyline({
            strokeColor: 'green',
            strokeOpacity: 1.0,
            strokeWeight: 5
        });

        var directionsDisplay = new google.maps.DirectionsRenderer({ polylineOptions: polylineOptionsActual, map: map });
        console.log(directionsDisplay.polylineOptions);

        this.getRoutes().push(directionsDisplay);

        var stepDisplay = new google.maps.InfoWindow();

        var request = {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
        };
        var me = this;
        var lang = DoctorsNearMe.config.getLanguage();

        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                console.log("OK");
                directionsDisplay.setDirections(response);
                me.showSteps(response, stepDisplay, map);
            } else {
                Ext.Msg.setMinWidth('50%');
                Ext.Msg.alert("Sorry","Unable to give directions from your location");
            }
        });
    },
    
    /**
     * Show steps in a given route
     * @method
     * @private
     * @param {Object} directionResult
     * @param {InfoWindow} stepDisplay
     * @param {Map} map
     */
    showSteps: function (directionResult, stepDisplay,map) {

        var myRoute = directionResult.routes[0].legs[0];
        console.log("my route");
        console.log(myRoute);
        for (var i = 0; i < myRoute.steps.length; i++) {
            var marker = new google.maps.Marker({
                position: myRoute.steps[i].start_location,
                map: map
            });
            this.attachInstructionText(marker, myRoute.steps[i].instructions, stepDisplay, map);
            this.getDirectionMarkers().push(marker);
        }
    },

    /**
     * Attaches instruction text
     * @method
     * @private
     * @param {Marker} marker
     * @param {String} text
     * @param {InfoWindow} stepDisplay
     * @param {Map} map
     */
    attachInstructionText: function (marker, text, stepDisplay,map) {
        google.maps.event.addListener(marker, 'click', function() {

            stepDisplay.setContent('<div>' + text + '</div>');
            stepDisplay.open(map, marker);
        });
    }
    
})