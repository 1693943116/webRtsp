var webrtcServerAddress = "http://localhost:8000";  // 本地ceshi 目录下的webrtc-streamer.exe双击 产生的地址  线上就是线上服务地址是rtsp的服务地址（后端）
var preloadTime = 2000; // 历史视频的预加载时间 默认提前两秒 上一个历史视频没播放完 下一个开始加载 减少等待时间
