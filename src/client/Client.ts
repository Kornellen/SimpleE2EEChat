import { loginHandler, LoginHandler } from "./common/LoginHandler";

export class Client {
  private loginHandler: LoginHandler;
  constructor() {
    this.loginHandler = loginHandler;
    this.loginHandler.userLogin();
  }
}

new Client();
