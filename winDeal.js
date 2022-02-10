// 监听尺寸变化
var winResize = new ResizeObserver(function (entries) {
  entries.forEach((entry) => {
    const width = doc.body.clientWidth,
      height = doc.body.clientHeight;
    if (width) {
      clientWidth = width;
      clientHeight = height;

      canvas.width = width;
      canvas.height = height;
      for (let i = 0, len = hisVideos.length; i < len; i++) {
        hisVideos[i].width = clientWidth;
        hisVideos[i].height = clientHeight;
      }
    }
    // 被销毁
    else {
      cancelWebRtcServer(webRtcServer);
      cancelAnimations(hisrafId);
      // 清除历史视频
      cancelHisVideo(hisVideos, hisWebRtcServer);
    }
  });
});
winResize.observe(doc.getElementById("bodys"));

// 监听传递过来的数据
window.addEventListener("message", function (e) {
  // 清除历史视频
  cancelHisVideo(hisVideos, hisWebRtcServer);
  // 判断是否为历史视频
  if (Array.isArray(JSON.parse(e.data))) {
    // 取消绘制canvas
    cancelAnimations(hisrafId);
    // 将之前的隐藏掉
    video.style.display = "none";
    canvas.style.display = "none";
    preData = null;

    hisData = JSON.parse(e.data);

    for (let i = 0; i < hisData.length; i++) {
      hisVideo = doc.createElement("video");
      hisVideo.id = "video" + i;
      hisVideo.width = clientWidth;
      hisVideo.height = clientHeight;
      hisVideo.style.display = "none";
      hisVideo.autoplay = true; // 自动播放打开
      hisVideo.muted = true; // 静音播放打开 不然无法自动播放 怕突然有声音吓到用户
      hisVideo.loop = false;
      hisVideos.push(hisVideo);
      doc.body.appendChild(hisVideo);
      if (i == 0) {
        const webRtcServerResult = new WebRtcStreamer(
          hisVideo,
          webrtcServerAddress
        );
        hisWebRtcServer.push(webRtcServerResult);
      }
    }
    dealHis(hisCurrent);
    return;
  }
  // =========================================================================以前逻辑================================================================================================

  if (preData === e.data) {
    return;
  }
  // 取消绘制canvas
  cancelAnimations(hisrafId);
  preData = e.data;
  var data = JSON.parse(e.data);

  dealHisColRol(data);
  // rtsp一样 判断是否切换区域播放
  if (rtsp && rtsp === data.rtsp) {
    // video或者cavas显示
    dealColRow();
    // 开始绘制
    comDraw(false, video);
  }
  // 重新连接
  if (rtsp && rtsp !== data.rtsp) {
    cancelWebRtcServer(webRtcServer);
    dealRtsp(data);
  }
  // 初次连接
  if (!rtsp) {
    dealRtsp(data);
  }
});

window.onload = function () {
  var controlEl = document.getElementById("cameraControl");
  var areaEl = document.getElementById("areaControl");
  var flag = 0;
  var a = window.location.href.split("?")[1];
  var b = a.split("&");
  b.forEach((item) => {
    var c = item.split("=");
    if (c[0] === "control") {
      flag = parseInt(c[1]);
    }
  });
  if (!flag) {
    controlEl.parentNode.removeChild(controlEl);
    areaEl.parentNode.removeChild(areaEl);
  }
};
window.onbeforeunload = function () {
  winResize.disconnect();
  webRtcServer.disconnect();
};
