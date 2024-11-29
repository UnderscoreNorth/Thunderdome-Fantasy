import express from "express";
import cors from "cors";
import config from "../config.json";
import { generateGame, newGame, retrieveJson, toJson, turn } from "./game";
import compression from "compression";
import { existsSync, mkdirSync } from "fs";
const app = express();
const port = config.port;
if (!existsSync("./games")) mkdirSync("./games");
if (!config.freq) throw "Missing freq in config.json";
if (!config.pass) throw "Missing pass in config.json";
if (!config.port) throw "Missing port in config.json";
runTurn();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(compression({ filter: shouldCompress }));

function shouldCompress(req, res) {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compression.filter(req, res);
}
app.use("/get", async (req, res, next) => {
  res.send(retrieveJson(req.query.id as string));
});
app.listen(port, () => {
  console.log(`Thunderdome listening on port ${port}`);
});
app.use("/auth", async (req, res, next) => {
  res.send({ auth: req.body.pass == config.pass });
});
app.use("/turn", async (req, res, next) => {
  turn();
  res.send(retrieveJson(req.query.id as string));
});
app.use("/newGame", async (req, res, next) => {
  if (req.body.pass !== config.pass) {
    res.send({});
    return;
  }
  newGame(req.body);
  res.send({});
});
function runTurn() {
  turn();
  setTimeout(() => {
    runTurn();
  }, config.freq - (new Date().getTime() % config.freq));
}

export default app;
