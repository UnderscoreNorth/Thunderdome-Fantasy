import express from "express";
import cors from "cors";
import config from "../config.json";
import { generateGame, toJson, turn } from "./game";
const app = express();
const port = config.port;
generateGame(200);
turn();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/get", async (req, res, next) => {
  res.send(await toJson());
});

app.listen(port, () => {
  console.log(`Thunderdome listening on port ${port}`);
});

export default app;
