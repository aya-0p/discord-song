import { Client, GuildMember, IntentsBitField, Snowflake, TextBasedChannel, VoiceChannel } from "discord.js";
import {
  AudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import { commands } from "./commands";
import { VOICEVOX } from "./voicevox";
import { Duplex } from "stream";
import { isSong, parseEasyScore, parseNotes } from "./parseSong";
import { Queue } from "./queue.js";
import { entersState } from "@discordjs/voice";

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
  if (message.author.bot || message.author.system || message.flags.has("Ephemeral")) return;
  const voiceConnection = voiceConnections.get(message.guildId ?? "");
  if (!voiceConnection) return;
  if (isSong(message.content)) {
    const score = parseNotes(message.content);
    VOICEVOX.singFrameAudioQuery(score.teacher, {
      notes: score.notes,
    })
      .then((singFrameAudioQuery) => {
        singFrameAudioQuery.f0 = singFrameAudioQuery.f0.map((f0) => f0 * 2 ** (score.voicePitch / 12));
        VOICEVOX.frameSynthesis(singFrameAudioQuery, score.singer)
          .then((data) => {
            voiceConnection.waitingList.add(data);
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
  } else if (message.content.startsWith("き")) {
    const score = parseEasyScore(message.content);
    VOICEVOX.singFrameAudioQuery(6000, {
      notes: score,
    })
      .then((singFrameAudioQuery) => {
        VOICEVOX.frameSynthesis(singFrameAudioQuery, 3001)
          .then((data) => {
            voiceConnection.waitingList.add(data);
          })
          .catch((err) => {
            console.error(err);
          });
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
