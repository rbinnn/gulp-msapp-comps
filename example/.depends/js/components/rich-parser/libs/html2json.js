import {
	empty,
    block,
    inline,
    closeSelf,
    fillAttrs,
    special
} from "./element"
import HTMLParser from './htmlparser.js'

const fontSize = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', '-webkit-xxx-large'];
const styleAttrs = {
    'color': 'color',
    'face': 'font-family',
    'size': 'font-size'
};

function removeDOCTYPE(html) {
    return html
        .replace(/<\?xml.*\?>\n/, '')
        .replace(/<.*!doctype.*\>\n/, '')
        .replace(/<.*!DOCTYPE.*\>\n/, '');
}

function trimHtml(html) {
  return html
        .replace(/\r?\n+/g, '')
        .replace(/<!--.*?-->/ig, '')
        .replace(/\/\*.*?\*\//ig, '')
        .replace(/[ ]+</ig, '<')
}

function strcharacterDiscode(str){
    // 加入常用解析
    str = str.replace(/&nbsp;/g, ' ');
    str = str.replace(/&quot;/g, "'");
    str = str.replace(/&amp;/g, '&');
    // str = str.replace(/&lt;/g, '‹');
    // str = str.replace(/&gt;/g, '›');

    str = str.replace(/&lt;/g, '<');
    str = str.replace(/&gt;/g, '>');
    str = str.replace(/&#8226;/g, '•');

    return str;
}

function strMoreDiscode(str){
    str = str.replace(/\r\n/g,"");  
    str = str.replace(/\n/g,"");

    str = str.replace(/code/g,"wxxxcode-style");
    return str;
}

var patt1 = new RegExp("^//");
function urlToHttpUrl(url,rep){  
    var result = patt1.test(url);
    if( result ){
        url = "https:" + url;
    }
    return  url;
}


export default function html2json(html, bindName) {
    //处理字符串
    html = removeDOCTYPE(html);
    html = trimHtml(html);    
    // 栈，先进先出，栈顶元素为开始标签
    var stack = [] 
    var results = {
        node: bindName,
        nodes: [],
        images:[],
        imageUrls:[],
        vids: []
    };
    var index = 0;
    HTMLParser(html, {
        start: function (tag, attrs, unary) {
            var node = {
                node: 'element',
                tag: tag,
                nodes: [],
                classStr: "",
                styleStr: ""
            };

            if (stack.length === 0) {
                node.index = index.toString()
                index += 1
            } else {
                var parent = stack[stack.length - 1];
                node.index = parent.index + '.' + parent.nodes.length
            }
            node.level = node.index.split(".").length - 1
            // 结构大于10层的，不处理了
            if( node.level > 10 ) {
                return
            }

            if (block[tag]) {
                node.tagType = "block";
            } else if (inline[tag]) {
                node.tagType = "inline";
            } else if (closeSelf[tag]) {
                node.tagType = "closeSelf";
            }

            if (attrs.length !== 0) {
                node.attr = attrs.reduce(function (pre, attr) {
                    var name = attr.name;
                    var value = attr.value || "";
                    if (name == 'class') {
                        node.classStr = value;
                    }
                    // has multi attibutes
                    // make it array of attribute
                    if (name == 'style') {
                        node.styleStr = value;
                    }
                    if (value.match(/ /)) {
                        value = value.split(' ');
                    }
                    

                    // if attr already exists
                    // merge it
                    if (pre[name]) {
                        if (Array.isArray(pre[name])) {
                            // already array, push to last
                            pre[name].push(value);
                        } else {
                            // single value, make it array
                            pre[name] = [pre[name], value];
                        }
                    } else {
                        // not exist, put it
                        pre[name] = value;
                    }

                    return pre;
                }, {});
            }

            //对img添加额外数据
            if (node.tag === 'img') {
                var imgUrl = node.attr.src;
                imgUrl = urlToHttpUrl(imgUrl);
                node.attr.src = imgUrl;
                results.images.push(node);
                results.imageUrls.push(imgUrl);
            }
            
            // 处理font标签样式属性
            if (node.tag === 'font') {                
                if (!node.attr.style) node.attr.style = [];
                if (!node.styleStr) node.styleStr = '';
                for (var key in styleAttrs) {
                    if (node.attr[key]) {
                        var value = key === 'size' ? fontSize[node.attr[key] - 1] : node.attr[key];
                        node.attr.style.push(styleAttrs[key]);
                        node.attr.style.push(value);
                        node.styleStr += styleAttrs[key] + ': ' + value + ';';
                    }
                }
            }

            //临时记录source资源
            if(node.tag === 'source'){
                results.source = node.attr.src;
            }

            if( node.tag === "video" ) {
                // results
                var vid = node.attr["data-vid"]
                var vids = results.vids
                var info = vids.find(item => item.vid === vid)
                if( info ) {
                    info.pos.push(node.index)
                }else {
                    vids.push({
                        vid: vid,
                        pos: [node.index]
                    })
                }
            }
            
            if (unary) {
                // if this tag dosen't have end tag
                // like <img src="hoge.png"/>
                // add to parents
                var parent = stack[stack.length - 1] || results;
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            } else {
                // bufArray.unshift(node);
                stack.push(node)
            }
        },
        end: function (tag) {
            var node = stack.pop();
            if (node.tag !== tag) console.error('invalid state: mismatch end tag');
            // if( node.tag ===)
            
            if (stack.length === 0) {
                results.nodes.push(node);
            } else {
                var parent = stack[stack.length - 1];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            }
        },
        chars: function (text) {
            text = strcharacterDiscode(text);
            text = strMoreDiscode(text);
            var node = {
                node: 'text',
                text: text
            };
            
            if (stack.length === 0) {
                node.index = index.toString()
                index += 1
                results.nodes.push(node);
            } else {
                var parent = stack[stack.length - 1];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length
                parent.nodes.push(node);
            }
            node.level = node.index.split(".").length - 1
        }
    });
    return results;
}



