export type PublicKeyDTO = { key: string };
export type UserDTO = { id: string; name: string };

export interface IUserService {
  login: (name: string, password: string) => Promise<UserDTO>;
  register: (name: string, password: string) => Promise<UserDTO>;

  getPublicKey: (userId: string) => Promise<PublicKeyDTO>;
}
