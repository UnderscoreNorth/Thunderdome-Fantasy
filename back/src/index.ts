import express from "express";
import cors from "cors";
import config from "../config.json";
import { generateGame, toJson, turn } from "./game";
import compression from "compression";
const app = express();
const port = config.port;
generateGame(200);
turn();

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
  res.send(await toJson());
});

app.listen(port, () => {
  console.log(`Thunderdome listening on port ${port}`);
});

export default app;
