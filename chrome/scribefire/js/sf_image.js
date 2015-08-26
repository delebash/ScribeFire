(function($) {
    var parentWin = (!window.frameElement && window.dialogArguments) || opener || parent || top;
    var tinyMCEPopup = parentWin.tinyMCE.activeEditor;
    var lastWidth = 0;
    var lastHeight = 0;

    function selectByValue(form_obj, field_name, value, add_custom, ignore_case) {
        if (!form_obj || !form_obj.elements[field_name])
            return;

        if (!value)
            value = "";

        var sel = form_obj.elements[field_name];

        var found = false;
        for (var i=0; i<sel.options.length; i++) {
            var option = sel.options[i];

            if (option.value == value || (ignore_case && option.value.toLowerCase() == value.toLowerCase())) {
                option.selected = true;
                found = true;
            } else
                option.selected = false;
        }

        if (!found && add_custom && value != '') {
            var option = new Option(value, value);
            option.selected = true;
            sel.options[sel.options.length] = option;
            sel.selectedIndex = sel.options.length - 1;
        }

        return found;
    }

    function getSelectValue(form_obj, field_name) {
        var elm = form_obj.elements[field_name];

        if (elm == null || elm.options == null || elm.selectedIndex === -1)
            return "";

        return elm.options[elm.selectedIndex].value;
    }

    var ImageDialog = {
        // preInit : function() {
        // 	var url;

        // 	tinyMCEPopup.requireLangPack();

        // 	if (url = tinyMCEPopup.getParam("external_image_list_url"))
        // 		document.write('<script language="javascript" type="text/javascript" src="' + tinyMCEPopup.editor.documentBaseURI.toAbsolute(url) + '"></script>');
        // },

        init : function() {
            var f = document.forms[0], ed = tinyMCEPopup;

            // Setup browse button
            // document.getElementById('srcbrowsercontainer').innerHTML = getBrowserHTML('srcbrowser','src','image','theme_advanced_image');
            // if (isVisible('srcbrowser'))
            // 	document.getElementById('src').style.width = '180px';

            e = ed.selection.getNode();

            this.fillFileList('sf_image_list', 'tinyMCEImageList');

            if (e.nodeName == 'IMG') {
                f.src.value = ed.dom.getAttrib(e, 'src');
                f.alt.value = ed.dom.getAttrib(e, 'alt');
                f.border.value = this.getAttrib(e, 'border');
                f.vspace.value = this.getAttrib(e, 'vspace');
                f.hspace.value = this.getAttrib(e, 'hspace');
                lastWidth = f.width.value = ed.dom.getAttrib(e, 'width');
                lastHeight = f.height.value = ed.dom.getAttrib(e, 'height');
                f.insert.value = ed.getLang('update');
                this.styleVal = ed.dom.getAttrib(e, 'style');
                selectByValue(f, 'sf_image_list', f.src.value);
                selectByValue(f, 'align', this.getAttrib(e, 'align'));
                this.updateStyle();
            }
        },

        fillFileList : function(id, l) {
            var dom = tinyMCEPopup.dom, lst = dom.get(id), v, cl;

            l = window[l];

            if (l && l.length > 0) {
                lst.options[lst.options.length] = new Option('', '');

                tinymce.each(l, function(o) {
                    lst.options[lst.options.length] = new Option(o[0], o[1]);
                });
            } else
                dom.remove(dom.getParent(id, 'tr'));
        },

        restoreSelection : function() {
            var t = tinyMCEPopup;

            if (!t.isWindow && tinymce.isIE)
                t.editor.selection.moveToBookmark(t.editor.windowManager.bookmark);
        },

        update : function() {
            var f = document.forms[0], nl = f.elements, ed = tinyMCEPopup, args = {}, el;

            this.restoreSelection();

            if (f.src.value === '') {
                if (ed.selection.getNode().nodeName == 'IMG') {
                    ed.dom.remove(ed.selection.getNode());
                    ed.execCommand('mceRepaint');
                }

                tinyMCEPopup.windowManager.close();
                return;
            }

            if (!ed.settings.inline_styles) {
                args = tinymce.extend(args, {
                    vspace : nl.vspace.value,
                    hspace : nl.hspace.value,
                    border : nl.border.value,
                    align : getSelectValue(f, 'align')
                });
            } else
                args.style = this.styleVal;

            tinymce.extend(args, {
                src : f.src.value,
                alt : f.alt.value,
                width : f.width.value,
                height : f.height.value
            });

            el = ed.selection.getNode();

            if (el && el.nodeName == 'IMG') {
                ed.dom.setAttribs(el, args);
            } else {
                ed.execCommand('mceInsertContent', false, '<img id="__mce_tmp" />', {skip_undo : 1});
                ed.dom.setAttribs('__mce_tmp', args);
                ed.dom.setAttrib('__mce_tmp', 'id', '');
                ed.undoManager.add();
            }

            tinyMCEPopup.windowManager.close();
        },

        updateStyle : function() {
            var dom = tinyMCEPopup.dom, st, v, f = document.forms[0];

            if (tinyMCEPopup.settings.inline_styles) {
                st = dom.parseStyle(this.styleVal);

                // Handle align
                v = getSelectValue(f, 'align');
                if (v) {
                    if (v == 'left' || v == 'right') {
                        st['float'] = v;
                        delete st['vertical-align'];
                    } else {
                        st['vertical-align'] = v;
                        delete st['float'];
                    }
                } else {
                    delete st['float'];
                    delete st['vertical-align'];
                }

                // Handle border
                v = f.border.value;
                if (v || v == '0') {
                    if (v == '0')
                        st['border'] = '0';
                    else
                        st['border'] = v + 'px solid black';
                } else
                    delete st['border'];

                // Handle hspace
                v = f.hspace.value;
                if (v) {
                    delete st['margin'];
                    st['margin-left'] = v + 'px';
                    st['margin-right'] = v + 'px';
                } else {
                    delete st['margin-left'];
                    delete st['margin-right'];
                }

                // Handle vspace
                v = f.vspace.value;
                if (v) {
                    delete st['margin'];
                    st['margin-top'] = v + 'px';
                    st['margin-bottom'] = v + 'px';
                } else {
                    delete st['margin-top'];
                    delete st['margin-bottom'];
                }

                // Merge
                st = dom.parseStyle(dom.serializeStyle(st), 'img');
                this.styleVal = dom.serializeStyle(st, 'img');
            }
        },

        getAttrib : function(e, at) {
            var ed = tinyMCEPopup, dom = ed.dom, v, v2;

            if (ed.settings.inline_styles) {
                switch (at) {
                    case 'align':
                        if (v = dom.getStyle(e, 'float'))
                            return v;

                        if (v = dom.getStyle(e, 'vertical-align'))
                            return v;

                        break;

                    case 'hspace':
                        v = dom.getStyle(e, 'margin-left')
                        v2 = dom.getStyle(e, 'margin-right');
                        if (v && v == v2)
                            return parseInt(v.replace(/[^0-9]/g, ''));

                        break;

                    case 'vspace':
                        v = dom.getStyle(e, 'margin-top')
                        v2 = dom.getStyle(e, 'margin-bottom');
                        if (v && v == v2)
                            return parseInt(v.replace(/[^0-9]/g, ''));

                        break;

                    case 'border':
                        v = 0;

                        tinymce.each(['top', 'right', 'bottom', 'left'], function(sv) {
                            sv = dom.getStyle(e, 'border-' + sv + '-width');

                            // False or not the same as prev
                            if (!sv || (sv != v && v !== 0)) {
                                v = 0;
                                return false;
                            }

                            if (sv)
                                v = sv;
                        });

                        if (v)
                            return parseInt(v.replace(/[^0-9]/g, ''));

                        break;
                }
            }

            if (v = dom.getAttrib(e, at))
                return v;

            return '';
        },

        resetImageData : function() {
            var f = document.forms[0];

            lastWidth = lastHeight = f.width.value = f.height.value = "";
        },

        updateImageData : function() {
            var f = document.forms[0], t = ImageDialog;

            if (f.width.value == "") {
                lastWidth = f.width.value = t.preloadImg.width;
            }

            if (f.height.value == "") {
                lastHeight = f.height.value = t.preloadImg.height;
            }
        },

        getImageData : function() {
            var f = document.forms[0];
            var url = parentWin.SCRIBEFIRE.getAPI().url
            this.preloadImg = new Image();
            this.preloadImg.onload = this.updateImageData;
            this.preloadImg.onerror = this.resetImageData;
            this.preloadImg.src = resolveHref(url,f.src.value);
        }
    };

    // ImageDialog.preInit();
    ImageDialog.init();
    // parentWin.tinymce.on('init', function() {
    // 	ImageDialog.init();
    // 	//ImageDialog.init, ImageDialog
    // });


    parentWin.SCRIBEFIRE.updateOptionalUI(document);

    // if (typeof Components !== 'undefined' && !(window.File && window.FileReader && window.FileList && window.Blob)) {
    // 	$("#upload-components").show();
    // 	$("#upload-drag").hide();
    // }

    $('#sf_image_cancel').on('click', function() {
        tinyMCEPopup.windowManager.close();

        return false;
    });

    $('#sf_image_form').on('submit', function() {
        ImageDialog.update();

        return false;
    });

    $('#sf_image_src').on('change', function() {
        ImageDialog.getImageData();
    });

    $('#sf_image_border').on('change', function() {
        ImageDialog.updateStyle();
    });

    $('#sf_image_align').on('change', function() {
        ImageDialog.updateStyle();
    });

    $('#sf_image_width').on('blur', function() {
        if (lastWidth && lastHeight) {
            lastHeight = document.getElementById('sf_image_height').value = Math.round(parseInt(this.value, 10) * (lastHeight / lastWidth));
        }

        lastWidth = this.value;
    });

    $('#sf_image_height').on('blur', function() {
        if (lastHeight && lastWidth) {
            lastWidth = document.getElementById('sf_image_width').value = Math.round(parseInt(this.value, 10) * (lastWidth / lastHeight));
        }

        lastHeight = this.value;
    });

    $('#sf_image_list').on('change', function() {
        document.getElementById('src').value = this.options[this.selectedIndex].value;
        document.getElementById('alt').value = this.options[this.selectedIndex].text;
    });

    $('#sf_image_upload').on('change', function() {
        $("#upload-drag").hide();
        $("#upload-working").show();

        var button = $("#sf_image_upload").addClass("busy");

        $("#insert").addClass("busy").text("Uploading...");

        SCRIBEFIRE_UPLOAD.upload(this.files, parentWin.SCRIBEFIRE.getAPI(), function (urls) {
                $("#insert").removeClass("busy").text("Insert");

                $("#image_upload").val("");
                $("#upload-drag").show();
                $("#upload-working").hide();
                var url = parentWin.SCRIBEFIRE.getAPI().url
                $("#sf_image_src").val(resolveHref(url,urls[0])).change();
            },
            function (msg) {
                $("#insert").removeClass("busy").text("Insert");

                $("#image_upload").val("");
                $("#upload-drag").show();
                $("#upload-working").hide();

                parentWin.SCRIBEFIRE.error(msg);
            }
        );
    });
})(jQuery)