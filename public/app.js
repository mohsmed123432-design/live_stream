const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const callButton = document.getElementById('callButton');
let localStream;
let peerConnection;

const rtcSettings = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
            urls: 'turn:global.relay.metered.ca:80',
            username: '5f814049be5b8eb47e29ec3f',
            credential: 'wq66STAzGrF6bAyM'
        },
        {
            urls: 'turn:global.relay.metered.ca:80?transport=tcp',
            username: '5f814049be5b8eb47e29ec3f',
            credential: 'wq66STAzGrF6bAyM'
        },
        {
            urls: 'turn:global.relay.metered.ca:443',
            username: '5f814049be5b8eb47e29ec3f',
            credential: 'wq66STAzGrF6bAyM'
        }
    ]
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch(error => console.error('Error accessing media devices.', error));

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcSettings);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = event => { remoteVideo.srcObject = event.streams[0]; };
    peerConnection.onicecandidate = event => {
        if (event.candidate) socket.emit('ice-candidate', event.candidate);
    };
}

callButton.addEventListener('click', async () => {
    createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
});

socket.on('offer', async (offer) => {
    createPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async (candidate) => {
    if (peerConnection) await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
