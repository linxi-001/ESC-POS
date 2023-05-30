
原文链接：https://juejin.cn/post/7237316724739457061
>  由于我在做项目期间遇到各种各样的打印，于是想写一篇文章来总结一下我遇到的打印需求以及解决方案。总的来说，目前我遇到的打印需求可以分为两类，网页打印和小票打印，在实现过程中，又可以分为前后端分别来实现，下面我就来说一下前端实现的方法和思路

**目录**

[ 一、小票打印](#%C2%A0%E4%B8%80%E3%80%81%E5%B0%8F%E7%A5%A8%E6%89%93%E5%8D%B0)

[ 打印指令封装](#%C2%A0%E6%89%93%E5%8D%B0%E6%8C%87%E4%BB%A4%E5%B0%81%E8%A3%85)

[1.蓝牙打印机](#1.%E8%93%9D%E7%89%99%E6%89%93%E5%8D%B0%E6%9C%BA)

[2.网口打印机](#2.%E7%BD%91%E5%8F%A3%E6%89%93%E5%8D%B0%E6%9C%BA)

[打印小票](#%E6%89%93%E5%8D%B0%E5%B0%8F%E7%A5%A8)

[打印效果（这里仅为展示，非上述代码打印）](#%E6%89%93%E5%8D%B0%E6%95%88%E6%9E%9C%EF%BC%88%E8%BF%99%E9%87%8C%E4%BB%85%E4%B8%BA%E5%B1%95%E7%A4%BA%EF%BC%8C%E9%9D%9E%E4%B8%8A%E8%BF%B0%E4%BB%A3%E7%A0%81%E6%89%93%E5%8D%B0%EF%BC%89)

[3.USB打印机](#3.USB%E6%89%93%E5%8D%B0%E6%9C%BA)

[ 二、网页打印](#%C2%A0%E4%BA%8C%E3%80%81%E7%BD%91%E9%A1%B5%E6%89%93%E5%8D%B0)

[1.windows.print()](#1.windows.print\(\))

[1.1使用媒体查询](#1.1%E4%BD%BF%E7%94%A8%E5%AA%92%E4%BD%93%E6%9F%A5%E8%AF%A2)

[1.2监听打印事件](#1.2%E7%9B%91%E5%90%AC%E6%89%93%E5%8D%B0%E4%BA%8B%E4%BB%B6)

[1.3分页符](#1.3%E5%88%86%E9%A1%B5%E7%AC%A6)

[1.4设置纸张](#1.4%E8%AE%BE%E7%BD%AE%E7%BA%B8%E5%BC%A0)

***

#  一、小票打印

目前市面上的小票打印机大多采用的打印指令集为ESC/POS指令，它可以使用ASCII码、十进制、十六进制来控制打印，我们可以使用它来控制字体大小、打印排版、字体加粗、下划线、走纸、切纸、控制钱箱等，下面以初始化打印机为例：

    ASCII码  ESC  @
    十进制码  27  64
    十六进制  1B  40

小票打印纸的宽度一般可分58mm和80mm，这里指的是打印纸的宽度，但是在实际打印的时候，有效打印区域并没有这么宽。

     打印机纸宽58mm，页的宽度384，字符宽度为1，每行最多盛放32个字符
     打印机纸宽80mm，页的宽度576，字符宽度为1，每行最多盛放48个字符

上面说的字符指的是打印到小票上的内容，其中数字和字母占1个字符，中文占2个字符，也就是说，如果使用58mm的打印纸，一行最多可以打印16个汉字或者32个数字 。

当然这是在不改变字体大小的情况下，如果我们改变了字体大小，那么一行盛放的内容也会改变。

    //控制字符大小

    ASCII码   GS  !   n
    十进制码  29  33  n
    十六进制  1D  21  n

> 1.这里的n是一个变量， 0 ≤ n ≤ 255 
>
> 2.用二进制表示，n的取值范围就是00000000到11111111，其中二进制的前四位用来控制宽度，后四位用来控制高度。**0000**表示**不变**，**0001**表示放大**2倍**，**0002**表示放大**3倍**，以此类推
>
> 3.该命令对所有字符(英数字符和汉字) 有效。
>
> 4.缺省值：n = 0

 下面我们来看一下字符的不同放大倍数（这里的1倍，表示使用默认大小）：

| 放大倍数      | n(二进制)   | n（十进制） |
| --------- | -------- | ------ |
| 宽度1倍，高度1倍 | 00000000 | 0      |
| 宽度1倍，高度2倍 | 00000001 | 1      |
| 宽度1倍，高度3倍 | 00000002 | 2      |
| 宽度2倍，高度1倍 | 00010000 | 16     |
| 宽度2倍，高度2倍 | 00010001 | 17     |
| 宽度2倍，高度3倍 | 00010002 | 18     |
| 宽度3倍，高度1倍 | 00020000 | 32     |
| 宽度3倍，高度2倍 | 00020001 | 33     |
| 宽度3倍，高度3倍 | 00020002 | 34     |

![161f8f6372295d6f421887239fd96ab.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0ca7c1d1df744cb4a735a7a44c09bc74~tplv-k3u1fbpfcp-watermark.image?)

> PS:打印纸时间有些长，字迹有些模糊，见谅

###  打印指令封装

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

也就是说，如果我们使用的打印机采用的是ESC/POS指令集（我这里使用过佳博、芯烨、斯普瑞特打印机），只要我们想办法把打印指令发送给打印机，打印机就可以识别到并且进行打印等操作。那么我们该如何发送呢？

### 1.蓝牙打印机

参考掘金 **zgt\_不梦**的文章 [微信小程序连接蓝牙打印机打印图片示例](https://juejin.cn/post/7002878986472652830 "微信小程序连接蓝牙打印机打印图片示例")

*   初始化蓝牙模块 wx.openBluetoothAdapter()
*   初始化完成后搜寻附近的蓝牙设备 wx.startBluetoothDevicesDiscovery()
*   监听寻找到新设备的事件 wx.onBluetoothDeviceFound()
*   在监听寻找到新设备的事件回调中获取所有蓝牙设备列表 wx.getBluetoothDevices()
*   连接低功耗蓝牙设备 wx.createBLEConnection()
*   连接成功后获取蓝牙设备服务 wx.getBLEDeviceServices()
*   在服务中取(notify=true || indicate=true) && write=true 的特征值的 uuid: wx.getBLEDeviceCharacteristics()
*   完成后停止搜寻 wx.stopBluetoothDevicesDiscovery()
*   向低功耗蓝牙设备特征值中写入二进制数据 wx.writeBLECharacteristicValue()
*   离开页面时取消蓝牙连接 wx.closeBLEConnection()
*   关闭蓝牙模块 wx.closeBluetoothAdapter()

> 亲测，好使！在uniapp也可以，只需替换对应的API即可

### 2.网口打印机

这里我使用的scoket连接，相比于USB打印，这里需要保证打印机和安卓设备在同一局域网下。好处是安卓设备可以和打印机距离较远（比如厨房打印）。这里以斯普瑞特打印机为例：\[斯普瑞特官网 <https://www.sprinter.com.cn/>![ ](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/de40327294274003baddaf273eefda80~tplv-k3u1fbpfcp-zoom-1.image)在进行数据通信之前，我们需要知道打印机在此局域网下的 **IP，** 下图为“一键配网”工具

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/60e62ad59077418784712bb6b60a3401~tplv-k3u1fbpfcp-watermark.image?)
 通过这个工具我们可以方便快捷的查询到打印机的IP，或者可以根据空闲的网段来修改默认分配的IP，斯普瑞特POS打印机的端口是**9100。**

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e1f85fe8d96f416cb1d83058e9b4be5a~tplv-k3u1fbpfcp-watermark.image?)

如果是其他品牌的打印机，我们也可以使用arp命令来查看当前局域网下的IP

拿到打印机的IP之后我们怎么来测试一下打印机呢？

我们可以使用telnet命令（这个在Windows系统一般默认是关闭的，需要我们手动打开）

    //telnet + 空格 + ip + 空格 + 端口号
    telnet 192.168.5.6 9100

打开命令行窗口输入telnet命令,按下回车

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ae6fa33431444f1786bd0a57cb83c1b6~tplv-k3u1fbpfcp-watermark.image?)

>  如果端口关闭或者无法连接，则显示不能打开到主机的链接，链接失败；端口打开的情况下，链接成功，则进入telnet页面（全黑的），证明端口可用。

连接成功后，我们输入任何内容后，按下回车，打印机就会打印我们刚才输入的内容。

接下来我们要使用scoket来连接安卓设备和打印机，这里我使用的是uniapp

    /**
     * 调用tcp通信进行打印
     * @param {buffer}  buffer       打印数据
     * @param {object}  printerInfo  打印机对象{IP:'',PORT:''}
     */
    function tcpWrite(buffer, printerInfo) {
      var Socket = plus.android.importClass("java.net.Socket");
      var PrintWriter = plus.android.importClass("java.io.PrintWriter");
      var BufferedWriter = plus.android.importClass("java.io.BufferedWriter");
      var OutputStreamWriter = plus.android.importClass("java.io.OutputStreamWriter");
      var BufferedReader = plus.android.importClass("java.io.BufferedReader");
      var InputStreamReader = plus.android.importClass("java.io.InputStreamReader");
      var InetSocketAddress = plus.android.importClass("java.net.InetSocketAddress");
      //连接  注意:这里的端口一定是数字类型
      var sk = null
      try {
        sk = new Socket(printerInfo.IP, Number(printerInfo.PORT));
        sk.setSoTimeout(5000);
      } catch (e) {
        console.log(e, 'ee')
        uni.showToast({
          icon: 'none',
          title: '打印机连接失败'
        })
      }
      //发送
      try {
        var outputStreamWriter = new OutputStreamWriter(sk.getOutputStream(), "GBK");
        var bufferWriter = new BufferedWriter(outputStreamWriter);
        var out = new PrintWriter(bufferWriter, true);
        out.println(buffer);
        //关闭tcp连接
        out.close();
      } catch (e) {
        console.log(e, 'ee')
        uni.showToast({
          icon: 'none',
          title: '打印机数据传输失败'
        })
      }
    }

### 打印小票

目前我们已经可以开心的使用打印功能了，只需要组合一下打印指令即可。这里需要注意的是，如果我们在此之前设置了字符大小宽高均放大2倍，那么后面打印的字符都会被放大，所以如果后面我们想使用默认字符大小，我们还需要再次设置字符大小为默认来覆盖之前的指令

    //这里的EscPosUtil.js就是上面封装的打印指令

    import Esc from './EscPosUtil.js';

    // 打印文字格式
    let strCenter = Esc.Center(); //文字居中
    let strLeft = Esc.Left(); //文字靠左
    let strSize1 = Esc.Size1(); //默认文字
    let strSize2 = Esc.Size2(17); //文字放大两倍（长宽均为两倍）

    let printerInfo = {
      IP:'192.168.5.6',
      PORT: 9100
    }


    let strCmd = strCenter + Esc.Size2(17) + Esc.boldFontOn() + '测试门店'+ "\n";
      strCmd += strSize1 + Esc.fillLine(' ') + "\n"
      strCmd += strCenter + Esc.Size2(17) + Esc.boldFontOn() + '结账单-堂食'  + "\n";
      strCmd += strSize1 + Esc.fillLine(' ') + "\n"
      strCmd += strLeft + Esc.Size2(17) + "取餐号:" + '62' + "\n";
      strCmd += Esc.inline('桌号:' + '牡丹厅', '人数:' + '6', ' ', 2) + "\n"
      strCmd += Esc.boldFontOff() + strSize1 + Esc.fillLine(' ') + "\n"
      strCmd += strLeft + strSize1 + "订单号:" + '202305171749110001' + "\n";

      // 商品信息
      strCmd += Esc.fillAround('商品') + "\n"
      // 票尾
      strCmd += Esc.fillLine(' ') + "\n"
      strCmd += strCenter + '欢迎下次光临!' + "\n";
      strCmd += Esc.feedLines(4) + "\n"
      // 切纸
      strCmd += Esc.cutPaper()

    tcpWrite(strCmd, printerInfo)

### 打印效果（这里仅为展示，非上述代码打印）

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4de1bfb345c34fe99314973448eb07d2~tplv-k3u1fbpfcp-watermark.image?)

### 3.USB打印机

这里我使用的是uniapp插件市场的插件，如果你了解安卓原生开发，你也可以自己制作一个原生插件，或者使用Native.js开发。使用原生插件在本地调试需要先打包“自定义调试基座”，在本地测试后再打正式包。

[uni-app基于nativejs实现USB-OTG通讯 - 简书1，监听USB拔出连接，判断是否含有权限 2，获取权限后，打开设备实现连接 3，读写发送接受数据![ 转存失败，建议直接上传图片文件](<转存失败，建议直接上传图片文件 >)https://www.jianshu.com/p/7c308ffcd789](https://www.jianshu.com/p/7c308ffcd789 "uni-app基于nativejs实现USB-OTG通讯 - 简书")

[uni-app官网uni-app,uniCloud,serverless![ ](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/31d16adbe33740dfad44176584516505~tplv-k3u1fbpfcp-zoom-1.image)https://uniapp.dcloud.net.cn/plugin/native-plugin.html#%E6%9C%AC%E5%9C%B0%E6%8F%92%E4%BB%B6-%E9%9D%9E%E5%86%85%E7%BD%AE%E5%8E%9F%E7%94%9F%E6%8F%92%E4%BB%B6](https://uniapp.dcloud.net.cn/plugin/native-plugin.html#%E6%9C%AC%E5%9C%B0%E6%8F%92%E4%BB%B6-%E9%9D%9E%E5%86%85%E7%BD%AE%E5%8E%9F%E7%94%9F%E6%8F%92%E4%BB%B6 "uni-app官网")

[Android USB接口热敏小票打印机插件usbPrinter - DCloud 插件市场本插件提供安卓手机通过USB接口连接热敏小票打印机进行打印的相关功能。通过USB连接相比使用蓝牙连接更稳定。![ ](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/768370c6395a409ca027128acb29e187~tplv-k3u1fbpfcp-zoom-1.image)https://ext.dcloud.net.cn/plugin?id=7757](https://ext.dcloud.net.cn/plugin?id=7757 "Android USB接口热敏小票打印机插件usbPrinter - DCloud 插件市场")

在使用USB插件后，我们可以监听USB设备的插入和拔出，在初始化之后，我们可以进行数据通信，将上面封装的打印指令传给打印机即可

#  二、网页打印

由于是网页运行在浏览器中，所以我们只能使用浏览器给我们提供的API

## 1.windows.print()

这个API在不同的浏览器中会有差异，其作用就是可以把网页中的body元素打印出来，如果我们不想打印整个body元素，则需要将body的innerHTML替换。使用这种方式有时有些页面样式会和打印出来的不一样，那么我们就要使用其他方式来优化。

    //使用方法

    document.body.innerHTML = newstr;  // 把需要打印的指定内容赋给body
    window.print();

### 1.1使用媒体查询

```

@media print {
  //把需要打印时才用到的样式写到这里
  p{
    font-size:16px;
  }
}
```

同理，你也可以直接在CSS文件或者style标签中加上 media="print"

    <style media="print">
    //CSS代码
    </style>

### 1.2监听打印事件

    //监听打印之前的事件
    window.onbeforeprint = function() {
      //可以修改元素样式
    }


    //监听打印之后的事件
    window.onafterprint = function() {
       //恢复之前的样式
    }

### 1.3分页符

  1.3.1 page-break-before  指定元素前插入分页符

  1.3.2 page-break-after  指定元素后插入分页符

| 值       | 描述                                 |
| ------- | ---------------------------------- |
| auto    | 默认。如果必要则在元素后插入分页符。                 |
| always  | 在元素后插入分页符。                         |
| avoid   | 避免在元素后插入分页符。                       |
| left    | 在元素之后足够的分页符，一直到一张空白的左页为止。          |
| right   | 在元素之后足够的分页符，一直到一张空白的右页为止。          |
| inherit | 规定应该从父元素继承 page-break-after 属性的设置。 |

> **1.** 您不能对绝对定位的元素使用此属性。
>
> **2.** 请尽可能少地使用分页属性，并且避免在表格、浮动元素、带有边框的块元素中使用分页属性。
>
> **3.** 任何版本的Internet Explorer（包括IE8）支持属性值"left"，"right"，和"inherit"。
>
> **4.** Firefox，Chrome和Safari不支持属性值"avoid"，"left"和"right"。.

    @media print {
        footer {page-break-after: always;}
    }

1.3.3 page-break-inside  设置是否在指定元素中插入分页符 

| 值       | 描述                                  |
| ------- | ----------------------------------- |
| auto    | 默认。如果必要则在元素内部插入分页符。                 |
| avoid   | 避免在元素内部插入分页符。                       |
| inherit | 规定应该从父元素继承 page-break-inside 属性的设置。 |

> 1.  您不能对绝对定位的元素使用此属性。
> 2.  请尽可能少地使用分页属性，并且避免在表格、浮动元素、带有边框的块元素中使用分页属性。
> 3.  IE8 及更早IE版本不支持 "inherit" 属性。
> 4.  Firefox, Chrome, 以及 Safari 不支持属性值 "avoid".

    //避免在 <pre> 与 <blockquote> 元素中插入分页符:

    @media print {
        pre, blockquote {page-break-inside: avoid;}
    }

### 1.4设置纸张

@page:  用来设置页面大小、边距、方向等

    //portrait：纵向；  landscape: 横向

    @page {
        size: A4 portrait;  //设置纸张及其方向    这里表示使用A4纸张，打印方向为纵向 
        margin: 3.7cm 2.6cm 3.5cm; //设置纸张外边距
    }
     
    // 去除页眉
    @page { margin-top: 0; }
     
    // 去除页脚
    @page { margin-bottom: 0; }

>  值得注意的是，如果我们使用的打印机是黑白打印的，比如针式打印机，那么我们使用的颜色最好是 **#000**，如果使用 **#999**这种灰色，打印效果会很不清晰

#  三、结尾

如果您有什么好的建议和想法，欢迎讨论

​
