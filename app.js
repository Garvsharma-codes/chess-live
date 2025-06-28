const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path'); // ✅ Add this line
const { title } = require('process');
const { log } = require('console');

const app = express();
const server = http.createServer(app);
const io = socket(server)

//io.emit   sabko bhej diya backend se
// chess.fen() aki function jo board ki current state nikal kr dega

//initiate chess 
const chess = new Chess();

let player = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get('/', function (req, res) {
    res.render('index', { title: "Chess Game" })
})

io.on("connection", function (uniquesocket) {        //jb bhi koi aayega to uski unique information milti hai jise hum socket kehte h!
    console.log("connected");

    // uniquesocket.on("disconnect", function () {         //jb disconnect ho
    //     console.log("disconnected");
    // })

    if(!player.white){
        player.white=uniquesocket.id;           //agr white nhi hai to uq id assign hogi
        uniquesocket.emit("playerRole","w");    //then uska role decide hoga, emit ke through
    }
    else if(!player.black){
        player.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("spectatorRole")
    }
})
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
            uniquesocket.emit("invalid Move",move)
        }
        
    }
    catch(err){
        console.log(err);
        uniquesocket.emit("invalid Move",move)
              

    }
})

server.listen(3000);