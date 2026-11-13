// Builds the mp4 from the recorded frames (variable timing) and the audio timeline:
// narration and the national-language readings, each at its moment.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, ffmpeg, outFile, silentFile] = process.argv.slice(2);
const tl = JSON.parse(readFileSync(join(dir, 'timeline.json'), 'utf8'));
const frames = tl.frames;
const end = tl.end / 1000;

// frames with their on-screen durations (the screencast only sends a frame when the page changes)
let list = '';
for (let i = 0; i < frames.length; i++) {
  const next = i + 1 < frames.length ? frames[i + 1].t : tl.end;
  const dur = Math.max(0.001, (next - frames[i].t) / 1000);
  list += `file '${join(dir, 'frames', frames[i].f).replace(/\\/g, '/')}'\nduration ${dur.toFixed(3)}\n`;
}
list += `file '${join(dir, 'frames', frames[frames.length - 1].f).replace(/\\/g, '/')}'\n`;
writeFileSync(join(dir, 'frames.txt'), list);

const run = args => { const r = spawnSync(ffmpeg, args, { encoding: 'utf8' }); if (r.status !== 0) { console.log(r.stderr.slice(-2500)); process.exit(1); } };
const firstFrame = frames[0].t / 1000;

// video only (also kept as the silent version for a human narrator)
run(['-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'frames.txt'), '-vf', `tpad=start_duration=${firstFrame.toFixed(3)}:start_mode=clone,fps=30,scale=1920:1080:flags=lanczos,format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', silentFile]);

// audio: every clip delayed to its moment, mixed, then muxed
const clips = [...tl.scenes.map(s => ({ file: s.file, t: s.t, vol: 1.0 })), ...tl.cues.map(c => ({ file: c.file, t: c.t, vol: c.vol ?? 1.15 }))];
const inputs = clips.flatMap(c => ['-i', join(dir, 'audio', c.file)]);
const chains = clips.map((c, i) => `[${i + 1}:a]aresample=48000,volume=${c.vol},adelay=${Math.round(c.t)}|${Math.round(c.t)}[a${i}]`);
const mix = `${clips.map((_, i) => `[a${i}]`).join('')}amix=inputs=${clips.length}:normalize=0:duration=longest,apad,atrim=0:${end.toFixed(2)}[aout]`;
run(['-y', '-i', silentFile, ...inputs, '-filter_complex', [...chains, mix].join(';'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', outFile]);
console.log(`done: ${outFile} (${end.toFixed(1)} s)`);
