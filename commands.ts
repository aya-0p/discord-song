import { InteractionContextType, SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("ボイスチャンネルに参加")
    .setContexts([InteractionContextType.Guild])
    .toJSON(),
  new SlashCommandBuilder()
    .setName("leave")
    .setDescription("ボイスチャンネルから退出")
    .setContexts([InteractionContextType.Guild])
    .toJSON(),
];
