// Your code here!
$(function () {
  console.log("sanity check");
  getRoles();

  function getRoles() {
    $.ajax ({
      url: 'http://galvanize-student-apis.herokuapp.com/gpersonnel/roles',
      method: 'GET'
    }).done(function (roles){
      console.log(roles);
      console.log(roles[0]);
      for (var i = 0; i < roles.length; i++) {
        var titles = (roles[i].title);
        $("#select").append('<option>' + titles + '</option>');
        //img
      }
    })
  };
});


$('form').on('submit', function(e) {
  e.preventDefault();
  var fN = ($('#first_name').val());
  var lN = ($('#last_name').val());
  var rl = ($('#select').val());
  var userInput = {
    firstName: fN ,
    lastName: lN,
    role: rl
  }
  console.log(userInput);

    $.ajax ({
      method: 'POST',

      url: 'http://galvanize-student-apis.herokuapp.com/gpersonnel/users',

      data: userInput,


      always: function(info) {
        console.log(info);
      },

      success: function (info) {
      var successMessage = info.message;
      $(".save-status").append('<p class="alert alert-dismissible alert-success">' + successMessage + '</p>');
      $(".save-status").fadeIn(500).delay(2000).fadeOut(500);
      },
      error: function(info) {
      var errorMessage = info.responseJSON.message;
      $(".save-status").append('<p class="alert alert-dismissible alert-danger">' + errorMessage + '</p>');
      $(".save-status").fadeIn(500).delay(2000).fadeOut(500);
      }
    })
});

$('#select').change(function(e) {
  var tS = ($('#select').val());
  $("#img").attr("src", "./assets/images/" + tS + ".jpg");
});
