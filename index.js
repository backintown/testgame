const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use('/client', express.static(__dirname + '/client'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});

server.listen(3000, () => {
  console.log('listening');
});

let SOCKET_LIST = {};
let PLAYER_LIST = {};

let Player = function (id) {
  this.x = 250;
  this.y = 250;
  this.number = "P" + Math.floor(Math.random() * 10);
  this.right = this.left = this.up = this.down = false;
  this.maxSpd = 10;
  this.updatePosition = () => {
    if (this.right) this.x += this.maxSpd;
    if (this.left) this.x -= this.maxSpd;
    if (this.up) this.y -= this.maxSpd;   // canvas increases downward
    if (this.down) this.y += this.maxSpd;
  }
}

io.sockets.on('connection', function (socket) {

  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  let player = new Player(socket.id);
  PLAYER_LIST[socket.id] = player;

  socket.on('disconnect', function () {
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  });

  socket.on('keyPress', function (data) {
    if (data.input === 'right') player.right = data.state;
    if (data.input === 'left') player.left = data.state;
    if (data.input === 'up') player.up = data.state;
    if (data.input === 'down') player.down = data.state;
  })
});

setInterval(function () {
  let pack = [];
  for (var i in SOCKET_LIST) {
    let player = PLAYER_LIST[i];
    player.updatePosition();
    pack.push({
      x: player.x,
      y: player.y,
      number: player.number
    });
  }
  for (let i in SOCKET_LIST) {
    let socket = SOCKET_LIST[i];
    socket.emit('newPositions', pack);
  }
}, 1000 / 60);