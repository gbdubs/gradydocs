$(document).ready(function(){
    var currentURL = window.location.href;
    currentURL = currentURL.substring(0, currentURL.lastIndexOf("/new"));
    var pattern = /^(\d|[a-z]|[A-Z]|-){1,30}$/;
    
    var gotoBtn   = $("#goto-doc > .btn");
    var gotoField = $("#goto-doc > input");
    var gotoError = $("#goto-doc > .error");
    
    $(gotoBtn).click(function(){
        var docName = $(gotoField).val();
        var acceptable = pattern.test(docName);
        if (acceptable){
            var newUrl = currentURL + "/edit/" + docName;
            window.location.href = newUrl;
        } else {
            $(gotoError).removeClass("hidden");
            $(gotoBtn).addClass("disabled");
        }
    });
    
    $(gotoField).change(function(){
        $(gotoError).addClass("hidden");
        $(gotoBtn).removeClass("disabled");
    });
    
    var newBtn   = $("#new-doc > .btn");
    var newField = $("#new-doc > input");
    var newCharError = $("#new-doc > .error.char");
    var newExistsError = $("#new-doc > .error.exists");
    
    $(newBtn).click(function(){
        var docName = $(newField).val();
        var acceptable = pattern.test(docName);
        if (acceptable){
            $.ajax({
                method: "GET",
                url: "proposed-doc-id",
                data: { docid: docName }
            }).done(function(data){
                if (data == "YES"){
                    var newUrl = currentURL + "/edit/" + docName;
                    window.location.href = newUrl;
                } else if (data == "NO"){
                    $(newExistsError).removeClass("hidden");
                    $(newBtn).addClass("disabled");
                }
            });
        } else {
            $(newCharError).removeClass("hidden");
            $(newBtn).addClass("disabled");
        }
    });
    
    $(newField).change(function(){
        $(newCharError).addClass("hidden");
        $(newExistsError).addClass("hidden");
        $(newBtn).removeClass("disabled");
    });
    
    
});