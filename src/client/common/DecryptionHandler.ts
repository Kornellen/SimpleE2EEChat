import crypto from "crypto";
import { userState } from "./UserState";
import { keyRing, KeyRing } from "./KeyRing";

export class DecrptionHandler {
  private static userState = userState;
  private static keyRing: KeyRing = keyRing;
  public static decryptWithUserPrivateKey(msg: string | Buffer) {
    let buffer = typeof msg === "string" ? Buffer.from(msg, "base64") : msg;

    const decryptedMsg = crypto.privateDecrypt(
      {
        key: this.keyRing.userPrivateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      buffer,
    );

    return decryptedMsg;
  }

  public static decryptMessage(message: string) {
    const messageBuffer = Buffer.from(message, "base64");

    const iv = messageBuffer.slice(0, 16);
    const authTag = messageBuffer.slice(-16);
    const encrypted = messageBuffer.slice(16, -16);

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      KeyRing.conversationKey,
      iv,
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }
}
