/**
 * PSD立ち絵素材からポーズ（感情表現）別のPNG画像を書き出すスクリプト
 * 
 * ag-psd でレイヤーを読み込み、Node.js canvas でピクセル合成してPNGを出力する。
 *
 * Usage: node scripts/export_psd_poses.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { createCanvas } from 'canvas';
import { readPsd, initializeCanvas } from 'ag-psd';

// ag-psd に canvas 実装を渡す
initializeCanvas(createCanvas);

const CHARACTERS = {
  zundamon: {
    psdPath: '/Users/Baron/ai-work/video-editor-poc/立ち絵/アジサバ_ずんだもん/ずんだもん立ち絵素材2.3.psd',
    outputDir: '/Users/Baron/ai-work/video-editor-poc/frontend/public/tachie/zundamon',
    poses: {
      normal: {
        口: 'ほあー',
        目: { mode: 'set', 白目: '普通白目', 黒目: '普通目' },
        眉: '普通眉',
        顔色: 'ほっぺ',
        右腕: '基本',
        左腕: '基本',
        枝豆: '枝豆通常',
      },
      happy: {
        口: 'ほあー',
        目: { mode: 'single', name: 'にっこり' },
        眉: '普通眉',
        顔色: 'ほっぺ赤め',
        右腕: '手を挙げる',
        左腕: '基本',
        枝豆: '枝豆通常',
      },
      thinking: {
        口: 'むー',
        目: { mode: 'single', name: 'ジト目' },
        眉: '困り眉1',
        顔色: 'ほっぺ',
        右腕: '基本',
        左腕: '考える',
        枝豆: '枝豆通常',
      },
      surprised: {
        口: 'お',
        目: { mode: 'set', 白目: '見開き白目', 黒目: '普通目' },
        眉: '上がり眉',
        顔色: 'ほっぺ',
        右腕: '手を挙げる',
        左腕: '基本',
        枝豆: '枝豆通常',
      },
      explaining: {
        口: 'ほあ',
        目: { mode: 'set', 白目: '普通白目', 黒目: 'カメラ目線' },
        眉: '怒り眉',
        顔色: 'ほっぺ',
        右腕: '指差し',
        左腕: '基本',
        枝豆: '枝豆通常',
      },
      sad: {
        口: 'んー',
        目: { mode: 'single', name: 'UU' },
        眉: '困り眉2',
        顔色: 'ほっぺ',
        右腕: '基本',
        左腕: '基本',
        枝豆: '枝豆萎え',
      },
      angry: {
        口: 'んあー',
        目: { mode: 'single', name: '><' },
        眉: '怒り眉',
        顔色: 'ほっぺ',
        右腕: '基本',
        左腕: '基本',
        枝豆: '枝豆通常',
      },
    }
  },
  metan: {
    psdPath: '/Users/Baron/ai-work/video-editor-poc/立ち絵/アジサバ_四国めたん/四国めたん立ち絵素材2.1.psd',
    outputDir: '/Users/Baron/ai-work/video-editor-poc/frontend/public/tachie/metan',
    poses: {
      normal: {
        口: 'ほほえみ',
        目: { mode: 'set', 白目: '普通白目', 黒目: 'カメラ目線' },
        眉: 'ごきげん',
        顔色: '普通2',
        右腕: '普通',
        左腕: '普通',
      },
      happy: {
        口: 'わあー',
        目: { mode: 'single', name: '見上げ' },
        眉: 'ごきげん',
        顔色: '普通2',
        右腕: '普通',
        左腕: '普通',
      },
      thinking: {
        口: 'もむー',
        目: { mode: 'set', 白目: '普通白目', 黒目: '目そらし' },
        眉: 'こまり',
        顔色: '普通',
        右腕: '普通',
        左腕: '口元に指',
      },
      surprised: {
        口: 'うえー',
        目: { mode: 'set', 白目: '見開き白目', 黒目: 'カメラ目線' },
        眉: 'ややおこ',
        顔色: '赤面',
        右腕: '手をかざす',
        左腕: '普通',
      },
      explaining: {
        口: 'わあー',
        目: { mode: 'set', 白目: '普通白目', 黒目: 'カメラ目線' },
        眉: 'ごきげん',
        顔色: '普通2',
        右腕: '指差す',
        左腕: '普通',
      },
      sad: {
        口: 'んー',
        目: { mode: 'single', name: '目閉じ' },
        眉: 'こまり',
        顔色: '青ざめ',
        右腕: '普通',
        左腕: '普通',
      },
      angry: {
        口: 'いー',
        目: { mode: 'set', 白目: '普通白目', 黒目: 'カメラ目線' },
        眉: 'おこ',
        顔色: '普通',
        右腕: '指差す',
        左腕: '普通',
      },
    }
  }
};

/** レイヤー名を正規化 (先頭の * や ! を除去) */
function normName(layer) {
  return (layer.name || '').replace(/^\*/, '').replace(/^!/, '');
}

/**
 * レイヤーが「表示されるべきか」を判定するためにPSD初期状態+ポーズ設定から決定
 * 返り値: 表示するリーフレイヤーの配列 (canvas を持つもの)
 */

/**
 * ポーズ設定を適用し、表示すべきレイヤーのvisibility mapを作る
 */
function buildVisibilityMap(psd, charKey, poseConfig) {
  // PSD をそのまま走査し、各グループのルールに従って
  // 表示すべきリーフレイヤーを収集する
  const visibleLayers = [];

  function collectVisible(layers, parentVisible) {
    if (!layers) return;
    for (const layer of layers) {
      const name = normName(layer);
      const isVisible = parentVisible && !layer.hidden;

      if (layer.children) {
        collectVisible(layer.children, isVisible);
      } else if (layer.canvas && isVisible) {
        visibleLayers.push(layer);
      }
    }
  }

  collectVisible(psd.children, true);
  return visibleLayers;
}

/**
 * グループ内で指定名以外のレイヤーを全て非表示にする
 */
function selectInGroup(children, targetName) {
  if (!children) return;
  for (const child of children) {
    const name = normName(child);
    if (name === targetName) {
      child.hidden = false;
      // 子がある場合は子も全て表示
      if (child.children) {
        showAll(child.children);
      }
    } else if (name !== '(非表示)') {
      child.hidden = true;
      if (child.children) {
        hideAll(child.children);
      }
    }
  }
}

function showAll(children) {
  if (!children) return;
  for (const child of children) {
    child.hidden = false;
    if (child.children) showAll(child.children);
  }
}

function hideAll(children) {
  if (!children) return;
  for (const child of children) {
    child.hidden = true;
    if (child.children) hideAll(child.children);
  }
}

function findGroup(layers, name) {
  if (!layers) return null;
  for (const layer of layers) {
    if (normName(layer) === name) return layer;
    if (layer.children) {
      const found = findGroup(layer.children, name);
      if (found) return found;
    }
  }
  return null;
}

function applyPose(psd, charKey, poseConfig) {
  const layers = psd.children;

  // --- 共通: 不要なレイヤーグループを非表示にする ---
  // ずんだもん
  const cloth2 = findGroup(layers, '服装2');
  if (cloth2) { cloth2.hidden = true; hideAll(cloth2.children); }
  const hoodie = findGroup(layers, 'パーカー裏地');
  if (hoodie) hoodie.hidden = true;
  // めたん
  const otherCloth = findGroup(layers, 'その他の服');
  if (otherCloth) { otherCloth.hidden = true; hideAll(otherCloth.children); }
  const rotNote = findGroup(layers, '回転移動でポニテにするなど');
  if (rotNote) rotNote.hidden = true;
  // 記号
  const symbols = findGroup(layers, '記号など');
  if (symbols) { symbols.hidden = true; hideAll(symbols.children); }

  // --- 口 ---
  const mouthGroup = findGroup(layers, '口');
  if (mouthGroup?.children) {
    mouthGroup.hidden = false;
    selectInGroup(mouthGroup.children, poseConfig.口);
  }

  // --- 目 ---
  const eyeGroup = findGroup(layers, '目');
  if (eyeGroup?.children) {
    eyeGroup.hidden = false;
    if (poseConfig.目.mode === 'single') {
      selectInGroup(eyeGroup.children, poseConfig.目.name);
    } else if (poseConfig.目.mode === 'set') {
      // 目セット以外を非表示
      for (const child of eyeGroup.children) {
        const name = normName(child);
        if (name === '目セット') {
          child.hidden = false;
          if (child.children) {
            for (const setChild of child.children) {
              const sName = normName(setChild);
              if (sName === poseConfig.目.白目) {
                setChild.hidden = false;
              } else if (sName === '黒目') {
                setChild.hidden = false;
                if (setChild.children) {
                  selectInGroup(setChild.children, poseConfig.目.黒目);
                }
              } else {
                setChild.hidden = true;
              }
            }
          }
        } else {
          child.hidden = true;
        }
      }
    }
  }

  // --- 眉 ---
  const browGroup = findGroup(layers, '眉');
  if (browGroup?.children) {
    browGroup.hidden = false;
    selectInGroup(browGroup.children, poseConfig.眉);
  }

  // --- 顔色 ---
  const faceGroup = findGroup(layers, '顔色');
  if (faceGroup?.children) {
    faceGroup.hidden = false;
    for (const child of faceGroup.children) {
      const name = normName(child);
      if (name === '(非表示)') {
        child.hidden = true;
      } else if (name === poseConfig.顔色) {
        child.hidden = false;
      } else {
        child.hidden = true;
      }
    }
  }

  // --- 腕 (服装1 / 白ロリ服 内) ---
  const clothGroup = findGroup(layers, '服装1') || findGroup(layers, '白ロリ服');
  if (clothGroup?.children) {
    clothGroup.hidden = false;
    
    // 体は表示
    const body = findGroup(clothGroup.children, '体');
    if (body) { body.hidden = false; if (body.children) showAll(body.children); }
    
    // いつもの服 / 制服
    const normalCloth = findGroup(clothGroup.children, 'いつもの服');
    if (normalCloth) normalCloth.hidden = false;
    const uniform = findGroup(clothGroup.children, '制服');
    if (uniform) { uniform.hidden = true; }

    // 右腕
    const rightArm = findGroup(clothGroup.children, '右腕');
    if (rightArm?.children && poseConfig.右腕) {
      rightArm.hidden = false;
      for (const child of rightArm.children) {
        const name = normName(child);
        if (name === '(非表示)') {
          child.hidden = true;
        } else if (name === 'まんじゅう') {
          // まんじゅうは基本非表示
          child.hidden = true;
        } else if (name === poseConfig.右腕) {
          child.hidden = false;
        } else {
          child.hidden = true;
        }
      }
    }

    // 左腕
    const leftArm = findGroup(clothGroup.children, '左腕');
    if (leftArm?.children && poseConfig.左腕) {
      leftArm.hidden = false;
      for (const child of leftArm.children) {
        const name = normName(child);
        if (name === '(非表示)') {
          child.hidden = true;
        } else if (name === 'まんじゅう袋') {
          child.hidden = true;
        } else if (name === poseConfig.左腕) {
          child.hidden = false;
        } else {
          child.hidden = true;
        }
      }
    }
  }

  // --- 枝豆 (ずんだもん専用) ---
  if (poseConfig.枝豆) {
    const edamame = findGroup(layers, '枝豆');
    if (edamame?.children) {
      edamame.hidden = false;
      for (const child of edamame.children) {
        const name = normName(child);
        if (name === poseConfig.枝豆) {
          child.hidden = false;
        } else if (name === 'パーカー(裏地とセットで使用)') {
          child.hidden = true;
        } else {
          child.hidden = true;
        }
      }
    }
  }
}

/**
 * 表示中のリーフレイヤーを下から順に合成して1枚の画像にする
 */
function compositeLayersToPng(psd) {
  const canvas = createCanvas(psd.width, psd.height);
  const ctx = canvas.getContext('2d');

  // ag-psd は children[0] が最背面（下層）、末尾が最前面（上層）
  // 順方向に描画することで奥から手前へ正しく合成される
  function renderLayer(layer, parentVisible) {
    if (!layer) return;
    const isVisible = parentVisible && !layer.hidden;

    if (!isVisible) return;

    if (layer.children) {
      // グループ: 子レイヤーを奥から手前へ順に描画
      for (const child of layer.children) {
        renderLayer(child, isVisible);
      }
    } else if (layer.canvas) {
      // リーフレイヤー: キャンバスに描画
      const x = layer.left || 0;
      const y = layer.top || 0;

      // ag-psd の opacity は 0〜1 の浮動小数点数
      const opacity = layer.opacity !== undefined ? (layer.opacity > 1 ? layer.opacity / 255 : layer.opacity) : 1;
      ctx.globalAlpha = opacity;
      ctx.drawImage(layer.canvas, x, y);
      ctx.globalAlpha = 1;
    }
  }

  for (const layer of (psd.children || [])) {
    renderLayer(layer, true);
  }

  return canvas.toBuffer('image/png');
}

async function main() {
  for (const [charKey, charConfig] of Object.entries(CHARACTERS)) {
    console.log(`\n📁 Processing: ${charKey}`);

    if (!existsSync(charConfig.outputDir)) {
      mkdirSync(charConfig.outputDir, { recursive: true });
    }

    for (const [poseName, poseConfig] of Object.entries(charConfig.poses)) {
      console.log(`  🎭 Pose: ${poseName}`);

      // PSD を毎回読み直す (レイヤー状態リセット)
      const buffer = readFileSync(charConfig.psdPath);
      const psd = readPsd(buffer, { skipCompositeImageData: true });

      // ポーズを適用
      applyPose(psd, charKey, poseConfig);

      // 合成してPNG出力
      try {
        const pngBuffer = compositeLayersToPng(psd);
        const outputPath = join(charConfig.outputDir, `${poseName}.png`);
        writeFileSync(outputPath, pngBuffer);
        // sipsで再エンコード（ブラウザ互換性上昇）
        execSync(`sips -s format png "${outputPath}" --out "${outputPath}"`, { stdio: 'ignore' });
        console.log(`    ✅ Saved: ${outputPath}`);
      } catch (err) {
        console.error(`    ❌ Error: ${err.message}`);
      }
    }
  }

  console.log('\n🎉 All poses exported!');
}

main().catch(console.error);
