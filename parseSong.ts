import { Note } from "./voicevox";

/**
 * # 楽譜
 * @version 1
 *
 * ```
 * [曲開始文字][区切り文字][音符...]
 * ```
 *
 * ## 曲開始文字
 * - sなどの曲であることを示す文字
 *
 * ## 音符
 * ```
 * [高さ基準?][高さ上下?][音][半音?][長さ?][連符?][付点?][区切り文字]
 * ```
 * - 定義されていない文字は無視される
 * - 高さ基準: その音がどの位置にあるか, 数値 (デフォルト4)
 * - 高さ上下: その音が高さ基準を超えたり下回った位置にいるか, h/l (デフォルトなし)
 * - 音: 音の種類, c,d,e,f,g,a,b (ど,れ,み,ふ,そ,ら,し), 「ふぁ」は2文字のため「ふ」で判定。2文字目は無視
 * - 半音: 音が半音上がったり下がったりするか, #/b (デフォルトなし)
 * - 長さ: その音の長さ(n分音符), 1, 2, 4, 8, 6(16分) (デフォルト8)
 * - 連符: その音が連符(3連付や5連符など)か, 数値 (デフォルト1) **連符を設定する時は長さの設定が必要**
 * - 付点: その音が付点音符か(付点で長さが1.5倍), "+" (デフォルトなし)
 * - 区切り文字: 音符の終わりを示す
 *
 * @example 1(「ド」から上の「ド」まで)
 * 歌 どー、れー、みー、ふぁー、そー、らー、しー、上どー。
 * s c- d- e- f- g- a- b- hc-
 * s c- d- e- f- g- a- b- 5c-
 * @example 2 (かえるのうた)
 * ```
 * s
 * c-,d-,e-,f- e-,d-,c-,n- e-,f-,g-,a- g-,f-,e-,n-;
 * c-,n-,c-,n- c-,n-,c-,n- c,c,d,d,e,e,f,f e-,d-,c-,n-;
 * ```
 */
const _ = null;
/**
 * 曲の開始
 */
const songStart = ["歌", "s", "S"];
/**
 * 区切り文字
 */
const sep = [" ", "　", "、", "。", "，", "．", ",", ".", ":", "：", "\n", "\r", "\t", ";", "；"];

// 音
/**
 * ド
 */
const do_ = ["ド", "c", "C", "ど", "と", "ト", "ﾄ", "ｃ", "Ｃ"];
/**
 * レ
 */
const re = ["レ", "d", "D", "れ", "ﾚ", "ｄ", "Ｄ"];
/**
 * ミ
 */
const mi = ["ミ", "e", "E", "み", "ﾐ", "ｅ", "Ｅ"];
/**
 * ファ
 */
const fa = ["フ", "f", "F", "ふ", "ﾌ", "ｆ", "Ｆ"];
/**
 * ソ
 */
const so = ["ソ", "g", "G", "そ", "ｿ", "ｇ", "Ｇ"];
/**
 * ラ
 */
const ra = ["ラ", "a", "A", "ら", "ﾗ", "ａ", "Ａ"];
/**
 * シ
 */
const si = ["シ", "b", "B", "し", "ｼ", "ｂ", "Ｂ"];
/**
 * 休符
 */
const rest = ["n", "N", "休", "ｎ", "Ｎ", "ん", "ﾝ", "ｍ", "Ｍ", "m", "M", "ン"];

// 高さ
/**
 * 高
 */
const high = ["上", "う", "ウ", "ｳ", "h", "H", "ｈ", "Ｈ", "↑"];
/**
 * 低
 */
const low = ["下", "l", "L", "ｌ", "Ｌ", "↓"];

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
const note3 = ["3", "３", "三"];
/**
 * 付点
 * 1つ前の音符の長さが1.5倍になる
 */
const notePlus = ["+", "＋", ".", "。"];

// 半音
const sharp = ["#, ＃", "♯"];
const flat = ["b", "ｂ", "♭"];

const basePitches = [...zero, ...one, ...two, ...three, ...four, ...five, ...six, ...seven, ...eight, ...nine];
const pitchOffsets = [...high, ...low];
const noteTypes = [...do_, ...re, ...mi, ...fa, ...so, ...ra, ...si, ...rest];
const halfNotes = [...sharp, ...flat];
const noteLengths = [...note1, ...note2, ...note4, ...note8, ...note16];
const tuplets = [...note3];
// 全ての制御文字
// 開始文字と区切り文字を除く
const controlChars = [...basePitches, "-", "ー", ...pitchOffsets, ...noteTypes, ...halfNotes, ...notePlus];

// デフォルト値

// テンポ
// b分音符を1分(60秒に)a回打つ速さ
// 音楽のテンポ
const tempo = 120; // a
// テンポの対象音符
const tempoNote = 4; // b

// 拍子記号
// m分のn拍子
// 1小節あたりの拍子数
const meterHigh = 4; // n
// 1拍が何分音符になるか
const meterLow = 4; // m

const checkIsChar = (...arr: Array<Array<string>>) => {
  arr.forEach((inArr) =>
    inArr.forEach((text) => {
      if (text.length !== 1) {
        console.error(
          `error: [checkIsChar] ${text} in ${inArr} is not 1 char, is ${text[0]} + ${text[1]} (${text.charCodeAt(
            0
          )} + ${text.charCodeAt(1)})`
        );
      }
    })
  );
};
checkIsChar(
  songStart,
  sep,
  do_,
  re,
  mi,
  fa,
  so,
  ra,
  si,
  rest,
  high,
  low,
  note1,
  note16,
  note2,
  note3,
  note4,
  note8,
  notePlus,
  zero,
  one,
  two,
  three,
  four,
  five,
  six,
  seven,
  eight,
  nine
);

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

const calcKey = (basePitch: number, noteType: number) => {
  return 12 * (basePitch + 1) + noteType;
};

/**
 * 楽譜をVOICEVOXが読み取れる形にする
 * @param input
 */
export const parseNotes = (input: string) => {
  // TODO: 変更可能にする
  let tempo = 120;
  let tempoNote = 4;
  let meterHigh = 4;
  let meterLow = 4;
  let frameOffset = { offset: 0 };
  const notes: Array<Note> = [];
  notes.push({ frame_length: 94, lyric: "" });
  for (const noteStr of input.split(/[\.．。,、，:：;；\n\r\t\s]/)) {
    let noteType = -1;
    let noteLength = 8;
    let basePitch = 4;
    let currentType = 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    for (const noteChar of noteStr) {
      if (!controlChars.includes(noteChar)) continue;
      switch (currentType) {
        case 0: {
          // TODO: 楽譜制御
          console.error("未実装です", noteChar, noteStr);
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
        key: calcKey(basePitch, noteType),
        frame_length: calcFrame({ tempo, tempoNote, noteLength }, frameOffset).frameLength,
        lyric: "ら",
      });
  }
  notes.push({ frame_length: 94, lyric: "" });
  return notes;
};

interface CalcFlameOptions {
  tempo: number;
  tempoNote: number;
  noteLength: number;
}
