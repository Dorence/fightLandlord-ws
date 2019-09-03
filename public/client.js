"use strict";

var F = window.fightLandLord;
console.log(F);

var player = { id: -1, cards: [], selectCard: [], role: "" };
var game = {
    pid: -1,
    playerNum: -1,
    players: [],
    ready: false,
    history: []
};

console.log($);

(function() {
    var w = window,
        d = document,
        dx = d.compatMode === "CSS1Compat" ? d.documentElement : d.body,
        ho = location.hostname ? location.hostname : "localhost";

    function el(name) { return document.getElementById(name); }

    //function dl(e) { if (e) e.parentNode.removeChild(e); }
    //function adc(name, cls) { if (!$(name).hasClass(cls)) $(name).addClass(cls); }
    //function rmc(name, cls) { if ($(name).hasClass(cls)) $(name).removeClass(cls); }

    function getC(c) {
        var k = document.cookie;
        if (!!k) {
            var st = k.indexOf(c + "=");
            if (st >= 0) { st += c.length + 1; var cend = k.indexOf(";", st); if (cend === -1) { cend = k.length; } return decodeURI(decodeURI(k.substring(st, cend))); }
        }
        return null;
    }

    function setC(c, v, hour) {
        var d = new Date();
        d.setTime(d.getTime() + hour * 3600 * 1000);
        document.cookie = c + "=" + v + "; expires=" + d.toGMTString();
    }

    function statCard() {
        player.selectCard = [];
        for (let i = 0; i < player.cards.length; i++) {
            if ($("#CC" + i).hasClass("active")) { player.selectCard.push(player.cards[i]); }
        }
        //console.log("card change", player.selectCard);
        if (player.selectCard.length) {
            el("btnSub").innerHTML = "出牌";
            let vl = F.valid(player.selectCard);
            console.log(vl);
            el("btnSub").disabled = !vl;

        } else {
            el("btnSub").innerHTML = "Pass";
            el("btnSub").disabled = false;
        }
    }

    window.CHAT = {
        msgObj: el("divMessage"),
        deckObj: el("divMainContainer").children[0],
        screenheight: w.innerHeight ? w.innerHeight : dx.clientHeight,
        username: null,
        userid: null,
        userroom: null,
        socket: null,
        paintFlag: false,

        //push a new message to div_message
        pushMsg: function(content, className) {
            var d = document.createElement("div");
            if (!!className) { d.className = className; }
            d.innerHTML = content;
            this.msgObj.appendChild(d);

            //delete overflow msg
            while (this.msgObj.children.length > 8) {
                this.msgObj.removeChild(this.msgObj.firstChild);
            }
            this.msgObj.scrollTo(0, this.msgObj.scrollHeight);
        },

        //push a card_play message to divMsg[$i]
        pushPlay: function(content, pid) {
            let d, p = el("divMsg" + pid);
            d = document.createElement("div");
            d.className = "user";
            d.innerHTML = content;
            p.appendChild(d);
            //delete overflow msg
            while (p.children.length > 4) {
                p.removeChild(p.firstChild);
            }
            p.scrollTo(0, p.scrollHeight);
        },

        // to login
        login: function() {
            var name = el("username").value,
                room = Number(el("iptRoom").value);
            if (!!name && !!room) {
                this.userid = this.genUid();
                this.username = name;
                this.userroom = room;

                setC("llName", this.username, 1);
                setC("llID", this.userid, 1);
                setC("llRoom", this.userroom, 1);
                el("liUserName").innerHTML = this.username + " @" + this.userroom;

                //连接websocket服务器
                this.socket = window.io.connect("ws://" + ho + ":3000/");
                this.socket.emit("login", { id: this.userid, name: this.username, room: this.userroom });
                this.listen();

                //after
                el("username").value = el("iptRoom").value = "";
                el("divLogin").hidden = true;
                el("divMainContainer").hidden = false;
                el("divMyCard").parentElement.hidden = false;
            }
        },

        //退出
        logout: function() {
            setC("llName", "", -1);
            setC("llID", "", -1);
            setC("llRoom", "", -1);
            if (this.socket) {
                this.socket.emit("disconn", { id: this.userid, name: this.username, room: this.userroom });
                this.socket.disconnect();
            }
            location.reload();
        },

        //提交聊天消息内容
        playSubmit: function() {
            if (player.id >= 0 && player.cards.length > 0) {
                var obj = {
                    id: this.userid,
                    name: this.username,
                    cards: player.selectCard,
                    pid: player.id,
                    room: this.userroom
                };
                console.log("sent : ", obj);
                this.socket.emit("playcard", obj);
            }
            return;
        },

        genUid: function() {
            return (new Date().getTime() % 100000000) + "" + Math.floor(Math.random() * 899 + 100);
        },

        //更新系统消息，本例中在用户加入、退出的时候调用
        updateSysMsg: function(o, action) {
            console.log(o);
            // 更新在线人数
            var userhtml = "";
            for (var i = 0; i < o.allUser.length; i++) {
                userhtml += (i ? ", " : "") + o.allUser[i].name;
            }
            el("spanOLNum").innerHTML = o.allUser.length;
            el("divOLName").innerHTML = userhtml;

            // push系统消息
            var html = "<div class=\"msg-system\">";
            html += o.user.name + " " + action;
            html += "</div>";
            this.pushMsg(html, "system");
            this.refreshDeck(o);
        },
        // 重绘玩家区域
        refreshDeck: function(obj) {
            console.log("begin refresh deck", obj.allUser);

            let u = new Array(F.player.num),
                i;
            for (i = 0; i < obj.allUser.length; i++) {
                if (obj.allUser[i].pid >= 0) {
                    u[obj.allUser[i].pid] = {
                        name: obj.allUser[i].name,
                        remain: -1,
                        state: obj.allUser[i].state
                    };
                }
            }
            console.log(u);
            for (i = 0; i < u.length; i++) {
                if (u.hasOwnProperty(i)) {
                    if (game.players.hasOwnProperty(i)) {
                        game.players[i] = u[i];
                    } else {
                        game.players[i].name = u[i].name;
                    }
                    el("spanU" + i).innerHTML = game.players[i].name;
                    if (u[i].state === "prepare" || u[i].state === "ready") {
                        el("spanB" + i).innerHTML = u[i].state === "prepare" ? "等待中" : "准备";
                    }
                } else {
                    delete game.players[i];
                    el("spanU" + i).innerHTML = "";
                    el("spanB" + i).innerHTML = "空";
                }
            }
        },
        paintDeck: function() {
            const n = game.playerNum = F.player.num;
            //remove all redundent
            while (this.deckObj.children[1]) {
                this.deckObj.removeChild(this.deckObj.children[1]);
            }
            let i, x;
            // generate the display order
            let r = [],
                pid = Math.max(0, player.id),
                l = pid + Math.ceil(n / 2);
            for (i = 0; 2 * i < n; i++)
                r.push((l + i) % n, (l - i - 1) % n);
            if (n & 1) r.push(pid);
            // end generating the display order
            console.log(n, player.id, l, r);
            for (i = 0; i < n; i++) {
                game.players[i] = {
                    name: "Empty",
                    remain: -1
                };
                x = $("<div id=\"divP" + r[i] + "\" class=\"col-lg-6 col-md-6 col-sm-6 col-xs-6 center-block\"></div>");
                $(x).append("<div class=\"col-lg-3 col-md-4 col-sm-4 col-xs-4 u-info\"><span id=\"spanU" +
                    r[i] + "\"></span><br>" + F.lang.roleName.player[r[i]] + "<br><span id=\"spanB" + r[i] +
                    "\" class=\"badge\">空</span></div>");
                $(x).append("<div id=\"divMsg" + r[i] + "\" class=\"message col-lg-9 col-md-8 col-sm-8 col-xs-8\"> </div>");
                $(this.deckObj).append(x);
            }
            // 奇数人则最下面的一个是col-*-12
            if (n % 2) {
                this.deckObj.lastChild.className = "col-lg-12 col-md-12 col-sm-12 col-xs-12 center-block";
            }
        },
        // 初始化
        init: function() {
            $("form").submit(function(e) { e.preventDefault(); });

            const lCookie = { name: getC("llName"), id: getC("llID"), room: Number(getC("llRoom")) };
            console.log("get cookie", lCookie);
            if (lCookie.name && lCookie.id && lCookie.room) {
                [this.userid, this.username, this.userroom] = [lCookie.id, lCookie.name, lCookie.room];

                // reconnect
                this.socket = window.io.connect("ws://" + ho + ":3000/");
                this.socket.emit("reconn", lCookie);
                this.listen();

                el("divLogin").hidden = true;
                el("divMainContainer").hidden = false;
                el("divMyCard").parentElement.hidden = false;
                el("liUserName").innerHTML = this.username + " @" + this.userroom;
            } else {
                $("#btnLogin").on("click", function() { window.CHAT.login(); });
                el("username").value = "U" + Math.floor(Math.random() * 100000);
                //use enter 提交用户名
                el("username").onkeydown = function(e) {
                    e = e || event;
                    if (e.keyCode === 13) { window.CHAT.login(); }
                };

                el("divLogin").hidden = false;
                el("divMainContainer").hidden = true;
            }

            //$("#btnDraw").on("click", function() { window.CHAT.drawcard(); });
            $("#btnSub").on("click", function() { window.CHAT.playSubmit(); });
        },

        drawcard: function() {
            if (player.id >= 0) {
                var obj = {
                    id: this.userid,
                    name: this.username,
                    pid: player.id,
                    room: this.userroom
                };
                console.log("Begin draw cards");
                this.socket.emit("drawcard", obj);
            }
        },
        playerEmitReady: function() {
            if (player.id && player.id > 0) {
                this.socket.emit("playerready", { name: this.username, id: this.userid, room: this.userroom });
                el("btnDraw").innerHTML = "Ready!";
            }
        },
        refreshRole: function(obj) {
            if (isNaN(obj.id)) {
                console.log(obj.id, "NaN !");
                return;
            }
            console.log("genRole", player.id = obj.id);
            el("btnSub").disabled = el("btnDraw").disabled = true;
            el("spanRole").innerHTML = player.role = obj.text;
            if (obj.id === 0) {
                el("btnDraw").innerHTML = "<i class=\"fa fa-play\"></i>开局";
            } else if (obj.id > 0) {
                el("btnDraw").disabled = false;
                el("btnDraw").innerHTML = "准备";
                $("#btnDraw").on("click", function() { window.CHAT.playerEmitReady(); });
            }

            // if the deck has not been painted
            if (!this.paintFlag) {
                this.paintFlag = true;
                this.paintDeck();
            }
        },
        // add socket listeners
        listen: function() {
            //监听新用户登录
            this.socket.on("login", function(o) { window.CHAT.updateSysMsg(o, "进入房间"); });
            //监听用户断开连接
            this.socket.on("lost", function(o) { window.CHAT.updateSysMsg(o, "失去连接"); });
            //监听用户退出
            this.socket.on("logout", function(o) { window.CHAT.updateSysMsg(o, "退出房间"); });
            //listen you are kicked out of the room
            this.socket.on("kick", function() { window.CHAT.logout(); });
            //listen generate new player role
            this.socket.on("genRole", function(obj) { window.CHAT.refreshRole(obj); });
            //listen refresh deck
            this.socket.on("refresh", function(obj) { window.CHAT.refreshDeck(obj); });

            this.socket.on("drawcard", function(obj) {
                console.log("get drawcard", obj);
                if (obj.id !== player.id) {
                    console.log("Error ID", obj);
                    return;
                }
                player.cards = obj.cards;
                $("#divMyCard").html("");
                let o = "";
                for (let i = 0; i < player.cards.length; i++) {
                    o = $("<button class=\"btn btn-default btn-card\" id=\"CC" + i + "\">" +
                        F.toCard(player.cards[i], true) + "</button>");
                    o.on("click", function() {
                        $(this).toggleClass("active");
                        statCard();
                    });
                    $("#divMyCard").append(o);
                }
                statCard();

                // change state badge to card number
                el("spanB" + player.id).innerHTML = player.cards.length;

            });

            this.socket.on("playedcard", function(obj) {
                console.log("get played", obj);
                game.history.push(obj);
                var contentDiv = "";
                if (obj.hasOwnProperty("passText")) {
                    contentDiv = obj.passText;
                } else {
                    for (var i = 0; i < obj.played.length; i++)
                        contentDiv += "<span style='border:0 solid #aaa'>" + F.toCard(obj.played[i]) + "</span>&nbsp;";
                }
                // refresh remain card number
                el("spanB" + obj.pid).innerHTML = obj.remain;
                window.CHAT.pushPlay("<div>" + contentDiv + "</div>", obj.pid);
            });

            this.socket.on("ownerready", function(obj) {
                console.log("all ready", obj);
                if (player.id === 0) {
                    game.ready = true;
                    el("btnDraw").disabled = false;
                    $("#btnDraw").on("click", function() { if (player.id === 0) window.CHAT.drawcard(); });
                }
            });
        }
    };
    window.CHAT.init();
})();