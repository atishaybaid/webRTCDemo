const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();
var socket = io();
var videoModule = (function () {

    async function initvideo() {
        const constraints = {
            video: true,
            audio: false
        };

        const videoEle = document.getElementById("local-video");
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            videoEle.srcObject = stream
            stream.getTracks().forEach((track) => {
                console.log("track");
                console.log(track);
                peerConnection.addTrack(track, stream)
            });

        } catch (error) {
            console.log("error occured while creating the stream");
            console.log(error);
        }


    }

    return {
        initvideo: initvideo
    }

})();


var activeConnection = [];

const checkExistingConnection = function (socketId) {
    if (activeConnection.indexOf(socketId) > -1) {
        return true;
    } else {
        return false;
    }
}
const hadleSocketConnection = function (socket) {
    const existing = checkExistingConnection(socket.id);
    if (!existing) {
        activeConnection.push(socket.id);
        socket.emit("update-user-list", {
            users: activeConnection.filter(
                existingSocket => existingSocket !== socket.id
            )
        });

        socket.broadcast.emit("update-user-list", {
            users: [socket.id]
        });
    }


}

var onClickCallBtn = async function (event) {
    console.log("onClickCallBtn  called");
    var callBtn = document.getElementById("callBtn");
    var socketId = callBtn.getAttribute("remote-client-id");
    console.log(socketId);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    socket.emit("call-user", {
        offer,
        to: socketId
    });

}
peerConnection.ontrack = function ({ streams: [stream] }) {
    const remoteVideo = document.getElementById("external-video");
    if (remoteVideo) {
        remoteVideo.srcObject = stream;
    }
}

var init = function () {

    socket.emit('chat message', "hey man wassup");
    socket.on("connection", hadleSocketConnection)
    socket.on("update-user-list", ({ users }) => {
        console.log(users);
        var callBtn = document.getElementById("callBtn");
        callBtn.innerText = `call ${users[0]}`;
        callBtn.setAttribute("remote-client-id", users[0]);
    });

    socket.on("call-made", async data => {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

        socket.emit("make-answer", {
            answer,
            to: data.socket
        });
    });
    let isAlreadyCalling = false;
    socket.on("answer-made", async data => {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
        );
        if (!isAlreadyCalling) {
            onClickCallBtn(data.socket);
            isAlreadyCalling = true;
        }

    });
    function hasGetUserMedia() {
        return !!(navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia);
    }

    if (hasGetUserMedia()) {
        videoModule.initvideo();
    } else {
        alert('getUserMedia() is not supported by your browser');
    }
    var callBtn = document.getElementById("callBtn");
    callBtn.addEventListener("click", onClickCallBtn);
    /* peerConnection.ontrack = function ({ streams: [stream] }) {
        const remoteVideo = document.getElementById("external-video");
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
        }
    }; */


};

window.addEventListener('DOMContentLoaded', (event) => {
    init();
    console.log('DOM fully loaded and parsed');
}) 