import { prisma } from "../../prisma/prisma";
import { PublicKey, User } from "../models/prisma/client";
import bcrypt from "bcrypt";
import fs from "fs";
import crypto from "crypto";
import os from "os";
import { HttpError } from "../helpers/HttpError";
import { IUserService, PublicKeyDTO, UserDTO } from "./UserService.interface";

export type Mapper<T, R> = (data: T) => R;

const userMapper: Mapper<User, UserDTO> = (user: User): UserDTO => ({
  id: user.id,
  name: user.name,
});

export class UserService implements IUserService {
  constructor() {
    console.log("Hello From UserService");
  }

  public async login(name: string, inputPassword: string): Promise<UserDTO> {
    const dbResult = await prisma.user.findUnique({
      where: { name: name },
    });
    if (!dbResult)
      throw new HttpError("User not found!", 404, "User Not Found");

    if (bcrypt.compareSync(inputPassword, dbResult.password))
      return userMapper(dbResult);
    else throw new HttpError("Invalid Credentials", 403, "Forbidden");
  }
  public async register(name: string, password: string): Promise<UserDTO> {
    try {
      const salt: string = bcrypt.genSaltSync(10);
      const hashedPsswd = bcrypt.hashSync(password, salt);

      const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "pkcs1",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs1",
          format: "pem",
        },
      });

      const appDir = `${os.homedir()}/.simpleE2EEChat`;
      if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });
      fs.writeFileSync(`${appDir}/priv_key_${name}.pem`, privateKey, "utf8");

      const user = await prisma.user.create({
        data: {
          name: name,
          password: hashedPsswd,
          publicKeys: { create: { key: publicKey } },
        },
      });

      return userMapper(user);
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
      else throw err;
    }
  }
  public async getPublicKey(userId: string): Promise<PublicKeyDTO> {
    const key = await prisma.publicKey.findFirst({ where: { userId: userId } });

    if (!key) {
      throw new HttpError("Key Not Found", 404, "KeyNotFoundError");
    }

    const keyMapper: Mapper<PublicKey, PublicKeyDTO> = (
      data: PublicKey,
    ): PublicKeyDTO => ({ key: data.key });

    return keyMapper(key);
  }

  public async getUserId(name: string): Promise<Pick<UserDTO, "id">> {
    const user = await prisma.user.findUnique({ where: { name: name } });

    if (!user) throw new HttpError("User not found", 404, "Not Found");

    return { id: user.id };
  }
}
