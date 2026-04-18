import cors from "cors";
import express from "express";
import http from "node:http";
import { WebSocketServer } from "ws";

const port = Number(process.env.PORT ?? 8080);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "*";
const llmBaseUrl = process.env.LLM_BASE_URL ?? "http://vllm-service.ai-chat.svc.cluster.local:8000/v1";
const postgresUrl = process.env.POSTGRES_URL ?? "";
const redisUrl = process.env.REDIS_URL ?? "";
const objectStorageEndpoint = process.env.OBJECT_STORAGE_ENDPOINT ?? "";

const app = express();
app.use(express.json());
app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    llmBaseUrl,
    postgresConfigured: postgresUrl.length > 0,
    redisConfigured: redisUrl.length > 0,
    objectStorageConfigured: objectStorageEndpoint.length > 0
  });
});

app.post("/api/chat", (req, res) => {
  const prompt = String(req.body?.message ?? "");
  res.json({
    message: `Backend is online. Replace this stub with the full agent loop. Received: ${prompt}`
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket, request) => {
  const url = new URL(request.url ?? "/ws", `http://${request.headers.host ?? "localhost"}`);
  const sessionId = url.searchParams.get("sessionId") ?? "anonymous";

  socket.send(
    JSON.stringify({
      type: "system",
      message: `Connected to the Akamai LKE chat backend as session ${sessionId}.`
    })
  );

  socket.on("message", (raw) => {
    const text = raw.toString();

    socket.send(
      JSON.stringify({
        type: "assistant",
        message: `Streaming placeholder response for: ${text}`
      })
    );
  });
});

server.listen(port, () => {
  console.log(`backend listening on port ${port}`);
});
