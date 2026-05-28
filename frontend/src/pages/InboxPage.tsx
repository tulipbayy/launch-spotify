import { useState } from "react";
import "../InboxPage.css";

type Message = {
  id: number;
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
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      name: "User123",
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
      members: ["You", "Maya", "Alex", "User456"],
      messages: [
        { id: 1, text: "Drop your favorite songs here", sender: "them", time: "9:18 AM" },
        { id: 2, text: "I’ll add mine after class", sender: "me", time: "9:20 AM" },
      ],
    },
    {
      id: 3,
      name: "User456",
      status: "offline",
      isGroup: false,
      messages: [
        { id: 1, text: "Send me your playlist!", sender: "them", time: "Yesterday" },
      ],
    },
  ]);

  const [selectedChatId, setSelectedChatId] = useState(1);
  const [newMessage, setNewMessage] = useState("");

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function sendMessage() {
    if (!newMessage.trim()) return;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: Date.now(),
                  text: newMessage,
                  sender: "me",
                  time: getCurrentTime(),
                },
              ],
            }
          : chat
      )
    );

    setNewMessage("");
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
                      <span>{lastMessage.time}</span>
                    </div>

                    <p>{lastMessage.text}</p>

                    {chat.isGroup && (
                      <small>{chat.members?.length} members</small>
                    )}
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
                    <p className="members">
                      {selectedChat.members?.join(", ")}
                    </p>
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