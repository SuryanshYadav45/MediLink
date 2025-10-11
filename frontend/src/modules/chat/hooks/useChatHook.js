import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useChatSocket(listingId, onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Wait until we actually have a listingId
    if (!listingId) {
      console.warn("Waiting for listingId...");
      return;
    }

    console.log(" Connecting socket (cookie-based auth)...");

    // Create socket connection
    const socket = io("http://localhost:5001", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Join the room for the current listing
    socket.emit("joinRoom", { listingId });

    // Listen for incoming messages safely
    socket.on("receiveMessage", (message) => {
      if (typeof onMessage === "function") {
        onMessage(message);
      } else {
        console.error(" onMessage is not a function", onMessage);
      }
    });

    socket.on("connect", () => {
  
    });

    socket.on("disconnect", () => {
  
    });

    socket.on("error", (err) => {
      console.error(" Socket error:", err);
    });

    // Cleanup on unmount or change
    return () => {
      if (socketRef.current) {
    
        socketRef.current.disconnect();
      }
    };
  }, [listingId, onMessage]);

  //  Function to send a message
  const sendMessage = (text) => {
    if (!socketRef.current || !listingId) return;
    socketRef.current.emit("sendMessage", { listingId, text });
  };

  return { sendMessage };
}
