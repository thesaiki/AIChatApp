import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
};

function createSocketUrl(sessionId: string) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws?sessionId=${encodeURIComponent(sessionId)}`;
}

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const sessionId = window.crypto.randomUUID();
    const socket = new WebSocket(createSocketUrl(sessionId));

    socket.addEventListener("open", () => {
      setConnected(true);
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        const nextMessage: ChatMessage = {
          id: window.crypto.randomUUID(),
          role: payload.type === "system" ? "system" : "assistant",
          content: payload.message ?? String(event.data)
        };
        setMessages((current) => [...current, nextMessage]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: window.crypto.randomUUID(),
            role: "assistant",
            content: String(event.data)
          }
        ]);
      }
    });

    wsRef.current = socket;
    return () => socket.close();
  }, []);

  function sendMessage() {
    const value = input.trim();
    if (!value || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(value);
    setMessages((current) => [
      ...current,
      {
        id: window.crypto.randomUUID(),
        role: "user",
        content: value
      }
    ]);
    setInput("");
  }

  return (
    <main className="shell">
      <section className="card">
        <header className="hero">
          <div>
            <p className="eyebrow">Akamai LKE</p>
            <h1>Stateful AI Chat</h1>
          </div>
          <span className={connected ? "badge online" : "badge offline"}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </header>

        <section className="messages">
          {messages.length === 0 ? (
            <p className="empty">Send a message to test the WebSocket path through Akamai LKE.</p>
          ) : (
            messages.map((message) => (
              <article key={message.id} className={`message ${message.role}`}>
                <span className="role">{message.role}</span>
                <p>{message.content}</p>
              </article>
            ))
          )}
        </section>

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message"
          />
          <button type="submit">Send</button>
        </form>
      </section>
    </main>
  );
}
