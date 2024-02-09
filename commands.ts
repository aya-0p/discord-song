import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder().setName("join").setDescription("ボイスチャンネルに参加").setDMPermission(false).toJSON(),
  new SlashCommandBuilder().setName("leave").setDescription("ボイスチャンネルから退出").setDMPermission(false).toJSON(),
];
