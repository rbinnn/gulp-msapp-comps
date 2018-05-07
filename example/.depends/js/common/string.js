/**
 *  处理字符串的常用函数集合
 *  @module base/string 
 * 
 */

/**
 *  去掉两端的空格
 *  @public
 *  @param  _asStr 要去掉空格的字符串
 *  @return 返回两端没有空格的字符串
 *  @example
 *  var te = '  fdsfs  ';
 *  var tags = trim(te); // tags = 'fdsfs';
 *
 */
function trim(_asStr) {
    return (_asStr && _asStr.replace ? _asStr : "").replace(/(^\s*)|(\s*$)/g, "");
}
/**
 *  将一个map，转换为字符串,用spliter1和spliter2间隔,spliter1 为外围spliter,
 *  @public
 *  @param  map 目标map map为{'fa':33,'tes':43}
 *          spliter1 外层分隔符 比如 &
 *          spliter2 内层分隔符 比如 =
 *  @return 返回用spliter1和spliter2连接的字符串
 *  @example
 *  var te = {'fa':33,'tes':43,'the':'ffs'};
 *  var tags = mapToStr(te); // tags为 fa=33&tes=43&the=ffs;
 *
 */
function mapToStr(map, spliter1, spliter2) {
    try {
        spliter1 = spliter1 || '&';
        spliter2 = spliter2 || '=';
        var _arr = [];
        for (var p in map) {
            _arr.push(p + spliter2 + map[p]);
        }
        return _arr.join(spliter1);

    } catch (e) {
        alert(e.message);
    }
}
/**
 *  将一个字符串转换为map,用spliter1和spliter2间隔,spliter1 为外围spliter,
 *  @public
 *  @param  str str为fa=33&tes=43&the=ffs
 *          spliter1 外层分隔符 比如 &
 *          spliter2 内层分隔符 比如 =
 *  @return 一个map
 *  @example
 *  var te = 'fa=33&tes=43&the=ffs';;
 *  var tags = strToMap(te); // tags为 {'fa':33,'tes':43,'the':'ffs'};
 *
 */
function strToMap(str, spliter1, spliter2) {
    spliter1 = spliter1 || '&';
    spliter2 = spliter2 || '=';
    var type = str.split(spliter1);
    var typeMap = {};
    for (var p in type) {
        var _i = type[p].split(spliter2);
        if (2 == _i.length) {
            typeMap[_i[0]] = _i[1];
        }
    }
    return typeMap;
}
/**
 *  简单过滤xss,将<,>,",'替换
 *  @public
 *  @param  str 要被替换的字符串
 *  @return 返回一个过滤后字符串
 **/
function filterXSS(str, stripTag) {
    var _str = '' + (str || '');
    if (stripTag) {
        _str = _str.replace(/<[^>]+>/g, '');
    }
    return _str.replace(/</mg, '&lt;').replace(/>/gm, '&gt;').replace(/\"/gm, '&quot;').replace(/\'/gm, '&#39;');
}
/**
 *  简单过滤xss,将<,>,",'替换
 *  @public
 *  @param  str 要被替换的字符串
 *  @return 返回一个过滤后字符串
 *
 */
function filterArrXSS(strArr, stripTag) {
    strArr = strArr || [];
    for (var i = 0, len = strArr.length; i < len; i++) {
        strArr[i] = filterXSS(strArr[i], stripTag);
    }
    return strArr;
}
/**
 *  将一个tpl,map整合为一个字符串。tpl里用{key} 标名要被 map[key] 替换的地方
 *  @public
 *  @param  tpl 带有{key} 的字符串
 *          obj 数据map
 *          filter 是否要做filterXSS，默认为 true
 *  @return 填充后的字符串。
 *
 */
var format = function (tpl, obj, filter) {
    tpl = tpl + '';
    if (undefined === filter) {
        filter = true;
    }
    filter = !!filter;
    return tpl.replace(/\{(\w+)\}/g, function (m, n) {
        var ret = obj[n] !== undefined ? obj[n].toString() : m;
        return filter ? filterXSS(ret) : ret;
    });
};


// 仅用于处理图片,audio, vidoe的url, 不要用在其他地方
function filterImg(url) {
    var isAndroid = /android/i.test(navigator.userAgent);
    var _url = (url + '').replace(/^\s*https?:\/\//i, '').replace(/^\s*\/\//, '');
    return /^\/[^\/]/i.test(url) ? url : (isAndroid ? 'http:' : location.protocol) + '//' + _url;
}



/**
 *  插入html
 *  两种情况
 *  @param  data 字符串或者对象
 *          elem 元素
            unXss 默认是会xss过滤，如不需要请传true

 *  data 为对象的时候，调用insertAdjacentHTML
 * {
    data, 
    position,
    elem, 
    unXss
 }
 *
 */
function insertHTMLFilterXss(data, elem, unXss) {
    if (typeof data === 'object') {
        elem = data.elem;
        unXss = data.unXss;
        var position = data.position;
        var str = unXss ? data.data : filterXSS(data.data);
        elem.insertAdjacentHTML(position, str);
    } else if (typeof data === 'string') {
        elem.innerHTML = unXss ? data : filterXSS(data);
    }
}


module.exports = {
    format: format,
    filterXSS: filterXSS,
    mapToStr: mapToStr,
    strToMap: strToMap,
    trim: trim,
    filterArrXSS: filterArrXSS,
    filterImg: filterImg,
    insertHTMLFilterXss: insertHTMLFilterXss,
};