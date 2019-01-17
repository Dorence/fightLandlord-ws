# FightLandlord - ws
this is a fight-landlord game using WebSocket and NodeJS

1 安装依赖
```
    cnpm install --save express socket.io
```

2 进入根目录执行
```
    cnpm install
    npm run start
```

3 浏览器访问 `http://ip:3000/` 在一个局域网内就可以访问, 需要修改的地方 `server.js` 中 `wsIP`

## socket 事件

### Client 发出 / Server 监听

 No | event name   |  state   | description
---:| ------------ | -------- | ----------------------------------------------
 1  | login        | debug    | 准备更名成 userLogin
 2  | reconn       | debug    | 准备更名成 userReconnect
 3  | disconn      | debug    | 准备更名成 userLogout
 4  | disconnect   | debug    | &emsp;
 5  | playerready  | error    | 准备更名成 playerReady
 6  | ownerReady   | *        | 功能继承于现有的 drawcard, 实现初始生成牌, 发牌
 8  | wantLord     | *        | &emsp;
 10 | playedcard   | *        | 准备更名成 playerPlay
 11 | drawcard     | discard  | 即将废弃

### Server 发出 / Client 监听

 No | event name  | state  | description
---:| ----------- | ------ | ------------
 1  | login       | debug  | &emsp;
 2  | logout      | debug  | &emsp;
 3  | kick        | debug  | &emsp;
 4  | return      | *      | 用户回到房间
 5  | lost        | debug  | &emsp;
 6  | logout      | debug  | &emsp;
 7  | genRole     | debug  | 准备更名成 refreshRole
 8  | refresh     | debug  | 准备更名成 refreshUser
 9  | drawcard    | debug  | 准备更名成 drawCard
 10 | gameBegin   | *      | &emsp;
 11 | giveLord    | *      | &emsp;
 12 | gameEnd     | *      | &emsp;
 13 | errorPlay   | *      | 发送错误信息


## 基本类

> **[S]** = server side only
> **[C]** = client side only

### Player

 member     | description
----------- | -----------------------------------------
 uid        | socket name( from `userid = genUid()` )
 sid [S]    | socket id
 pid        | player id in game, -1 => watcher
 name       | user name
 room       | room number
 cards      | {Array}
 remain [C] | cards in hand ( wait for play )

### Role

 member  | description
-------- | --------------------------------------------------------------
 pid     | eq. Player.pid
 role    | role name displayed in website, determined by F.lang.roleName

### Room

global room is a map of all Room(s), the mapping key to room is an unsigned integer given by user(such as `516`)



