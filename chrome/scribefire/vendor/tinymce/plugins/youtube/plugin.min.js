/**
 *
 *
 * @author Josh Lobe
 * http://ultimatetinymcepro.com
 */

$(function() {


    tinymce.PluginManager.add('youtube', function(editor, url) {


        editor.addButton('youtube', {

            image: url + '/images/youtube.png',
            tooltip: 'YouTube Video',
            onclick: open_youtube
        });

        function open_youtube() {

            editor.windowManager.open({

                title: 'Select YouTube Video',
                width: 900,
                height: 655,
                url: url+'/youtube.html'
            })
        }

    });
});