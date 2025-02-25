function ping() {
  return "Pong";
}

function socketioSocket() {
  var socket = io();
  
  socket.on("message", function(data) {
    console.log("Received message:", data);
  });
}