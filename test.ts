import { parseNotes, isSong } from "./parseSong";
import { VOICEVOX } from "./voicevox";
import fs from "node:fs";

const input = `s
c-,d-,e-,f- e-,d-,c-,n- e-,f-,g-,a- g-,f-,e-,n-;
c-,n-,c-,n- c-,n-,c-,n- c,c,d,d,e,e,f,f e-,d-,c-,n-;`;
const teacher = 6000;
const speaker = 3001;
const song = isSong(input);
const notes = parseNotes(input);
console.log(song);
console.dir(notes, { depth: null });

VOICEVOX.singFrameAudioQuery(teacher, {
  notes,
}).then((data) => {
  VOICEVOX.frameSynthesis(data, speaker).then((data) => {
    fs.writeFileSync("out.wav", data);
  });
});
