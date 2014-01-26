$(document).ready(init);
var socket = io.connect(); // TIP: .connect with no args does auto-discovery

function init(){
  console.log('init');
  var roomId = $('#roomTitle').attr('data-roomid');
  socket.on('connect', function () { // TIP: you can avoid listening on `connect` and listen on events directly too!
    socket.emit('setRoom', roomId, function () {
      console.log(data); // data will be 'woot'
    });
  });
  socket.on('publishUpdate', function(update){
    insertUpdate(update);
  });

  $('#updateSend').on('click', sendUpdate);
  $("#updateText").keyup(function(event){
  // thx http://stackoverflow.com/a/155263
    if(event.keyCode == 13){
      $("#updateSend").click();
    }
  });
};

function sendUpdate(){
  var name = $('#username').val();
  var type = $("#radioTypes input[type='radio']:checked").val();
  if(type == null){ 
    alert('You must select an update type'); 
    return false; 
  };
  //Construct update
  var update = {
    timestamp: new Date().toString(),
    author: name,
    type: type,
    text: $('#updateText').val(),
  };
  socket.emit('writeUpdate', update, function(err){
    console.log('writeUpdate callback')
    if(!err){
      insertUpdate(update);
    } else { console.log(err) };
  });
};

function insertUpdate(update){
  var li = $('<li></li>');
  li.addClass(update.type)
  .append(
    $('<span class="type"></span>')
    .text(update.type)
  )
  .append(
    $('<div></div>')
    .append([
      $('<span class="timestamp"></span>')
      .text(update.timestamp)
    , $('<span class="author"></span>')
      .text(update.author)
    , $('<span class="text"></span>')
      .text(update.text)
    ])
  );
  $('#history').append(li);
};
