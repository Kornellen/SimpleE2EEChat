import crypto from "crypto";
import { KeyRing, keyRing } from "./KeyRing";

export class EncryptionHandler {
  private static keyRing = keyRing;
  public static encryptMessage(message: string) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      KeyRing.conversationKey,
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(message, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const fullBuffer = Buffer.concat([iv, encrypted, authTag]);

    return fullBuffer.toString("base64");
  }

  public static encryptWithUserPublicKey(msg: Buffer) {
    const encryptedMsg = crypto.publicEncrypt(
      {
        key: this.keyRing.reciverPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      msg,
    );

    return encryptedMsg;
  }
}
