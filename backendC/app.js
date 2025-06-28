const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path'); // ✅ Add this line
const { title } = require('process');
const { log } = require('console');

const app = express();
const server = http.createServer(app);
const io = socket(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

//io.emit   sabko bhej diya backend se
// chess.fen() aki function jo board ki current state nikal kr dega

//initiate chess 
const chess = new Chess();

const player = {
  white: null,
  black: null
};
let currentPlayer = "W";

app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


app.get('/', function (req, res) {
    res.render('index', { title: "Chess Game" })
})

io.on("connection", function (uniquesocket) {        //jb bhi koi aayega to uski unique information milti hai jise hum socket kehte h!
    console.log("connected");


// Clean up any disconnected sockets

 // Assign role based on actual availability
  if (!player.white && uniquesocket.id !== player.black) {
    player.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
    console.log("🎮 Assigned WHITE to:", uniquesocket.id);
  } else if (!player.black && uniquesocket.id !== player.white) {
    player.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
    console.log("🎮 Assigned BLACK to:", uniquesocket.id);
  } else {
    uniquesocket.emit("spectatorRole");
    console.log("👀 Assigned SPECTATOR to:", uniquesocket.id);
  }

  // ♻️ Handle disconnect
  uniquesocket.on("disconnect", () => {
    console.log("❌ Disconnected:", uniquesocket.id);

    let roleFreed = false;

    if (player.white === uniquesocket.id) {
      player.white = null;
      roleFreed = true;
      console.log("♻️ Freed WHITE slot");
    }
    if (player.black === uniquesocket.id) {
      player.black = null;
      roleFreed = true;
      console.log("♻️ Freed BLACK slot");
    }

    if (!player.white && !player.black) {
      chess.reset();
      console.log("♟️ Game reset: no players left");
    }

    if (roleFreed) {
      io.emit("playerSlotAvailable");
    }
  });

    //handle move
    uniquesocket.on("move",function(move){
    try{
        if(chess.turn()==="w" && uniquesocket.id!==player.white) return;                    //chess actually m batata hai ki kiska turn hai game m
        if(chess.turn()==="b" && uniquesocket.id!==player.black) return;                    //chess actually m batata hai ki kiska turn hai game m
        
        const result= chess.move(move);             //chess dekhega move(purple) ke through,agr sahi to backend mai chl jayega 
        if(result){
            currentPlayer=chess.turn()              //cp mai save kr liya kiski turn h
            io.emit("move",move);                   //sabko move hote hue dekha diya    
            io.emit("boardState", chess.fen());     //sabke pass chess ki current state
        }
        else{
            console.log("invalid move:",move);
           uniquesocket.emit("invalidMove",move)
        }
        
    }
    catch(err){
        console.log(err);
        uniquesocket.emit("invalidMove",move)
              

    }
}); // closes uniquesocket.on('move')

}); // closes io.on('connection')

server.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
