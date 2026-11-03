import type { VideoSpec } from './videoSpec';

/**
 * 参考動画①: 新型iPad mini 速報・スペック比較ショート (1080×1920)
 */
export const ipadMiniEditorialSpec: VideoSpec = {
  title: '新型iPad mini 速報・進化点まとめ',
  fps: 30,
  width: 1080,
  height: 1920,
  bgmVolume: 0.15,
  speakers: {},
  scenes: [
    {
      id: 'ipad-1',
      template: 'editorial-kinetic',
      props: {
        theme: 'light-grid',
        badgeType: 'live-pill',
        badgeText: '速報',
        title: 'Appleから\n新型 iPad mini\nが発表。//',
        mediaPreset: 'tablet-hero',
        mediaCredit: 'IMAGE: APPLE',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '先ほどAppleから新型iPad miniが発表されました！', durationFrames: 80 }
      ]
    },
    {
      id: 'ipad-2',
      template: 'editorial-kinetic',
      props: {
        theme: 'light-grid',
        badgeType: 'mono-label',
        badgeText: 'WHAT CHANGED',
        title: '~~マイナー~~アップデート\nめちゃくちゃ\n__進化してる。__',
        summaryHeading: '▼ ポイントをまとめていきます',
        summaryCards: [
          { icon: 'screen', label: '画面' },
          { icon: 'size', label: 'サイズ' },
          { icon: 'waterproof', label: '防水' }
        ],
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '今回マイナーアップデートじゃなくてめちゃくちゃ進化してるのでポイントをまとめていきます。', durationFrames: 105 }
      ]
    },
    {
      id: 'ipad-3',
      template: 'editorial-kinetic',
      props: {
        theme: 'accent',
        badgeType: 'mono-label',
        badgeText: 'CHANGE 01',
        watermark: '01',
        title: 'ディスプレイ',
        subtitle: '液晶 → OLED',
        mediaPreset: 'tablet-oled',
        mediaCredit: 'IMAGE: APPLE',
        motionStyle: 'slide-up'
      },
      dialogues: [
        { text: 'まず変わった点で言うと、画面がOLEDディスプレイ！', durationFrames: 80 }
      ]
    },
    {
      id: 'ipad-4',
      template: 'editorial-comparison',
      props: {
        theme: 'dark',
        badgeType: 'step-pill',
        stepNumber: '1',
        badgeText: 'ディスプレイ',
        title: '最大輝度が大幅進化',
        comparisonMode: 'cards-2',
        items: [
          { label: '前モデル', valueText: '500ニト', visual: 'glow-dim' },
          { label: '新型', valueText: '1,200ニト', accent: true, visual: 'glow-bright' }
        ],
        footerHeadline: '2倍以上//',
        caption: '※ピーク輝度'
      },
      dialogues: [
        { text: 'しかも最大1,200ニトと2倍以上の明るさで表示できます。', durationFrames: 90 }
      ]
    },
    {
      id: 'ipad-5',
      template: 'editorial-comparison',
      props: {
        theme: 'light-grid',
        transition: 'blinds',
        badgeType: 'step-pill',
        stepNumber: '1',
        badgeText: 'ディスプレイ',
        title: '今回から選べる\n__Nano-texture__',
        comparisonMode: 'cards-2',
        items: [
          { label: 'ふつうの画面', visual: 'glare-standard' },
          { label: 'Nano-texture', accent: true, visual: 'glare-nano' }
        ],
        footerHeadline: '映り込みが減るので外でも見やすい',
        caption: '※256GB・512GBモデルのみ'
      },
      dialogues: [
        { text: 'あとね、今回からナノテクスチャを選べるようになってるのがめっちゃ嬉しい！', durationFrames: 95 }
      ]
    },
    {
      id: 'ipad-6',
      template: 'editorial-comparison',
      props: {
        theme: 'light-grid',
        badgeType: 'step-pill',
        stepNumber: '2',
        badgeText: 'サイズ',
        title: '横から見ると',
        comparisonMode: 'bars-horizontal',
        items: [
          { label: '前モデル', valueText: '6.3mm', numericValue: 74 },
          { label: '新型', valueText: '5.4mm', numericValue: 62, accent: true }
        ],
        diffLabel: '-0.9mm',
        secondaryComparison: {
          heading: '重さは',
          fromLabel: '293g',
          toLabel: '255g',
          diffText: '-38g'
        },
        footerHeadline: '薄くなって、軽くなった。'
      },
      dialogues: [
        { text: '厚さ5.4ミリまで薄くなって、重量は255グラム。', durationFrames: 95 }
      ]
    },
    {
      id: 'ipad-7',
      template: 'editorial-comparison',
      props: {
        theme: 'light-grid',
        transition: 'blinds',
        badgeType: 'step-pill',
        stepNumber: '2',
        badgeText: 'サイズ',
        title: '前作のiPad mini、\n正直ちょっとベゼル太いなと思ってた',
        comparisonMode: 'cards-2',
        showArrowBetweenCards: true,
        items: [
          { label: '前モデル', badge: '前モデル', sublabel: '8.3インチ', visual: 'bezel-thick' },
          { label: '新型', badge: '新型', sublabel: '8.5インチ ((-24%))', accent: true, visual: 'bezel-thin' }
        ],
        footerHeadline: '外側の大きさは同じ。画面だけ広がった\n**めちゃくちゃ嬉しい**\n**アップデート。**'
      },
      dialogues: [
        { text: '本体の大きさはそのままなんだけど、ベゼルが細くなって画面が8.5インチに広がった！', durationFrames: 105 }
      ]
    },
    {
      id: 'ipad-8',
      template: 'editorial-list',
      props: {
        theme: 'light-grid',
        badgeType: 'mono-label',
        badgeText: 'CHANGE 03 — AND MORE',
        watermark: '03',
        title: '__その他の__\n__進化点__',
        listMode: 'checklist',
        showTopCard: true,
        topCardLabel: 'mini',
        items: [
          { text: '防水防塵に対応', subtext: 'IP67' },
          { text: 'チップは A20 Pro', subtext: '最新のiPhoneと同じ' },
          { text: 'フロントカメラが横に', subtext: 'ビデオ通話がしやすい' }
        ],
        caption: '※IP67 = 実験室の管理された条件下。永久しない。'
      },
      dialogues: [
        { text: 'その他にも防水防塵対応、A20 Proチップ搭載、横向きフロントカメラと進化点盛りだくさん！', durationFrames: 120 }
      ]
    },
    {
      id: 'ipad-9',
      template: 'editorial-comparison',
      props: {
        theme: 'light-grid',
        badgeType: 'step-pill',
        stepNumber: '4',
        badgeText: '気になるところ',
        title: 'まず、価格',
        comparisonMode: 'bars-vertical',
        thresholdLabel: '10万円のライン',
        thresholdValue: 64,
        items: [
          { label: '前モデル', valueText: '78,800円', numericValue: 50 },
          { label: '新型', valueText: '119,800円', numericValue: 82, accent: true }
        ],
        diffLabel: '+4万円',
        footerHeadline: '10万円超えか…'
      },
      dialogues: [
        { text: '一方気になったポイントは価格。119,800円からと約4万円の値上がり。', durationFrames: 100 }
      ]
    },
    {
      id: 'ipad-10',
      template: 'editorial-comparison',
      props: {
        theme: 'dark',
        badgeType: 'step-pill',
        stepNumber: '4',
        badgeText: '気になるところ',
        title: 'あと残念ながら\nProMotion\n**非対応**',
        comparisonMode: 'cards-2',
        items: [
          { label: '60Hz', sublabel: 'カクッと動く', accent: true, visual: 'fps-60' },
          { label: '120Hz', sublabel: 'なめらか', visual: 'fps-120' }
        ],
        footerHeadline: 'これで120Hzだったら\n**マジやばかったね**',
        caption: '※Appleは仕様に記載なし（各社報道）'
      },
      dialogues: [
        { text: 'あと残念ながらProMotionには非対応。これで120Hzだったらマジやばかったね。', durationFrames: 95 }
      ]
    },
    {
      id: 'ipad-11',
      template: 'editorial-list',
      props: {
        theme: 'light-grid',
        badgeType: 'mono-label',
        badgeText: 'RELEASE',
        title: '予約と発売はいつ？',
        listMode: 'calendar',
        items: [
          { text: '今日 10/26', tag: 'today' },
          { text: '予約開始', subtext: '10/29 (木)', tag: 'preorder' },
          { text: '発売', subtext: '11/6 (金)', tag: 'release' }
        ]
      },
      dialogues: [
        { text: '予約は10月29日からで、発売は11月6日！', durationFrames: 85 }
      ]
    },
    {
      id: 'ipad-12',
      template: 'editorial-workflow',
      props: {
        theme: 'dark',
        title: '今週は\n**Appleweek.**',
        workflowMode: 'horizontal-timeline',
        steps: [
          { timeOrDate: '10/26', sublabel: 'iPad mini', label: '10/26', accent: true },
          { timeOrDate: '10/28', sublabel: 'MacBook ?', label: '10/28' },
          { timeOrDate: '10/29', sublabel: '予約開始', label: '10/29' }
        ],
        footerHeadline: '速報、\n**どんどん届けます**',
        ctaButtonText: '+ フォロー',
        ctaSubtext: 'ご視聴ありがとうございました'
      },
      dialogues: [
        { text: '新製品が発表され次第どんどん速報動画を届けていくので、ぜひフォローしてお待ちください！', durationFrames: 110 }
      ]
    }
  ]
};

/**
 * 参考動画②: iPhone Duo 活用レビュー・ワークフロー解説ショート (1080×1920)
 */
export const iphoneDuoEditorialSpec: VideoSpec = {
  title: 'iPhone Duo を購入した理由 (AIワークフロー解説)',
  fps: 30,
  width: 1080,
  height: 1920,
  bgmVolume: 0.15,
  speakers: {},
  scenes: [
    {
      id: 'duo-1',
      template: 'editorial-kinetic',
      props: {
        theme: 'light-grid',
        transition: 'diagonal-wedge',
        title: '36万円\n==もする==\niPhone Duo\n__を買った理由。__',
        mediaPreset: 'fold-phone',
        mediaCredit: 'IMAGE: APPLE',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '36万円もするiPhone Duoを買った理由。', durationFrames: 80 }
      ]
    },
    {
      id: 'duo-2',
      template: 'editorial-kinetic',
      props: {
        theme: 'dark',
        title: 'それは、\n完全に\n==**仕事**==',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: 'これね、完全に仕事よ。', durationFrames: 65 }
      ]
    },
    {
      id: 'duo-3',
      template: 'editorial-kinetic',
      props: {
        theme: 'accent',
        badgeType: 'mono-label',
        badgeText: 'CHAPTER 01 — AIに頼む時代',
        watermark: '01',
        title: 'というのも、\n最近の仕事は\n自分が\n~~**手を動かす**~~',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: 'というのも最近の仕事って、自分がめちゃくちゃ手を動かすというより、', durationFrames: 90 }
      ]
    },
    {
      id: 'duo-4',
      template: 'editorial-workflow',
      props: {
        theme: 'dark',
        badgeType: 'mono-label',
        badgeText: 'WORKFLOW',
        title: 'AIに頼んで、',
        workflowMode: 'vertical-loop',
        steps: [
          { label: '頼む' },
          { label: 'レビュー' },
          { label: '指示' },
          { label: '送る' }
        ],
        loopLabel: 'また頼む',
        footerHeadline: 'こういう作業が、\n**結構多い。**'
      },
      dialogues: [
        { text: 'ある程度AIに頼んで、成果物をレビューしてまた指示を出して送る、みたいな作業が結構多い。', durationFrames: 135 }
      ]
    },
    {
      id: 'duo-5',
      template: 'editorial-kinetic',
      props: {
        theme: 'light-grid',
        transition: 'panel-wipe',
        title: 'そうなってくると、\nスマホの画面だけだと',
        mediaPreset: 'phone-chat-overflow',
        footerHeadline: 'ちょっと\n**足りない。**'
      },
      dialogues: [
        { text: 'そうなってくると、スマホの画面だけだとちょっと足りない。', durationFrames: 90 }
      ]
    },
    {
      id: 'duo-6',
      template: 'editorial-kinetic',
      props: {
        theme: 'light-grid',
        title: '例えば、\n成果物を見ながら\n**AI**と会話する',
        mediaPreset: 'phone-toggle-ai',
        footerHeadline: '普通のスマホだと\n**やりにくい。**'
      },
      dialogues: [
        { text: '例えば成果物を見ながらAIと会話するみたいなことが普通のスマホだとやりにくいんだけど、', durationFrames: 110 }
      ]
    },
    {
      id: 'duo-7',
      template: 'editorial-kinetic',
      props: {
        theme: 'light-grid',
        transition: 'panel-wipe',
        title: '折りたたみスマホは',
        mediaPreset: 'fold-icon-2x',
        footerHeadline: 'スマホ**2個分**\nの大きさ'
      },
      dialogues: [
        { text: '折りたたみスマホはスマホ2個分ぐらいの大きさがあるので、', durationFrames: 75 }
      ]
    },
    {
      id: 'duo-8',
      template: 'editorial-kinetic',
      props: {
        theme: 'light-grid',
        title: '__画面を分割__して',
        mediaPreset: 'fold-split-callouts',
        callouts: [
          { label: 'AIとやり取り', accent: false },
          { label: 'メールの返信', accent: true }
        ],
        footerHeadline: '**同時にできる。**'
      },
      dialogues: [
        { text: '画面を分割してAIとやり取りしながらメールの返信みたいな操作が同時にできちゃう！', durationFrames: 105 }
      ]
    },
    {
      id: 'duo-9',
      template: 'editorial-list',
      props: {
        theme: 'light-grid',
        transition: 'blinds',
        title: '折りたたみスマホを\n紹介すると、',
        listMode: 'comments',
        items: [
          { subtext: '@user_2081', text: 'スマホとタブレットを持った方がいい' },
          { subtext: '@user_5307', text: 'パソコン買った方がいいよ' }
        ],
        footerHeadline: 'みたいなコメントが、\n**結構くる。**'
      },
      dialogues: [
        { text: '折りたたみスマホを紹介すると、タブレットやパソコン買った方がいいよみたいなコメントが結構くるんだけど、', durationFrames: 120 }
      ]
    },
    {
      id: 'duo-10',
      template: 'editorial-comparison',
      props: {
        theme: 'light-grid',
        title: 'もちろん、\n本気で仕事するなら',
        comparisonMode: 'devices-3',
        watermark: '100%',
        items: [
          { label: 'スマホ', numericValue: 30 },
          { label: '折りたたみ', numericValue: 55 },
          { label: 'パソコン', numericValue: 100, accent: true }
        ],
        footerHeadline: 'パソコンの方が'
      },
      dialogues: [
        { text: 'もちろん本気で仕事をするならパソコンの方が100%いい。', durationFrames: 90 }
      ]
    },
    {
      id: 'duo-11',
      template: 'editorial-workflow',
      props: {
        theme: 'light-grid',
        title: 'ただね、\n__コンビニ__\nに行ってる時間とか\nちょっと外出してる\n**隙間時間**',
        workflowMode: 'day-slots',
        dayStartLabel: '9:00',
        dayEndLabel: '21:00',
        steps: [
          { label: 'コンビニ 5分', positionPercent: 24 },
          { label: '移動 10分', positionPercent: 52 },
          { label: '待ち 3分', positionPercent: 78 }
        ]
      },
      dialogues: [
        { text: 'ただね、コンビニに行ってる時間とかちょっと外出してる隙間時間で、', durationFrames: 95 }
      ]
    },
    {
      id: 'duo-12',
      template: 'editorial-kinetic',
      props: {
        theme: 'light-grid',
        transition: 'panel-wipe',
        title: '**AI**の成果物や\n進捗を確認したり',
        mediaPreset: 'tablet-dual-stack',
        footerHeadline: 'その場で\n**新しい指示を出す**'
      },
      dialogues: [
        { text: 'AIの成果物や進捗状況を確認したり、その場で新しい指示を出したりする時に本当に快適！', durationFrames: 110 }
      ]
    },
    {
      id: 'duo-13',
      template: 'editorial-list',
      props: {
        theme: 'light-grid',
        title: '今週は\niPhone Duo\nの動画を\n結構あげていきます。',
        listMode: 'weekdays-cta',
        items: [],
        footerHeadline: '気になる方は\n**フォローして**\nお待ちください。',
        brandFooter: 'PAULNOROMAN.'
      },
      dialogues: [
        { text: '今週はiPhone Duo関連の動画を結構あげていくので、気になる方はぜひフォローしてお待ちください！', durationFrames: 110 }
      ]
    }
  ]
};

/**
 * 漫画紹介ショート（エディトリアル・モーション版）:
 * 『とんでもない光景を目撃した女の子がヤバすぎた』の漫画コマ＋各シーンのセリフをそのまま使用し、
 * エディトリアルCSS/SVGモーションフォーマットに当てはめた構成 (全11シーン / 1080×1920)
 */
export const sakuragiMangaEditorialSpec: VideoSpec = {
  title: 'とんでもない光景を目撃してしまった女の子 (エディトリアル漫画紹介)',
  fps: 30,
  width: 1080,
  height: 1920,
  bgmVolume: 0.15,
  speakers: {},
  scenes: [
    {
      id: 'manga-1',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'manga-slash',
        badgeType: 'none',
        watermark: '01',
        title: '[blue:衝撃の光景]を目の当たりに\nしてしまった女の子が',
        footerHeadline: '[red:ヤバすぎた]',
        footerStartFrame: 16,
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_11.png',
        motionStyle: 'zoom-out',
        focusLines: true
      },
      dialogues: [
        { text: '衝撃の光景を目の当たりにしてしまった女の子がヤバすぎた', durationFrames: 85 }
      ]
    },
    {
      id: 'manga-2',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'manga-slash',
        badgeType: 'none',
        watermark: '02',
        title: '[pink:先パイ彼女いるんすか？]',
        footerHeadline: 'と文芸部の先パイに\n質問する女の子',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_02a.png',
        secondaryMediaUrl: '/manga/sakuragi/panel_02b.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '「先パイ彼女いるんすか？」', durationFrames: 60 },
        { text: 'と文芸部の先パイに質問する女の子', durationFrames: 75 }
      ]
    },
    {
      id: 'manga-3',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        badgeType: 'none',
        watermark: '03',
        title: '彼女は先パイと\n過ごす時間が大好きで',
        footerHeadline: 'バレー部が休みの日は\nいつも文芸部に\n入り浸っていた',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_03a.png',
        secondaryMediaUrl: '/manga/sakuragi/panel_03b.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '彼女は先パイと過ごす時間が大好きで', durationFrames: 65 },
        { text: 'バレー部が休みの日はいつも文芸部に入り浸っていた', durationFrames: 85 }
      ]
    },
    {
      id: 'manga-4',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'blinds',
        badgeType: 'none',
        watermark: '04',
        title: '卒業が近づいた先パイと\nもっと過ごしたいと思い',
        footerHeadline: '最近はいつもより\n積極的になる彼女だが',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_04.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '卒業が近づいた先パイともっと過ごしたいと思い', durationFrames: 75 },
        { text: '最近はいつもより積極的になる彼女だが', durationFrames: 70 }
      ]
    },
    {
      id: 'manga-5',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'manga-slash',
        badgeType: 'none',
        watermark: '05',
        title: 'そんな先パイは同じく文芸部の\n[red:上園先輩]に好意を寄せており',
        footerHeadline: '文武両道で美人な先輩は\n学年の男子全員の\n高嶺の花であった',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_05a.png',
        secondaryMediaUrl: '/manga/sakuragi/panel_05b.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: 'そんな先パイは同じく文芸部の上園先輩に好意を寄せており', durationFrames: 110 },
        { text: '文武両道で美人な先輩は学年の男子全員の高嶺の花であった', durationFrames: 115 }
      ]
    },
    {
      id: 'manga-6',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'panel-wipe',
        badgeType: 'none',
        watermark: '06',
        title: '先パイもまた\nそのように思っており',
        footerHeadline: '彼女は[pink:『女として終わってる]\n[pink:自分くらいが丁度いい』]と\n先輩に提案してみるが',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_06a.png',
        secondaryMediaUrl: '/manga/sakuragi/panel_06b.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '先パイもまたそのように思っており', durationFrames: 65 },
        { text: '彼女は『女として終わってる自分くらいが丁度いい』と先輩に提案してみるが', durationFrames: 110 }
      ]
    },
    {
      id: 'manga-7',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'manga-slash',
        badgeType: 'none',
        watermark: '07',
        title: '[blue:そんなこと言うなよ]\n[blue:お前はかっこいいよ]',
        footerHeadline: 'と言われ改めて\n先輩の良さに気付く女の子',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_07.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '「そんなこと言うなよ、お前はかっこいいよ」', durationFrames: 85 },
        { text: 'と言われ改めて先輩の良さに気付く女の子', durationFrames: 75 }
      ]
    },
    {
      id: 'manga-8',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'blinds',
        badgeType: 'none',
        watermark: '08',
        title: 'そんなある日\n昨夜から先輩からの\n返信が無いことに気付き',
        footerHeadline: '部活仲間にあの先輩かと\nからかわれてしまうが',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_08a.png',
        secondaryMediaUrl: '/manga/sakuragi/panel_08b.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: 'そんなある日、昨夜から先輩からの返信が無いことに気付き', durationFrames: 85 },
        { text: '部活仲間にあの先輩かとからかわれてしまうが', durationFrames: 80 }
      ]
    },
    {
      id: 'manga-9',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        badgeType: 'none',
        watermark: '09',
        title: '同時にウジウジしてるのは\nらしくないと[red:アドバイス]を貰い',
        footerHeadline: '遂に[red:告白]する決心がつく\n女の子',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_09.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '同時にウジウジしてるのはらしくないとアドバイスを貰い', durationFrames: 85 },
        { text: '遂に告白する決心がつく女の子', durationFrames: 65 }
      ]
    },
    {
      id: 'manga-10',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'manga-slash',
        badgeType: 'none',
        watermark: '10',
        title: '思い立ったらすぐに行動と\n文芸部に向かう彼女',
        footerHeadline: 'そして思いを伝えるため\n扉を開くと',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_10a.png',
        secondaryMediaUrl: '/manga/sakuragi/panel_10b.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '思い立ったらすぐに行動と文芸部に向かう彼女', durationFrames: 80 },
        { text: 'そして思いを伝えるため扉を開くと', durationFrames: 65 }
      ]
    },
    {
      id: 'manga-11',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-dark',
        transition: 'manga-slash',
        badgeType: 'none',
        watermark: '11',
        title: '[red:そこには大好きな先パイと]\n[red:上園先輩が…]',
        mediaPreset: 'manga-panel',
        mediaUrl: '/manga/sakuragi/panel_11.png',
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: 'そこには大好きな先パイと上園先輩が…', durationFrames: 95 }
      ]
    },
    {
      id: 'manga-12',
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-dark',
        transition: 'none',
        badgeType: 'none',
        watermark: '11',
        fallingMangaBg: true,
        title: '作品の詳細は動画の\n[red:説明欄]からチェックしてね！',
        mediaPreset: 'manga-description-guide',
        footerHeadline: '説明欄は右上の[red:3点]を押す\nor\n左下の[red:タイトル]から',
        footerStartFrame: 30,
        motionStyle: 'blur-in'
      },
      dialogues: [
        { text: '作品の詳細は動画の説明欄からチェックしてね！説明欄は右上の3点を押すか左下のタイトルから見られます。', durationFrames: 110 }
      ]
    }
  ]
};

