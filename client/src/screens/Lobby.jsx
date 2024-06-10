import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);

      // Simulate an asynchronous task, like a server request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`, { state: { email, room } });
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-3xl font-bold mb-4 text-center">Join a Room</h1>
        <form onSubmit={handleSubmitForm} className="mb-4">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold mb-1">
              Email ID
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 w-full transition duration-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="room" className="block text-sm font-semibold mb-1">
              Room Number
            </label>
            <input
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="border p-2 w-full transition duration-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            className={`bg-blue-500 text-white py-2 px-4 w-full transition duration-300 ${
              isLoading ? "cursor-not-allowed" : "hover:bg-blue-600"
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Joining..." : "Join"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;
