import { Note, VOICEVOX } from "./voicevox";

/** 曲の開始 */
const songStart = ["歌", "曲", "s", "S"];
/** 区切り文字 */
const sep = [" ", "　", "\n", "\r", "\t", ";", "；"];

// 音
/** ド */
const do_ = ["ド", "c", "C", "ど", "と", "ト"];
/** レ */
const re = ["レ", "d", "D", "れ"];
/** ミ */
const mi = ["ミ", "e", "E", "み"];
/** ファ */
const fa = ["フ", "f", "F", "ふ"];
/** ソ */
const so = ["ソ", "g", "G", "そ"];
/** ラ */
const ra = ["ラ", "a", "A", "ら"];
/** シ */
const si = ["シ", "b", "B", "し"];
/** 休符 */
const rest = ["n", "N", "休", "ん", "m", "M", "ン"];

// 高さ
/** 高 */
const high = ["上", "h", "H", "↑"];
/** 低 */
const low = ["下", "l", "L", "↓"];

// 数字
/** 0 */
const zero = ["0", "０"];
/** 1 */
const one = ["1", "１"];
/** 2 */
const two = ["2", "２"];
/** 3 */
const three = ["3", "３"];
/** 4 */
const four = ["4", "４"];
/** 5 */
const five = ["5", "５"];
/** 6 */
const six = ["6", "６"];
/** 7 */
const seven = ["7", "７"];
/** 8 */
const eight = ["8", "８"];
/** 9 */
const nine = ["9", "９"];

// 長さ
/** 0.25拍(16分音符) */
const note16 = six;
/** 0.5拍(8分音符) */
const note8 = eight;
/** 1拍(4分音符) */
const note4 = ["-", "ー", ...four];
/** 2拍(2分音符) */
const note2 = two;
/** 4拍(全音符) */
const note1 = one;
/** 3連符 */
const note3 = three;
/** 5連符 */
const note5 = five;
/**
 * 付点
 * 1つ前の音符の長さが1.5倍になる
 */
const dotNote = ["+", "＋", ".", "。"];

/** 歌詞 */
const lyrics = ["_", "＿", "/"];

// 半音
/** 半音上げる */
const sharp = ["#", "＃", "♯"];
/** 半音下げる */
const flat = ["b", "ｂ", "♭"];

const basePitches = [...zero, ...one, ...two, ...three, ...four, ...five, ...six, ...seven, ...eight, ...nine];
const octaveOffsets = [...high, ...low];
const noteTypes = [...do_, ...re, ...mi, ...fa, ...so, ...ra, ...si, ...rest];
const halfNotes = [...sharp, ...flat];
const noteLengths = [...note1, ...note2, ...note4, ...note8, ...note16];
const tuplets = [...note3, ...note5];

/**
 * 全ての制御文字
 * 開始文字と区切り文字を除く
 */
const controlChars = [
  ...basePitches,
  "-",
  "ー",
  ...octaveOffsets,
  ...noteTypes,
  ...halfNotes,
  ...dotNote,
  ...lyrics,
  "{",
  "}",
];

// デフォルト値

// テンポ
// b分音符を1分(60秒に)a回打つ速さ
// 音楽のテンポ
const defaultTempo = 120; // a
// テンポの対象音符
const defaultTempoNote = 4; // b

// 拍子記号
// m分のn拍子
// 1小節あたりの拍子数
const defaultMeterHigh = 4; // n
// 1拍が何分音符になるか
const defaultMeterLow = 4; // m

// 歌詞
const defaultLyric = "ら";

function checkIsChar(...arr: Array<Array<string>>) {
  arr.forEach((inArr) =>
    inArr.forEach((text) => {
      if (text.length !== 1) {
        console.error(
          `error: [checkIsChar] ${text} is not 1 char, is ${text[0]} + ${text[1]} (${text.charCodeAt(
            0,
          )} + ${text.charCodeAt(1)})`,
        );
      }
    }),
  );
}

checkIsChar(controlChars);

/**
 * 入力文字列が曲かどうかを識別する
 * @returns 1文字目が`songStart`で2文字目が`sep`であれば`true`
 */
export function isScore(text: string) {
  return songStart.includes(text[0]) && sep.includes(text[1]);
}

export function isEasyScore(text: string) {
  return text[0] === "き" && [" ", "\n"].includes(text[1]);
}

function calcFrame({ noteLength, tempo, tempoNote }: CalcFlameOptions, frameOffset: { offset: number }) {
  // 四分音符=60 = 八分音符=120
  // 4 / tempoNote;
  // テンポが60のとき、1拍=1s
  // 60 / tempo;
  // 音符の長さ
  // 4 / noteLength;
  // 1s = (VOICEVOX.engineManifest.frame_rate)f
  // (4 / tempoNote) * (60 / tempo) * (4 / noteLength) * VOICEVOX.engineManifest.frame_rate;
  const frameLength = (960 * VOICEVOX.engineManifest.frame_rate) / tempo / tempoNote / noteLength;
  let intFrameLength = Math.floor(frameLength);
  frameOffset.offset += frameLength % 1;
  if (frameOffset.offset >= 1) {
    intFrameLength++;
    frameOffset.offset--;
  }
  return {
    frameLength: intFrameLength,
    frameOffset,
  };
}

function calcKey(basePitch: number, noteType: number, pitchChanges: number) {
  return 12 * (basePitch + 1) + noteType + pitchChanges;
}

/**
 * 楽譜をVOICEVOXが読み取れる形にする
 */
export function parseNotes(input: string) {
  if (VOICEVOX.engineManifest == null) throw new Error("Engine Manifestが読み込まれていません");
  /** 現在のテンポ */
  let tempo = defaultTempo;
  /** テンポの対象音符 */
  let tempoNote = defaultTempoNote;
  //  未使用
  /** 1小節あたりの拍子数 */
  const _meterHigh = defaultMeterHigh;
  /** 1拍が何分音符になるか */
  const _meterLow = defaultMeterLow;
  /** 中間生成物生成時に使われるスタイルID */
  let teacher = 6000;
  /** 音声生成時に使われるスタイルID */
  let singer = 3001;
  /** 楽譜全体の音をこの値だけずらして中間生成物を生成する */
  let scorePitch = 0;
  /** 中間生成物をこの値だけずらして音声を生成する */
  let voicePitch = 0;
  /** 一番最初の設定かどうか */
  let firstSettings = true;
  /** フレーム値の小数の値 */
  const frameOffset = { offset: 0 };
  /** 音符 */
  const notes: Array<Note> = [{ frame_length: 94, lyric: "" }];

  for (const noteStr of input.split(new RegExp(`[${sep.join("")}]`))) {
    /**
     * 音の高さ
     * ドが0
     * NaNは休符
     * -100で音符が存在しないことを示す
     */
    let noteType = -100;
    /**
     * 音の長さ
     * 全音符が1、4分音符が4
     */
    let noteLength = 8;
    /**
     * オクターブ
     */
    let octave = 4;
    let currentType: CurrentType = CurrentType.C_OCTAVE;
    /** 歌詞 未指定で「ら」 */
    let lyric = defaultLyric;
    /** 歌詞入力モードかどうか */
    let isLyricMode = false;
    /** 設定 */
    const settings = {
      /** 設定内容 */
      data: new Map<ScoreSettings, string>(),
      /** 今読んでいるのがキーか */
      isReadingKey: true,
      /** キーの仮保存 */
      tempKey: "",
      /** 値の仮保存 */
      tempValue: "",
    };
    if (noteStr[0] === "{") currentType = CurrentType.B_SETTINGS;
    for (const noteChar of noteStr) {
      // 歌詞入力モードでない、設定入力モードでない、制御文字でない場合、この文字を無視する
      if (!isLyricMode && currentType !== CurrentType.B_SETTINGS && !controlChars.includes(noteChar)) continue;
      switch (currentType) {
        case CurrentType.A_VOID:
          break;
        case CurrentType.B_SETTINGS: {
          // 設定開始
          if (noteChar === "{") {
            break;
            // 設定終了
          } else if (noteChar === "}") {
            settings.data.set(settings.tempKey as ScoreSettings, settings.tempValue);
            for (const [key, value] of settings.data) {
              switch (key) {
                case ScoreSettings.Teacher: {
                  if (!firstSettings) break;
                  const changedTeacher = Number(value);
                  if (Number.isInteger(changedTeacher)) teacher = changedTeacher;
                  break;
                }
                case ScoreSettings.Singer: {
                  if (!firstSettings) break;
                  const changedSinger = Number(value);
                  if (Number.isInteger(changedSinger)) singer = changedSinger;
                  break;
                }
                case ScoreSettings.ScorePitch: {
                  if (!firstSettings) break;
                  const changedScorePitch = Number(value);
                  if (Number.isInteger(changedScorePitch)) scorePitch = changedScorePitch;
                  break;
                }
                case ScoreSettings.VoicePitch: {
                  if (!firstSettings) break;
                  const changedVoicePitch = Number(value);
                  if (Number.isInteger(changedVoicePitch)) voicePitch = changedVoicePitch;
                  break;
                }
                case ScoreSettings.Tempo: {
                  const changedTempo = Number(value);
                  if (Number.isInteger(changedTempo)) tempo = changedTempo;
                  break;
                }
                case ScoreSettings.TempoNote: {
                  const changedtempo_note = Number(value);
                  if (Number.isInteger(changedtempo_note)) tempoNote = changedtempo_note;
                  break;
                }
                default: {
                  break;
                }
              }
            }
            // 以後の文字を無視する
            currentType = CurrentType.A_VOID;
            break;
            // 区切り文字の時
          } else if (noteChar === ",") {
            settings.data.set(settings.tempKey as ScoreSettings, settings.tempValue);
            settings.tempKey = "";
            settings.tempValue = "";
            settings.isReadingKey = true;
            break;
            // 次から値を読む
          } else if (noteChar === "=") {
            settings.isReadingKey = false;
            break;
            // キーを読んでいる時
          } else if (settings.isReadingKey) {
            settings.tempKey += noteChar;
            break;
            // 値を読んでいる時
          } else {
            settings.tempValue += noteChar;
            break;
          }
        }
        case CurrentType.C_OCTAVE: {
          // オクターブ基準
          if (basePitches.includes(noteChar)) {
            if (zero.includes(noteChar)) {
              octave = 0;
            } else if (one.includes(noteChar)) {
              octave = 1;
            } else if (two.includes(noteChar)) {
              octave = 2;
            } else if (three.includes(noteChar)) {
              octave = 3;
            } else if (four.includes(noteChar)) {
              octave = 4;
            } else if (five.includes(noteChar)) {
              octave = 5;
            } else if (six.includes(noteChar)) {
              octave = 6;
            } else if (seven.includes(noteChar)) {
              octave = 7;
            } else if (eight.includes(noteChar)) {
              octave = 8;
            } else if (nine.includes(noteChar)) {
              octave = 9;
            } else {
              console.error("unknown string", noteChar, "in", basePitches);
            }
            currentType = CurrentType.D_OCTAVE_OFFSET;
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case CurrentType.D_OCTAVE_OFFSET: {
          // オクターブ上下
          if (octaveOffsets.includes(noteChar)) {
            if (high.includes(noteChar)) {
              octave++;
            } else if (low.includes(noteChar)) {
              octave--;
            } else {
              console.error("unknown string", noteChar, "in", octaveOffsets);
            }
            currentType = CurrentType.E_PITCH;
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case CurrentType.E_PITCH: {
          // 音
          if (noteTypes.includes(noteChar)) {
            if (do_.includes(noteChar)) {
              noteType = 0;
            } else if (re.includes(noteChar)) {
              noteType = 2;
            } else if (mi.includes(noteChar)) {
              noteType = 4;
            } else if (fa.includes(noteChar)) {
              noteType = 5;
            } else if (so.includes(noteChar)) {
              noteType = 7;
            } else if (ra.includes(noteChar)) {
              noteType = 9;
            } else if (si.includes(noteChar)) {
              noteType = 11;
            } else if (rest.includes(noteChar)) {
              noteType = NaN;
            } else {
              console.error("unknown string", noteChar, "in", basePitches);
            }
            currentType = CurrentType.F_PITCH_OFFSET;
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case CurrentType.F_PITCH_OFFSET: {
          // 半音
          if (halfNotes.includes(noteChar)) {
            if (sharp.includes(noteChar)) {
              noteType++;
            } else if (flat.includes(noteChar)) {
              noteType--;
            } else {
              console.error("unknown string", noteChar, "in", halfNotes);
            }
            currentType = CurrentType.G_LENGTH;
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case CurrentType.G_LENGTH: {
          // 長さ
          if (noteLengths.includes(noteChar)) {
            if (note1.includes(noteChar)) {
              noteLength = 1;
            } else if (note2.includes(noteChar)) {
              noteLength = 2;
            } else if (note4.includes(noteChar)) {
              noteLength = 4;
            } else if (note8.includes(noteChar)) {
              noteLength = 8;
            } else if (note16.includes(noteChar)) {
              noteLength = 16;
            } else {
              console.error("unknown string", noteChar, "in", noteLengths);
            }
            currentType = CurrentType.H_TUPLETS;
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case CurrentType.H_TUPLETS: {
          // 連符
          if (tuplets.includes(noteChar)) {
            if (note3.includes(noteChar)) {
              noteLength = (noteLength * 2) / 3;
            }
            if (note5.includes(noteChar)) {
              noteLength = (noteLength * 4) / 5;
            } else {
              console.error("unknown string", noteChar, "in", tuplets);
            }
            currentType = CurrentType.I_DOT;
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case CurrentType.I_DOT: {
          // 付点
          if (dotNote.includes(noteChar)) {
            noteLength *= 1.5;
            currentType = CurrentType.J_LYRIC;
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case CurrentType.J_LYRIC: {
          // 歌詞
          if (isLyricMode) {
            lyric += noteChar;
            break;
          } else if (lyrics.includes(noteChar)) {
            isLyricMode = true;
            currentType = CurrentType.J_LYRIC;
            lyric = "";
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        default: {
          console.error("無効な文字です", noteChar, "in", noteStr);
        }
      }
    }
    // 音符がない
    if (noteType === -100) {
      continue;
      // 休符
    } else if (Number.isNaN(noteType)) {
      notes.push({
        frame_length: calcFrame({ noteLength, tempo, tempoNote }, frameOffset).frameLength,
        lyric: "",
      });
      // 音符がある
    } else {
      notes.push({
        frame_length: calcFrame({ noteLength, tempo, tempoNote }, frameOffset).frameLength,
        key: calcKey(octave, noteType, scorePitch),
        lyric,
      });
      firstSettings = false;
    }
  }
  // 楽譜の最後には休符が必要
  notes.push({ frame_length: 94, lyric: "" });
  return {
    notes,
    singer,
    teacher,
    voicePitch,
  };
}

const smallChar = [
  "ぁ",
  "ぃ",
  "ぅ",
  "ぇ",
  "ぉ",
  "っ",
  "ゃ",
  "ゅ",
  "ょ",
  "ゎ",
  "ァ",
  "ィ",
  "ゥ",
  "ェ",
  "ォ",
  "ャ",
  "ュ",
  "ョ",
  "ヮ",
];

export function parseEasyScore(input: string) {
  if (VOICEVOX.engineManifest == null) throw new Error("Engine Manifestが読み込まれていません");
  /** 音符入力か歌詞入力か */
  let isNote = true;
  /** 音符 */
  const notes: Array<Note> = [];
  /** 音の長さ */
  let noteLength = 8;
  /** 音の高さ */
  let key = NaN;
  /** オクターブの移動 */
  let octaveOffset = 0 as -1 | 0 | 1;
  /** 歌詞 */
  let lyric = "";
  let lyricIndex = 0;
  const frameOffset = { offset: 0 };
  function pushNote() {
    if (Number.isNaN(key) || key === 0) {
      notes.push({
        frame_length: calcFrame({ noteLength, tempo: 120, tempoNote: 4 }, frameOffset).frameLength,
        lyric: "",
      });
    } else {
      notes.push({
        frame_length: calcFrame({ noteLength, tempo: 120, tempoNote: 4 }, frameOffset).frameLength,
        key: key + 12 * octaveOffset,
        lyric: "ら",
      });
    }
    noteLength = 8;
    key = NaN;
    octaveOffset = 0;
  }
  function pushLyric() {
    if (lyric === "") return;
    const note = notes.at(lyricIndex);
    if (!note) return;
    if (note.key == null) {
      lyricIndex++;
      pushLyric();
      return;
    } else {
      note.lyric = lyric;
      lyricIndex++;
      return;
    }
  }
  function setKeyShift(shift: -1 | 1) {
    pushNote();
    octaveOffset = shift;
  }
  function setKey(k: number) {
    if (octaveOffset === 0 || !Number.isNaN(key)) {
      pushNote();
    }
    key = k;
  }
  notes.push({ frame_length: 30, lyric: "" });
  for (let i = 0; i < input.length; i++) {
    if (i < 2) continue;
    const char = input[i];
    const charCode = char.charCodeAt(0);
    // 歌詞入力モードで文字が以下のものの時
    if (
      !isNote &&
      ((charCode >= 0x3041 && charCode <= 0x3094) || (charCode >= 0x30a1 && charCode <= 0x30f4) || charCode === 0x30f6)
    ) {
      // 文字が小文字の時、一つ前の歌詞に追加する
      if (smallChar.includes(char)) {
        lyric += char;
      } else {
        pushLyric();
        lyric = char;
      }
    } else if (char === "上") {
      setKeyShift(1);
    } else if (char === "下") {
      setKeyShift(-1);
    } else if (char === "ど" || char === "と") {
      setKey(60);
    } else if (char === "れ") {
      setKey(62);
    } else if (char === "み") {
      setKey(64);
    } else if (char === "ふ") {
      setKey(65);
    } else if (char === "そ") {
      setKey(67);
    } else if (char === "ら") {
      setKey(69);
    } else if (char === "し") {
      setKey(71);
    } else if (char === "#" || char === "＃" || char === "♯") {
      key++;
    } else if (char === "b" || char === "♭") {
      key--;
    } else if (char === "ー") {
      noteLength = 4;
    } else if (char === "か") {
      pushNote();
      isNote = false;
    } else if (char === "ん") {
      setKey(0);
    }
  }
  if (isNote) pushNote();
  else pushLyric();
  notes.push({ frame_length: 30, lyric: "" });
  return notes;
}

interface CalcFlameOptions {
  tempo: number;
  tempoNote: number;
  noteLength: number;
}

enum CurrentType {
  A_VOID = -1,
  B_SETTINGS = 0,
  C_OCTAVE = 1,
  D_OCTAVE_OFFSET = 2,
  E_PITCH = 3,
  F_PITCH_OFFSET = 4,
  G_LENGTH = 5,
  H_TUPLETS = 6,
  I_DOT = 7,
  J_LYRIC = 8,
}

enum ScoreSettings {
  Teacher = "teacher",
  Singer = "singer",
  ScorePitch = "score_pitch",
  VoicePitch = "voice_pitch",
  Tempo = "tempo",
  TempoNote = "tempo_note",
}
