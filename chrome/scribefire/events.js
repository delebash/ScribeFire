var windowWidth = 0;

$(window).load(function () {
    windowWidth = $(window).width();
});

var editor = {
    val : function (new_val) {
        if (typeof new_val != 'undefined') {
            if (switchEditors.mode == 'tinymce') {
                tinyMCE.get('text-content').setContent(switchEditors._wp_Autop(new_val));
            }
            else {
                $("#text-content").val(switchEditors._wp_Nop(new_val));
            }
        }
        else {
            if (switchEditors.mode == 'tinymce') {
                return tinyMCE.get('text-content').getContent().replace(/^\s+|\s+$/g, "");
            } else {
                var rv = editor.text();

                if (SCRIBEFIRE.prefs.getBoolPref("markdown")) {
                    rv = showdownConverter.makeHtml(rv);
                }

                rv = rv.replace(/^\s+|\s+$/g, "");

                return switchEditors._wp_Autop(rv);
            }
        }
    },

    text : function () {
        if (switchEditors.mode == 'tinymce') {
            return tinyMCE.get('text-content').getContent();
        }
        else {
            return $("#text-content").val();
        }
    },

    insertContent : function (html) {
        editor.val(editor.val() + "\n\n" + html);
    }
};

function getTimestamp() {
    if ($("#text-datestamp-year").val() === "" || !$("#text-datestamp-day").val() || $("#text-timestamp-hour").val() === "" || $("#text-timestamp-minute").val() === "") {
        return false;
    }

    var datestamp = $("#text-datestamp-year").val() + "-" + $("#list-datestamp-month").val() + "-" + $("#text-datestamp-day").val();
    var timestamp = pad(Math.max(0, $("#text-timestamp-hour").val())) + ":" + pad(Math.max(0, $("#text-timestamp-minute").val())) + ":00";

    return datestamp + " " + timestamp;
}

function setTimestamp(date) {
    if (date instanceof Date) {
        date = date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
    }

    if (date) {
        var parts = date.split(/[^0-9]/);

        $("#text-datestamp-year").val(parts[0]);
        $("#list-datestamp-month").val(parts[1]);
        $("#text-datestamp-day").val(parts[2]);
        $("#text-timestamp-hour").val(parts[3]);
        $("#text-timestamp-minute").val(parts[4]);
    }
    else {
        $("#text-datestamp-year").val("");
        $("#text-datestamp-month").val("");
        $("#text-datestamp-day").val("");
        $("#text-timestamp-hour").val("");
        $("#text-timestamp-minute").val("");
    }
}

$(document).ready(function () {
    $('body')[0].addEventListener('dragenter', function() {
        if (SCRIBEFIRE.getAPI().ui.upload) {
            SCRIBEFIRE.enableDragAndDropUpload();
        }
    }, false);

    $("#button-template-save").on("click", function (e) {
        e.preventDefault();

        var template = { title : $("#text-title").val(), content : editor.val() };
        var templateId = (new Date()).getTime();

        var templates = SCRIBEFIRE.prefs.getJSONPref("templates", {});
        templates[templateId] = template;
        SCRIBEFIRE.prefs.setJSONPref("templates", templates);

        SCRIBEFIRE.populateTemplatesList();
        $("#list-templates").val(templateId).change();
    });

    $(".post-meta").hide();

    if (!supports_input_placeholder()) {
        $("#filter-entries").hide();
    }

    $("#text-slug").on("change", function () {
        if ($(this).val()) {
            $("#slug-display").text($(this).val());
        }
        else {
            $("#slug-display").text("Automatic");
        }
    });

    $("#slug-toggle").on("click", function (e) {
        e.preventDefault();

        var slug = $("#text-slug");

        if (slug.is(":visible")) {
            slug.hide();
            $("#slug-display").show();
        }
        else {
            $("#slug-display").hide();
            slug.show();
        }
    });

    $(".trap").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
    });

    $("#link-help").on("click", function (e) {
        $('#scribefire-help-version').html(SCRIBEFIRE.version);
        $('#scribefire-help').dialog({width: 600, height:400, modal: true, resizable: false});
    });

    $("#toggle-schedule").on("click", function (e) {
        e.preventDefault();

        if (!$("#toggle-schedule-scheduled").is(":visible") && !$("#text-datestamp-day").val()) {
            setTimestamp(new Date());
        }

        $("#toggle-schedule-immediately").toggle();
        $("#toggle-schedule-scheduled").toggle();
    });

    $("#list-blog-types").on("change", function (e) {
        var option = $(this).find("option:selected");

        $("#label-add-blog-type").text(option.text());

        if (option.attr("requires_id") == "true") {
            $("#text-add-blog-id-container").show();
        } else {
            $("#text-add-blog-id-container").hide();
        }
    });

    $("#button-category-add").on("click", function (e) {
        e.preventDefault();

        var button = $(this);
        button.addClass("busy");

        var categoryName = prompt(scribefire_string("prompt_newCategory"));

        if (categoryName) {
            function callback() {
                button.removeClass("busy");
            }

            SCRIBEFIRE.addCategory(categoryName, callback, callback);
        }
        else {
            button.removeClass("busy");
        }
    });

    $(".reset-button").on("click", function (e) {
        e.preventDefault();

        SCRIBEFIRE.clearData();
    });

    /*
    $(".button-addblog-cancel").on("click", function (e) {
        e.preventDefault();

        $(document).trigger("close.dialog");
//		$("#dialog-blog-add").hide();

        // @todo Cancel any requests.
        $("#button-blog-urlcheck").removeClass("busy");
    });
    */

    $("#button-blog-remove").on("click", function (e) {
        e.preventDefault();

        if (confirm(scribefire_string("confirm_generic"))) {
            SCRIBEFIRE.removeBlog($("#list-blogs").val());
        }
    });

    $("#button-entry-remove").on("click", function (e){
        e.preventDefault();

        var button = $(this);
        button.addClass("busy");

        if (confirm(scribefire_string("confirm_deletePost"))) {
            function callback() {
                button.removeClass("busy");
            }

            SCRIBEFIRE.deletePost(
                $("#list-entries").val(),
                function success() {
                    SCRIBEFIRE.notify(scribefire_string("notification_post_delete"));

                    SCRIBEFIRE.clearData();

                    button.removeClass("busy");
                },
                function failure() {
                    button.removeClass("busy");
                }
            );
        }
    });

    $(".subbar").on("click", function () {
        if ($(this).attr("disabled") != "true") {
            if ($(this).attr("is_open")) {
                $(this).removeAttr("is_open");
                $(this).parent().find(".subunderbar:first").hide();
            }
            else {
                $(this).attr("is_open", "true");
                $(this).parent().find(".subunderbar:first").show();
            }
        }
    });

    $("#text-title").on("change", function () {
        $("#label-current-title").text($(this).val());
    });

    $("#text-tags").on("change", function () {
        $("#label-current-tags").text($(this).val());
    });

    $("#text-excerpt").on("change", function () {
        var excerpt = $(this).val();
        if (excerpt) {
            if (excerpt.length > 100) {
                excerpt = excerpt.substring(0, 100) + "...";
            }

            $("#label-current-excerpt").text(excerpt);
        }
        else {
            $("#label-current-excerpt").text("");
        }
    });

    $('#list-blogs').on('change', function () {
        var obj = $(this);

        SCRIBEFIRE.currentAPI = null;

        SCRIBEFIRE.updateOptionalUI();

        SCRIBEFIRE.populateEntriesList($("#filter-entries").val());

        if (obj.length > 0) {
            $(".blog-unmeta").hide();
            $(".blog-meta").show();

            if (obj.val()) {
                SCRIBEFIRE.populateCategoriesList();
            }
        } else {
            $(".blog-meta").hide();
            $(".blog-unmeta").show();
        }


        SCRIBEFIRE.prefs.setCharPref("selectedBlog", obj.val());
    });

    $("#button-update-auth").on("click", function (e) {
        e.preventDefault();

        alert("@Todo");
    });

    $("#button-migrate").on("click", function (e) {
        e.preventDefault();

        $("#panel-migrate").dialog({width: 600, height:400, modal: true, resizable: false});
    });

    $("#button-settings").on("click", function (e) {
        e.preventDefault();

        window.open("options.html");
    });

    $("#list-entries").on("change", function (e) {
        if (SCRIBEFIRE.dirty && $(this).data("lastPostId") && $(this).data("lastPostId") != $(this).val() && $(this).val().toString().indexOf("scribefire:new") != 0) {
            if (!confirm(scribefire_string("confirm_not_saved"))) {
                $(this).val($(this).data("lastPostId"));

                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }

        $(this).data("lastPostId", $(this).val());

        var postId = $(this).val();

        $("#buttons-publish-published").hide();
        $("#buttons-publish-draft").show();

        if (!postId || postId.toString().indexOf("scribefire:new") == 0) {
            $(".post-meta").hide();
        }
        else {
            $(".post-meta").show();

            var entry = $(this).find("option:selected");

            if (entry.data("published")) {
                $("#buttons-publish-published").show();
                $("#buttons-publish-draft").hide();
            }

            if (!$(this).attr("ignoreContent")) {
                $("#text-title").val(entry.data("title")).change();

                editor.val(entry.data("content"));

                $("#text-tags").val(entry.data("tags"));

                if (entry.data("timestamp") instanceof Date) {
                    setTimestamp(entry.data("timestamp"));
                    $("#toggle-schedule-immediately").hide();
                    $("#toggle-schedule-scheduled").show();
                }
                else {
                    setTimestamp();
                    $("#toggle-schedule-immediately").show();
                    $("#toggle-schedule-scheduled").hide();
                }

                $("#text-slug").val(entry.data("slug"));
                $("#checkbox-private").each(function () { this.checked = entry.data("private"); });

                try { $("#text-excerpt").val(entry.data("excerpt")).change(); } catch (e) {
                    //console.log(e);
                }

                SCRIBEFIRE.clearCustomFields();

                if (custom_fields = entry.data("custom_fields")) {
                    for (var i = 0; i < custom_fields.length; i++) {
                        SCRIBEFIRE.addCustomField(custom_fields[i].id, custom_fields[i].key, custom_fields[i].value);
                    }
                }

                /*
                if (featured_image = entry.data("featured_image")) {
                    $("#text-featured-image-id").val(featured_image.id);
                }
                */

                SCRIBEFIRE.getAPI().getPostCategories(
                    { "id" : postId },
                    function success (categories, key) {
                        if (key == "value") {
                            $("#list-categories").val(categories).change();
                            $('#list-categories').trigger("chosen:updated");
                        }
                        else {
                            var vals = [];

                            for (var i = 0; i < categories.length; i++) {
                                var val = $("#list-categories option[categoryId='"+categories[i]+"']").attr("value");

                                if (val) {
                                    vals.push(val);
                                }
                            }
                            $("#list-categories").val(vals).change();
                            $('#list-categories').trigger("chosen:updated");

                        }
                    },
                    function failure(rv) {
                        rv.func = "getPostCategories";
                        SCRIBEFIRE.genericError(rv);
                    }
                );
            }
        }

        //$("#label-current-entry").text(($(this).find("option:selected").data("title") || ""));

        switch ($(this).find("option:selected").data("type")) {
            case "pages":
            // @todo localize
                $(".entry-type-text").text("Page");
            break;
            case "posts":
            default:
            // @todo localize
                $(".entry-type-text").text("Post");
            break;
        }

        SCRIBEFIRE.updateOptionalUI();

        SCRIBEFIRE.dirty = false;
    });

    $("#list-templates").on("change", function (e) {
        if ($(this).val()) {
            $(".template-anti-meta").hide();
            $(".template-meta").show();
        }
        else {
            $(".template-meta").hide();
            $(".template-anti-meta").show();
        }
    }).change();

    $("#button-template-load").on("click", function (e) {
        if (!SCRIBEFIRE.dirty || confirm(scribefire_string("confirm_not_saved"))) {
            var selectionTemplate = $("#list-templates").find("option:selected");

            $("#text-title").val(selectionTemplate.data("title"));
            editor.val(selectionTemplate.data("content"));
        }
    });

    $("#button-template-delete").on("click", function (e) {
        if (confirm(scribefire_string("confirm_generic"))) {
            var templateId = $("#list-templates").val();

            var templates = SCRIBEFIRE.prefs.getJSONPref("templates", {});
            delete templates[templateId];
            SCRIBEFIRE.prefs.setJSONPref("templates", templates);

            SCRIBEFIRE.populateTemplatesList();
            SCRIBEFIRE.notify("Template deleted.");
        }
    });

    $('#edButtonHTML').on('click', function() {
        switchEditors.go('text-content', 'html');
    });

    $('#edButtonPreview').on('click', function() {
        switchEditors.go('text-content', 'tinymce');
    });

    $("#button-blog-add").on("click", function() {
        SCRIBEFIRE_ACCOUNT_WIZARD.add();
    });

    $('#button-blog-urlcheck').on('click', function() {
        SCRIBEFIRE_ACCOUNT_WIZARD.urlCheck();
    });

    $("#button-blog-logincheck").on("click", function() {
        SCRIBEFIRE_ACCOUNT_WIZARD.loginCheck();
    });

    $("#text-blog-url").on("change", function () {
        $("#label-add-blog-url").text($(this).val());
    });

    $("#text-blog-api-url").on("change", function () {
        $("#label-add-blog-apiurl").text($(this).val());
    });

    $("#text-addblog-id").on("change", function () {
        $("#label-add-blog-blogid").text($(this).val());
    });

    $('#button-export-data').on('click', function() {
        SCRIBEFIRE.exportData();
    });

    $('#import-file').on('change', function() {
        SCRIBEFIRE.importData(this.files);
    });

    $("#button-publish-draft").on("click", function (e) {
        e.preventDefault();

        $("#status-draft").val("0");

        var button = $(this);
        button.addClass("busy");

        SCRIBEFIRE.publish(
            function success(rv) {
                button.removeClass("busy");

                $(".ui-multipost").hide();
                $(".ui-multipost-inverse").show();

                if (SCRIBEFIRE.prefs.getBoolPref("multipost")) {
                    if ($('#list-blogs option').length > 0) {
                        $(".ui-multipost").show();
                        $(".ui-multipost-inverse").hide();
                        $("#multipost-blog-list").html("").hide();

                        var selectedBlog = $("#list-blogs").val();

                        $("#multipost-blog-list").append(
                            $("<tr/>")
                                .append(
                                    $('<td colspan="4" />')
                                        .append(
                                            $('<input type="checkbox" id="multipost-select-all" />')
                                                .click(function (e) {
                                                    var checked = $(this).get(0).checked;

                                                    $("#multipost-blog-list input[type=checkbox]").each(function () {
                                                        $(this).get(0).checked = checked;
                                                    });
                                                })
                                        )
                                )
                        );

                        var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
                        var blogsToSelect = SCRIBEFIRE.prefs.getJSONPref("multipostBlogs", []);

                        for (var i in blogs) {
                            if (i != selectedBlog) {
                                $("#multipost-blog-list").append(
                                    $("<tr/>")
                                        .attr("blog_id", i)
                                        .append(
                                            $('<td/>')
                                                .append(
                                                    $('<input type="checkbox" name="multipost-blog" ' + (~$.inArray(i, blogsToSelect) ? ' checked="checked"' : '') + ' />').val(i)
                                                )
                                        )
                                        .append(
                                            $('<td/>')
                                                .text(blogs[i].name)
                                        )
                                        .append(
                                            $('<td/>')
                                                .append(
                                                    $('<a target="_blank" />')
                                                    .attr("href", blogs[i].url)
                                                    .text(blogs[i].url)
                                                )
                                        )
                                        .append(
                                            $('<td/>')
                                        )
                                );
                            }
                        }

                        $("#multipost-blog-list").show();
                    }
                }

                $("#panel-publish-notification")
                    .find(".pre-multipost-hidden").hide().end()
                    .find(".multipost-hidden").show();

                $("#panel-publish-notification").dialog({width: 600, height:400, modal: true, resizable: false});
            },
            function error(rv) {
                button.removeClass("busy");
            }
        );
    });

    $("#button-publish").on("click", function (e) {
        e.preventDefault();

        var button = $(this);
        button.addClass("busy");

        SCRIBEFIRE.publish(
            function success(rv) {
                button.removeClass("busy");
                $("#panel-publish-update-notification").dialog({width: 600, height:400, modal: true, resizable: false});
            },
            function error(rv) {
                button.removeClass("busy");
            }
        );
    });

    $("#button-save-progress").on("click", function (e) {
        e.preventDefault();

        $("#status-draft").val("1");

        var button = $(this);
        button.addClass("busy");

        SCRIBEFIRE.publish(
            function success(rv) {
                button.removeClass("busy");
                SCRIBEFIRE.notify('Your progress has been saved.');
            },
            function error(rv) {
                button.removeClass("busy");
            }
        );
    });

    $("#button-multipost").on("click", function (e) {
        var selectedBlogs = $("#multipost-blog-list input:checked");

        if (selectedBlogs.length == 0) {
            alert(scribefire_string("warning_selectBlog"));
        }
        else {
            $(".multipost-hidden").hide();

            var blogs = [];
            var blogIds = [];

            selectedBlogs.each(function () {
                blogIds.push($(this).val());
                blogs.push(SCRIBEFIRE.getBlog($(this).val()));
            });

            SCRIBEFIRE.prefs.setJSONPref("multipostBlogs", blogIds);

            $("#multipost-select-all").remove();

            $("#multipost-blog-list input[type=checkbox]:not(:checked)").each(function () {
                $(this).closest("tr").remove();
            });

            var currentBlogId = null;

            var success = function (rv) {
                $("#multipost-blog-list tr[blog_id='" + currentBlogId + "'] td:last-child").text(scribefire_string("status_published"));
                postToNextBlog();
            };

            var failure = function (rv) {
                $("#multipost-blog-list tr[blog_id='" + currentBlogId + "'] td:last-child")
                    .text(scribefire_string("status_failure"))
                    .parent()
                    .after(
                        $("<tr/>").append($("<td colspan='4'/>").text(rv.msg))
                    );
                postToNextBlog();
            };

            function postToNextBlog() {
                var blog = blogs.shift();

                if (blog) {
                    currentBlogId = blogIds.shift();

                    $("#multipost-blog-list tr[blog_id='" + currentBlogId + "'] td:last-child").text(scribefire_string("status_publishing"));
                    SCRIBEFIRE.multipublish(blog, success, failure);
                }
                else {
                    // Finished.
                    $(".pre-multipost-hidden").show();
                }
            }

            postToNextBlog();
        }
    });

    $("#button-blog-edit").on("click", function (e) {
        e.preventDefault();

        var blog = SCRIBEFIRE.getBlog();

        $("#panel-blog-edit .blog-edit-field").each(function () {
            $(this).val(blog[$(this).attr("name")]);
        });

        $("#panel-blog-edit").dialog({width: 600, height:400, modal: true, resizable: false});
    });

    $(".button-blog-view").on("click", SCRIBEFIRE.viewBlog);

    $("#button-blog-edit-finish").on("click", function (e) {
        e.preventDefault();

        var blog = SCRIBEFIRE.getBlog();

        $("#panel-blog-edit .blog-edit-field").each(function () {
            blog[$(this).attr("name")] = $(this).val();
        });

        SCRIBEFIRE.setBlog(blog);

        $("#panel-blog-edit").dialog('close');

        SCRIBEFIRE.populateBlogsList();

        var key = blog.url;
        if (blog.username) key = blog.username + "@" + key;

        $("#list-blogs").val(key).change();
    });

    $("#button-add-custom-field").on("click", function (e) {
        e.preventDefault();

        SCRIBEFIRE.addCustomField(null, null, null, true);
    });

    $(".button-remove-custom-field").on("click", function (e) {
        e.preventDefault();

        if ($(".custom_field").length == 1) {
            SCRIBEFIRE.clearCustomFields();
        }
        else {
            $(this).parent(".custom_field").remove();
        }
    });

    $("#text-title").val(SCRIBEFIRE.prefs.getCharPref("state.title"));
    SCRIBEFIRE.prefs.setCharPref("state.title", "");

    $("#text-tags").val(SCRIBEFIRE.prefs.getCharPref("state.tags"));
    SCRIBEFIRE.prefs.setCharPref("state.tags", "");
    $("#text-tags").autocomplete(tagsAutocompleteData);

    $("#text-excerpt").val(SCRIBEFIRE.prefs.getCharPref("state.excerpt")).change();
    SCRIBEFIRE.prefs.setCharPref("state.excerpt", "");

    setTimestamp(SCRIBEFIRE.prefs.getCharPref("state.timestamp"));

    if (getTimestamp()) {
        $("#toggle-schedule-immediately").hide();
        $("#toggle-schedule-scheduled").show();
    }
    else {
        $("#toggle-schedule-immediately").show();
        $("#toggle-schedule-scheduled").hide();
    }

    SCRIBEFIRE.prefs.setCharPref("state.timestamp");

    $("#status-draft").val(SCRIBEFIRE.prefs.getBoolPref("state.draft") ? "1" : "0").change();
    SCRIBEFIRE.prefs.setBoolPref("state.draft", false);

    $("#text-slug").val(SCRIBEFIRE.prefs.getCharPref("state.slug")).change();
    SCRIBEFIRE.prefs.setCharPref("state.slug", "");

    var custom_fields = SCRIBEFIRE.prefs.getJSONPref("state.customFields", []);
    SCRIBEFIRE.prefs.setJSONPref("state.customFields", []);

    for (var i = 0; i < custom_fields.length; i++) {
        SCRIBEFIRE.addCustomField(custom_fields[i].id, custom_fields[i].key, custom_fields[i].value);
    }

    $(".custom_field input[name='key']").on("focus", function () {
        $(this).autocomplete(customFieldAutocompleteData);
    });

    var is_private = SCRIBEFIRE.prefs.getBoolPref("state.private");
    // $("#checkbox-private").get(0).checked = is_private;

    var entry_filter_timeout = null;
    var last_filter = "";

    $("#filter-entries").on("keyup click", function (e) {
        var filter = $(this).val();

        if (filter != last_filter) {
            clearTimeout(entry_filter_timeout);

            entry_filter_timeout = setTimeout(
                function (f) {
                    last_filter = f;

                    SCRIBEFIRE.prefs.setCharPref("state.entryId", $("#list-entries").val());

                    SCRIBEFIRE.populateEntriesList(f, true);
                }, 500, filter);
        }

        $(this).persist("value");
    });

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Set up drag and drop upload.
        var dropArea = document.getElementById("hidden-file-upload");

        if (null !== dropArea) {
            var handleDrop = function (evt) {
                evt.preventDefault();
                evt.stopPropagation();

                SCRIBEFIRE.disableDragAndDropUpload();

                if ("dataTransfer" in evt && "files" in evt.dataTransfer) {
                    // Firefox
                    var files = evt.dataTransfer.files;
                } else if ("files" in evt.target) {
                    // Chrome
                    var files = evt.target.files;
                }

                var numFiles = files.length;

                if (numFiles > 0) {
                    if (numFiles === 1) {
                        var imageUploadText = scribefire_string("text_uploading_image");
                    }
                    else {
                        var imageUploadText = scribefire_string("text_uploading_images", numFiles);
                    }

                    var loadingNotice = $("<p/>");
                    loadingNotice.text(imageUploadText);
                    var buttonContainer = $("<span/>");
                    buttonContainer.addClass("buttons");
                    loadingNotice.append(buttonContainer);
                    $('scribefire-loading-notice').html(loadingNotice).dialog({width: 600, height:400, modal: true, resizable: false});

                    SCRIBEFIRE_UPLOAD.upload(files, SCRIBEFIRE.getAPI(), function (urls) {
                        $('scribefire-loading-notice').dialog('close');

                        if (urls.length > 0) {
                            var container = $("<div/>");

                            for (var i = 0, _len = urls.length; i < _len; i++) {
                                var img = $("<img/>");
                                img.attr("src", urls[i]);
                                container.append(img);
                                container.append("\n\n");
                            }

                            var html = container.html();

                            editor.insertContent(html);
                        }
                    }, function (error) {
                        $('scribefire-loading-notice').dialog('close');
                        alert(error);
                    });
                }
            };

            dropArea.addEventListener("change", handleDrop, false); // Chrome
            document.getElementById("drag-and-drop-upload-form").addEventListener("drop", handleDrop, false); // Firefox
        }
    } else {
        $(".ui-import-export").hide();
    }

    $('#drag-and-drop-upload-form').on('submit', function() { return false; });
    $('#hidden-file-upload').on('click', function() { return false; })

    SCRIBEFIRE.load();

    $("#text-title").on("change", function() { SCRIBEFIRE.dirty = true; });
    $("#text-content").on("change", function() { SCRIBEFIRE.dirty = true; });
    $("#text-tags").on("change", function() { SCRIBEFIRE.dirty = true; });
    $("#list-categories").on("change", function() { SCRIBEFIRE.dirty = true; });

    $(window).load(function () {
        var editorContent = SCRIBEFIRE.prefs.getCharPref("state.content");

        if (!editorContent) editorContent = "";

        SCRIBEFIRE.prefs.setCharPref("state.content", "");

        var blogThisData = false;

        if (blogThisData = SCRIBEFIRE.prefs.getCharPref("blogThis")) {
            blogThisData = JSON.parse(blogThisData);

            editorContent += SCRIBEFIRE.formatBlogThisData(blogThisData.url, blogThisData.title, blogThisData.selection);

            SCRIBEFIRE.prefs.setCharPref("blogThis", "");
        }

        editorContent = editorContent.replace(/^\s+|\s+$/g, "");

        $("#text-content").val(editorContent);

        tinyMCE.init({
            menubar: false,
            theme: 'modern',
            skin: 'light',
            selector: 'textarea#text-content',
            content_css: 'skin/editor_content.css',
            plugins: 'textcolor link sf_image media table fullscreen wordcount wordpress autolink youtube',
            toolbar1: 'forecolor backcolor | bold italic underline strikethrough | subscript superscript | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | blockquote',
            toolbar2: 'cut copy paste removeformat | link youtube sf_image media table | fontselect fontsizeselect  | wp_more fullscreen ',
            entity_encoding : 'raw',
            resize: 'both',
            directionality: SCRIBEFIRE.prefs.getBoolPref("rtl") ? 'rtl' : 'ltr',
            image_advtab: true,
            paste_data_images: true,
            paste_block_drop: true,
            entity_encoding: 'raw',
            forced_root_block: SCRIBEFIRE.prefs.getBoolPref('autoAddP') ? 'p' : false,
            browser_spellcheck: true,
            force_br_newlines : SCRIBEFIRE.prefs.getBoolPref('enterBr') ? true : false,
            force_p_newlines : SCRIBEFIRE.prefs.getBoolPref('enterBr') ? false : true,
            setup: function(editor) {
                editor.on('init', function() {
                    if (SCRIBEFIRE.prefs.getCharPref('state.editor') == 'html') {
                        switchEditors.go('text-content', 'html');
                    }
                });

                editor.on('change', function() {
                    SCRIBEFIRE.dirty = true;
                });
            }
        });

        // 	extended_valid_elements : "iframe[title|width|height|src|frameborder|allowfullscreen]",

        // 	setup : function (ed) {
        // 		ed.wordCountTimer = null;

        // 		tinymce.DOM.setHTML(tinymce.DOM.get(ed.id + "_path_row"), "");

        // 		ed.onKeyUp.add(function (ed, e) {
        // 			clearTimeout(ed.wordCountTimer);

        // 			ed.wordCountTimer = setTimeout(function () {
        // 				var bareText = (tinyMCE.activeEditor.getContent()).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");

        // 				var wordCount = bareText.split(" ").length;
        // 				var charCount = bareText.length;

        // 				var str = scribefire_string("text_count", [ wordCount, charCount ]);

        // 				tinymce.DOM.setHTML(tinymce.DOM.get(ed.id + "_word_count"),  str);
        // 			}, 250);
        // 		});
        // 	}
        // });

        $("html").pasteImageReader();

        setTimeout(function () {
            $("#text-content_ifr").contents().find("html").pasteImageReader();
        }, 3000);

        // We use .parent() here because putting an id on the element breaks the flex box model someho
        // $("#text-content").parent().resize();

        function saveEditorState() {
            // Grab all of the input values for state persistence.
            SCRIBEFIRE.prefs.setCharPref("state.entryId", $("#list-entries").val());
            SCRIBEFIRE.prefs.setCharPref("state.title", $("#text-title").val());
            SCRIBEFIRE.prefs.setCharPref("state.content", editor.val());
            SCRIBEFIRE.prefs.setCharPref("state.tags", $("#text-tags").val());
            SCRIBEFIRE.prefs.setCharPref("state.timestamp",getTimestamp());
            SCRIBEFIRE.prefs.setBoolPref("state.draft", $("#status-draft").val() == "1");
            SCRIBEFIRE.prefs.setJSONPref("state.categories", $("#list-categories").val());
            SCRIBEFIRE.prefs.setCharPref("state.slug", $("#text-slug").val());
            SCRIBEFIRE.prefs.setJSONPref("state.customFields", SCRIBEFIRE.getCustomFields(true));
            SCRIBEFIRE.prefs.setCharPref("state.excerpt", $("#text-excerpt").val());
            SCRIBEFIRE.prefs.setBoolPref("state.private", $("#checkbox-private").get(0).checked);
            SCRIBEFIRE.prefs.setCharPref("state.editor", switchEditors.mode);
        }

        $(window).bind("beforeunload", saveEditorState);

        if (platform === "presto") {
            // Opera doesn't support beforeunload, so we save the state every 5 seconds.
            setInterval(saveEditorState, 5000);
        }

        adjustForSize();
    });

    $(window).resize(function () {
        clearTimeout(resize_timeout);

        resize_timeout = setTimeout(adjustForSize, 100);
    });
});

var customFieldAutocompleteData = {
    minLength : 0,

    source : function (request, response) {
        var toMatch = request.term;

        response($.ui.autocomplete.filter(SCRIBEFIRE.autocomplete.custom_field_keys, toMatch));
    }
};

var tagsAutocompleteData = {
    minLength : 0,
    source : function (request, response) {
        var toMatch = "";

        if (request.term) {
            toMatch = request.term.split(/,\s*/).pop();
        }

        response($.ui.autocomplete.filter(SCRIBEFIRE.autocomplete.tags, toMatch));
    },
    focus : function () {
        return false;
    },
    select: function(event, ui) {
        var terms = this.value.split(/,\s*/);
        // remove the current input
        terms.pop();
        // add the selected item
        terms.push( ui.item.value );
        // add placeholder to get the comma-and-space at the end
        terms.push("");
        this.value = terms.join(", ");
        return false;
    }
};

var resize_timeout = null;
// var editor_resize_timeout = null;

function adjustForSize() {
    if (switchEditors.mode == 'tinymce') {
        if ("activeEditor" in tinyMCE && tinyMCE.activeEditor) {
            var windowHeight = $(window).height();
            var windowWidth = $(window).width();
            var bodyWidth = $("#drag-and-drop-upload-form").width();

            var editorHeight = $("#text-content_ifr").height();
            var editorWidth = $("#text-content_ifr").width();

            var contentWidth = $("#content").width();
            var newEditorWidth = contentWidth - 50;

            var contentHeight = $("#content").height();

            if (contentHeight > windowHeight) {
                newEditorHeight = Math.max(200, editorHeight - (contentHeight - windowHeight));
            }
            else {
                var usedHeight = 0;
                $("#content > *").each(function () {
                    usedHeight += $(this).height() + 2;
                });

                newEditorHeight = editorHeight + (contentHeight - usedHeight);
            }

            if (bodyWidth > windowWidth) {
                newEditorWidth = Math.max(400, (newEditorWidth - (bodyWidth - windowWidth)));
            }

            tinyMCE.activeEditor.theme.resizeTo(newEditorWidth, newEditorHeight);
        }
    }

    /*
    // Resize the editor proportionally to how wide the window was made.
    editorWidth = $("#text-content_ifr").width();
    editorHeight = $("#text-content_ifr").height();

    var newWindowWidth = $(window).width();
    var newWindowHeight = $("#content").height();

    var usedHeight = 0;
    $("#content > *").each(function () {
        usedHeight += $(this).height() + 2;
    });

    var difference = newWindowWidth - windowWidth;
    windowWidth = newWindowWidth;

    if (difference != 0) {
        if (switchEditors.mode == 'tinymce') {
            if ("activeEditor" in tinyMCE && tinyMCE.activeEditor) {
                var newEditorWidth = editorWidth + difference;
                if (newEditorWidth > windowWidth) {
                    newEditorWidth = windowWidth - 20;
                }

                tinyMCE.activeEditor.theme.resizeTo(newEditorWidth, editorHeight + (newWindowHeight - usedHeight));
            }
        }
    }

    // Ensure that the body doesn't exceed the window.  Mainly a hack for Firefox and scroll bars.
    $("body").width( $(window).width() - 3 );//.height( Math.max( $("body").height(), $(window).height() ));

    return;
    */
}
$(document).bind('close.dialog', function() {
    $('.ui-dialog').filter(function () {
        return $(this).css("display") === "block";
        }).find('.ui-dialog-content').dialog('close');
    SCRIBEFIRE_ACCOUNT_WIZARD.clearAddBlogFields();
})

if (typeof safari != 'undefined') {
    // BlogThis listener
    function handleSafariMessages(msgEvent) {
        if (msgEvent.name == "blog-this") {
            var responseParts = msgEvent.message.split("\t");

            var title = responseParts.shift();
            var url = responseParts.shift();
            var selection = responseParts.join("\t");
            var target = SCRIBEFIRE.prefs.getCharPref("defaultLinkTarget");

            SCRIBEFIRE.blogThis(url, title, selection);
        }
    }

    safari.self.addEventListener("message", handleSafariMessages, false);
}