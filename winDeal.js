// 监听尺寸变化（解决全屏播放 canvas尺寸不变的bug）
var winResize = new ResizeObserver(function (entries) {
  entries.forEach((entry) => {
    const width = entry.contentRect.width;
    if (width) {
      clientWidth = entry.contentRect.width;
      clientHeight = entry.contentRect.height;
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    }
    // 被销毁 关闭全屏时
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
    // 将实时摄像播放隐藏掉
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
  // =========================================================================实时视频================================================================================================
  // 如果推流数据和上次一样 则不作处理
  if (preData === e.data) {
    return;
  }
  // 取消绘制canvas
  cancelAnimations(hisrafId);
  preData = e.data;
  var data = JSON.parse(e.data);

  // 计算出是否分区 以及分多少区
  dealHisColRol(data);
  dealRowCol();
  // rtsp一样 判断是否切换区域播放
  if (rtsp && rtsp === data.rtsp) {
    if (+number >= +current && current > 0) {
      // video或者cavas显示
      dealColRow();
      // 计算出一个区域的宽高
      colRowSize();
      // 开始绘制
      comDraw(false, video);
    }
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

window.onbeforeunload = function () {
  // 关闭监听尺寸
  winResize.disconnect();

  cancelAnimations(hisrafId);
  cancelWebRtcServer(webRtcServer);
  cancelHisVideo(hisVideos, hisWebRtcServer);
};
