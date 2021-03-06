var notificationMenu = (function () {
    "use strict";
    var scriptVersion = "1.0.5";
    var util = {
        version: "1.0",
        escapeHTML: function (str) {
            if (str === null) {
                return null;
            }
            if (typeof str === "undefined") {
                return;
            }
            if (typeof str === "object") {
                try {
                    str = JSON.stringify(str);
                } catch (e) {
                    /*do nothing */
                }
            }
            try {
                return apex.util.escapeHTML(String(str));
            } catch (e) {
                str = String(str);
                return str
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#x27;")
                    .replace(/\//g, "&#x2F;");
            }
        },
        jsonSaveExtend: function (srcConfig, targetConfig) {
            var finalConfig = {};
            /* try to parse config json when string or just set */
            if (typeof targetConfig === 'string') {
                try {
                    targetConfig = JSON.parse(targetConfig);
                } catch (e) {
                    console.log("Error while try to parse udConfigJSON. Please check your Config JSON. Standard Config will be used.");
                    console.log(e);
                    console.log(targetConfig);
                }
            } else {
                finalConfig = targetConfig;
            }
            /* try to merge with standard if any attribute is missing */
            try {
                finalConfig = $.extend(true, srcConfig, targetConfig);
            } catch (e) {
                console.log('Error while try to merge udConfigJSON into Standard JSON if any attribute is missing. Please check your Config JSON. Standard Config will be used.');
                console.log(e);
                finalConfig = srcConfig;
                console.log(finalConfig);
            }
            return finalConfig;
        }
    };

    return {

        initialize: function (elementID, ajaxID, udConfigJSON, items2Submit, escapeRequired) {
            var stdConfigJSON = {
                "refresh": 0,
                "mainIcon": "fa-bell",
                "mainIconColor": "white",
                "mainIconBackgroundColor": "rgba(70,70,70,0.9)",
                "mainIconBlinking": false,
                "counterBackgroundColor": "rgb(232, 55, 55 )",
                "counterFontColor": "white",
                "linkTargetBlank": true
            };
            var configJSON = {};
            configJSON = util.jsonSaveExtend(stdConfigJSON, udConfigJSON);


            /* define container and add it to parent */
            var container = drawContainer();

            /* get data and draw */
            getData(drawBody);

            /* Used to set a refresh via json configuration */
            if (configJSON.refresh > 0) {
                setInterval(function () {
                    if (container.children('span').length == 0) {
                        if (ajaxID) {
                            getData(refreshBody);
                        } else {
                            refreshBody(dataJSON);
                        }
                    }
                }, configJSON.refresh * 1000);
            }

            /***********************************************************************
             **
             ** function to get data from Apex
             **
             ***********************************************************************/
            function getData(f) {
                if (ajaxID) {
                    apex.server.plugin(
                        ajaxID, {
                            pageItems: items2Submit
                        }, {
                            success: f,
                            error: function (d) {
                                container.empty();
                                console.log(d.responseText);
                                container.append("<span>Error occured please check console for more information</span>");
                            },
                            dataType: "json"
                        });
                } else {
                    try {
                        drawBody(dataJSON);
                    } catch (e) {
                        console.log('need data json');
                        console.log(e);
                    }
                }
            }

            /***********************************************************************
             **
             ** Used to draw a container
             **
             ***********************************************************************/
            function drawContainer() {
                var li = $("<li></li>");
                li.addClass("t-NavigationBar-item");


                var div = $("<div></div>");
                li.append(div);

                $('.t-NavigationBar').prepend(li);
                return (div);
            }

            /***********************************************************************
             **
             ** Used to draw a note body
             **
             ***********************************************************************/
            function drawBody(dataJSON) {
                if (escapeRequired !== false) {
                    /* escape config */
                    configJSON.counterBackgroundColor = util.escapeHTML(configJSON.counterBackgroundColor);
                    configJSON.counterFontColor = util.escapeHTML(configJSON.counterFontColor);
                    configJSON.mainIcon = util.escapeHTML(configJSON.mainIcon);
                    configJSON.mainIconBackgroundColor = util.escapeHTML(configJSON.mainIconBackgroundColor);
                    configJSON.mainIconColor = util.escapeHTML(configJSON.mainIconColor);
                }

                var div = $("<div></div>");

                div.addClass("toggleNotifications");

                div.attr("id", elementID + "_toggleNote");
                div.attr("toggled", "true");
                var ul = "#" + elementID + "_ul";

                div.click(function () {
                    var toggled = div.attr('toggled') == 'false' ? 'true' : 'false';
                    div.attr("toggled", toggled);

                    $(ul).fadeToggle("fast");
                });


                $(document).on('touchstart click', function (e) {
                    if ((!div.is(e.target) && div.has(e.target).length === 0) && !$(e.target).parents(ul).length > 0) {
                        if (div.attr('toggled') == 'false') {
                            div.attr("toggled", true);
                            $(ul).fadeToggle("fast");
                        }
                    }
                });

                var countDiv = $("<div></div>");
                countDiv.addClass("count");
                div.append(countDiv);

                var numDiv = $("<div></div>");
                numDiv.addClass("num");
                numDiv.css("background", configJSON.counterBackgroundColor);
                numDiv.css("color", configJSON.counterFontColor);
                numDiv.attr("id", elementID + "_numdiv");
                numDiv.html(dataJSON.row.length);
                countDiv.append(numDiv);

                var bellLabel = $("<label></label>");
                bellLabel.addClass("show");
                bellLabel.css("background", configJSON.mainIconBackgroundColor);
                bellLabel.attr("for", elementID + "_navtoggle");

                var bellI = $("<i></i>");
                bellI.addClass("fa");
                bellI.addClass(configJSON.mainIcon);
                bellI.css("color", configJSON.mainIconColor);

                if (configJSON.mainIconBlinking) {
                    bellI.addClass("fa-blink");
                }

                bellLabel.append(bellI);

                div.append(bellLabel);

                container.append(div);

                refreshBody(dataJSON);
            }

            /***********************************************************************
             **
             ** Used to refresh
             **
             ***********************************************************************/
            function refreshBody(dataJSON) {
                var toggleNote = "#" + elementID + "_toggleNote";
                $(toggleNote).hide();
                if (dataJSON.row) {
                    var numDivID = "#" + elementID + "_numdiv";
                    var ulID = "#" + elementID + "_ul";
                    if (dataJSON.row.length > 0) {
                        $(toggleNote).show();
                        $(numDivID).html(dataJSON.row.length);
                        $(ulID).remove();
                        drawList($(toggleNote), dataJSON)
                    } else {
                        $(ulID).remove();
                        $(numDivID).html("0");
                    }
                }
            }

            /***********************************************************************
             **
             ** Used to draw the note list
             **
             ***********************************************************************/
            function drawList(div, dataJSON) {

                var ul = $("<ul></ul>");
                ul.attr("id", elementID + "_ul");
                ul.addClass("notifications");
                ul.addClass("notificationstoggle");
                var toggleNote = "#" + elementID + "_toggleNote";
                if ($(toggleNote).attr("toggled") == "false") {
                    ul.toggle();
                }

                if (dataJSON.row) {
                    for (var item = 0; item < dataJSON.row.length; item++) {
                        if (escapeRequired !== false) {
                            /* escape data */
                            if (dataJSON.row[item].NOTE_LINK) {
                                dataJSON.row[item].NOTE_LINK = util.escapeHTML(dataJSON.row[item].NOTE_LINK);
                            }
                            if (dataJSON.row[item].NOTE_HEADER) {
                                dataJSON.row[item].NOTE_HEADER = util.escapeHTML(dataJSON.row[item].NOTE_HEADER);
                            }
                            if (dataJSON.row[item].NOTE_ICON) {
                                dataJSON.row[item].NOTE_ICON = util.escapeHTML(dataJSON.row[item].NOTE_ICON);
                            }
                            if (dataJSON.row[item].NOTE_ICON_COLOR) {
                                dataJSON.row[item].NOTE_ICON_COLOR = util.escapeHTML(dataJSON.row[item].NOTE_ICON_COLOR);
                            }
                            if (dataJSON.row[item].NOTE_TEXT) {
                                dataJSON.row[item].NOTE_TEXT = util.escapeHTML(dataJSON.row[item].NOTE_TEXT);
                            }
                        }

                        var a = $("<a></a>");

                        if (dataJSON.row[item].NOTE_LINK) {
                            a.attr("href", dataJSON.row[item].NOTE_LINK);
                            if (configJSON.linkTargetBlank) {
                                a.attr("target", "_blank");
                            }
                            a.on('touchstart click', function (e) {
                                if (div.attr('toggled') == 'false') {
                                    div.attr("toggled", true);
                                    $(ul).fadeToggle("fast");
                                }
                            });
                        }

                        var li = $("<li></li>");
                        li.addClass("note");
                        if (dataJSON.row[item].NOTE_COLOR) {
                            li.css("box-shadow", "-5px 0 0 0 " + dataJSON.row[item].NOTE_COLOR);
                        }

                        var noteHeader = $("<div></div>");
                        noteHeader.addClass("note-header");

                        var i = $("<i></i>");
                        i.addClass("fa");
                        if (dataJSON.row[item].NOTE_ICON) {
                            i.addClass(dataJSON.row[item].NOTE_ICON);
                        }
                        if (dataJSON.row[item].NOTE_ICON_COLOR) {
                            i.css("color", dataJSON.row[item].NOTE_ICON_COLOR);
                        }
                        i.addClass("fa-lg");

                        noteHeader.append(i);
                        if (dataJSON.row[item].NOTE_HEADER) {
                            noteHeader.append(dataJSON.row[item].NOTE_HEADER);
                        }
                        li.append(noteHeader);

                        var span = $("<span></span>");
                        span.addClass("note-info");
                        if (dataJSON.row[item].NOTE_TEXT) {
                            span.html(dataJSON.row[item].NOTE_TEXT);
                        }
                        li.append(span);

                        a.append(li);

                        ul.append(a);
                    }
                }

                $("body").append(ul);
            }
        }
    }
})();
