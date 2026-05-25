import WebSocket from "ws";
import crypto from "crypto";
import fs from "fs";
import os from "os";

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

const wsc = new WebSocket("ws://localhost:3000/send");

wsc.on("ping", () =>
  wsc.send(JSON.stringify({ message: "Connection established" })),
);

wsc.on("open", () => console.log("Connection is open!"));

wsc.on("message", (msg) => {
  if (msg.toString().startsWith("SERVER:{")) {
    process.stdout.write(msg.toString() + "\n");
    return;
  }

  const privateKey = fs.readFileSync(
    `${os.homedir()}/.simpleE2EEChat/priv_key_USER.pem`,
    "utf8",
  );
  const decryptedMsg = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    msg as Buffer,
  );

  process.stdout.write(decryptedMsg.toString("utf8") + "\n");
});

let currentMessage = "";

process.stdin.on("data", async (key) => {
  if (key === "\u0003") process.exit();

  if (key === "\r") {
    const data = await fetch(
      "http://localhost:3000/api/publickey/06ee06be-0f14-48ba-8863-2650e03565ad",
    );

    const { key } = await data.json();

    const encryptedMsg = crypto.publicEncrypt(
      {
        key,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(currentMessage, "utf8"),
    );
    wsc.send(encryptedMsg);
    process.stdout.write("\r\n");
    currentMessage = "";
  }

  if (key === "\u007f") {
    currentMessage = currentMessage.slice(0, -1);
    process.stdout.write("\r\x1b[K");
    process.stdout.write(currentMessage);
    return;
  }

  currentMessage += key;
  process.stdout.write(key);
});

wsc.on("error", (err) => console.error(err));
