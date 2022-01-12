var doc = document,
  clientWidth = doc.body.clientWidth,
  clientHeight = doc.body.clientHeight,
  webRtcServer = null,
  video = doc.getElementById("video"),
  canvas = doc.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  current, // 显示第几块区域
  number, // 总共分为多少块区域
  col = 1, // 分为多少列
  colWidth, // 每列宽度
  row, // 分为多少行
  rowHeight, // 每行高度
  rtsp, // rtsp流
  preData, // 上次传递过来的数据
  //  历史视频数据
  hisData = [], // 暂存的历史数据
  hisCurrent = 0, // 当前播放的历史视频
  hisWebRtcServer = [], // 历史视频的webrtsp服务实例
  hisVideos = [], // 有多少个历史视频 就创建多少个video标签
  hisrafId = 0; // requestAnimationFrame的id 方便清楚使用
canvas.width = clientWidth; // 将canvas尺寸填充满容器
canvas.height = clientHeight;

// 处理传递过来的数据 计算出分几区 显示哪一块 方便canvas裁切
function dealHisColRol(data) {
  current = data.current;
  number = data.number;
}
// 计算出分几区 例如number：9 current:3  就是 3*3  播放第三个区域
function dealRowCol() {
  if (+number >= +current && current > 0) {
    var resultNum = Math.sqrt(number),
      isInteger = Number.isInteger(resultNum);
    if (isInteger) {
      col = resultNum;
    } else {
      for (var i = 2; i < number; i++) {
        if (number % i === 0) {
          col = number / i;
          break;
        }
      }
    }
    if (+number === 2) {
      col = 2;
    }
  }
}
// 整块用video播放 区域播放用canvas裁切
function dealColRow() {
  // 显示全部
  if (+number === 1 || +col === 1) {
    video.style.display = "block";
    canvas.style.display = "none";
    return true;
  }
  // 显示某一块
  canvas.style.display = "block";
  video.style.display = "none";
}
// 计算出每一个区域的宽高
function colRowSize() {
  colWidth = video.videoWidth / col; // 列（每列宽度）
  row = Math.floor(number / col); // 行（分为几行）
  rowHeight = video.videoHeight / row; // 行（每行高度）
}
// 绘制canvas
function comDraw(his, comVideo) {
  // 判断是否为历史视频的调用 从历史视频切换回实时视频要将历史视频的分区播放关掉
  if (his && hisVideos.length <= 0) return;
  ctx.clearRect(0, 0, clientWidth, clientHeight); // clear canvas
  if (current <= col) {
    ctx.drawImage(
      comVideo,
      (current - 1) * colWidth,
      0,
      colWidth,
      rowHeight,
      0,
      0,
      clientWidth,
      clientHeight
    );
  } else {
    if (current % col === 0) {
      const nowRow = current / col;
      ctx.drawImage(
        comVideo,
        (col - 1) * colWidth,
        rowHeight * (nowRow - 1),
        colWidth,
        rowHeight,
        0,
        0,
        clientWidth,
        clientHeight
      );
    } else {
      ctx.drawImage(
        comVideo,
        ((current % col) - 1) * colWidth,
        rowHeight * Math.floor(current / col),
        colWidth,
        rowHeight,
        0,
        0,
        clientWidth,
        clientHeight
      );
    }
  }
  hisrafId = window.requestAnimationFrame(() => {
    // 历史视频的处理
    if (his) {
      comDraw(true, comVideo);
    } else {
      comDraw(false, comVideo);
    }
  });
}
// 历史视频处理 
function dealHis(hisCurrent) {
  hisWebRtcServer[hisCurrent].connect(hisData[hisCurrent].rtsp);
  
  hisVideos[hisCurrent].addEventListener("loadeddata", (event) => {
    // 关闭上一个历史视频的播放和rtsp流
    if (hisCurrent > 0) {
      hisVideos[hisCurrent - 1].style.display = "none";
      hisWebRtcServer[hisCurrent - 1].disconnect();
      // doc.body.removeChild(hisVideos[hisCurrent - 1]);
    }
    // 本次video显示播放
    hisVideos[hisCurrent].style.display = "block";
    // 处理current number
    dealHisColRol(hisData[hisCurrent]);
    // 计算出分几区
    dealRowCol();
    // 播放全页面
    if (+number === 1 || +col === 1) {
      hisVideos[hisCurrent].style.display = "block";
      canvas.style.display = "none";
    } else {
      // 分区播放
      canvas.style.display = "block";
      hisVideos[hisCurrent].style.display = "none";
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      colWidth = hisVideos[hisCurrent].videoWidth / col; // 列（每列宽度）
      row = Math.floor(number / col); // 行（分为几行）
      rowHeight = hisVideos[hisCurrent].videoHeight / row; // 行（每行高度）
      // 绘制canvas
      comDraw(true, hisVideos[hisCurrent]);
    }
    // 预加载下一个历史视频 减少rtsp连接的等待时间
    const timeOut = setTimeout(() => {
      clearTimeout(timeOut);
      var hisCurrentNext = hisCurrent + 1;
      if (hisCurrentNext >= hisData.length) return;
      const webRtcServerResult = new WebRtcStreamer(
        hisVideos[hisCurrentNext],
        webrtcServerAddress
      );
      hisWebRtcServer.push(webRtcServerResult);

      hisCurrent = hisCurrentNext;
      dealHis(hisCurrent);
    }, hisData[hisCurrent].time - preloadTime);
  });
}
// 处理实时摄像播放
function dealRtsp(data) {
  rtsp = data.rtsp;
  webRtcServer = new WebRtcStreamer("video", webrtcServerAddress);
  webRtcServer.connect(rtsp);

  +number >= +current && current > 0 && dealCanvas();
}

function dealCanvas() {
  dealColRow();
  if (canvas.style.display == "block") {
    video.addEventListener("loadeddata", (event) => {
      // video.width = video.videoWidth;
      // video.height = video.videoHeight;
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      colRowSize();
      comDraw(false, video);
    });
  }
}
// 取消requestAnimationFrame
function cancelAnimations(selfHisrafId) {
  if (selfHisrafId) {
    window.cancelAnimationFrame(selfHisrafId);
    hisrafId = 0;
  }
}
// 取消rtsp流连接
function cancelWebRtcServer(selfWebRtcServer) {
  if (selfWebRtcServer) {
    selfWebRtcServer.disconnect();
    webRtcServer = null;
  }
}
// 关闭历史视频播放
function cancelHisVideo(selfHisVideos, selfHisWebRtcServer) {
  if (selfHisVideos.length > 0) {
    selfHisVideos.forEach(function (item, index) {
      const result = doc.getElementById("video" + index);
      if (result) doc.body.removeChild(result);
    });
    selfHisWebRtcServer[selfHisWebRtcServer.length - 1].disconnect();
  }
  hisData = [];
  hisCurrent = 0;
  hisWebRtcServer = [];
  hisVideos = [];
}
