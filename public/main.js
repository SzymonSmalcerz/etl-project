$(document).ready(function() {
  var next = 1;
  $(".add-more").click(function(e){
      e.preventDefault();
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
              e.preventDefault();
              var fieldNum = this.id.charAt(this.id.length-1);
              var fieldID = "#field" + fieldNum;
              $(this).remove();
              $(fieldID).remove();
          });
  });

    $('#extract').click(function(e) {
      setLoadingGif();
      var b = [];
      for(var i=0;i<$('#field')[0].childNodes.length;i++) {
        if($('#field')[0].childNodes[i].value != null && $('#field')[0].childNodes[i].value.length > 0) {
          b.push($('#field')[0].childNodes[i].value);
        }
      };
      b = new Set(b);
      b = [...b];
      $.post("/e",{
        movieKeys : b
      },(data, status) => {
      console.log(data);
        showMessage(data);
        fetchState();
      });
    });

    $('#transform').click(function(e) {
      setLoadingGif();
      $.post("/t",{},(data, status) => {
      console.log(data);
      showMessage(data);
      fetchState();
      });
    });

    $('#load').click(function(e) {
      setLoadingGif();
      $.post("/l",{},(data, status) => {
      console.log(data);
      showMessage(data);
      fetchState();
      });
    });

    function setLoadingGif() {
        $('#extractContainer').css("display", "none");
        $('#transformContainer').css("display", "none");
        $('#loadContainer').css("display", "none");
        $('#loading').css("display", "inline-block");
    }

    function showMessage(data) {
      if(data.message != null) {
        $('.textWrapper')[0].innerText = data.message;
        $('.message').css("background-color", "rgba(0,200,0,150)");
      } else if(data.error != null) {
        $('.textWrapper')[0].innerText = data.error;
        $('.message').css("background-color", "rgba(200,0,0,150)");
      }
      $('.message').css("display", "table");
    }

    $('.message').click(function(e) {
      $('.message').css("display", "none");
    });

    function fetchState() {
      $.ajax({
          url : "/state",
          dataType : "json"
      })
      .done(res => {
        $('#loading').css("display", "none");
        if(res.currentState == "L") {
            $('#extractContainer').css("display", "inline-block");
        } else if(res.currentState == "E") {
            $('#transformContainer').css("display", "inline-block");
            $('#transformKeys')[0].innerText = res.lastKeysEntered;
        } else if(res.currentState == "T") {
            $('#loadContainer').css("display", "inline-block");
            $('#loadKeys')[0].innerText = res.lastKeysEntered;
        }
      });
    };

    fetchState()
});
