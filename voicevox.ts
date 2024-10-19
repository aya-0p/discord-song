import axios from "axios";
import "dotenv/config";

export const VOICEVOX = {
  audioQuery: async (text: string, speaker: number) => {
    const result = await axios.post(
      `${process.env.VOICEVOX as string}/audio_query`,
      {},
      {
        params: {
          speaker: speaker,
          text: text,
        },
        timeout: 60 * 60 * 1000,
      },
    );
    return result.data as AudioQuery;
  },
  frameSynthesis: async (singFrameAudioQuery: SingFrameAudioQuery, speaker: number) => {
    const result = await axios.post(`${process.env.VOICEVOX as string}/frame_synthesis`, singFrameAudioQuery, {
      params: {
        speaker: speaker,
      },
      responseType: "arraybuffer",
      timeout: 60 * 60 * 1000,
    });
    return Buffer.from(result.data as ArrayBuffer);
  },
  getVersion: async () => {
    const result = await axios.get(`${process.env.VOICEVOX as string}/version`, {
      timeout: 60 * 60 * 1000,
    });
    return result.data as string;
  },
  singFrameAudioQuery: async (speaker: number, singFrame: Score) => {
    const result = await axios.post(`${process.env.VOICEVOX as string}/sing_frame_audio_query`, singFrame, {
      params: {
        speaker: speaker,
      },
      timeout: 60 * 60 * 1000,
    });
    return result.data as SingFrameAudioQuery;
  },
  synthesis: async (audioQuery: AudioQuery, speaker: number) => {
    const result = await axios.post(`${process.env.VOICEVOX as string}/synthesis`, audioQuery, {
      params: {
        speaker: speaker,
      },
      responseType: "arraybuffer",
      timeout: 60 * 60 * 1000,
    });
    return Buffer.from(result.data as ArrayBuffer);
  },
};

interface AudioQuery {
  accent_phrases: Array<AccentPhrase>;
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana: null | string;
}

interface AccentPhrase {
  moras: Array<Mora>;
  accent: number;
  pause_mora: Mora | null;
  is_interrogative: boolean | null;
}

interface Mora {
  text: string;
  consonant: null | string;
  consonant_length: null | number;
  vowel: string;
  vowel_length: number;
  pitch: null | number;
}

interface Score {
  notes: Array<Note>;
}

export interface Note {
  key?: number;
  frame_length: number;
  lyric: string;
}

interface SingFrameAudioQuery {
  f0: Array<number>;
  volume: Array<number>;
  phonemes: Array<Phoneme>;
  volumeScale: number;
  outputSamplingRate: number;
  outputStereo: boolean;
}

interface Phoneme {
  phoneme: string;
  frame_length: number;
}
