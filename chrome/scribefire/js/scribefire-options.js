function save() {
	$(".preference").each(function () {
		if ($(this).attr("pref-type") == "bool") {
			SCRIBEFIRE.prefs.setBoolPref($(this).attr("pref-name"), this.checked);
		}
		else if ($(this).attr("pref-type") == "char") {
			SCRIBEFIRE.prefs.setCharPref($(this).attr("pref-name"), $(this).val());
		}
		else if ($(this).attr("pref-type") == "int") {
			SCRIBEFIRE.prefs.setIntPref($(this).attr("pref-name"), $(this).val());
		}
	});
}

$(document).ready(function () {
	SCRIBEFIRE.localize(document);
	
	document.title = scribefire_string("options_page_title");

	$(".preference").on('change', function() {
		if ($(this).attr("pref-type") == "bool") {
			SCRIBEFIRE.prefs.setBoolPref($(this).attr("pref-name"), this.checked);
		}
		else if ($(this).attr("pref-type") == "char") {
			SCRIBEFIRE.prefs.setCharPref($(this).attr("pref-name"), $(this).val());
		}
		else if ($(this).attr("pref-type") == "int") {
			SCRIBEFIRE.prefs.setIntPref($(this).attr("pref-name"), $(this).val());
		}
		
		// save();
	});

	$(".navbar-item").on('click', function () {
		$(".navbar-item-selected").removeClass("navbar-item-selected");
		$(this).addClass("navbar-item-selected");
		
		$(".page").hide();
		$("#" + $(this).attr("pagename") + "Page").show();
	});
	
	// Load defaults
	$(".preference").each(function () {
		if ($(this).attr("pref-type") == "bool") {
			this.checked = SCRIBEFIRE.prefs.getBoolPref($(this).attr("pref-name"));
		}
		else if ($(this).attr("pref-type") == "char") {
			$(this).val(SCRIBEFIRE.prefs.getCharPref($(this).attr("pref-name")));
		}
		else if ($(this).attr("pref-type") == "int") {
			$(this).val(SCRIBEFIRE.prefs.getIntPref($(this).attr("pref-name")));
		}
	});

 	SCRIBEFIRE.setTextDirection(SCRIBEFIRE.prefs.getBoolPref("rtl") ? 'rtl' : 'ltr');
});