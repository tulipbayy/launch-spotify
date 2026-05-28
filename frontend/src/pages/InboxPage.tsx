import * as React from "react";
import { useEffect, useState } from "react";
import "../InboxPage.css";

type Message = {
  id: number | string;
  text: string;
  sender: "me" | "them";
  time: string;
};

type Chat = {
  id: number;
  name: string;
  status: "online" | "offline";
  isGroup: boolean;
  members?: string[];
  messages: Message[];
};

export default function InboxPage() {
  const params = new URLSearchParams(window.location.search);

  const CURRENT_USER_ID = localStorage.getItem("spotifyId") || "user123";
  const OTHER_USER_ID = params.get("recipientId") || "user456";
  const OTHER_USER_NAME = params.get("recipientName") || "User456";

  const API_URL = "http://localhost:5001/api/messages";

  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      name: OTHER_USER_NAME,
      status: "online",
      isGroup: false,
      messages: [
        { id: 1, text: "Have you heard this new album?", sender: "them", time: "10:32 AM" },
        { id: 2, text: "Yeah, it’s actually really good.", sender: "me", time: "10:33 AM" },
      ],
    },
    {
      id: 2,
      name: "Playlist Group",
      status: "online",
      isGroup: true,
      members: ["You", "Maya", "Alex", OTHER_USER_NAME],
      messages: [
        { id: 1, text: "Drop your favorite songs here", sender: "them", time: "9:18 AM" },
        { id: 2, text: "I’ll add mine after class", sender: "me", time: "9:20 AM" },
      ],
    },
  ]);

  const [selectedChatId, setSelectedChatId] = useState(1);
  const [newMessage, setNewMessage] = useState("");

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`${API_URL}/${CURRENT_USER_ID}/${OTHER_USER_ID}`);
        const data = await res.json();

        if (!Array.isArray(data)) return;

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === 1
              ? {
                  ...chat,
                  messages:
                    data.length > 0
                      ? data.map((msg: any) => ({
                          id: msg.id,
                          text: msg.text,
                          sender: msg.senderID === CURRENT_USER_ID ? "me" : "them",
                          time: msg.timestamp,
                        }))
                      : chat.messages,
                }
              : chat
          )
        );
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    }

    fetchMessages();
  }, [CURRENT_USER_ID, OTHER_USER_ID]);

  async function sendMessage() {
    if (!newMessage.trim()) return;

    if (selectedChat?.isGroup) {
      const localMessage = {
        id: Date.now(),
        text: newMessage,
        sender: "me" as const,
        time: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? { ...chat, messages: [...chat.messages, localMessage] }
            : chat
        )
      );

      setNewMessage("");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderID: CURRENT_USER_ID,
          recipientID: OTHER_USER_ID,
          text: newMessage,
        }),
      });

      const savedMessage = await res.json();

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: savedMessage.id,
                    text: savedMessage.text,
                    sender: "me",
                    time: savedMessage.timestamp,
                  },
                ],
              }
            : chat
        )
      );

      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  return (
    <main className="inbox-page">
      <section className="inbox-card">
        <div className="inbox-left">
          <div className="inbox-header">
            <h1>Inbox</h1>
            <p>Message other music fans</p>
          </div>

          <div className="search-bar">
            <span>⌕</span>
            <input type="text" placeholder="Search chats..." />
          </div>

          <div className="chat-list">
            {chats.map((chat) => {
              const lastMessage = chat.messages[chat.messages.length - 1];

              return (
                <button
                  key={chat.id}
                  className={
                    chat.id === selectedChatId ? "chat-row selected" : "chat-row"
                  }
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <div
                    className={`avatar ${
                      chat.status === "online" ? "online-avatar" : ""
                    }`}
                  >
                    {chat.isGroup ? "G" : chat.name.charAt(0)}
                  </div>

                  <div className="chat-info">
                    <div className="chat-name-row">
                      <h3>{chat.name}</h3>
                      <span>{lastMessage?.time}</span>
                    </div>

                    <p>{lastMessage?.text}</p>

                    {chat.isGroup && <small>{chat.members?.length} members</small>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedChat && (
          <div className="inbox-right">
            <div className="chat-header">
              <div className="active-user">
                <div
                  className={`avatar ${
                    selectedChat.status === "online" ? "online-avatar" : ""
                  }`}
                >
                  {selectedChat.isGroup ? "G" : selectedChat.name.charAt(0)}
                </div>

                <div>
                  <h2>{selectedChat.name}</h2>
                  {selectedChat.isGroup ? (
                    <p className="members">{selectedChat.members?.join(", ")}</p>
                  ) : (
                    <p className={selectedChat.status}>{selectedChat.status}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="messages">
              {selectedChat.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.sender === "me"
                      ? "message-wrap mine"
                      : "message-wrap theirs"
                  }
                >
                  <div
                    className={
                      message.sender === "me"
                        ? "message my-message"
                        : "message their-message"
                    }
                  >
                    {message.text}
                  </div>
                  <span className="message-time">{message.time}</span>
                </div>
              ))}
            </div>

            <div className="type-row">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button onClick={sendMessage}>➤</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}