// 打印机纸宽58mm，页的宽度384，字符宽度为1，每行最多盛放32个字符
// 打印机纸宽80mm，页的宽度576，字符宽度为1，每行最多盛放48个字符
const PAGE_WIDTH = 576;
const MAX_CHAR_COUNT_EACH_LINE = 48;

//字符串转字节序列
function stringToByte(str) {
  var bytes = new Array();
  var len, c;
  len = str.length;
  for (var i = 0; i < len; i++) {
    c = str.charCodeAt(i);
    if (c >= 0x010000 && c <= 0x10FFFF) {
      bytes.push(((c >> 18) & 0x07) | 0xF0);
      bytes.push(((c >> 12) & 0x3F) | 0x80);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000800 && c <= 0x00FFFF) {
      bytes.push(((c >> 12) & 0x0F) | 0xE0);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000080 && c <= 0x0007FF) {
      bytes.push(((c >> 6) & 0x1F) | 0xC0);
      bytes.push((c & 0x3F) | 0x80);
    } else {
      bytes.push(c & 0xFF);
    }
  }
  return bytes;
}

//字节序列转ASCII码
//[0x24, 0x26, 0x28, 0x2A] ==> "$&C*"
function byteToString(arr) {
  if (typeof arr === 'string') {
    return arr;
  }
  var str = '',
    _arr = arr;
  for (var i = 0; i < _arr.length; i++) {
    var one = _arr[i].toString(2),
      v = one.match(/^1+?(?=0)/);
    if (v && one.length == 8) {
      var bytesLength = v[0].length;
      var store = _arr[i].toString(2).slice(7 - bytesLength);
      for (var st = 1; st < bytesLength; st++) {
        store += _arr[st + i].toString(2).slice(2);
      }
      str += String.fromCharCode(parseInt(store, 2));
      i += bytesLength - 1;
    } else {
      str += String.fromCharCode(_arr[i]);
    }
  }
  return str;
}
//居中
function Center() {
  var Center = [];
  Center.push(27);
  Center.push(97);
  Center.push(1);
  var strCenter = byteToString(Center);
  return strCenter;
}

//居左
function Left() {
  var Left = [];
  Left.push(27);
  Left.push(97);
  Left.push(0);
  var strLeft = byteToString(Left);
  return strLeft;
}
//居右
function Right() {
  var right = [];
  Left.push(27);
  Left.push(97);
  Left.push(2);
  var strRight = byteToString(right);
  return strRight;
}
//标准字体
function Size1() {
  var Size1 = [];
  Size1.push(29);
  Size1.push(33);
  Size1.push(0);
  var strSize1 = byteToString(Size1);
  return strSize1;
}
//大号字体
/*  放大1倍  n = 0
 *  长宽各放大2倍  n = 17 */
function Size2(n) {
  var Size2 = [];
  Size2.push(29);
  Size2.push(33);
  Size2.push(n);
  var strSize2 = byteToString(Size2);
  return strSize2;
}

// 字体加粗
function boldFontOn() {
  var arr = []
  arr.push(27)
  arr.push(69)
  arr.push(1)
  var cmd = byteToString(arr);
  return cmd
}
// 取消字体加粗
function boldFontOff() {
  var arr = []
  arr.push(27)
  arr.push(69)
  arr.push(0)
  var cmd = byteToString(arr);
  return cmd
}
// 打印并走纸n行
function feedLines(n = 1) {
  var feeds = []
  feeds.push(27)
  feeds.push(100)
  feeds.push(n)
  var printFeedsLines = byteToString(feeds);
  return printFeedsLines
}
// 切纸
function cutPaper() {
  var cut = []
  cut.push(29)
  cut.push(86)
  cut.push(49)
  var cutType = byteToString(cut);
  return cutType
}

// 开钱箱
function open_money_box() {
  var open = []
  open.push(27)
  open.push(112)
  open.push(0)
  open.push(60)
  open.push(255)
  var openType = byteToString(open)
  return openType
}

// 初始化打印机
function init() {
  var arr = []
  arr.push(27)
  arr.push(68)
  arr.push(0)
  var str = byteToString(arr)
  return str
}
/* 
 设置左边距
 len:
 */

function setLeftMargin(len = 1) {
  var arr = []
  arr.push(29)
  arr.push(76)
  arr.push(len)
  var str = byteToString(arr)
  return str
}

// 设置打印区域宽度
function setPrintAreaWidth(width) {
  var arr = []
  arr.push(29)
  arr.push(87)
  arr.push(width)
  var str = byteToString(arr)
  return str
}

/**
 * @param str
 * @returns {boolean} str是否全是中文
 */
function isChinese(str) {
  return /^[\u4e00-\u9fa5]$/.test(str);
}
// str是否全含中文或者中文标点
function isHaveChina(str) {
  if (escape(str).indexOf("%u") < 0) {
    return 0
  } else {
    return 1
  }
}
/**
 * 返回字符串宽度(1个中文=2个英文字符)
 * @param str
 * @returns {number}
 */
function getStringWidth(str) {
  let width = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    width += isHaveChina(str.charAt(i)) ? 2 : 1;
  }
  return width;
}


/**
 * 同一行输出str1, str2，str1居左, str2居右
 * @param {string} str1 内容1
 * @param {string} str2 内容2
 * @param {string} fillWith str1 str2之间的填充字符
 * @param {number} fontWidth 字符宽度 1/2
 *
 */
function inline(str1, str2, fillWith = ' ', fontWidth = 1) {
  const lineWidth = MAX_CHAR_COUNT_EACH_LINE / fontWidth;
  // 需要填充的字符数量
  let fillCount = lineWidth - (getStringWidth(str1) + getStringWidth(str2)) % lineWidth;
  let fillStr = new Array(fillCount).fill(fillWith.charAt(0)).join('');
  return str1 + fillStr + str2;
}



/**
 * 同一行输出str1, str2，str3,  str1居左占50%超出自动换行, str2、str3居右各占25%
 * @param {string} str1 内容1
 * @param {string} str2 内容2
 * @param {string} str3 内容3
 * @param {number} fontWidth 字符宽度 1/2
 */
function table(str1, str2, str3, fontWidth = 1) {
  // 填充的字符  这里是空格
  let fillWith = ' '
  // 配置str1和str2之间的间距
  let span = 4
  // 每行最大的字符数量,这里需要考虑字体大小fontWidth
  const lineWidth = MAX_CHAR_COUNT_EACH_LINE / fontWidth;
  // 将str1按长度分割成数组
  let str1Width = lineWidth / 2 - span //str1字符所占的最大宽度（中文占2个，英文占1个）
  let len = 0
  let str = ''
  let arr = []
  for (let i = 0; i < str1.length; i++) {
    if (len >= str1Width) {
      arr.push(str)
      len = 0
      str = str1[i]
    } else {
      len += getStringWidth(str1[i])
      str += str1[i]
    }
  }
  arr.push(str)
  // 需要填充的字符数量  这里的fillCount1、2必须是正整数，不可为小数或字符
  let fillCount1 = lineWidth * 0.5 - (getStringWidth(str1)) % (lineWidth / 2);
  fillCount1 = fillCount1 / fontWidth
  let fillStr1 = new Array(fillCount1).fill(fillWith.charAt(0)).join('');
  let fillCount2 = lineWidth * 0.25 - (getStringWidth(str2)) % (lineWidth / 4);
  fillCount2 = fillCount2 / fontWidth
  let fillStr2 = new Array(fillCount2).fill(fillWith.charAt(0)).join('');

  let res = ''
  if (getStringWidth(str1) > str1Width) {
    fillStr1 = '    '
  }
  arr.forEach((k, i) => {
    if (i == 0) {
      res = k + fillStr1 + str2 + fillStr2 + str3;
      // 配置行末尾填充的字符
      let fillCount3 = lineWidth - getStringWidth(res)
      let fillStr3 = new Array(fillCount3).fill(fillWith.charAt(0)).join('');
      res += fillStr3
    } else {
      let fillCount = lineWidth - (getStringWidth(k)) % lineWidth;
      fillCount = fillCount / fontWidth
      let fillStr = new Array(fillCount).fill(fillWith.charAt(0)).join('');
      res += k + fillStr;
    }
  })
  return res
}




/* 
设置对齐方式
 0：居左
 1：居中
 2：居右
 */
function align(type) {
  if (type == 0) {
    Left()
  } else if (type == 1) {
    Center()
  } else if (type == 2) {
    Right()
  }
}



/**
 * 用字符填充一整行
 * @param {string} fillWith 填充字符
 * @param {number} fontWidth 字符宽度 1/2
 */
function fillLine(fillWith = '-', fontWidth = 1) {
  const lineWidth = MAX_CHAR_COUNT_EACH_LINE / fontWidth;
  return new Array(lineWidth).fill(fillWith.charAt(0)).join('');
}

/**
 * 文字内容居中，左右用字符填充
 * @param {string} str 文字内容
 * @param {number} fontWidth 字符宽度 1/2
 * @param {string} fillWith str1 str2之间的填充字符
 */
function fillAround(str, fillWith = '-', fontWidth = 1) {
  const lineWidth = MAX_CHAR_COUNT_EACH_LINE / fontWidth;
  let strWidth = getStringWidth(str);
  // 内容已经超过一行了，没必要填充
  if (strWidth >= lineWidth) {
    return str;
  }
  // 需要填充的字符数量
  let fillCount = lineWidth - strWidth;
  // 左侧填充的字符数量
  let leftCount = Math.round(fillCount / 2);
  // 两侧的填充字符，需要考虑左边需要填充，右边不需要填充的情况
  let fillStr = new Array(leftCount).fill(fillWith.charAt(0)).join('');
  return fillStr + str + fillStr.substr(0, fillCount - leftCount);
}



module.exports = {
  inline,
  fillLine,
  fillAround,
  Center,
  Left,
  Right,
  Size1,
  Size2,
  boldFontOn,
  boldFontOff,
  feedLines,
  cutPaper,
  open_money_box,
  byteToString,
  stringToByte,
  setLeftMargin,
  setPrintAreaWidth,
  table,
  init
}