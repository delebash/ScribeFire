/**
 * Code in this file taken from Wordpress, licensed under the GPL.
 */

var switchEditors = {
	mode : 'tinymce',

	I : function(e) {
		return document.getElementById(e);
	},

	_wp_Nop : function(content) {
		var autoAddP = SCRIBEFIRE.prefs.getBoolPref('autoAddP');
		var blocklist1, blocklist2;

		// Protect pre|script tags
		content = content.replace(/<(pre|script)[^>]*>[\s\S]+?<\/\1>/g, function(a) {
			a = a.replace(/<br ?\/?>[\r\n]*/g, '<wp_temp>');
			return a.replace(/<\/?p( [^>]*)?>[\r\n]*/g, '<wp_temp>');
		});

		// Pretty it up for the source editor
		blocklist1 = 'blockquote|ul|ol|li|table|thead|tbody|tfoot|tr|th|td|div|h[1-6]|p|fieldset';
		content = content.replace(new RegExp('\\s*</('+blocklist1+')>\\s*', 'g'), '</$1>\n');
		content = content.replace(new RegExp('\\s*<(('+blocklist1+')[^>]*)>', 'g'), '\n<$1>');

		// Mark </p> if it has any attributes.
		content = content.replace(/(<p [^>]+>.*?)<\/p>/g, '$1</p#>');

		// Separate <div> containing <p>
		content = content.replace(/<div([^>]*)>\s*<p>/gi, '<div$1>\n\n');

		// Remove <p> and <br />
		content = content.replace(/\s*<p>/gi, '');
		content = content.replace(/\s*<\/p>\s*/gi, '\n\n');
		content = content.replace(/\n[\s\u00a0]+\n/g, '\n\n');
		content = content.replace(/\s*<br ?\/?>\s*/gi, '\n');

		// Fix some block element newline issues
		content = content.replace(/\s*<div/g, '\n<div');
		content = content.replace(/<\/div>\s*/g, '</div>\n');
		content = content.replace(/\s*\[caption([^\[]+)\[\/caption\]\s*/gi, '\n\n[caption$1[/caption]\n\n');
		content = content.replace(/caption\]\n\n+\[caption/g, 'caption]\n\n[caption');

		blocklist2 = 'blockquote|ul|ol|li|table|thead|tbody|tfoot|tr|th|td|h[1-6]|pre|fieldset';
		content = content.replace(new RegExp('\\s*<(('+blocklist2+') ?[^>]*)\\s*>', 'g'), '\n<$1>');
		content = content.replace(new RegExp('\\s*</('+blocklist2+')>\\s*', 'g'), '</$1>\n');
		content = content.replace(/<li([^>]*)>/g, '\t<li$1>');

		if ( content.indexOf('<object') != -1 ) {
			content = content.replace(/<object[\s\S]+?<\/object>/g, function(a){
				return a.replace(/[\r\n]+/g, '');
			});
		}

		// Unmark special paragraph closing tags
		content = content.replace(/<\/p#>/g, '</p>\n');
		content = content.replace(/\s*(<p [^>]+>[\s\S]*?<\/p>)/g, '\n$1');

		// Trim whitespace
		content = content.replace(/^\s+/, '');
		content = content.replace(/[\s\u00a0]+$/, '');

		// put back the line breaks in pre|script
		content = content.replace(/<wp_temp>/g, '\n');
		
		// Keep <pre> tags on their own lines.
		content = content.replace(/(<pre[^>]*>)([^\n])/g, "$1\n$2");
		content = content.replace(/([^\n])<\/pre>/g, "$1\n</pre>");
		
		return content;
	},

	go : function(id, mode) {
		id = id || 'text-content';
		mode = mode || '';
		
		var ed, qt = this.I('quicktags'), H = this.I('edButtonHTML'), P = this.I('edButtonPreview'), ta = this.I(id);

		try { ed = tinyMCE.get(id); }
		catch(e) { ed = false; }

		if (!mode) {
			if (ed && ed.isHidden()) {
				mode = 'tinymce';
			}
		}
		
		if ( 'tinymce' == mode ) {
			$("#edButtonPreview").hide();
			$("#edButtonHTML").show();
			
			if ( ed && ! ed.isHidden() )
				return false;

			// setUserSetting( 'editor', 'tinymce' );

			P.className = 'active';
			H.className = '';
			
			edCloseAllTags(); // :-(
			//qt.style.display = 'none';

			ta.style.color = '#FFF';
			
			ta.value = editor.val();
			
			try {
				if ( ed )
					ed.show();
				else
					tinyMCE.execCommand("mceAddControl", false, id);
			} catch(e) {}

			ta.style.color = '#000';
			
			this.mode = 'tinymce';
		} else {
			$("#edButtonHTML").hide();
			$("#edButtonPreview").show();
			
			// setUserSetting( 'editor', 'html' );
			ta.style.color = '#000';
			H.className = 'active';
			P.className = '';
			
			if ( ed && !ed.isHidden() ) {
				ta.style.height = ed.getContentAreaContainer().offsetHeight + 40 + 'px';
				ed.hide();
			}
			
			ta.value = switchEditors.pre_wpautop(ta.value);
			
			//qt.style.display = 'block';
			this.mode = 'html';
		}
		return false;
	},

	_wp_Autop : function(pee) {
		var autoAddP = SCRIBEFIRE.prefs.getBoolPref('autoAddP');
		var blocklist = 'table|thead|tfoot|caption|col|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre|select|form|blockquote|address|math|p|h[1-6]|fieldset|legend';

		// strips line breaks between object attributes and tags
		if ( pee.indexOf('<object') != -1 ) {
			pee = pee.replace(/<object[\s\S]+?<\/object>/g, function(a){
				return a.replace(/[\r\n]+/g, '');
			});
		}

		// strips line breaks between attributes within html tags 
		pee = pee.replace(/<[^<>]+>/g, function(a){
			return a.replace(/[\r\n]+/g, ' ');
		});

		pee = pee + '\n\n';
		pee = pee.replace(/<br \/>\s*<br \/>/gi, '\n\n');
		pee = pee.replace(new RegExp('(<(?:'+blocklist+')[^>]*>)', 'gi'), '\n$1');
		pee = pee.replace(new RegExp('(</(?:'+blocklist+')>)', 'gi'), '$1\n\n');
		pee = pee.replace(/\r\n|\r/g, '\n');
		pee = pee.replace(/\n\s*\n+/g, '\n\n');
		if (autoAddP) {
			pee = pee.replace(/([\s\S]+?)\n\n/g, '<p>$1</p>\n');
		}
		pee = pee.replace(/<p>\s*?<\/p>/gi, '');
		pee = pee.replace(new RegExp('<p>\\s*(</?(?:'+blocklist+')[^>]*>)\\s*</p>', 'gi'), "$1");
		pee = pee.replace(/<p>(<li.+?)<\/p>/gi, '$1');
		pee = pee.replace(/<p>\s*<blockquote([^>]*)>/gi, '<blockquote$1><p>');
		pee = pee.replace(/<\/blockquote>\s*<\/p>/gi, '</p></blockquote>');
		pee = pee.replace(new RegExp('<p>\\s*(</?(?:'+blocklist+')[^>]*>)', 'gi'), "$1");
		pee = pee.replace(new RegExp('(</?(?:'+blocklist+')[^>]*>)\\s*</p>', 'gi'), "$1");
		if (autoAddP) {
			pee = pee.replace(/\s*\n/gi, '<br />\n');
		} else {
			pee = pee.replace(/\n/gi, '<br />\n');
		}
		pee = pee.replace(new RegExp('(</?(?:'+blocklist+')[^>]*>)\\s*<br />', 'gi'), "$1");
		pee = pee.replace(/<br \/>(\s*<\/?(?:p|li|div|dl|dd|dt|th|pre|td|ul|ol)>)/gi, '$1');
		pee = pee.replace(/(?:<p>|<br ?\/?>)*\s*\[caption([^\[]+)\[\/caption\]\s*(?:<\/p>|<br ?\/?>)*/gi, '[caption$1[/caption]');

		pee = pee.replace(/(<(?:div|th|td|form|fieldset|dd)[^>]*>)(.*?)<\/p>/g, function(a, b, c) {
			if ( c.match(/<p( [^>]+)?>/) )
				return a;

			return b + '<p>' + c + '</p>';
		});

		// Fix the pre|script tags
		pee = pee.replace(/<(pre|script)[^>]*>[\s\S]+?<\/\1>/g, function(a) {
			a = a.replace(/<br ?\/?>[\r\n]*/g, '\n');
			return a.replace(/<\/?p( [^>]*)?>[\r\n]*/g, '\n');
		});

		return pee;
	},

	pre_wpautop : function(content) {
		var t = this, o = { o: t, data: content, unfiltered: content };

		// jQuery('body').trigger('beforePreWpautop', [o]);
		o.data = t._wp_Nop(o.data);
		// jQuery('body').trigger('afterPreWpautop', [o]);
		return o.data;
	},

	wpautop : function(pee) {
		var t = this, o = { o: t, data: pee, unfiltered: pee };

		// jQuery('body').trigger('beforeWpautop', [o]);
		o.data = t._wp_Autop(o.data);
		// jQuery('body').trigger('afterWpautop', [o]);
		return o.data;
	}
};

/** quicktags **/

// new edit toolbar used with permission
// by Alex King
// http://www.alexking.org/

var edButtons = new Array(), edLinks = new Array(), edOpenTags = new Array(), now = new Date(), datetime;

function edButton(id, display, tagStart, tagEnd, access, open) {
	this.id = id;				// used to name the toolbar button
	this.display = display;		// label on button
	this.tagStart = tagStart; 	// open tag
	this.tagEnd = tagEnd;		// close tag
	this.access = access;		// access key
	this.open = open;			// set to -1 if tag does not need to be closed
}

function zeroise(number, threshold) {
	// FIXME: or we could use an implementation of printf in js here
	var str = number.toString();
	if (number < 0) { str = str.substr(1, str.length) }
	while (str.length < threshold) { str = "0" + str }
	if (number < 0) { str = '-' + str }
	return str;
}

datetime = now.getUTCFullYear() + '-' +
zeroise(now.getUTCMonth() + 1, 2) + '-' +
zeroise(now.getUTCDate(), 2) + 'T' +
zeroise(now.getUTCHours(), 2) + ':' +
zeroise(now.getUTCMinutes(), 2) + ':' +
zeroise(now.getUTCSeconds() ,2) +
'+00:00';

edButtons[edButtons.length] =
new edButton('ed_strong'
,'b'
,'<strong>'
,'</strong>'
,'b'
);

edButtons[edButtons.length] =
new edButton('ed_em'
,'i'
,'<em>'
,'</em>'
,'i'
);

edButtons[edButtons.length] =
new edButton('ed_link'
,'link'
,''
,'</a>'
,'a'
); // special case

edButtons[edButtons.length] =
new edButton('ed_block'
,'b-quote'
,'\n\n<blockquote>'
,'</blockquote>\n\n'
,'q'
);


edButtons[edButtons.length] =
new edButton('ed_del'
,'del'
,'<del datetime="' + datetime + '">'
,'</del>'
,'d'
);

edButtons[edButtons.length] =
new edButton('ed_ins'
,'ins'
,'<ins datetime="' + datetime + '">'
,'</ins>'
,'s'
);

edButtons[edButtons.length] =
new edButton('ed_img'
,'img'
,''
,''
,'m'
,-1
); // special case

edButtons[edButtons.length] =
new edButton('ed_ul'
,'ul'
,'<ul>\n'
,'</ul>\n\n'
,'u'
);

edButtons[edButtons.length] =
new edButton('ed_ol'
,'ol'
,'<ol>\n'
,'</ol>\n\n'
,'o'
);

edButtons[edButtons.length] =
new edButton('ed_li'
,'li'
,'\t<li>'
,'</li>\n'
,'l'
);

edButtons[edButtons.length] =
new edButton('ed_code'
,'code'
,'<code>'
,'</code>'
,'c'
);

edButtons[edButtons.length] =
new edButton('ed_more'
,'more'
,'<!--more-->'
,''
,'t'
,-1
);
/*
edButtons[edButtons.length] =
new edButton('ed_next'
,'page'
,'<!--nextpage-->'
,''
,'p'
,-1
);
*/
function edLink() {
	this.display = '';
	this.URL = '';
	this.newWin = 0;
}

edLinks[edLinks.length] = new edLink('WordPress'
                                    ,'http://wordpress.org/'
                                    );

edLinks[edLinks.length] = new edLink('alexking.org'
                                    ,'http://www.alexking.org/'
                                    );

function edAddTag(button) {
	if (edButtons[button].tagEnd != '') {
		edOpenTags[edOpenTags.length] = button;
		document.getElementById(edButtons[button].id).value = '/' + document.getElementById(edButtons[button].id).value;
	}
}

function edRemoveTag(button) {
	for (var i = 0; i < edOpenTags.length; i++) {
		if (edOpenTags[i] == button) {
			edOpenTags.splice(i, 1);
			document.getElementById(edButtons[button].id).value = 		document.getElementById(edButtons[button].id).value.replace('/', '');
		}
	}
}

function edCheckOpenTags(button) {
	var tag = 0, i;
	for (i = 0; i < edOpenTags.length; i++) {
		if (edOpenTags[i] == button) {
			tag++;
		}
	}
	if (tag > 0) {
		return true; // tag found
	}
	else {
		return false; // tag not found
	}
}

function edCloseAllTags() {
	var count = edOpenTags.length, o;
	for (o = 0; o < count; o++) {
		edInsertTag(edCanvas, edOpenTags[edOpenTags.length - 1]);
	}
}

function edQuickLink(i, thisSelect) {
	if (i > -1) {
		var newWin = '', tempStr;
		if (edLinks[i].newWin == 1) {
			newWin = ' target="_blank"';
		}
		tempStr = '<a href="' + edLinks[i].URL + '"' + newWin + '>'
		            + edLinks[i].display
		            + '</a>';
		thisSelect.selectedIndex = 0;
		edInsertContent(edCanvas, tempStr);
	}
	else {
		thisSelect.selectedIndex = 0;
	}
}

function edSpell(myField) {
	var word = '', sel, startPos, endPos;
	if (document.selection) {
		myField.focus();
	    sel = document.selection.createRange();
		if (sel.text.length > 0) {
			word = sel.text;
		}
	}
	else if (myField.selectionStart || myField.selectionStart == '0') {
		startPos = myField.selectionStart;
		endPos = myField.selectionEnd;
		if (startPos != endPos) {
			word = myField.value.substring(startPos, endPos);
		}
	}
	if (word == '') {
		word = prompt(quicktagsL10n.wordLookup, '');
	}
	if (word !== null && /^\w[\w ]*$/.test(word)) {
		window.open('http://www.answers.com/' + escape(word));
	}
}

// insertion code

function edInsertTag(myField, i) {
	//IE support
	if (document.selection) {
		myField.focus();
	    var sel = document.selection.createRange();
		if (sel.text.length > 0) {
			sel.text = edButtons[i].tagStart + sel.text + edButtons[i].tagEnd;
		}
		else {
			if (!edCheckOpenTags(i) || edButtons[i].tagEnd == '') {
				sel.text = edButtons[i].tagStart;
				edAddTag(i);
			}
			else {
				sel.text = edButtons[i].tagEnd;
				edRemoveTag(i);
			}
		}
		myField.focus();
	}
	//MOZILLA/NETSCAPE support
	else if (myField.selectionStart || myField.selectionStart == '0') {
		var startPos = myField.selectionStart, endPos = myField.selectionEnd, cursorPos = endPos, scrollTop = myField.scrollTop;

		if (startPos != endPos) {
			myField.value = myField.value.substring(0, startPos)
			              + edButtons[i].tagStart
			              + myField.value.substring(startPos, endPos)
			              + edButtons[i].tagEnd
			              + myField.value.substring(endPos, myField.value.length);
			cursorPos += edButtons[i].tagStart.length + edButtons[i].tagEnd.length;
		}
		else {
			if (!edCheckOpenTags(i) || edButtons[i].tagEnd == '') {
				myField.value = myField.value.substring(0, startPos)
				              + edButtons[i].tagStart
				              + myField.value.substring(endPos, myField.value.length);
				edAddTag(i);
				cursorPos = startPos + edButtons[i].tagStart.length;
			}
			else {
				myField.value = myField.value.substring(0, startPos)
				              + edButtons[i].tagEnd
				              + myField.value.substring(endPos, myField.value.length);
				edRemoveTag(i);
				cursorPos = startPos + edButtons[i].tagEnd.length;
			}
		}
		myField.focus();
		myField.selectionStart = cursorPos;
		myField.selectionEnd = cursorPos;
		myField.scrollTop = scrollTop;
	}
	else {
		if (!edCheckOpenTags(i) || edButtons[i].tagEnd == '') {
			myField.value += edButtons[i].tagStart;
			edAddTag(i);
		}
		else {
			myField.value += edButtons[i].tagEnd;
			edRemoveTag(i);
		}
		myField.focus();
	}
}

function edInsertContent(myField, myValue) {
	var sel, startPos, endPos, scrollTop;

	//IE support
	if (document.selection) {
		myField.focus();
		sel = document.selection.createRange();
		sel.text = myValue;
		myField.focus();
	}
	//MOZILLA/NETSCAPE support
	else if (myField.selectionStart || myField.selectionStart == '0') {
		startPos = myField.selectionStart;
		endPos = myField.selectionEnd;
		scrollTop = myField.scrollTop;
		myField.value = myField.value.substring(0, startPos)
		              + myValue
                      + myField.value.substring(endPos, myField.value.length);
		myField.focus();
		myField.selectionStart = startPos + myValue.length;
		myField.selectionEnd = startPos + myValue.length;
		myField.scrollTop = scrollTop;
	} else {
		myField.value += myValue;
		myField.focus();
	}
}

function edInsertLink(myField, i, defaultValue) {
	if (!defaultValue) {
		defaultValue = 'http://';
	}
	if (!edCheckOpenTags(i)) {
		var URL = prompt(quicktagsL10n.enterURL, defaultValue);
		if (URL) {
			edButtons[i].tagStart = '<a href="' + URL + '">';
			edInsertTag(myField, i);
		}
	}
	else {
		edInsertTag(myField, i);
	}
}

function edInsertImage(myField) {
	var myValue = prompt(quicktagsL10n.enterImageURL, 'http://');
	if (myValue) {
		myValue = '<img src="'
				+ myValue
				+ '" alt="' + prompt(quicktagsL10n.enterImageDescription, '')
				+ '" />';
		edInsertContent(myField, myValue);
	}
}



