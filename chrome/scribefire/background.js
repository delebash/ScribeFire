function openScribeFire() {
    var scribefireUrl = chrome.extension.getURL('scribefire.html');

    // Check for a tab already with this URL.
    chrome.tabs.getAllInWindow(null, function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].url == scribefireUrl) {
                chrome.tabs.update(tabs[i].id, { "selected" : true });

                if (localStorage["extensions.scribefire.blogThis"]) {
                    chrome.tabs.update(tabs[i].id, { "url" : scribefireUrl });
                }
                return;
            }
        }
        if (localStorage["extensions.scribefire.newWindow"] == 'true') {
            chrome.windows.create({'url': scribefireUrl, 'type': 'popup'}, function(window) {});
        } else {
            chrome.tabs.create({"url": scribefireUrl});
        }
    });
}

chrome.browserAction.onClicked.addListener(function() {
    openScribeFire();
});

function scribefireContextClick(info, tab) {
    var blogThis = {
        url : tab.url,
        title : tab.title,
        selection : info.selectionText
    };

    if (info.linkUrl) {
        blogThis.url = info.linkUrl;
        blogThis.title = info.selectionText || "Your link text here.";
    }
    else if (info.mediaType == "video") {
        blogThis.selection = '<video src="' + info.srcUrl + '"></video>';
    }
    else if (info.mediaType == "audio") {
        blogThis.selection = '<audio src="' + info.srcUrl + '"></audio>';
    }
    else if (info.mediaType == "image") {
        blogThis.selection = '<img src="' + info.srcUrl + '" />';
    }

    localStorage["extensions.scribefire.blogThis"] = JSON.stringify(blogThis);

    openScribeFire();
}

var contexts = {
    "page" : "Blog This Page",
    "selection" : "Blog Selected Text",
    "link" : "Blog This Link",
    "image" : "Blog This Image",
    "video" : "Blog This Video",
    "audio" : "Blog This Audio"
};

for (var i in contexts) {
    var context = i;
    var title = contexts[i];

    var id = chrome.contextMenus.create( { "title" : title, "contexts" : [ context ], "onclick": scribefireContextClick } );
}