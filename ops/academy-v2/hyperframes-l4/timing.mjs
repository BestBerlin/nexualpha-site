import { readFile } from "node:fs/promises";

const FPS = 30;
const INTRO_DURATION = 3;
const VERSION = 1;
const CHARS_PER_SECOND = 4.5;
const TAIL_SECONDS = 0.4;
const HAN_RE = /\p{Script=Han}/gu;

function roundUpToFrame(seconds) {
  return Number((Math.ceil(seconds * FPS - Number.EPSILON) / FPS).toFixed(6));
}

function roundTime(seconds) {
  return Number(seconds.toFixed(6));
}

function sceneId(index) {
  return `scene-${index + 1}`;
}

function assertFinitePositive(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${label} must be a finite number greater than 0`);
  }
}

function assertScript(script) {
  if (!script || typeof script !== "object" || !Array.isArray(script.scenes)) {
    throw new TypeError("script.scenes must be an array");
  }

  script.scenes.forEach((scene, index) => {
    const id = sceneId(index);
    if (!scene || typeof scene !== "object") {
      throw new TypeError(`${id} must be an object`);
    }
    if (typeof scene.voice_zh !== "string" || scene.voice_zh.trim() === "") {
      throw new TypeError(`${id}.voice_zh must be a non-empty string`);
    }
    assertFinitePositive(scene.min_s, `${id}.min_s`);
  });
}

function countChineseChars(text) {
  return [...text.matchAll(HAN_RE)].length;
}

function wordWeight(text) {
  const han = countChineseChars(text);
  return han > 0 ? han : Math.max(1, [...text].length);
}

function segmentWords(text) {
  const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
  const words = [...segmenter.segment(text)]
    .map((part) => part.segment.trim())
    .filter(Boolean);

  return words.length > 0 ? words : [text.trim()];
}

function buildWordTiming(text, duration) {
  duration = roundTime(duration);
  const words = segmentWords(text);
  const weights = words.map(wordWeight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = 0;

  return words.map((word, index) => {
    const start = roundTime(cursor);
    const end =
      index === words.length - 1
        ? duration
        : roundTime(cursor + (duration * weights[index]) / totalWeight);
    cursor = end;
    return { text: word, start, end };
  });
}

function estimateSceneDuration(scene) {
  const spokenSeconds = countChineseChars(scene.voice_zh) / CHARS_PER_SECOND;
  return roundUpToFrame(Math.max(scene.min_s, spokenSeconds) + TAIL_SECONDS);
}

function normalizeWords(words, id) {
  if (words === undefined) {
    return undefined;
  }
  if (!Array.isArray(words)) {
    throw new TypeError(`${id} override words must be an array when present`);
  }

  return words.map((word, wordIndex) => {
    if (!word || typeof word !== "object") {
      throw new TypeError(`${id}.words[${wordIndex}] must be an object`);
    }
    return {
      text: word.text,
      start: word.start,
      end: word.end,
    };
  });
}

function normalizeOverride(raw, script) {
  if (!raw || typeof raw !== "object") {
    throw new TypeError("timing override must be a JSON object");
  }
  if (raw.version !== undefined && raw.version !== VERSION) {
    throw new TypeError(`timing override version must be ${VERSION}`);
  }
  if (raw.fps !== undefined && raw.fps !== FPS) {
    throw new TypeError(`timing override fps must be ${FPS}`);
  }
  if (raw.introDuration !== undefined && raw.introDuration !== INTRO_DURATION) {
    throw new TypeError(
      `timing override introDuration must be ${INTRO_DURATION}`,
    );
  }
  if (!Array.isArray(raw.scenes)) {
    throw new TypeError("timing override scenes must be an array");
  }
  if (raw.scenes.length !== script.scenes.length) {
    throw new TypeError("timing override scene count must match script scenes");
  }

  const timing = {
    version: VERSION,
    fps: FPS,
    introDuration: INTRO_DURATION,
    scenes: raw.scenes.map((scene, index) => {
      const id = sceneId(index);
      if (!scene || typeof scene !== "object") {
        throw new TypeError(`${id} override must be an object`);
      }
      if (scene.id !== id) {
        throw new TypeError(`${id} override id must be exactly ${id}`);
      }

      const hasSeconds = Object.hasOwn(scene, "seconds");
      const hasDuration = Object.hasOwn(scene, "duration");
      if (hasSeconds && hasDuration && scene.seconds !== scene.duration) {
        throw new TypeError(
          `${id} override seconds and duration must match when both are present`,
        );
      }

      const seconds = hasSeconds ? scene.seconds : scene.duration;
      assertFinitePositive(seconds, `${id} override seconds`);
      if (seconds < script.scenes[index].min_s) {
        throw new RangeError(`${id} override seconds must be at least min_s`);
      }

      const duration = roundUpToFrame(seconds);
      return {
        id,
        duration,
        words:
          normalizeWords(scene.words, id) ??
          buildWordTiming(
            script.scenes[index].voice_zh,
            Math.max(0.001, duration - TAIL_SECONDS),
          ),
      };
    }),
  };

  validateTiming(timing, script);
  return timing;
}

function buildTiming(script, durations) {
  const timing = {
    version: VERSION,
    fps: FPS,
    introDuration: INTRO_DURATION,
    scenes: script.scenes.map((scene, index) => {
      const duration = durations[index];
      return {
        id: sceneId(index),
        duration,
        words: buildWordTiming(
          scene.voice_zh,
          Math.max(0.001, duration - TAIL_SECONDS),
        ),
      };
    }),
  };

  validateTiming(timing, script);
  return timing;
}

function validateTiming(timing, script) {
  if (timing.version !== VERSION) {
    throw new TypeError(`timing version must be ${VERSION}`);
  }
  if (timing.fps !== FPS) {
    throw new TypeError(`timing fps must be ${FPS}`);
  }
  if (timing.introDuration !== INTRO_DURATION) {
    throw new TypeError(`timing introDuration must be ${INTRO_DURATION}`);
  }
  if (
    !Array.isArray(timing.scenes) ||
    timing.scenes.length !== script.scenes.length
  ) {
    throw new TypeError("timing scenes must match script scene count");
  }

  timing.scenes.forEach((scene, index) => {
    const id = sceneId(index);
    if (scene.id !== id) {
      throw new TypeError(`${id} timing id must be exactly ${id}`);
    }
    assertFinitePositive(scene.duration, `${id}.duration`);
    if (scene.duration < script.scenes[index].min_s) {
      throw new RangeError(`${id}.duration must be at least min_s`);
    }
    if (
      Math.abs(scene.duration * FPS - Math.round(scene.duration * FPS)) > 0.0001
    ) {
      throw new RangeError(
        `${id}.duration must be rounded up to ${FPS}fps frames`,
      );
    }
    if (!Array.isArray(scene.words) || scene.words.length === 0) {
      throw new TypeError(`${id}.words must be a non-empty array`);
    }

    let previousEnd = 0;
    scene.words.forEach((word, wordIndex) => {
      if (!word || typeof word !== "object") {
        throw new TypeError(`${id}.words[${wordIndex}] must be an object`);
      }
      if (typeof word.text !== "string" || word.text.length === 0) {
        throw new TypeError(
          `${id}.words[${wordIndex}].text must be a non-empty string`,
        );
      }
      assertFinitePositive(word.end, `${id}.words[${wordIndex}].end`);
      if (!Number.isFinite(word.start) || word.start < 0) {
        throw new TypeError(
          `${id}.words[${wordIndex}].start must be finite and >= 0`,
        );
      }
      if (word.start < previousEnd) {
        throw new RangeError(
          `${id}.words[${wordIndex}] overlaps the previous word`,
        );
      }
      if (word.end <= word.start) {
        throw new RangeError(
          `${id}.words[${wordIndex}].end must be greater than start`,
        );
      }
      if (word.end > scene.duration) {
        throw new RangeError(
          `${id}.words[${wordIndex}].end exceeds scene duration`,
        );
      }
      previousEnd = word.end;
    });
  });
}

export function estimateTiming(script) {
  assertScript(script);
  return buildTiming(script, script.scenes.map(estimateSceneDuration));
}

export async function loadTiming(path, script) {
  assertScript(script);

  if (!path) {
    return estimateTiming(script);
  }

  const raw = await readFile(path, "utf8");

  const override = JSON.parse(raw);
  return normalizeOverride(override, script);
}
