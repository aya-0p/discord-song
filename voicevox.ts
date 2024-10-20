import axios from "axios";
import "dotenv/config";

let ready: boolean = false;
const onReadyFn: Array<() => void> = [];

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
  connectWaves: async (waves: Array<Buffer>) => {
    const result = await axios.post(
      `${process.env.VOICEVOX as string}/connect_waves`,
      [...waves.map((wave) => wave.toString("base64"))],
      {
        responseType: "arraybuffer",
        timeout: 60 * 60 * 1000,
      },
    );
    return Buffer.from(result.data as ArrayBuffer);
  },
  engineManifest: createEngineManifest(),
  frameSynthesis: async (frameAudioQuery: FrameAudioQuery, speaker: number) => {
    const result = await axios.post(`${process.env.VOICEVOX as string}/frame_synthesis`, frameAudioQuery, {
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
  onReady: (fn: () => void) => {
    if (ready) {
      fn();
    } else {
      onReadyFn.push(fn);
    }
  },
  singFrameAudioQuery: async (speaker: number, singFrame: Score) => {
    const result = await axios.post(`${process.env.VOICEVOX as string}/sing_frame_audio_query`, singFrame, {
      params: {
        speaker: speaker,
      },
      timeout: 60 * 60 * 1000,
    });
    return result.data as FrameAudioQuery;
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

void axios
  .get(`${process.env.VOICEVOX as string}/engine_manifest`, {
    timeout: 60 * 60 * 1000,
  })
  .then((result) => {
    VOICEVOX.engineManifest = result.data as EngineManifest;
    ready = true;
    onReadyFn.forEach((fn) => fn());
  });

function createEngineManifest(): EngineManifest {
  //@ts-expect-error aaa
  return null;
}

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

interface FrameAudioQuery {
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

interface EngineManifest {
  manifest_version: string;
  name: string;
  brand_name: string;
  uuid: string;
  url: string;
  icon: string;
  default_sampling_rate: number;
  frame_rate: number;
  terms_of_service: string;
  update_infos: Array<UpdateInfo>;
  dependency_licenses: Array<DependencyLicense>;
  supported_vvlib_manifest_version: string;
  supported_features: {
    adjust_mora_pitch: boolean;
    adjust_phoneme_length: boolean;
    adjust_speed_scale: boolean;
    adjust_pitch_scale: boolean;
    adjust_intonation_scale: boolean;
    adjust_volume_scale: boolean;
    adjust_pause_length: boolean;
    interrogative_upspeak: boolean;
    synthesis_morphing: boolean;
    sing: boolean;
    manage_library: boolean;
    return_resource_url: boolean;
  };
}

interface UpdateInfo {
  version: string;
  descriptions: Array<string>;
  contributors: Array<string>;
}

interface DependencyLicense {
  name: string;
  version: string;
  license: string;
  text: string;
}
