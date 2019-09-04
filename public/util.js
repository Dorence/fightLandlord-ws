(function() {
    "use strict";
    let util = {
        bool: function(val) { return val ? 1 : 0; },
        cmp: function(x, y) { return x < y ? -1 : 1; },
        isArray: function(arr) { return arr && typeof arr === "object" && Array === arr.constructor; },
        isString: function(str) { return typeof str === "string"; },

        /**
         * 检测是否是顺子
         * @param {Array} arr 
         */
        isSeries: function(arr) {
            if (!this.isArray(arr) || arr.length <= 1) return false;
            let tmp = Object.assign({}, arr);
            tmp.sort(cmp);
            for (let i = 1; i < tmp.length; i++)
                if (tmp[i] !== tmp[i - 1] + 1) return false;
            return true;
        },

        /**
         * 检查 num 是否在 [minNum, maxNum) 中
         * @param {Number} num 
         * @param {Number} minNum 
         * @param {Number} maxNum 
         */
        examNum: function(num, minNum = 0, maxNum = Infinity) {
            return !isNaN(num) && (num >= minNum) && (num < maxNum);
        },
        /**
         * 随机生成 [0, range) 的整数
         * @param {Number} range 
         */
        randomInt: function(range = 2) {
            return (isNaN(range) || range <= 0) ? (-1) : Math.floor(range * Math.random());
        },
        // without checking range
        _randomInt: function(range) {
            return Math.floor(range * Math.random());
        },

        randomEle: function(arr) {
            if (this.isArray(arr) && arr.length)
                return arr[this._randomInt(arr.length)];
            else
                return "";
        },

        shuffle: function(arr) {
            if (this.isArray(arr) && arr.length) {
                for (let i = arr.length - 1; i >= 0; i--) {
                    x = this._randomInt(arr.length);
                    [arr[x], arr[i]] = [arr[i], arr[x]];
                }
            } else {
                arr = [];
            }
            return arr;
        }

    };
    /* Do Everything  */
    (() => {



    })();
    /* End Do Everything */
    /* EXPORT part */
    if (typeof module !== "undefined" && module.exports) {
        module.exports = util;
    } else if (typeof define === "function" && define.amd) {
        define("util", function() { return util; });
    } else { this.util = util; }
}).call(this);