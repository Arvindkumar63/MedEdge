import React, { useEffect, useCallback, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { FaPhone } from "react-icons/fa";
import peer from "../service/peer";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const [remoteEmail, setRemoteEmail] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [remoteRoom, setRemoteRoom] = useState("");

  const handleUserJoined = useCallback(({ email, id, room }) => {
    console.log(`Email ${email} joined room ${room} with ID: ${id}`);
    setRemoteSocketId(id);
    setRemoteEmail(email);
    setRemoteId(id);
    setRemoteRoom(room);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    peer.addStream(stream);
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(async ({ from, offer }) => {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    peer.addStream(stream);
    console.log(`Incoming Call`, from, offer);
    const ans = await peer.getAnswer(offer);
    socket.emit("call:accepted", { to: from, ans });
  }, [socket]);

  const sendStreams = useCallback(() => {
    if (myStream) {
      peer.addStream(myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(({ from, ans }) => {
    peer.setLocalDescription(ans);
    console.log("Call Accepted!");
    sendStreams();
  }, [sendStreams]);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket]);

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const [remoteStream] = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-4">Room Page</h1>
      <h4 className="mb-4">
        {remoteSocketId ? (
          <span className="text-green-500">
            Connected with {remoteEmail} (ID: {remoteId}) in room {remoteRoom}
          </span>
        ) : (
          <span className="text-red-500">No one in room</span>
        )}
      </h4>
      <div className="mb-4">
        {remoteSocketId && (
          <button
            onClick={handleCallUser}
            className="bg-green-500 text-white py-2 px-4 rounded-full flex items-center"
          >
            <FaPhone className="mr-2" />
            VIDEO CALL
          </button>
        )}
      </div>
      <div className="flex">
        {myStream && (
          <div className="mr-4">
            <h1 className="text-xl font-bold mb-2">My Stream</h1>
            <video
              autoPlay
              playsInline
              muted
              height="500px"
              width="700px"
              ref={(video) => {
                if (video) video.srcObject = myStream;
              }}
            />
          </div>
        )}

        {remoteStream && (
          <div>
            <h1 className="text-xl font-bold mb-2">Remote Stream</h1>
            <video
              autoPlay
              playsInline
              height="500px"
              width="700px"
              ref={(video) => {
                if (video) video.srcObject = remoteStream;
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
