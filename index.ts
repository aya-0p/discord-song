import { Client, GuildMember, IntentsBitField, VoiceChannel } from "discord.js";
import type { Snowflake, TextBasedChannel } from "discord.js";
import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  entersState,
} from "@discordjs/voice";
import type { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { commands } from "./commands";
import { VOICEVOX } from "./voicevox";
import { Duplex } from "stream";
import { isSong, parseEasyScore, parseNotes } from "./parseSong";
import { Queue } from "./queue.js";
import { generateMusic } from "./generateMusic";

const client = new Client({
  intents: [
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
  ],
});

const voiceConnections = new Map<Snowflake, Connection>();

client.on("messageCreate", (message) => {
  // Botによる投稿、システムによる投稿、見れる人が限られた投稿は無視
  if (message.author.bot || message.author.system || message.flags.has("Ephemeral")) return;
  const voiceConnection = voiceConnections.get(message.guildId ?? "");
  // 通話接続がなければ終了
  if (!voiceConnection) return;
  if (isSong(message.content)) {
    const score = parseNotes(message.content);
    generateMusic(score.teacher, score.singer, score.notes, score.voicePitch)
      .then((data) => {
        voiceConnection.waitingList.add(data);
      })
      .catch((err) => {
        console.error(err);
      });
  } else if (message.content.startsWith("き")) {
    const score = parseEasyScore(message.content);
    generateMusic(6000, 3001, score)
      .then((data) => {
        voiceConnection.waitingList.add(data);
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    const text = message.content;
    const speaker = 3; // 3: ずんだもん（ノーマル）
    VOICEVOX.audioQuery(text, speaker)
      .then((audioQuery) => {
        VOICEVOX.synthesis(audioQuery, speaker)
          .then((buffer) => {
            voiceConnection.waitingList.add(buffer);
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

client.on("interactionCreate", (interaction) => {
  (async () => {
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case "join": {
          const member = interaction.member;
          if (!(member instanceof GuildMember)) {
            void interaction.reply({
              content: "不明なエラーが発生しました",
              ephemeral: true,
            });
            if (!member) console.error("error: [join] member is null, not GuildMember");
            else console.error("error: [join] member is APIInteractionGuildMember, not GuildMember");
            return;
          }
          const guild = interaction.guild;
          if (!guild) {
            void interaction.reply({
              content: "不明なエラーが発生しました",
              ephemeral: true,
            });
            console.error("error: [join] guild is null");
            return;
          }
          const voiceChannel = member.voice.channel;
          if (!voiceChannel) {
            void interaction.reply({
              content: "ボイスチャンネルに参加していません",
              ephemeral: true,
            });
            return;
          }
          if (!(voiceChannel instanceof VoiceChannel)) {
            void interaction.reply({
              content: "ステージチャンネルには対応していません",
              ephemeral: true,
            });
            return;
          }
          const connection = voiceConnections.get(guild.id);
          if (connection) {
            connection.audioPlayer.stop();
            connection.connection.destroy();
            voiceConnections.delete(voiceChannel.id);
          }
          const audioPlayer = createAudioPlayer({
            behaviors: {
              maxMissedFrames: Number.MAX_SAFE_INTEGER,
              noSubscriber: NoSubscriberBehavior.Play,
            },
          });
          const newConnection = {
            audioPlayer,
            connection: joinVoiceChannel({
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-ignore
              adapterCreator: guild.voiceAdapterCreator,
              channelId: voiceChannel.id,
              guildId: guild.id,
              selfDeaf: false,
              selfMute: false,
            }),
            textChannel: interaction.channel,
            voiceChannel: voiceChannel,
            waitingList: new Queue<Buffer>(async (data) => {
              if (
                [
                  VoiceConnectionStatus.Connecting,
                  VoiceConnectionStatus.Destroyed,
                  VoiceConnectionStatus.Disconnected,
                ].includes(newConnection.connection.state.status)
              )
                return;
              const resource = createAudioResource(Duplex.from(data));
              newConnection.audioPlayer.play(resource);
              await entersState(newConnection.audioPlayer, AudioPlayerStatus.Idle, 60 * 60 * 1000);
              return;
            }),
          };
          newConnection.connection.subscribe(newConnection.audioPlayer);
          voiceConnections.set(guild.id, newConnection);
          void interaction.reply({
            content: "ボイスチャンネルに参加しました",
            ephemeral: true,
          });
          break;
        }
        case "leave": {
          const voiceConnection = voiceConnections.get(interaction.guildId ?? "");
          if (!voiceConnection) {
            const guild = interaction.guild;
            if (!guild) {
              void interaction.reply({
                content: "不明なエラーが発生しました",
                ephemeral: true,
              });
              console.error("error: [leave] guild is null");
              return;
            }
            const me = await guild.members.fetchMe().catch((err) => {
              console.error("error: [leave] failed to fetch me", err);
            });
            if (!me) {
              void interaction.reply({
                content: "不明なエラーが発生しました",
                ephemeral: true,
              });
              console.error("error: [leave] me is null");
              return;
            }
            me.voice.disconnect().catch((err) => {
              console.error("error: [leave] failed to disconnect", err);
            });
          } else {
            voiceConnection.audioPlayer.stop();
            voiceConnection.connection.destroy();
            voiceConnections.delete(interaction.guildId ?? "");
          }
          void interaction.reply({
            content: "ボイスチャンネルから退出しました",
            ephemeral: true,
          });
          break;
        }
      }
    }
  })().catch((err) => {
    console.error(err);
  });
});

client.on("ready", (client) => {
  void client.application.commands.set(commands);
});

void client.login(process.env.TOKEN);

VOICEVOX.getVersion().catch(() => {
  console.error("error: failed to connect to VOICEVOX");
  process.exit(1);
});

interface Connection {
  /**
   * 接続中のボイスチャンネル
   */
  voiceChannel: VoiceChannel;
  /**
   * 読み上げ対象のテキストチャンネル
   * voiceChannelも対象
   */
  textChannel: null | TextBasedChannel;
  connection: VoiceConnection;
  audioPlayer: AudioPlayer;
  waitingList: Queue<Buffer>;
}
