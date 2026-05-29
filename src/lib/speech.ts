/**
 * Web Speech API 封装
 * 浏览器原生语音识别和语音合成，零依赖
 */

export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synth: SpeechSynthesis;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  /**
   * 开始语音识别，返回识别结果的 Promise
   * @param lang 语言代码 'zh-CN' | 'en-US'
   * @param onInterim 可选回调，实时返回中间识别结果
   */
  startRecognition(
    lang: "zh-CN" | "en-US" = "zh-CN",
    onInterim?: (text: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        reject(new Error("浏览器不支持语音识别"));
        return;
      }

      this.recognition = new SpeechRecognitionAPI();
      this.recognition.lang = lang;
      this.recognition.interimResults = !!onInterim;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (event.results[0].isFinal) {
          const transcript = event.results[0][0].transcript;
          resolve(transcript);
        } else if (onInterim) {
          onInterim(event.results[0][0].transcript);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(`语音识别错误: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  /**
   * 停止语音识别
   */
  stopRecognition(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * 文字转语音
   * @param text 要朗读的文字
   * @param lang 语言代码
   */
  speak(text: string, lang: "zh-CN" | "en-US" = "zh-CN"): void {
    // 取消当前正在播放的语音
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // 尝试选择中文语音
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("zh") || v.lang.startsWith("en")
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synth.speak(utterance);
  }

  /**
   * 检查浏览器是否支持语音识别
   */
  static isRecognitionSupported(): boolean {
    return !!(
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }
}

// 浏览器 Speech API 类型扩展
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
