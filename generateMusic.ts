import { Note, VOICEVOX } from "./voicevox";

function createRestNote(length: number) {
  return { frame_length: Math.floor(length), lyric: "" };
}

export async function generateMusic(teacher: number, singer: number, notes: Note[], f0Shift?: number) {
  const splitedNotes: Note[][] = [];
  const tempSplitedNotes: Note[] = [];
  let tempRestNoteLength: number = 0;
  notes.forEach((value, index) => {
    if (notes.length - 1 === index) {
      if (tempSplitedNotes.length > 0) {
        splitedNotes.push([...tempSplitedNotes, createRestNote(tempRestNoteLength)]);
        tempSplitedNotes.length = 0;
        tempRestNoteLength = 0;
      }
      return;
    }
    if (value.key != null) {
      if (tempRestNoteLength !== 0) {
        splitedNotes.push([...tempSplitedNotes, createRestNote(Math.floor(tempRestNoteLength / 2))]);
        tempSplitedNotes.length = 0;
        tempSplitedNotes.push(createRestNote(Math.ceil(tempRestNoteLength / 2)));
        tempRestNoteLength = 0;
      }
      tempSplitedNotes.push(value);
    } else {
      tempRestNoteLength += value.frame_length;
    }
  });
  const audioData: Buffer[] = [];
  for (const notes of splitedNotes) {
    const frameAudioQuery = await VOICEVOX.singFrameAudioQuery(teacher, {
      notes,
    });
    if (f0Shift != null) {
      frameAudioQuery.f0 = frameAudioQuery.f0.map((f0) => f0 * 2 ** (f0Shift / 12));
    }
    audioData.push(await VOICEVOX.frameSynthesis(frameAudioQuery, singer));
  }
  return await VOICEVOX.connectWaves(audioData);
}
