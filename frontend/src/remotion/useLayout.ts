import { useVideoConfig } from 'remotion';
import { isPortraitSize } from '../types/videoSpec';

/** ショート(縦)動画で、下部の立ち絵+字幕に充てる割合 */
const PORTRAIT_BOTTOM_RATIO = 0.44;

/**
 * 動画の縦横サイズに応じたレイアウト情報を返すフック。
 * 通常動画(横)とショート動画(縦)で各コンポーネントの見た目を切り替えるために使う。
 *
 * slideBottomInset: スライドの下に確保する余白(px)。
 *   スライド背景は画面全体に広げつつ、中身を上部に寄せるために
 *   各テンプレートの下パディングへ加算して使う。
 */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const isPortrait = isPortraitSize(width, height);
  const slideBottomInset = isPortrait ? Math.round(height * PORTRAIT_BOTTOM_RATIO) : 0;
  return { width, height, isPortrait, slideBottomInset };
};
