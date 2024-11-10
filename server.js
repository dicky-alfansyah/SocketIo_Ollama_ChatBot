const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { ChatOllama } = require("@langchain/ollama");
const path = require("path");

const PORT = 3000;
const app = express();

// Middleware untuk mengizinkan CORS dan melayani file statis dari folder 'public'
app.use(cors());
app.use(express.static("public"));

// Membuat server HTTP dan inisialisasi Socket.IO dengan konfigurasi CORS
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Inisialisasi model ChatOllama
const model = new ChatOllama({
  // baseUrl: "http://localhost:11434", // end point
  model: "llama3.2:latest", // Model Ollama yang akan digunakan
});


// Endpoint untuk index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Mengelola koneksi Socket.IO
io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  // Mendengarkan pesan dari klien
  socket.on("message", async (message) => {
    console.log(`Pesan diterima: ${message}`);

    try {
      // Mendefinisikan konteks percakapan
      const conversation = [
        [
          "system",
          "Dicky adalah asisten AI yang ahli dalam semua bidang. Pastikan respon secara singkat dalam bahasa Indonesia .",
        ],
        ["human", message],
      ];

      // Mendapatkan respons model
      const aiResponse = await model.invoke(conversation);
      const responseContent = aiResponse && aiResponse.content ? aiResponse.content : "Maaf, tidak ada respons yang dapat diberikan saat ini.";

      // Mengirim respons teks ke klien
      socket.emit("botResponse", responseContent);
    } catch (error) {
      console.error("Terjadi kesalahan saat berkomunikasi dengan ChatOllama:", error);
      socket.emit("botResponse", "Maaf, ada masalah teknis.");
    }
  });

  // Mengelola pemutusan koneksi pengguna
  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// Menjalankan server
server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});