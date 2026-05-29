import crypto from "crypto";

export class EncryptionHandler {
  public static encryptMessage(message: string, key: Buffer) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([
      cipher.update(message, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const fullBuffer = Buffer.concat([iv, encrypted, authTag]);

    return fullBuffer.toString("base64");
  }

  public static encryptWithUserPublicKey(msg: Buffer, key: string) {
    const encryptedMsg = crypto.publicEncrypt(
      {
        key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      msg,
    );

    return encryptedMsg;
  }
}
