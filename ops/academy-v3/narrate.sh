#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-/Volumes/致态2TB/nx-agents/education/v2/.venv/bin/python}"
PLAN_PATH="${PLAN_PATH:-$SCRIPT_DIR/build/narration/narration-plan.json}"
AUDIO_DIR="${AUDIO_DIR:-$SCRIPT_DIR/build/narration/audio}"
MANIFEST_PATH="${MANIFEST_PATH:-$SCRIPT_DIR/build/narration/generation-manifest.json}"
PLAN_ONLY=0
EPISODES="${EPISODES:-}"
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan-only)
      PLAN_ONLY=1
      shift
      ;;
    --plan)
      PLAN_PATH="$2"
      shift 2
      ;;
    --audio-dir)
      AUDIO_DIR="$2"
      shift 2
      ;;
    --episodes)
      EPISODES="$2"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --manifest)
      MANIFEST_PATH="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

# Validate all resolved paths before creating any directory, including symlink ancestors.
node - "$WORKTREE_ROOT" "$PLAN_PATH" "$AUDIO_DIR" "$MANIFEST_PATH" <<'NODE'
const fs=require('node:fs');const path=require('node:path');
const [root,...targets]=process.argv.slice(2);const allowed=fs.realpathSync(root)+path.sep;
for(const target of targets){
 let ancestor=path.resolve(target),tail=[];
 while(!fs.existsSync(ancestor)){tail.unshift(path.basename(ancestor));ancestor=path.dirname(ancestor);}
 const resolved=path.join(fs.realpathSync(ancestor),...tail);
 if(!resolved.startsWith(allowed)) {console.error('Refusing output outside worktree: '+target);process.exit(2);}
}
NODE
mkdir -p "$(dirname "$PLAN_PATH")" "$AUDIO_DIR" "$(dirname "$MANIFEST_PATH")"

node "$SCRIPT_DIR/narration-plan.mjs" --out "$PLAN_PATH" ${EPISODES:+--episodes "$EPISODES"}

if [[ "$PLAN_ONLY" -eq 1 ]]; then
  node - "$PLAN_PATH" "$MANIFEST_PATH" <<'NODE'
const { readFileSync, writeFileSync } = require('node:fs');
const [planPath, manifestPath] = process.argv.slice(2);
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
writeFileSync(manifestPath, JSON.stringify({
  status: 'plan-only',
  plan: planPath,
  expected_line_count: plan.summary.lines,
  audio_dir: plan.summary.audio_dir,
  next_steps: plan.summary.next_steps
}, null, 2) + '\n');
NODE
  echo "Plan-only narration manifest written to $MANIFEST_PATH"
  exit 0
fi

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Missing executable mlx_audio Python: $PYTHON_BIN" >&2
  exit 2
fi

export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export HF_DATASETS_OFFLINE=1
export HF_HUB_DISABLE_TELEMETRY=1
export HF_HUB_ENABLE_HF_TRANSFER=0
export TOKENIZERS_PARALLELISM=false

if ! "$PYTHON_BIN" - <<'PY' >/dev/null 2>&1
import mlx.core as mx
mx.default_device()
PY
then
  node - "$PLAN_PATH" "$MANIFEST_PATH" <<'NODE'
const { readFileSync, writeFileSync } = require('node:fs');
const [planPath, manifestPath] = process.argv.slice(2);
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
writeFileSync(manifestPath, JSON.stringify({
  status: 'blocked-metal-unavailable',
  plan: planPath,
  expected_line_count: plan.summary.lines,
  message: 'mlx_audio is installed in the v2 virtualenv, but this session cannot access a Metal device. No wav files were generated.',
  next_steps: plan.summary.next_steps
}, null, 2) + '\n');
NODE
  echo "Metal is unavailable in this session; wrote blocked manifest to $MANIFEST_PATH" >&2
  exit 3
fi

node - "$PLAN_PATH" "$AUDIO_DIR" "$MANIFEST_PATH" "$PYTHON_BIN" "$FORCE" <<'NODE'
const { spawnSync } = require('node:child_process');
const { existsSync, mkdirSync, statSync, writeFileSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const [planPath, audioDir, manifestPath, pythonBin, force] = process.argv.slice(2);
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
mkdirSync(audioDir, { recursive: true });

const generated = [];
for (const episode of plan.episodes) {
  for (const scene of episode.scenes) {
    for (const line of scene.lines) {
      const profile = line.voice_profile === 'sam-voice-design'
        ? plan.voice_profiles.samVoiceDesign
        : plan.voice_profiles.englishMasterClone;
      const existing = resolve(audioDir, `${line.id}_000.wav`);
      // Batches resume: keep reviewed takes unless --force is given.
      if (force !== '1' && existsSync(existing) && statSync(existing).size > 0) {
        generated.push({ id: line.id, episode: episode.id, scene: scene.id, speaker: line.speaker, voice_profile: line.voice_profile, wav: existing, bytes: statSync(existing).size, reused: true });
        continue;
      }
      const args = ['-m', 'mlx_audio.tts.generate', '--model', profile.model, '--lang_code', 'en'];
      if (profile.mode === 'clone') {
        args.push('--ref_audio', profile.ref_audio, '--ref_text', profile.ref_text);
      } else {
        args.push('--instruct', profile.instruct);
      }
      args.push('--text', line.text, '--output_path', audioDir, '--file_prefix', line.id);
      const result = spawnSync(pythonBin, args, { stdio: 'inherit', env: process.env });
      if (result.status !== 0) process.exit(result.status ?? 1);
      const wav = resolve(audioDir, `${line.id}_000.wav`);
      if (!existsSync(wav) || statSync(wav).size === 0) {
        console.error(`Expected wav was not created: ${wav}`);
        process.exit(1);
      }
      generated.push({
        id: line.id,
        episode: episode.id,
        scene: scene.id,
        speaker: line.speaker,
        voice_profile: line.voice_profile,
        estimated_start: line.start,
        estimated_end: line.end,
        wav,
        bytes: statSync(wav).size
      });
    }
  }
}

writeFileSync(manifestPath, JSON.stringify({
  status: 'generated-unaligned',
  plan: planPath,
  audio_dir: audioDir,
  generated_line_count: generated.length,
  generated,
  next_steps: plan.summary.next_steps
}, null, 2) + '\n');
console.log(`Generated ${generated.length} narration wav files. Manifest: ${manifestPath}`);
NODE
