import { Note } from "./voicevox";

/**
 * 曲の開始
 */
const songStart = ["歌", "曲", "s", "S"];
/**
 * 区切り文字
 */
const sep = [" ", "　", "\n", "\r", "\t", ";", "；"];

// 音
/**
 * ド
 */
const do_ = ["ド", "c", "C", "ど", "と", "ト"];
/**
 * レ
 */
const re = ["レ", "d", "D", "れ"];
/**
 * ミ
 */
const mi = ["ミ", "e", "E", "み"];
/**
 * ファ
 */
const fa = ["フ", "f", "F", "ふ"];
/**
 * ソ
 */
const so = ["ソ", "g", "G", "そ"];
/**
 * ラ
 */
const ra = ["ラ", "a", "A", "ら"];
/**
 * シ
 */
const si = ["シ", "b", "B", "し"];
/**
 * 休符
 */
const rest = ["n", "N", "休", "ん", "m", "M", "ン"];

// 高さ
/**
 * 高
 */
const high = ["上", "h", "H", "↑"];
/**
 * 低
 */
const low = ["下", "l", "L", "↓"];

// 数字
/**
 * 0
 */
const zero = ["0", "０"];
/**
 * 1
 */
const one = ["1", "１"];
/**
 * 2
 */
const two = ["2", "２"];
/**
 * 3
 */
const three = ["3", "３"];
/**
 * 4
 */
const four = ["4", "４"];
/**
 * 5
 */
const five = ["5", "５"];
/**
 * 6
 */
const six = ["6", "６"];
/**
 * 7
 */
const seven = ["7", "７"];
/**
 * 8
 */
const eight = ["8", "８"];
/**
 * 9
 */
const nine = ["9", "９"];

// 長さ
/**
 * 0.25拍(16分音符)
 */
const note16 = six;
/**
 * 0.5拍(8分音符)
 */
const note8 = eight;
/**
 * 1拍(4分音符)
 */
const note4 = ["-", "ー", ...four];
/**
 * 2拍(2分音符)
 */
const note2 = two;
/**
 * 4拍(全音符)
 */
const note1 = one;
/**
 * 3連符
 */
const note3 = three;
/**
 * 付点
 * 1つ前の音符の長さが1.5倍になる
 */
const notePlus = ["+", "＋", ".", "。"];

const lyrics = ["_", "＿", "/"];

// 半音
const sharp = ["#", "＃", "♯"];
const flat = ["b", "ｂ", "♭"];

const basePitches = [...zero, ...one, ...two, ...three, ...four, ...five, ...six, ...seven, ...eight, ...nine];
const pitchOffsets = [...high, ...low];
const noteTypes = [...do_, ...re, ...mi, ...fa, ...so, ...ra, ...si, ...rest];
const halfNotes = [...sharp, ...flat];
const noteLengths = [...note1, ...note2, ...note4, ...note8, ...note16];
const tuplets = [...note3];
// 全ての制御文字
// 開始文字と区切り文字を除く
const controlChars = [
  ...basePitches,
  "-",
  "ー",
  ...pitchOffsets,
  ...noteTypes,
  ...halfNotes,
  ...notePlus,
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

const checkIsChar = (...arr: Array<Array<string>>) => {
  arr.forEach((inArr) =>
    inArr.forEach((text) => {
      if (text.length !== 1) {
        console.error(
          `error: [checkIsChar] ${text} is not 1 char, is ${text[0]} + ${text[1]} (${text.charCodeAt(
            0
          )} + ${text.charCodeAt(1)})`
        );
      }
    })
  );
};
checkIsChar(controlChars);

export const isSong = (text: string) => {
  return songStart.some((t) => text[0] === t) && sep.some((t) => text[1] === t);
};

const calcFrame = ({ tempo, tempoNote, noteLength }: CalcFlameOptions, frameOffset: { offset: number }) => {
  // 四分音符=60 = 八分音符=120
  // 4 / tempoNote;
  // テンポが60のとき、1拍=1s
  // 60 / tempo;
  // 音符の長さ
  // 4 / noteLength;
  // 1s = 93.75f
  // (4 / tempoNote) * (60 / tempo) * (4 / noteLength) * 93.75;
  const frameLength = 90000 / tempo / tempoNote / noteLength;
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
};

const calcKey = (basePitch: number, noteType: number, pitchChanges: number) => {
  return 12 * (basePitch + 1) + noteType + pitchChanges;
};

/**
 * 楽譜をVOICEVOXが読み取れる形にする
 * @param input
 */
export const parseNotes = (input: string) => {
  let tempo = defaultTempo;
  let tempoNote = defaultTempoNote;
  let meterHigh = defaultMeterHigh;
  let meterLow = defaultMeterLow;
  let teacher = 6000;
  let singer = 3001;
  let scorePitch = 0;
  let voicePitch = 0;
  let firstSettings = true;
  let frameOffset = { offset: 0 };
  const notes: Array<Note> = [];
  notes.push({ frame_length: 94, lyric: "" });
  for (const noteStr of input.split(/[\u0020\u3000\u000a\u000d\u0009;；]/)) {
    let noteType = -1;
    let noteLength = 8;
    let basePitch = 4;
    let currentType = 1 as -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    let lyric = defaultLyric;
    let isLyricMode = false;
    const settings = {
      isReadingKey: true,
      data: new Map<string, string>(),
      tempKey: "",
      tempValue: "",
    };
    if (noteStr[0] === "{") currentType = 0;
    for (const noteChar of noteStr) {
      if (!isLyricMode && currentType !== 0 && !controlChars.includes(noteChar)) continue;
      switch (currentType) {
        case -1:
          break;
        case 0: {
          if (noteChar === "{") null;
          else if (noteChar === "}") {
            settings.data.set(settings.tempKey, settings.tempValue);
            for (const [key, value] of settings.data) {
              switch (key) {
                case "teacher": {
                  if (!firstSettings) break;
                  const changedTeacher = Number(value);
                  if (Number.isInteger(changedTeacher)) teacher = changedTeacher;
                  break;
                }
                case "singer": {
                  if (!firstSettings) break;
                  const changedSinger = Number(value);
                  if (Number.isInteger(changedSinger)) singer = changedSinger;
                  break;
                }
                case "score_pitch": {
                  if (!firstSettings) break;
                  const changedScorePitch = Number(value);
                  if (Number.isInteger(changedScorePitch)) scorePitch = changedScorePitch;
                  break;
                }
                case "voice_pitch": {
                  if (!firstSettings) break;
                  const changedVoicePitch = Number(value);
                  if (Number.isInteger(changedVoicePitch)) voicePitch = changedVoicePitch;
                  break;
                }
                case "tempo": {
                  const changedTempo = Number(value);
                  if (Number.isInteger(changedTempo)) tempo = changedTempo;
                  break;
                }
                case "tempo_note": {
                  const changedtempo_note = Number(value);
                  if (Number.isInteger(changedtempo_note)) tempoNote = changedtempo_note;
                  break;
                }
              }
            }
            currentType = -1;
          } else if (noteChar === ",") {
            settings.data.set(settings.tempKey, settings.tempValue);
            settings.tempKey = "";
            settings.tempValue = "";
            settings.isReadingKey = true;
          } else if (noteChar === "=") settings.isReadingKey = false;
          else if (settings.isReadingKey) settings.tempKey += noteChar;
          else settings.tempValue += noteChar;
          break;
        }
        case 1: {
          // 高さ基準
          if (basePitches.includes(noteChar)) {
            if (zero.includes(noteChar)) basePitch = 0;
            else if (one.includes(noteChar)) basePitch = 1;
            else if (two.includes(noteChar)) basePitch = 2;
            else if (three.includes(noteChar)) basePitch = 3;
            else if (four.includes(noteChar)) basePitch = 4;
            else if (five.includes(noteChar)) basePitch = 5;
            else if (six.includes(noteChar)) basePitch = 6;
            else if (seven.includes(noteChar)) basePitch = 7;
            else if (eight.includes(noteChar)) basePitch = 8;
            else if (nine.includes(noteChar)) basePitch = 9;
            else console.error("unknown string", noteChar, "in", basePitches);
            currentType = 2;
            break;
          }
        }
        case 2: {
          // 高さ上下
          if (pitchOffsets.includes(noteChar)) {
            if (high.includes(noteChar)) basePitch++;
            else if (low.includes(noteChar)) basePitch--;
            else console.error("unknown string", noteChar, "in", pitchOffsets);
            currentType = 3;
            break;
          }
        }
        case 3: {
          // 音
          if (noteTypes.includes(noteChar)) {
            if (do_.includes(noteChar)) noteType = 0;
            else if (re.includes(noteChar)) noteType = 2;
            else if (mi.includes(noteChar)) noteType = 4;
            else if (fa.includes(noteChar)) noteType = 5;
            else if (so.includes(noteChar)) noteType = 7;
            else if (ra.includes(noteChar)) noteType = 9;
            else if (si.includes(noteChar)) noteType = 11;
            else if (rest.includes(noteChar)) noteType = NaN;
            else console.error("unknown string", noteChar, "in", basePitches);
            currentType = 4;
            break;
          }
        }
        case 4: {
          // 半音
          if (halfNotes.includes(noteChar)) {
            if (sharp.includes(noteChar)) noteType++;
            else if (flat.includes(noteChar)) noteType--;
            else console.error("unknown string", noteChar, "in", halfNotes);
            currentType = 5;
            break;
          }
        }
        case 5: {
          // 長さ
          if (noteLengths.includes(noteChar)) {
            if (note1.includes(noteChar)) noteLength = 1;
            else if (note2.includes(noteChar)) noteLength = 2;
            else if (note4.includes(noteChar)) noteLength = 4;
            else if (note8.includes(noteChar)) noteLength = 8;
            else if (note16.includes(noteChar)) noteLength = 16;
            else console.error("unknown string", noteChar, "in", noteLengths);
            currentType = 6;
            break;
          }
        }
        case 6: {
          // 連符
          if (tuplets.includes(noteChar)) {
            if (note3.includes(noteChar)) noteLength = (noteLength * 2) / 3;
            else console.error("unknown string", noteChar, "in", tuplets);
            currentType = 7;
            break;
          }
        }
        case 7: {
          // 付点
          if (notePlus.includes(noteChar)) {
            noteLength *= 1.5;
            currentType = 8;
            break;
          }
        }
        case 8: {
          // 歌詞
          if (isLyricMode) {
            lyric += noteChar;
            break;
          } else if (lyrics.includes(noteChar)) {
            isLyricMode = true;
            currentType = 8;
            lyric = "";
            break;
          }
        }
        default: {
          console.error("ここには来ないはずです", noteChar, noteStr);
        }
      }
    }
    if (noteType === -1) continue;
    else if (Number.isNaN(noteType))
      notes.push({
        frame_length: calcFrame({ tempo, tempoNote, noteLength }, frameOffset).frameLength,
        lyric: "",
      });
    else
      notes.push({
        key: calcKey(basePitch, noteType, scorePitch),
        frame_length: calcFrame({ tempo, tempoNote, noteLength }, frameOffset).frameLength,
        lyric,
      });
    firstSettings = false;
  }
  notes.push({ frame_length: 94, lyric: "" });
  return {
    notes,
    teacher,
    singer,
    voicePitch,
  };
};

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

export const parseEasyScore = (input: string) => {
  let isNote = true;
  const notes: Array<Note> = [];
  let noteLength = 8;
  let key = NaN;
  let keyShift = 0 as -1 | 0 | 1;
  let lyric = "";
  let lyricIndex = 0;
  const frameOffset = { offset: 0 };
  function pushNote() {
    if (Number.isNaN(key)) {
      key = -1;
      return;
    }
    if (key === -1)
      notes.push({
        lyric: "",
        frame_length: calcFrame({ tempo: 120, tempoNote: 4, noteLength }, frameOffset).frameLength,
      });
    else
      notes.push({
        lyric: "ら",
        frame_length: calcFrame({ tempo: 120, tempoNote: 4, noteLength }, frameOffset).frameLength,
        key: key + 12 * keyShift,
      });
    noteLength = 8;
    key = -1;
    keyShift = 0;
  }
  function pushLyric() {
    if (lyric === "") return;
    const note = notes.at(lyricIndex);
    if (!note) return;
    if (!note.key) {
      lyricIndex++;
      pushLyric();
      return;
    } else {
      note.lyric = lyric;
      lyricIndex++;
      return;
    }
  }
  function setKeyShift(shift: 1 | -1) {
    pushNote();
    keyShift = shift;
  }
  function setKey(k: number) {
    if (keyShift === 0 || key !== -1) pushNote();
    key = k;
  }
  notes.push({ lyric: "", frame_length: 30 });
  for (let i = 0; i < input.length; i++) {
    if (i < 2) continue;
    const char = input[i];
    const charCode = char.charCodeAt(0);
    if (
      !isNote &&
      ((charCode >= 0x3041 && charCode <= 0x3094) || (charCode >= 0x30a1 && charCode <= 0x30f4) || charCode === 0x30f6)
    ) {
      if (smallChar.includes(char)) lyric += char;
      else {
        pushLyric();
        lyric = char;
      }
    } else if (char === "上") setKeyShift(1);
    else if (char === "下") setKeyShift(-1);
    else if (char === "ど" || char === "と") setKey(60);
    else if (char === "れ") setKey(62);
    else if (char === "み") setKey(64);
    else if (char === "ふ") setKey(65);
    else if (char === "そ") setKey(67);
    else if (char === "ら") setKey(69);
    else if (char === "し") setKey(71);
    else if (char === "#" || char === "＃" || char === "♯") key++;
    else if (char === "b" || char === "♭") key--;
    else if (char === "ー") noteLength = 4;
    else if (char === "か") {
      pushNote();
      isNote = false;
    }
  }
  if (isNote) pushNote();
  else pushLyric();
  notes.push({ lyric: "", frame_length: 30 });
  return notes;
};

interface CalcFlameOptions {
  tempo: number;
  tempoNote: number;
  noteLength: number;
}
