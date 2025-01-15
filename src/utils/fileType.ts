const imageExtnames = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];
const audioExtnames = ["mp3", "wav", "m4a"];
const videoExtnames = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
const textExtnames = [
  "txt",
  "md",
  "markdown",
  "json",
  "js",
  "ts",
  "html",
  "css",
  "vue",
  "jsx",
  "tsx",
  "yml",
  "yaml",
  "toml",
  "ini",
  "conf",
  "sh",
  "bash",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "hpp",
  "rs",
  "go",
  "rb",
  "php",
  "pl",
  "sql",
  "log",
];
const staticImageExtnames = ["png", "jpg", "jpeg", "bmp", "webp"];
const animateImageExtnames = ["gif"];

export function getExtname(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex + 1).toLowerCase();
}

export function isImage(extname: string) {
  return imageExtnames.includes(getExtname(extname));
}

export function isAudio(extname: string) {
  return audioExtnames.includes(getExtname(extname));
}

export function isVideo(filename: string) {
  return videoExtnames.includes(getExtname(filename));
}

export function isText(filename: string) {
  return textExtnames.includes(getExtname(filename));
}

export function isStaticImage(filename: string) {
  return staticImageExtnames.includes(getExtname(filename));
}

export function isAnimateImage(filename: string) {
  return animateImageExtnames.includes(getExtname(filename));
}
