import { Help } from "./Help";
import { Select } from "./Select";
import { SelectChat } from "./SelectChat";
import { ShowCommands } from "./ShowCommands";
import { ShowKey } from "./ShowKey";
import { SwitchUser } from "./SwitchUser";

export { Help, Select, SelectChat, SwitchUser, ShowKey, ShowCommands };

export const COMMANDS = [
  new Help("help"),
  new Select("select"),
  new SelectChat("select chat"),
  new SwitchUser("switch user"),
  new ShowKey("show key"),
  new ShowCommands("list commands"),
];
