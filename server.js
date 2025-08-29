const express = require("express");
const redis = require("redis");
const path = require("path");

const app = express();
let cli = null;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/pedido", async (req, res) => {
  const { itens } = req.body;

  if (!itens || itens.length === 0) {
    return res.status(400).json({ error: "O carrinho está vazio." });
  }

  try {
    const pedidoId = `pedido:${Date.now()}`;

    for (const item of itens) {
      await cli.hSet(
        pedidoId,
        item.nome,
        `Qtd: ${item.quantidade}, Preço Unit: R$ ${item.preco.toFixed(2)}`
      );
    }

    console.log(`Pedido ${pedidoId} recebido e salvo com sucesso:`, itens);
    res.status(200).json({ status: "Pedido enviado!", pedidoId: pedidoId });
  } catch (err) {
    console.error("Erro ao salvar o pedido no Redis:", err);
    res.status(500).json({ error: "Erro ao processar o pedido." });
  }
});

app.listen(3000, async () => {
  cli = redis.createClient({
    socket: {
      host: "192.168.0.34",
      port: 6379,
    },
  });

  cli.on("error", function (error) {
    console.error(error);
  });

  try {
    await cli.connect();
    console.log("Conectado ao Redis:", cli.isOpen);
    const ret = await cli.ping();
    console.log("Ping Redis:", ret);
    console.log("Servidor rodando na porta 3000...");
  } catch (error) {
    console.error("Não foi possível conectar ao Redis:", error);
  }
});
