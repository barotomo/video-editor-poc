import type { VideoSpec } from './videoSpec';

export const sampleVideoSpec: VideoSpec = {
  title: 'JSONベース自動動画生成システムの紹介',
  fps: 30,
  width: 1280,
  height: 720,
  bgmVolume: 0.15,
  speakers: {
    zundamon: {
      id: 'zundamon',
      name: 'ずんだもん',
      color: '#10b981',
      avatarBg: '#d1fae5',
      iconText: '🟢',
      avatarImage: '/tachie/zundamon.png',
      avatarBasePath: '/tachie/zundamon',
      spriteFacing: 'left',
      defaultTransform: { x: 0, y: 0, scale: 1.0 }
    },
    metan: {
      id: 'metan',
      name: '四国めたん',
      color: '#ec4899',
      avatarBg: '#fce7f3',
      iconText: '🌸',
      avatarImage: '/tachie/metan.png',
      avatarBasePath: '/tachie/metan',
      spriteFacing: 'right',
      defaultTransform: { x: 0, y: 0, scale: 1.0 }
    },
    narrator: {
      id: 'narrator',
      name: 'ナレーション',
      color: '#3b82f6',
      avatarBg: '#dbeafe',
      iconText: '🤖',
      defaultTransform: { x: 0, y: 0, scale: 1.0 }
    }
  },
  scenes: [
    {
      "id": "scene-1",
      "template": "text-card",
      "props": {
        "title": "JSONで動画を作る新時代",
        "subtitle": "動画編集ソフト不要！1枚の定義ファイルで完全自動化",
        "badge": "No Video Editor Needed",
        "themeColor": "#10b981",
        "transform": { "x": 0, "y": 0, "scale": 1.0 }
      },
      "dialogues": [
        {
          "speaker": "zundamon",
          "emotion": "happy",
          "text": "みんなこんにちは！今日は動画編集ソフトを一切使わずに動画を作る方法を紹介するのだ！",
          "durationFrames": 120,
          "transform": { "x": 0, "y": 0, "scale": 1.0 }
        },
        {
          "speaker": "metan",
          "emotion": "explaining",
          "text": "1枚のJSONファイルに台本や構成を書くだけで、MP4動画が自動レンダリングされるのよ。",
          "durationFrames": 130,
          "transform": { "x": 0, "y": 0, "scale": 1.0 }
        }
      ]
    },
    {
      "id": "scene-2",
      "template": "code-block",
      "props": {
        "title": "動画定義 JSON スキーマ",
        "language": "json",
        "fileName": "video_script.json",
        "code": "{\n  \"template\": \"code-block\",\n  \"dialogues\": [\n    {\n      \"speaker\": \"zundamon\",\n      \"text\": \"JSONに書くだけでアニメーションや字幕が動くのだ！\",\n      \"durationFrames\": 120\n    }\n  ]\n}",
        "transform": { "x": 0, "y": 0, "scale": 1.0 }
      },
      "dialogues": [
        {
          "speaker": "zundamon",
          "emotion": "surprised",
          "text": "見てほしいのだ！コードブロックの「型」を使うと、こんなに綺麗なコード表示ができるのだ！",
          "durationFrames": 140,
          "transform": { "x": 0, "y": 0, "scale": 1.0 }
        }
      ]
    },
    {
      "id": "scene-3",
      "template": "stat-graph",
      "props": {
        "title": "動画制作プロセスの効率比較",
        "subtitle": "編集作業を極限まで削ぎ、コンテンツの質に集中",
        "items": [
          { "label": "従来の手作業編集 (時間/本)", "value": 90, "color": "#ef4444" },
          { "label": "JSON自動化編集 (時間/本)", "value": 15, "color": "#10b981" },
          { "label": "思考・台本作成への集中度", "value": 95, "color": "#3b82f6" }
        ],
        "transform": { "x": 0, "y": 0, "scale": 1.0 }
      },
      "dialogues": [
        {
          "speaker": "metan",
          "emotion": "happy",
          "text": "従来の手動カットやテロップ配置に何時間もかける必要はもうありませんわ。",
          "durationFrames": 130,
          "transform": { "x": 0, "y": 0, "scale": 1.0 }
        },
        {
          "speaker": "zundamon",
          "emotion": "thinking",
          "text": "人間のクリエイティブな時間が増えて、質も格段に上がるのだ！",
          "durationFrames": 110,
          "transform": { "x": 0, "y": 0, "scale": 1.0 }
        }
      ]
    },
    {
      "id": "scene-4",
      "template": "social-post",
      "props": {
        "authorName": "動画自動化Bot",
        "authorHandle": "@auto_video_ai",
        "content": "動画生成AIや複雑な編集ソフトはもう不要！Remotion × React × JSON で、プロ品質の動画がコードだけで生成できるようになりました！🚀 #Remotion #React #動画生成",
        "timestamp": "2026年9月12日 09:00",
        "likesCount": "1,240",
        "repostsCount": "382",
        "transform": { "x": 0, "y": 0, "scale": 1.0 }
      },
      "dialogues": [
        {
          "speaker": "narrator",
          "emotion": "normal",
          "text": "SNS風スライドや各種テンプレートを自由に拡張可能。あなたもJSON動画制作を体験してみましょう！",
          "durationFrames": 150,
          "transform": { "x": 0, "y": 0, "scale": 1.0 }
        }
      ]
    }
  ]
};

/** アニメ切り抜きショート動画用のサンプルSpec */
export const sampleAnimeClipSpec: VideoSpec = {
  title: 'ハメねこに苗字ができた日（アニメ切り抜きショート）',
  fps: 30,
  width: 1080,
  height: 1920,
  bgmVolume: 0.1,
  speakers: {
    yanineko: {
      id: 'yanineko',
      name: 'ハメねこ',
      color: '#ff4380',
      avatarBg: '#ffe4e6',
      iconText: '🐱',
      spriteFacing: 'left'
    }
  },
  scenes: [
    {
      id: 'scene-anime-clip',
      template: 'video-clip',
      props: {
        videoUrl: '/videos/yanineko_raw_clip.mp4',
        logoUrl: '/logos/yanineko_logo.svg',
        logoSubtext: 'アニメ『ヤニねこ』公式切り抜きショート',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        videoFit: 'contain'
      },
      dialogues: [
        {
          speaker: 'yanineko',
          text: 'テストとかも\n毎回名前で',
          durationFrames: 65
        },
        {
          speaker: 'yanineko',
          text: 'いじられてたし…',
          durationFrames: 80
        },
        {
          speaker: 'yanineko',
          text: 'できたー！',
          durationFrames: 65
        },
        {
          speaker: 'yanineko',
          text: 'ハメねこに苗字ができた日🐱',
          durationFrames: 100
        }
      ]
    }
  ]
};
