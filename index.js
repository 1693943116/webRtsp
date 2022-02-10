var doc = document,
  clientWidth = doc.body.clientWidth,
  clientHeight = doc.body.clientHeight,
  webRtcServer = null,
  channel = 1, // 通道（切换摄像机）
  nvrName = "",
  shelfNo = "",
  subChannel = "",
  video = doc.getElementById("video"),
  canvas = doc.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  sx,
  sy,
  sw,
  sh,
  rtsp,
  preData,
  //  历史视频数据
  hisData = [],
  hisCurrent = 0,
  hisWebRtcServer = [],
  hisVideos = [],
  hisrafId = 0; // 历史视频的循环id
canvas.width = clientWidth;
canvas.height = clientHeight;

// 处理传递过来的数据
function dealHisColRol(data) {
  nvrName = data.nvrNameP || "";
  shelfNo = data.shelfNoP || "";
  channel = data.mainChannel || "";
  sx = +data.sx || 0;
  sy = +data.sy || 0;
  sw = +data.sw || 0;
  sh = +data.sh || 0;
}
function dealColRow() {
  // 显示全部
  if (sx == 0 && sy == 0 && sw == 0 && sh == 0) {
    video.style.display = "block";
    canvas.style.display = "none";

    return true;
  }
  // 显示某一块
  canvas.style.display = "block";
  video.style.display = "none";
}
// 绘制canvas
function comDraw(his, comVideo) {
  // 判断是否为历史视频的调用
  if (his && hisVideos.length <= 0) return;
  ctx.clearRect(0, 0, clientWidth, clientHeight); // clear canvas
  ctx.drawImage(comVideo, sx, sy, sw, sh, 0, 0, clientWidth, clientHeight);
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
  //canvas自适应宽高
  hisVideos[hisCurrent].addEventListener("loadeddata", (event) => {
    if (hisCurrent > 0) {
      hisVideos[hisCurrent - 1].style.display = "none";
      hisWebRtcServer[hisCurrent - 1].disconnect();
      // doc.body.removeChild(hisVideos[hisCurrent - 1]);
    }
    hisVideos[hisCurrent].style.display = "block";
    // 处理current number
    dealHisColRol(hisData[hisCurrent]);
    // 显示全部
    if (sx == 0 && sy == 0 && sw == 0 && sh == 0) {
      hisVideos[hisCurrent].style.display = "block";
      canvas.style.display = "none";
    } else {
      // 显示某一块
      canvas.style.display = "block";
      hisVideos[hisCurrent].style.display = "none";
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      // 绘制canvas
      comDraw(true, hisVideos[hisCurrent]);
    }
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

function dealRtsp(data) {
  rtsp = data.rtsp;
  webRtcServer = new WebRtcStreamer("video", webrtcServerAddress);
  webRtcServer.connect(rtsp);
  dealCanvas();
}

function dealCanvas() {
  dealColRow();
  if (canvas.style.display == "block") {
    //canvas自适应宽高
    video.addEventListener("loadeddata", (event) => {
      // video.width = video.videoWidth;
      // video.height = video.videoHeight;
      console.log(video.videoWidth, video.videoHeight);
      canvas.width = clientWidth;
      canvas.height = clientHeight;

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

function cancelWebRtcServer(selfWebRtcServer) {
  if (selfWebRtcServer) {
    selfWebRtcServer.disconnect();
    webRtcServer = null;
  }
}
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

