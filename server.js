"use strict";
const wsIP = "127.0.0.1";

var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var F = require("./public/rule");

var styles = {
    bold: function(t) { return "\x1B[1m" + t + "\x1B[0m"; },
    red: function(t) { return "\x1B[31m" + t + "\x1B[39m"; },
    green: function(t) { return "\x1B[32m" + t + "\x1B[39m"; },
    yellow: function(t) { return "\x1B[33m" + t + "\x1B[39m"; },
    blue: function(t) { return "\x1B[34m" + t + "\x1B[39m"; },
    cyan: function(t) { return "\x1B[36m" + t + "\x1B[39m"; },
    grey: function(t) { return "\x1B[90m" + t + "\x1B[39m"; },
    "italic": ["\x1B[3m", "\x1B[23m"],
    "underline": ["\x1B[4m", "\x1B[24m"],
    "inverse": ["\x1B[7m", "\x1B[27m"],
    "strikethrough": ["\x1B[9m", "\x1B[29m"],
    "white": ["\x1B[37m", "\x1B[39m"],
    "black": ["\x1B[30m", "\x1B[39m"],
    "magenta": ["\x1B[35m", "\x1B[39m"],
    "whiteBG": ["\x1B[47m", "\x1B[49m"],
    "greyBG": ["\x1B[49;5;8m", "\x1B[49m"],
    "blackBG": ["\x1B[40m", "\x1B[49m"],
    "blueBG": ["\x1B[44m", "\x1B[49m"],
    "cyanBG": ["\x1B[46m", "\x1B[49m"],
    "greenBG": ["\x1B[42m", "\x1B[49m"],
    "magentaBG": ["\x1B[45m", "\x1B[49m"],
    "redBG": ["\x1B[41m", "\x1B[49m"],
    "yellowBG": ["\x1B[43m", "\x1B[49m"]
};

app.get("/", function(req, res) { res.sendFile(__dirname + "/index.html"); });
app.use("/public", express.static(__dirname + "/public")); //设置文件目录

/**
 * create a game player
 * @param {String} name player name
 * @param {Number} room room name
 * @param {String} socketName socket name
 * @param {String} socketID  socket id
 * @param {String} state user state
 */
function Player(name, room, socketName, socketID, state) {
    this.name = name;
    this.room = room;
    this.socket = socketName;
    this.sid = socketID;
    this.state = state;
    this.pid = -1; // playing_card id
    this.cards = new Array;
}

/**
 * create a game room
 * @param {Number} owner player's index in allUser
 */
function Room(owner) {
    this.owner = owner;
    this.state = "prepare";
    this.player = new Array;
    this.watcher = new Array;
}

let allUser = [],
    room = {};

function findUserByID(id) {
    for (let i in allUser) {
        if (allUser[i].id === id) { return isNaN(Number(i)) ? i : Number(i); }
    }
    return -1;
}

function findUserInRoom(index, roomNum) {
    if (room.hasOwnProperty(roomNum)) {
        if (room[roomNum].owner === index) { return 0; }
        let i;
        if (Array.isArray(room[roomNum].player)) {
            for (i in room[roomNum].player)
                if (room[roomNum].player[i] === index) { return Number(i) + 1; }
        }
        if (Array.isArray(room[roomNum].watcher)) {
            for (i in room[roomNum].watcher)
                if (room[roomNum].watcher[i] === index) { return -1; }
        }
    }
    return -2;
}

function isOnline(index) {
    if (!allUser.hasOwnProperty(index)) { return false; }
    const o = allUser[index].state,
        os = ["online", "wait", "prepare", "watch", "ready", "playing"];
    for (let i = 0; i < os.length; i++)
        if (o === os[i]) return true;
    return false;
}

function Role(pid) {
    this.id = pid;
    if (pid < 0) {
        this.text = util.randomElement(F.lang.roleName.watcher);
    } else {
        this.text = F.lang.roleName.player[pid];
    }
}

function sendPID(roomNum, eventName, userInfo) {
    const r = room[roomNum];

    function toUser(index, pid) {
        if (allUser.hasOwnProperty(index)) {
            return {
                pid: allUser[index].pid = pid,
                name: allUser[index].name,
                state: allUser[index].state
            };
        }
    }

    if (r) {
        let users = [],
            s = [],
            i;
        if (r.hasOwnProperty("owner")) {
            if (isOnline(r.owner)) {
                users.push(toUser(r.owner, 0));
                s.push(r.owner);
            }
        }
        if (r.hasOwnProperty("player")) {
            for (i = 0; i < r.player.length; i++)
                if (isOnline(r.player[i])) {
                    users.push(toUser(r.player[i], i + 1));
                    s.push(r.player[i]);
                }
        }
        if (r.hasOwnProperty("watcher")) {
            for (i = 0; i < r.watcher.length; i++)
                if (isOnline(r.watcher[i])) {
                    users.push(toUser(r.watcher[i], i + 1));
                    s.push(r.watcher[i]);
                }
        }
        if (userInfo)
            for (i = 0; i < s.length; i++) {
                io.sockets.to(allUser[s[i]].sid).emit("genRole", new Role(allUser[s[i]].pid));
            }
        if (userInfo) io.sockets.to(roomNum).emit(eventName, { allUser: users, user: userInfo });
        else io.sockets.to(roomNum).emit("refresh", { allUser: users });
    }
}

function deleteFromRoom(index, roomNum) {
    if (room.hasOwnProperty(roomNum)) {
        let i;
        if (room[roomNum].owner === index) { delete room[roomNum].owner; return; }
        if (Array.isArray(room[roomNum].player)) {
            for (i in room[roomNum].player)
                if (room[roomNum].player[i] === index) { delete room[roomNum].player[i]; }
        }
        if (Array.isArray(room[roomNum].watcher)) {
            for (i in room[roomNum].watcher)
                if (room[roomNum].watcher[i] === index) { room[roomNum].watcher.splice(i, 1); }
        }
    }
}

function sendDrawCard(index, card) {
    if (allUser[index]) {
        if (typeof card === "undefined") {
            io.sockets.to(allUser[index].sid).emit("drawcard", { id: allUser[index].pid, cards: allUser[index].cards });
        } else if (util.isArray(card)) {
            io.sockets.to(allUser[index].sid).emit("drawcard", { id: allUser[index].pid, cards: allUser[index].cards = card });
        }
    }
}


io.on("connection", function(socket) {
    console.log(styles.green("NewCon  ::"), "ID " + socket.id);

    // 监听新用户加入
    socket.on("login", function(obj) {
        // 将新加入用户的唯一标识当作socket的名称，后面用到
        socket.name = obj.id;
        // join the socket room
        socket.join(obj.room);

        let found = findUserByID(obj.id);
        if (found >= 0) {
            // 已经有过记录, delete
            deleteFromRoom(found, obj.room);
            delete allUser[found];
        }

        // create player
        allUser.push(new Player(obj.name, obj.room, socket.name, socket.id, ""));
        let p = allUser.length - 1;

        if (room.hasOwnProperty(obj.room)) {
            if (room[obj.room].hasOwnProperty("owner")) {
                // 已经有房主
                let i = 0;
                while (i < F.player.num - 1 && room[obj.room].player.hasOwnProperty(i)) { i++; }
                // find nearest empty in room[].player[]

                if (i === F.player.num - 1) {
                    // cannot find empty player's place, new user is one watcher of the room
                    room[obj.room].watcher.push(p);
                    allUser[p].state = "watch";
                    console.log(styles.cyan("Watcher+::"), obj.room, obj.name, obj.id);
                } else {
                    // new user is one player of the room
                    room[obj.room].player[i] = p;
                    room[obj.room].state = allUser[p].state = "prepare";
                    console.log(styles.cyan("Player+ ::"), obj.room, obj.name, obj.id);
                }
            } else {
                // new user is the owner of the room
                room[obj.room].owner = p;
                room[obj.room].state = allUser[p].state = "prepare";
                console.log(styles.cyan("Host+   ::"), obj.room, obj.name, obj.id);
            }
        } else {
            //create a new room
            room[obj.room] = new Room(p);
            allUser[p].state = "prepare";
            console.log(styles.cyan("Room+   ::"), obj.room, obj.name, obj.id);
        }
        sendPID(obj.room, "login", { name: obj.name });
    });

    // listen user reconnect
    socket.on("reconn", function(obj) {
        //将用户的唯一标识当作socket的名称，后面用到
        socket.name = obj.id;
        // join the socket room
        socket.join(obj.room);
        let found = findUserByID(obj.id);

        if (found < 0) {
            // 无记录
            console.log("Kick    ::", obj.name, obj.id, "when trying to reconnect");
            socket.emit("kick");
        } else {
            allUser[found].name = obj.name;
            allUser[found].room = obj.room;
            allUser[found].sid = socket.id;
            let roomID = findUserInRoom(found, obj.room);
            if (roomID === -2) {
                // not found in room, or room doesn't exist
                //console.log(room, found, roomID);

                // delete the user
                delete allUser[found];
                console.log("Kick    ::", obj.name, obj.id, "cannot find in @", obj.room);
                socket.emit("kick");
            } else {
                // user is in room
                if (roomID === 0) {
                    // the user is the owner
                    allUser[found].state = "prepare";
                    console.log(styles.grey("Owner#  ::"), obj.room, obj.name, obj.id);
                } else if (roomID === -1) {
                    // the user is a watcher
                    allUser[found].state = "watch";
                    console.log(styles.grey("Watcher#::"), obj.room, obj.name, obj.id);
                } else {
                    // the user is a player
                    let i;
                    for (i = 0; i < room[obj.room].player.length; i++)
                        if (room[obj.room].player[i] === found) { break; }
                    if (i === room[obj.room].player.length) {
                        // cannot find player's place
                        console.log(styles.bold("Error   ::"), obj.name, obj.id, "is not a player!");
                    } else {
                        allUser[found].state = "prepare";
                        if (room[obj.room].hasOwnProperty("owner")) {
                            // 已有房主, user仍在原位    
                            console.log(styles.grey("Player# ::"), obj.room, obj.name, obj.id);
                        } else {
                            // 无房主, user成为房主
                            deleteFromRoom(found, obj.room);
                            room[obj.room].owner = found;
                            allUser[found].pid = 0;
                            console.log(styles.grey("P->Owner::"), obj.room, obj.name, obj.id);
                        }
                    }
                }

                if (roomID >= 0) { sendDrawCard(found); }
                sendPID(obj.room, "login", { name: obj.name });
                console.log(styles.grey("ReJoin  ::"), obj.name, obj.id, "@", obj.room);
            }
        }
    });

    // 监听 lost connection
    socket.on("disconnect", function() {
        let found = findUserByID(socket.name); // socket.name === user.id
        if (found >= 0) {
            allUser[found].state = "lost";
            // 向room广播用户lost conn
            sendPID(allUser[found].room, "lost", { name: allUser[found].name });
            console.log(styles.red("Lost    ::"), allUser[found].name, allUser[found].id);
        } else {
            console.log(styles.red("Lost?   ::"), socket.id, socket.name, "@", Object.keys(socket.rooms));
        }
    });

    //监听用户退出
    socket.on("disconn", function(obj) {
        //将退出的用户从列表中删除
        let found = findUserByID(obj.id);
        if (found >= 0) {
            deleteFromRoom(found, obj.room);
            delete allUser[found];
            // 向room广播用户logout
            sendPID(obj.room, "logout", { name: obj.name });
            console.log(styles.red("Leave   ::"), obj.name, obj.id, "@", Object.keys(socket.rooms));
        } else {
            console.log(styles.red("Leave?  ::"), socket.id, socket.name, "@", Object.keys(socket.rooms));
            socket.removeAllListeners();
            socket.disconnect(true);
        }
    });

    //监听play
    socket.on("playcard", function(obj) {
        console.log(styles.yellow("Play  ::"), obj.name, obj.cards, "@", obj.room);
        if (room.hasOwnProperty(obj.room)) {
            let p = findUserByID(obj.id);
            if (p >= 0 && isOnline(p)) {
                if (allUser[p].cards.length < obj.cards.length) {
                    // not enough card
                    socket.emit("errorPlay", { id: obj.pid });
                } else if (obj.cards.length === 0) {
                    // pass
                    io.emit("playedcard", {
                        name: obj.name,
                        pid: obj.pid,
                        remain: allUser[p].cards.length,
                        passText: util.randomElement(F.lang.passText)
                    });
                    console.log(styles.bold("Send  ::"), obj.name, obj.name, "Pass");
                } else {
                    let i, j;
                    for (i = 0; i < obj.cards.length; i++) {
                        let flag = false;
                        for (j = 0; j < allUser[p].cards.length; j++) {
                            if (obj.cards[i] === allUser[p].cards[j]) {
                                allUser[p].cards.splice(j, 1);
                                flag = true;
                                break;
                            }
                        }
                        if (!flag) {
                            console.log("cannot find card[" + j + "]", obj.cards[i], allUser[p].cards);
                            socket.emit("errorPlay", { id: obj.pid, error: "Cannot find card " + obj.cards[i] });
                            return;
                        }
                    }
                    sendDrawCard(p);
                    io.sockets.to(obj.room).emit("playedcard", {
                        name: obj.name,
                        pid: obj.pid,
                        played: obj.cards,
                        remain: allUser[p].cards.length,
                    });
                    console.log(styles.bold("Send  ::"), obj.name, obj.cards);
                }
            } else {
                console.log("Not playing or offline");
                socket.emit("errorPlay", { id: -1 });
            }
        }
    });

    socket.on("drawcard", function(obj) {
        function toSend(index, pid, cid) {
            console.log("  ", allUser[index].name, cardEach[cid]);
            io.sockets.to(allUser[index].sid).emit("drawcard", { id: pid, cards: allUser[index].cards = cardEach[cid] });
        }
        const cardEach = F.newDrawCard();
        console.log("Draw    ::", cardEach);

        let r = room[obj.room];
        if (r && r.hasOwnProperty("owner") && Array.isArray(r.player)) {
            toSend(r.owner, 0, 0);
            let i;
            for (i = 0; i < cardEach.length - 1 && i < F.player.num - 1; i++) {
                toSend(r.player[i], i + 1, i + 1);
            }
            if (F.player.cardLord) {
                room[obj.room].lordCard = cardEach[F.player.num];
            }
        }
    });

    // listen the player to ready
    socket.on("playerready", function(obj) {
        let found = findUserByID(obj.id);
        if (found >= 0 && allUser.hasOwnProperty(found) &&
            allUser[found].pid > 0 && obj.room === allUser[found].room) {
            // valid he/she is a game player
            if (room[obj.room].player[allUser[found].pid - 1] !== found) {
                console.log("Error   ::", obj.name, "[" + found + "] isn't player", room[obj.room].player);
                return;
            }
            allUser[found].state = "ready";

            let r = room[obj.room];
            let isAllReady = true,
                i;
            for (i = 0; i < F.player.num - 1; i++) {
                if (!r.player.hasOwnProperty(i) || allUser[r.player[i]].state !== "ready") {
                    isAllReady = false;
                    break;
                }
            }
            if (isAllReady) {
                // the let owner start
                socket.to(allUser[r.owner].sid).emit("ownerready", { msg: "oJBk!" });
            }

            sendPID(obj.room, null, null);
            console.log("Ready   ::", obj.name, obj.id, "@", obj.room, allUser[found].state);
        }
    });

});

http.listen(3000, wsIP, function() {
    console.log(styles.cyan("Listen  ::"), "" + wsIP + ":3000 ");
});