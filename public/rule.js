"use strict";
(function() {
    var FLL = {};
    /* Do Everything  */
    (function() {
        FLL.errorCard = "\u2716";

        var defaultRule = {
            allCardNum: 54,
            joker: {
                num: 2,
                symbol: [
                    "<i class='fa fa-steam-square' style='color: black'></i>",
                    "<i class='fa fa-steam-square' style='color: red'></i>"
                ],
                get: function(cardID) {
                    cardID = Math.floor(cardID);
                    const n = defaultRule.normCardNum;
                    if (!isNaN(cardID) && cardID >= n && cardID < n + this.num) { return cardID - n; } else { return -1; }
                }
            },
            normCardNum: 52,
            rank: {
                num: 13,
                symbol: ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"],
                get: function(cardID) {
                    cardID = Math.floor(cardID);
                    if (!isNaN(cardID) && cardID >= 0 && cardID < defaultRule.normCardNum) { return Math.floor(cardID / 4); } else { return -1; }
                }
            },
            suit: {
                num: 4,
                name: ["diamonds", "clubs", "hearts", "spades"],
                symbol: ["\u2663", "\u2666", "\u2665", "\u2660"],
                get: function(cardID) {
                    cardID = Math.floor(cardID);
                    if (!isNaN(cardID) && cardID >= 0 && cardID < defaultRule.normCardNum) { return cardID % 4; } else { return -1; }
                }
            },
            player: {
                num: 3,
                cardEach: 18,
                cardLord: 0
            },
            cardCombination: [ //objects{name, minLen, maxLen, judge(arr)}
                {
                    name: "single",
                    minLen: 1,
                    maxLen: 1,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        let face = defaultRule.rank.get(arr[0]);
                        return { name: this.name, ord: 1, value: (face < 0 ? [1, defaultRule.joker.get(arr[0])] : [0, face]) };
                    }
                }, //end single
                {
                    name: "pair",
                    minLen: 2,
                    maxLen: 2,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        let face = defaultRule.rank.get(arr[0]);
                        // have joker card
                        if (face < 0) { return false; }
                        for (let i = 1; i < arr.length; i++)
                            if (face !== defaultRule.rank.get(arr[i])) return false;
                        return { name: this.name, ord: 1, value: [face] };
                    }
                }, //end pair
                {
                    name: "triplet",
                    minLen: 3,
                    maxLen: 3,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        let face = defaultRule.rank.get(arr[0]);
                        for (let i = 1; i < arr.length; i++)
                            if (face !== defaultRule.rank.get(arr[i])) return false;
                        return { name: this.name, ord: 1, value: [face] };
                    }
                }, //end triplet
                {
                    name: "bomb",
                    minLen: 4,
                    maxLen: 4,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        let face = defaultRule.rank.get(arr[0]);
                        for (let i = 1; i < arr.length; i++)
                            if (face !== defaultRule.rank.get(arr[i])) return false;
                        return { name: this.name, ord: 3, value: [face] };
                    }
                }, //end bomb
                {
                    name: "series",
                    minLen: 5,
                    maxLen: 12,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        let face = [],
                            i;
                        for (i = 0; i < arr.length; i++)
                            face.push(defaultRule.rank.get(arr[i]));
                        face.sort(function(a, b) { return a - b; });
                        //是否有非普通牌(Joker...)
                        if (face[0] < 0) { return false; }
                        for (i = 1; i < face.length; i++) {
                            if (face[i] !== face[i - 1] + 1) { return false; }
                        }
                        //最后一张是否大于A
                        if (face[face.length - 1] > 11) { return false; }
                        return { name: this.name, ord: 1, value: [face[0], face.length] };
                    }
                }, //end series
                {
                    name: "tripletWithSingle",
                    minLen: 4,
                    maxLen: 4,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        let face = [],
                            i;
                        for (i = 0; i < arr.length; i++)
                            face.push(defaultRule.rank.get(arr[i]));
                        face.sort(function(a, b) { return a - b; });
                        if (face[0] === face[1]) {
                            if (face[1] === face[2] && face[2] !== face[3]) {
                                return { name: this.name, ord: 1, value: [face[0], face[3]] };
                            } else return false;
                        } else {
                            if (face[1] === face[2] && face[1] === face[3]) {
                                return { name: this.name, ord: 1, value: [face[1], face[0]] };
                            } else return false;
                        }
                    }
                }, //end tripletWithSingle
                {
                    name: "tripletWithPair",
                    minLen: 5,
                    maxLen: 5,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        let face = [],
                            i;
                        for (i = 0; i < arr.length; i++)
                            face.push(defaultRule.rank.get(arr[i]));
                        face.sort(function(a, b) { return a - b; });
                        //AAABB or AABBB => 0 == 1, 3 == 4
                        if (face[0] === face[1] && face[3] === face[4]) {
                            if (face[1] === face[2]) {
                                if (face[2] !== face[3]) {
                                    return { name: this.name, ord: 1, value: [face[0], face[3]] };
                                } else return false;
                            } else {
                                if (face[2] === face[3]) {
                                    return { name: this.name, ord: 1, value: [face[2], face[0]] };
                                } else return false;
                            }
                        } else return false;
                    }
                }, //end tripletWithPair
                {
                    name: "pairSeries",
                    minLen: 6,
                    maxLen: 24,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        //必须是偶数张牌
                        if (arr.length % 2) { return false; }
                        let face = [],
                            i;
                        for (i = 0; i < arr.length; i++)
                            face.push(defaultRule.rank.get(arr[i]));
                        face.sort(function(a, b) { return a - b; });
                        //是否有非普通牌(Joker...)
                        if (face[0] < 0) { return false; }
                        if (face[0] !== face[1]) { return false; }
                        for (i = 2; i < face.length; i += 2) {
                            if (face[i + 1] !== face[i] || face[i] !== face[i - 1] + 1) { return false; }
                        }
                        //最后一张是否大于A
                        if (face[face.length - 1] > 11) { return false; }
                        return { name: this.name, ord: 1, value: [face[0], face.length / 2] };
                    }
                }, //end pairSeries
                {
                    name: "rocket",
                    minLen: 2,
                    maxLen: 2,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        if (defaultRule.joker.get(arr[0]) >= 0 && defaultRule.joker.get(arr[1]) >= 0) {
                            return { name: this.name, ord: 4, value: [0] };
                        } else { return false; }
                    }
                }, //end rocket
                {
                    name: "plane",
                    minLen: 6,
                    maxLen: 20,
                    judge: function(arr) {
                        if (arr.length < this.minLen || arr.length > this.maxLen) { return false; }
                        let face = [];
                        (function() {
                            let i = 0,
                                tmp = [],
                                tmp1 = [];
                            for (i = 0; i < arr.length; i++) {
                                if (defaultRule.joker.get(arr[i]) >= 0) tmp.push(defaultRule.joker.get(arr[i]) + defaultRule.rank.num);
                                else tmp.push(defaultRule.rank.get(arr[i]));
                            }
                            tmp.sort(function(a, b) { return a - b; });

                            tmp1.push([tmp[0], 1]);
                            for (i = 1; i < tmp.length; i++) {
                                if (tmp[i] === tmp[i - 1]) tmp1[tmp1.length - 1][1]++;
                                else tmp1.push([tmp[i], 1]);
                            }
                            tmp1.sort(function(a, b) { return a[1] === b[1] ? a[0] - b[0] : b[1] - a[1]; });

                            for (i = 0; i < tmp1.length; i++)
                                if (face.hasOwnProperty(tmp1[i][1])) face[tmp1[i][1]].push(tmp1[i][0]);
                                else face[tmp1[i][1]] = [tmp1[i][0]];
                        })();

                        // 3张的大于等于2
                        if (!face.hasOwnProperty(3) || face[3].length < 2) { return false; }
                        // 没有4张的
                        if (face.hasOwnProperty(4)) { return false; }
                        // 只有0/1/2张的且长度与3张的相同
                        if (face.hasOwnProperty(1)) {
                            if (face.hasOwnProperty(2)) { return false; }
                            if (face[1].length !== face[3].length) { return false; }
                        } else if (face.hasOwnProperty(2)) {
                            if (face[2].length !== face[3].length) { return false; }
                        }
                        // 3个最后一张是否大于A
                        if (face[3][face[3].length - 1] > 11) { return false; }

                        // 现在只需3张的成连子就行
                        if (!FLL.isSeries(face[3])) { return false; }

                        return {
                            name: this.name,
                            ord: 1,
                            value: [face[3][0], face[3].length, face[1] || face[2] || []]
                        };
                    }
                }
            ],
            /**
             * @return -1 : cannot compare
             *         0 : a is not greater than b
             *         1 : a is greater than b
             * @param {cardComb} a 
             * @param {cardComb} b 
             */
            compare: function(a, b) {
                function B(x) { return x ? 1 : 0; }
                if (a.ord !== b.ord) { return B(a.ord > b.ord); } else {
                    if (a.name === b.name) {
                        switch (a.name) {
                            case "single":
                                if (a.value[0] === b.value[0]) return B(a.value[1] > b.value[1]);
                                else return B(a.value[0] > b.value[0]);
                            case "pair":
                            case "triplet":
                            case "bomb":
                            case "tripletWithSingle":
                            case "tripletWithPair":
                                return B(a.value[0] > b.value[0]);
                            case "series":
                            case "pairSeries":
                            case "plane":
                                if (a.value[1] === b.value[1]) return B(a.value[0] > b.value[0]);
                                else return -1;
                            default:
                                return -1;
                        }
                    } else { return -1; }
                }
            },
            lang: {
                passText: ["Pass", "过", "不要", "要不起", "还是你比较厉害"],
                roleName: {
                    player: [
                        "[南]房主",
                        "[东]下家",
                        "[北]对家",
                        "[西]上家"
                    ],
                    watcher: ["观战者", "吃瓜群众", "和平观察员", "战争观察员", "联合国特派观察员", "暗中观察者"]
                }
            }
        };

        FLL.randomElement = function(arr) {
            const len = arr.length;
            if (len) { return arr[Math.floor(len * Math.random())]; } else { return ""; }
        };

        FLL.isSeries = function(arr) {
            if (!Array.isArray(arr) || arr.length <= 1) { return false; }
            let i, tmp = arr;
            tmp.sort(function(a, b) { return a - b; });
            for (i = 1; i < tmp.length; i++)
                if (tmp[i] !== tmp[i - 1] + 1) return false;
            return true;
        };

        // generate a random array of [0,cardNum)
        FLL.genCard = function(cardNum) {
            let i, x, tmp, card = [];
            for (i = 0; i < cardNum; i++) { card[i] = i; }
            for (i = cardNum - 1; i >= 0; i--) {
                x = Math.floor(Math.random() * cardNum);
                tmp = card[x];
                card[x] = card[i];
                card[i] = tmp;
            }
            return card;
        };

        FLL.newDrawCard = function() {
            let card = this.genCard(this.allCardNum),
                ret = [];
            for (let i = 0; i < this.player.num; i++) {
                if (card.length) {
                    ret.push(card.splice(0, this.player.cardEach).sort(function(a, b) { return a - b; }));
                }
            }
            if (this.player.cardLord && card.length) {
                ret.push(card.splice(0, this.player.cardLord).sort(function(a, b) { return a - b; }));
            }
            return ret;
        };

        FLL.toCard = function(cardID, flag) {
            var i, o = "";
            if (cardID >= FLL.normCardNum) {
                i = this.joker.get(cardID);
                return i < 0 ? this.errorCard : (flag ? "<br>" : "") + this.joker.symbol[i];
            } else {
                i = this.suit.get(cardID);
                if (i >= 0) o += this.suit.symbol[i];
                i = this.rank.get(cardID);
                if (i >= 0) o += (flag ? "<br><strong>" : "") + this.rank.symbol[i] + (flag ? "</strong>" : "");
                return o.length ? o : this.errorCard;
            }
        };

        FLL.valid = function(arr) {
            let cc = this.cardCombination,
                j;
            for (let i = 0; i < cc.length; i++) {
                j = cc[i].judge(arr);
                if (j) { return j; }
            }
            return false;
        };

        FLL.init = function(rule) {
            rule = rule || defaultRule;
            for (let i in rule) { FLL[i] = rule[i]; }
            return;
        };

        FLL.init();
    })();
    /* End Do Everything */
    /* EXPORT part */
    if (typeof module !== "undefined" && module.exports) {
        module.exports = FLL;
    } else if (typeof define === "function" && define.amd) {
        define("fightLandLord", function() { return FLL; });
    } else { this["fightLandLord"] = FLL; }
}).call(this);