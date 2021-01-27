$( "#connect" ).click(function() {
    $( "#loader" ).toggle();
});

var time = new Date().getTime();
     $(document.body).bind("mousemove keypress", function(e) {
         time = new Date().getTime();
     });

     function refresh() {
         if(new Date().getTime() - time >= 7000) 
             window.location.reload(true);
         else 
             setTimeout(refresh, 7000);
     }

setTimeout(refresh, 7000);