$(document).ready(function() {
    if (!window.console) window.console = {};
    if (!window.console.log) window.console.log = function() {};

    updater.start();
});

var updater = {
    socket: null,
    link: 1,
    converter: new showdown.Converter({
        noHeaderId: 'true',
        strikethrough: 'true',
        tables: 'true',
        tasklists: 'true',
        smoothLivePreview: 'true',
        smartIndentationFix: 'true'
    }),

    start: function() {
        md = $('#md');
        html = $('#html');
        var jsearch = $('#search');
        var submit = $('#submit');
        var search = document.getElementById("search");
        var url = "ws://" + location.host + "/linksocket";
        updater.socket = new WebSocket(url);
        updater.socket.onmessage = function(event) {
            json = JSON.parse(event.data);
            switch (json.message) {
                case "update":
                    md.html(json.content.split('\n').join('<br>').split(' ').join('&nbsp;'));
                    md.data('before-server', md.html());
                    break;
            }
        };
        jsearch.keypress(function(event) {
            if (event.which == 13) {
                submit.click();
            }
        });
        submit.click(function(event) {
            updater.update(true);
        });
        $('#info').slideUp();
        $('#help').click(function(event) {
            $('#info').slideToggle();
        });
        window.setInterval(function(){
            if (md.data('before') !== md.html()) {
                md.data('before', md.html());
                updater.update(false);
            }
        }, 1000);
        window.setInterval(window.onbeforeunload = function(){
            if (md.data('before-server') !== md.html()) {
                md.data('before-server', md.html());
                updater.socket.send(JSON.stringify({"message": "save", "content": md.html().split('&nbsp;').join(' ').replace(/<br\s*[\/]?>/gi,'\n')}));
            }
        }, 60000);
        slideToggle = function(heading) {
            if (heading.is($('h1'))) {
                elements = heading.nextUntil('h1');
            } else if (heading.is($('h2'))) {
                elements = heading.nextUntil('h1, h2');
            } else if (heading.is($('h3'))) {
                elements = heading.nextUntil('h1, h2, h3');
            } else if (heading.is($('h4'))) {
                elements = heading.nextUntil('h1, h2, h3, h4');
            } else if (heading.is($('h5'))) {
                elements = heading.nextUntil('h1, h2, h3, h4, h5');
            } else if (heading.is($('h6'))) {
                elements = heading.nextUntil(':header');
            } else return;
            if (elements.length) {
                if (elements.filter(':visible').length) {
                    heading.removeClass('down');
                    heading.addClass('up');
                    elements.hide();
                } else {
                    heading.removeClass('up');
                    heading.addClass('down');
                    elements.filter(':header').removeClass('up');
                    elements.filter(':header').addClass('down');
                    elements.show();
                }
            }
        };
    },

    update: function(doSearch) {
        var html = $('#html');
        var md = document.getElementById("md");

        var text = md.innerText.replace(/\xA0/g, ' ');
        var search = document.getElementById("search").value.trim();

        if (search && doSearch) {
            var textLines = text.split('\n');
            var lines = parseElement(textLines, search);
            lines.sort(function (a, b) {  return a - b;  });
            addContext(textLines, lines);
            lines.sort(function (a, b) {  return a - b;  });
            text = '';
            lines.forEach(function(item, index) {
                text = text.concat(textLines[item] + '\n');
                if (textLines[item].match(/^[\s-]*>/) === null) {
                    text = text.concat('\n');
                }
            });
        }

        html.html(updater.converter.makeHtml(text));

        html.find(':header').click(function(){
            slideToggle($(this));
        });
        html.find(':header').addClass('down');
        html.find(':header').removeClass('up');
    }
};

var parseElement = function (text, search) {
    var lines = [];
    for (var i = 0; i<text.length; i++) {
        lines.push(i);
    }

    // Parse OR statements
    var recursion = function(item, index) {
        recursivelines = recursivelines.concat(parseElement(text, item).filter(function (item) {
            return recursivelines.indexOf(item) < 0;
        }));
    };
    var filter = function(item) {
        return lines.indexOf(item) >= 0;
    };
    while ((found = /(?:(?:"[^"]+"|[^\s"]+)\s+OR\s+)+(?:"[^"]+"|[^\s"]+)/g.exec(search)) !== null) {
        search = search.replace(found[0], '');
        recursivelines = [];
        found[0].split(/(?:\s+OR\s+)(?=(?:[^"]|"[^"]*")*$)/g).forEach(recursion);
        lines = recursivelines.filter(filter);
    }

    // Parse quotes
    while ((found = /-?(?:")([^"]+)(?:")/g.exec(search)) !== null) {
        search = search.replace(found[0], '');
        parse(text, lines, found, found[0].charAt(0) === '-');
    }

    // Parse due dates
    while ((found = /-?([^ ]+):(<=?|>=?)?([0-9]{4}-[01][0-9]-[0-3][0-9])/g.exec(search)) !== null) {
        search = search.replace(found[0], '');
        var searchDate = new Date(found[3]);
        var j = 0;
        while (j < lines.length) {
            var line = text[lines[j]];
            var reg = /([^ `]+):([0-9]{4}-[01][0-9]-[0-3][0-9])/g;
            var matched = false;
            while ((lineFound = reg.exec(line)) !== null) {
                if (lineFound[1] !== found[1]) {
                    continue;
                }
                var lineDate = new Date(lineFound[2]);
                switch (found[2]) {
                    case "<":
                        matched = (lineDate - searchDate < 0);
                        break;
                    case ">":
                        matched = (lineDate - searchDate > 0);
                        break;
                    case "<=":
                        matched = (lineDate - searchDate <= 0);
                        break;
                    case ">=":
                        matched = (lineDate - searchDate >= 0);
                        break;
                    default:
                        matched = (lineDate - searchDate === 0);
                        break;
                }
                if (!matched) {
                    break;
                }
            }
            if (found[0].charAt(0) === '-') {
                matched = !matched;
            }
            if (matched) {
                j++;
            } else {
                lines.splice(j, 1);
            }
        }
    }

    // Parse individual words
    while ((found = /-?(\S+)/g.exec(search)) !== null) {
        search = search.replace(found[0], '');
        parse(text, lines, found, found[0].charAt(0) === '-');
    }

    return lines;
};

var parse = function(text, lines, found, exclude) {
    i = 0;
    // This is O(n). Is there a way to reduce that???
    while (i<lines.length) {
        if (text[lines[i]].indexOf(found[1]) === -1 ? !exclude : exclude) {
            lines.splice(i, 1);
        } else {
            i++;
        }
    }
};

var addContext = function(text, lines) {
    //var heading = /^#{1,6}\s/;
    var previousLine = -1;
    var currentHeading = 6;
    for (var i = 0; i<lines.length; i++) {
        var line = text[lines[i]];

        // Find headings
        var heading = 0, j = 0;
        while (line.charAt(j) === '#') {
            heading++;
            j++;
        }
        if (heading === 0) heading = 7;
        j = lines[i];
        var backheading = heading;
        while (j > previousLine) {
            var backline = text[j];
            var newHeading = 0, k = 0;
            while (backline.charAt(k) === '#') {
                newHeading++;
                k++;
            }
            if (newHeading === 0) newHeading = 7;
            if (newHeading < backheading) {
                lines.splice(0, 0, j);
                backheading = newHeading;
                i++;
            }
            j--;
        }

        // Showdown, the program I'm using to convert markdown to html, currently only supports one layer of nested lists
        // So if you give it 3+ then it'll smush 2 and on all in the same level.

        // If it's a bullet point...
        if (line.match(/^ *- /)) {
            // Find the top level
            j = lines[i] + 1;
            var spaces = -1;
            while (spaces) {
                j--;
                var lineTest = text[j];
                if (text[j] === null) {
                    //  Reached the top of the page
                    j++;
                    break;
                }
                if (lineTest.match(/\S+/)) {
                    if (!lineTest.match(/^ *- /)) {
                        // the top level has more than one space.
                        // I could potentially try to find the lowest number of spaces, but that'd be a lot of work.
                        // The current solution will just make it a bit more inclusive than it necessarily need be.
                        j++;
                        break;
                    }
                    spaces = 0;
                    var l = 0;
                    while (lineTest.charAt(l) === ' ') {
                        spaces++;
                        l++;
                    }
                } else {
                    spaces = -1;
                }
            }

            // print the bullet list
            while (j < text.length - 1) {
                if (lines.indexOf(j) === -1 || !text[j].match(/\S+/)) {
                    lines.splice(0, 0, j);
                    i++;
                }
                j++;
                var bulletLine = text[j];
                if (bulletLine.match(/\S+/)) {
                    if (!bulletLine.match(/^ *- /)) {
                        break;
                    }
                    var bulletSpaces = 0, m = 0;
                    while (bulletLine.charAt(m) === ' ') {
                        bulletSpaces++;
                        m++;
                    }
                    if (bulletSpaces === 0) {
                        break;
                    }
                }
            }
        }

        previousLine = lines[i];
        currentHeading = heading;
    }
};
