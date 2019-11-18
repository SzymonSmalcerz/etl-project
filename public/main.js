$(document).ready(function() {
    var next = 1;
    $(".add-more").click(function(e) {
      console.log("___________");
        e.preventDefault();
        document.asd = e;
        var addto = "#field" + next;
        var addRemove = "#field" + (next);
        next = next + 1;
        var newIn = '<input autocomplete="off" class="input form-control" id="field' + next + '" name="field' + next + '" type="text">';
        var newInput = $(newIn);
        var removeBtn = '<button id="remove' + (next - 1) + '" class="btn btn-danger remove-me" >-</button></div><div id="field">';
        var removeButton = $(removeBtn);
        $(addto).after(newInput);
        $(addRemove).after(removeButton);
        $("#field" + next).attr('data-source',$(addto).attr('data-source'));
        $("#count").val(next);
        $('.remove-me').click(function(e){
            console.log(e);
            e.preventDefault();
            var fieldNum = this.id.charAt(this.id.length-1);
            var fieldID = "#field" + fieldNum;
            $(this).remove();
            $(fieldID).remove();
        });
    });

    $('#submit').click(function(e) {
      $('.input-append').css("display", "none");
      var b = [];
      for(var i=0;i<$('#field')[0].childNodes.length;i++) {
        if($('#field')[0].childNodes[i].value != null && $('#field')[0].childNodes[i].value.length > 0) {
          b.push($('#field')[0].childNodes[i].value);
        }
      };
      b = new Set(b);
      b = [...b];
      console.log(b);
      alert("entered keys: " + b);
      alert("no more for now :C");
    });
});
