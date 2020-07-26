"use strict";

var _express = _interopRequireDefault(require("express"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*


*/
const app = (0, _express.default)();

const server = require('http').createServer(app);

const io = require('socket.io')(server);

app.use('/static', _express.default.static('public'));
app.use('/healthcheck', require('express-healthcheck')());
app.set('view engine', 'pug');
app.get("/", (req, res) => {
  console.log("app get method called");
  res.render("index.pug");
});
var activeConnection = [];

const checkExistingConnection = function (socketId) {
  if (activeConnection.indexOf(socketId) > -1) {
    return true;
  } else {
    return false;
  }
};

io.on('connection', socket => {
  console.log("connection stablished");
  socket.on('event', data => {
    console.log(data);
  });
  socket.on('chat message', msg => {
    console.log('message: ' + msg);
  });
  const existing = checkExistingConnection(socket.id);

  if (!existing) {
    activeConnection.push(socket.id);
    socket.emit("update-user-list", {
      users: activeConnection.filter(existingSocket => existingSocket !== socket.id)
    });
    socket.broadcast.emit("update-user-list", {
      users: [socket.id]
    });
  }

  socket.on('disconnect', () => {
    activeConnection = activeConnection.filter(existingSocket => existingSocket !== socket.id);
    socket.broadcast.emit("remove-user", {
      socketId: socket.id
    });
  });
  socket.on("call-user", data => {
    socket.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: socket.id
    });
  });
  socket.on("make-answer", data => {
    socket.to(data.to).emit("answer-made", {
      socket: socket.id,
      answer: data.answer
    });
  });
});

const start = async () => {
  server.listen(9000, () => {
    console.log(`server started on port 9000`);
  });
};

start();