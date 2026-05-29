import crypto from "crypto";
import { userState } from "./UserState";

export class DecrptionHandler {
  private static userState = userState;
  public static decryptWithUserPrivateKey(msg: string | Buffer) {
    let buffer = typeof msg === "string" ? Buffer.from(msg, "base64") : msg;

    const decryptedMsg = crypto.privateDecrypt(
      {
        key: this.userState.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      buffer,
    );

    return decryptedMsg;
  }

  public static decryptMessage(message: string, converKey: Buffer) {
    const messageBuffer = Buffer.from(message, "base64");

    const iv = messageBuffer.slice(0, 16);
    const authTag = messageBuffer.slice(-16);
    const encrypted = messageBuffer.slice(16, -16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", converKey, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }
}
