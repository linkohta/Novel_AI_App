# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code (claude.ai/code) 向けのガイダンスです。

## プロジェクト概要

NovelAI の画像生成 API にプロンプトを送信し、生成された画像を保存・閲覧するアプリです（`package.json` の description: 「Novel AI 画像生成プロンプト送信・保存アプリ」）。Electronによるデスクトップ版と、Capacitorによるスマートフォン(Android)版で、React + Vite で書かれたUI（`src/`）を共通のソースコードとして共有している。

## 応対言語

- ユーザーとの対話は常に **日本語** で行うこと。

## 機能

- **プロンプト送信による画像生成**: APIキー（persistent token）、プロンプト、ネガティブプロンプト、モデル、幅・高さ、ステップ数、スケール、サンプラー、シードを指定して NovelAI の画像生成 API を呼び出す。「モデル」セクションの「Quality Tagsを自動追加する」チェックボックス（既定ON）は NovelAI API の `qualityToggle` パラメータに対応し、サーバー側で標準のQuality Tagsをプロンプトに自動追加するかどうかを制御する。プロンプトに手動でQuality Tags（や UC Preset 相当のテキスト）を追加済みの場合、ONのままだとサーバー側の自動追加分と重複し、NovelAI公式サイトでの出力と大きく異なる結果になるため、その場合はOFFにする。
  - **`nai-diffusion-4`系・`nai-diffusion-5`系モデルのサンプリング関連パラメータ**: `shared/novelai.mjs` の `buildRequestBody` は、`nai-diffusion-3`系での動作歴を踏まえたUI/API設計時点では `noise_schedule` / `deliberate_euler_ancestral_bug` / `prefer_brownian` / `legacy_uc` を送信していなかったが、これらは公式サイトが内部で使っているプリセット既定値（コミュニティによるAPIリバースエンジニアリング成果である [novelai-api](https://github.com/Aedial/novelai-api) の `image_presets/presets_v4/default.preset` を参照）であり、**プロンプト内容ではなく拡散サンプリングそのものを左右する**ため、省略すると同じプロンプト・シード・サンプラーでも公式サイトと大きく異なる画像になる。そのため `nai-diffusion-4`系・`nai-diffusion-5`系では `noise_schedule: 'karras'` / `deliberate_euler_ancestral_bug: false` / `prefer_brownian: true` / `legacy_uc: false` を、モデル共通で `dynamic_thresholding: false` / `controlnet_strength: 1` / `legacy: false` / `legacy_v3_extend: false` / `cfg_rescale: 0` を固定値として送信し、公式サイトの既定挙動に合わせている。今後 `nai-diffusion-3` 系でも同様の差異が報告された場合は、上記リポジトリの `presets_v3/default.preset`（`noise_schedule: 'native'` 等、V4系とは既定値が異なる）を参照してV3向けの値を追加すること。あわせて `sm: false` / `sm_dyn: false` / `autoSmea: true`（SMEA・SMEA DYNは既定OFFだが、公式サイトの「Auto」トグルと同様に1024×1024pxを超える解像度ではSMEAを自動適用させる）も送信しており、これを省略すると高解像度時にSMEAによる構図破綻・崩れの補正が働かず、公式サイトより低品質な結果になる。
- **キャラクタープロンプト**: 「＋ キャラクターを追加」でキャラクターごとのプロンプト／ネガティブプロンプトを複数設定できる。各キャラクターカードのチェックボックスで有効／無効を切り替えられ、無効化したキャラクターは入力欄がグレーアウトし、画像生成時のリクエストからも除外される。`nai-diffusion-4`系・`nai-diffusion-5`系モデルでは `v4_prompt` / `v4_negative_prompt`（`char_captions`）として送信し、それ以外のモデルでは `characterPrompts` として送信する。
- **キャラクター名での追加**: 「キャラクター名」「作品名（任意）」を入力し、任意で「組み合わせるチャンク／テンプレート（プロンプト用）」「組み合わせるチャンク／テンプレート（ネガティブプロンプト用）」をそれぞれ選択して「キャラクター名で追加」をクリックすると、`character (series)` 形式（作品名未入力時はキャラクター名のみ、Danbooru/NovelAIで一般的なキャラクタータグの表記に準拠）のプロンプトに選択したプロンプトチャンク／プロンプトテンプレートの内容をカンマ区切りで連結し、選択したネガティブプロンプト用のチャンク／テンプレートの内容をそのままネガティブプロンプトに設定したキャラクターカードが自動生成される。プロンプト側・ネガティブプロンプト側の両方でテンプレートを選択した場合は、それぞれについて追加前に変数入力ダイアログが順番に開く。
- **プロンプトチャンクの保存**: プロンプト欄の内容に名前を付けて保存し、チップとして一覧表示できる。チップをクリックすると直前にフォーカスしていたプロンプト欄（プロンプト／ネガティブプロンプト／各キャラクターのプロンプト欄）に挿入、✎クリックで編集ダイアログを表示、×クリックで削除できる（`chunks.json` に永続化）。「キャラクター名での追加」機能からも選択して利用できる。
- **プロンプトテンプレート**: `"変数名"` 形式のプレースホルダーを任意個数含んだプロンプト本文をテンプレートとして名前付きで保存できる。一覧の「適用」をクリックするとテンプレート内の変数を自動検出したダイアログが開き、値をまとめて入力して「反映」すると、直前にフォーカスしていたプロンプト欄の内容を置き換える形で反映される。「編集」「削除」も可能（`templates.json` に永続化）。「キャラクター名での追加」機能からも選択して利用できる。
- **各機能セクションの折りたたみ**: 左パネルの各機能（設定／プロンプト／プロンプトテンプレート／お気に入り／キャラクタープロンプト／モデル／連続生成）は `<details>`/`<summary>` で折りたたみ可能。「生成する」ボタンは折りたたみの影響を受けない独立した固定エリアに配置している。開閉状態は各 `<details>` の `id`（`settingsSection` / `promptSection` / `templateSection` / `favoritesSection` / `characterSection` / `modelSection` / `batchSection`）をキーに `settings.sectionState` として保存され、次回起動時に復元される。
- **お気に入り（アーティスト・キャラクター）**: よく使うアーティスト名を「お気に入りアーティスト」として、キャラクター名＋作品名（任意）のペアを「お気に入りキャラクター」として保存できる。各チップの「挿入」で直前にフォーカスしていたプロンプト欄に反映され、キャラクターのチップは「テンプレへ」で「キャラクター名で追加」欄（キャラクタープロンプトセクション）にキャラクター名・作品名を自動入力できる（同セクションを自動的に展開）。「編集」「削除」も可能（`favorite-artists.json` / `favorite-characters.json` に永続化）。
- **設定の永続化**: 画面に表示されている入力・選択状態は原則としてすべて `settings.json` に保存し、次回起動時に同じ状態へ復元する（`load-settings` / `save-settings` IPC）。対象はAPIキー・プロンプト／ネガティブプロンプト・モデルや画像サイズ等のパラメータ・Quality Tags自動追加のON/OFF・保存先フォルダ・キャラクタープロンプト・複数プロンプト連続生成のリスト（`queueItems`、行ごとのプロンプト／ネガティブプロンプト／枚数／キャラクタープロンプトを含む）・連続生成／複数プロンプト連続生成の回数や生成間隔（秒）・各機能セクションの折りたたみ状態（`sectionState`）など、UI上のフォーム入力全般に及ぶ。新しく永続化すべき入力欄（フォーム値・回数・間隔など）を画面に追加した場合は、`App.jsx` の設定読み込み（`useEffect` 内の `loadSettings` 呼び出し）と `currentSettings`（保存対象オブジェクトとその依存配列）の両方に必ず追加すること。片方だけ追加すると、保存はされるが起動時に復元されない（またはその逆）状態になる。例外的に永続化しないのはシード値（`seed`、既定で毎回0/ランダムに戻す、旧アプリの挙動を踏襲）のように意図的に「起動のたびにリセットする」設計にしているものだけであり、その場合はコード上にその旨のコメントを残す。
- **Anlas / Opus残量の確認**: 「設定」セクションの「Anlas / Opus残量を確認」ボタンをクリックすると、NovelAI APIの `GET /user/subscription`（`window.api.getSubscriptionInfo(apiKey)`）を呼び出し、Anlas残量（`trainingStepsLeft` の固定分＋購入分の合計）と、Opus等のサブスクリプション特典による無料生成枠（`perks.unlimitedImageGeneration`、解像度・回数上限・リセット間隔）を表示する。NovelAI APIはこの枠の「使用済み回数」までは返さないため、表示するのは上限（クォータ）情報であり、残り使用可能回数の厳密な値ではない。
- **連続生成**: 指定した回数・間隔（秒）で同一プロンプトの画像を連続生成し、`output/batch_<タイムスタンプ>/` フォルダにまとめて保存する。「中断する」でいつでも停止できる。Anlas（トークン）消費とAPIレート制限に配慮し、既定で各生成の間に待機時間（既定5秒、変更可）を挟む設計としている。
- **複数プロンプト連続生成**: 「＋ プロンプトを追加」でプロンプト／ネガティブプロンプト／枚数の組を任意個数リストに追加でき、各行の「↑」「↓」で並び順を入れ替えられる（プロンプト欄・ネガティブプロンプト欄はチャンク／テンプレートの挿入対象にもなる）。各行には「＋ キャラクターを追加」でその行専用のキャラクタープロンプト（`CharacterCard`と同じ有効／無効・プロンプト・ネガティブプロンプトの組。フォーカスキーは `` queue:${item.id}:char:${charIndex}:prompt `` 等でチャンク／テンプレート挿入対象にもなる）を任意個数追加でき、その行の生成では左パネル「キャラクタープロンプト」セクションの全体設定ではなく行ごとのキャラクター設定のみが適用される。各キャラクターは `<details>`/`<summary>`（`.char-fold`）で「キャラクター{n}」の見出しに折りたため、行内にキャラクターが増えても左パネルが縦に長くなりすぎないようにしている（「キャラクター名で追加」によるチャンク／テンプレート組み合わせ機能は行ごとには提供せず、既存のキャラクタープロンプトセクションのみで利用可能）。モデル・サイズ等の共通設定はそのまま使い、指定した順番でリストの上から順に各行の枚数だけ画像を生成し、`output/queue_<タイムスタンプ>/prompt<n>/`（`n`はリスト内の順番、1始まり）にプロンプトごとのフォルダへ分けて保存する。「中断する」でいつでも停止でき、連続生成（同一プロンプト）とは同時実行できないよう互いにガードしている。
  - **複数プロンプトテンプレート**: 「複数プロンプトテンプレート」欄の「現在の内容をテンプレートとして保存」をクリックすると、その時点のリスト全行（プロンプト・ネガティブプロンプト・枚数・各行のキャラクタープロンプト）を元にした専用ダイアログ（`QueueTemplateEditModal`）が開く。ダイアログ内で各テキスト欄を編集し、変数にしたい箇所を `"変数名"` の形式（`src/utils/templateVariables.js` の単一プロンプト用テンプレートと同じ記法）に置き換えてから名前を付けて保存できる（`queue-templates.json` に永続化）。ダイアログには行・キャラクターそれぞれに「削除」ボタンと、末尾に「＋ プロンプトを追加」（行の追加）・各行に「＋ キャラクターを追加」ボタンがあり、複数プロンプト連続生成のリストが空でも一からテンプレートを組み立てられる（元になるプロンプトが必須ではない）。行数・キャラクター数が増えて縦に長くなってもダイアログ本体（`.modal`）は `max-height: 90vh` + `overflow-y: auto` でスクロール可能にしており、各キャラクターは `<details>`/`<summary>` で個別に折りたたみ可能（既定は折りたたみ状態）にすることでダイアログの高さを抑えている。一覧の「適用」をクリックすると、テンプレート内の全変数（各行のプロンプト・ネガティブプロンプト・キャラクタープロンプト・ネガティブプロンプトを横断して検出、`extractQueueTemplateVariables`）をまとめて入力するダイアログ（`QueueTemplateApplyModal`）が開き、「反映」すると値が一括置換された行（`substituteQueueTemplateRows`）で複数プロンプト連続生成のリスト全体を置き換える（既存の行は破棄される）。「編集」「削除」も可能。
  - 複数プロンプト連続生成のリスト自体（`queueItems`。各行のプロンプト・ネガティブプロンプト・枚数・キャラクタープロンプトを含む）は、`prompt`や`characters`と同様に `settings.queueItems` として永続化され、次回起動時に復元される（起動時のみ復元し、空の初期状態を保存で上書きしないよう、読み込んだ配列が1件以上ある場合のみ復元する。古い保存データにIDが無い場合は読み込み時に補完する）。
- **画像からのプロンプト自動入力**: 「設定」セクションの「画像からプロンプトを読み込む」でNovelAIが生成したPNG画像ファイルを選択すると、そのPNGのtEXt/zTXt/iTXtチャンクに埋め込まれた生成情報（`Comment`チャンクのJSON。プロンプト・ネガティブプロンプト・ステップ数・スケール・サンプラー・シードと、`nai-diffusion-4`系・`nai-diffusion-5`系なら`v4_prompt`/`v4_negative_prompt`、それ以外なら`characterPrompts`によるキャラクタープロンプト、および`IHDR`チャンクから幅・高さ）を読み取り、対応する入力欄へ自動入力する（`src/utils/pngMetadata.js`。ファイルバイト列の解析のみで完結するため`window.api`は経由せず、Electron/Android共通で動作する）。抽出されるプロンプト・ネガティブプロンプトは実際の生成に使われた値（Quality Tags自動追加がONだった場合はその内容を含む）であるため、二重追加を避けるために読み込み後は自動的に「Quality Tagsを自動追加する」をOFFにする。モデル名（`full`/`curated`等の区別）はPNGの`Source`チャンクからは正確に判別できないため自動設定せず、参考情報としてステータス表示にのみ含める。読み込んだ画像に`Comment`チャンク（JSON）も`Description`チャンクも無い場合（NovelAI以外で生成・編集された画像、メタデータが除去された画像など）は「読み取れませんでした」という旨をステータス表示するのみで、既存の入力内容は変更しない。
- **生成結果のプレビュー**: 生成された画像をメイン画面に表示し、ファイル名・シード値を確認できる。
- **生成に使用したプロンプトのJSON出力**: 画像を1枚生成するたびに、その画像と同じフォルダ・同じファイル名（拡張子のみ `.json`）で、NovelAI APIへ実際に送信したリクエストボディ（`shared/novelai.mjs` の `buildRequestBody` が組み立てる `{ input, model, action, parameters }`。APIキーは含まれない）をそのまま保存する。プロンプト・ネガティブプロンプト・キャラクタープロンプト（`v4_prompt`/`v4_negative_prompt`または`characterPrompts`）・モデル・サイズ・サンプラー・シードなど、その画像の生成に実際に使われた値をテキストエディタ等でいつでも確認できる。連続生成・複数プロンプト連続生成で生成した画像にも同様に1枚ずつ対応するJSONファイルが作成される。
- **生成履歴サムネイル**: 過去に生成した画像をサムネイル一覧として表示し、クリックで再表示できる。
- **保存フォルダを開く**: 生成画像の保存先フォルダをOS標準のファイルマネージャーで開く（`open-output-folder` IPC、メニューの「ファイル」からも可能）。
- **保存先フォルダの変更**（Electron版のみ）: 「設定」セクションの「画像の保存先フォルダ」欄からOS標準のフォルダ選択ダイアログ（`choose-output-folder` IPC）を開き、任意のフォルダを保存先に指定できる。指定したパスは `settings.outputDir` として永続化され、未設定（空文字列）の場合は既定値（`documents/NovelAI/output/`）が使われる。「既定に戻す」で `outputDir` を空にして既定値に戻せる。Android版はCapacitorに任意フォルダへの書き込み権限を得る手段がないため、この欄は「保存先は端末内のドキュメントフォルダに固定されています」という説明文のみを表示し、保存先は常に固定。
- **生成ボタンの常時表示**: 「生成する」ボタンは左パネル内で `position: sticky` により画面下部に固定表示され、パネルをスクロールしても常にクリックできる（`.generate-sticky`）。
- **日本語メニュー**: ウィンドウ上部のメニュー（ファイル／編集／表示／ウィンドウ／ヘルプ）をすべて日本語化。

## アーキテクチャ

本アプリは **UI層を React + Vite で書き、Electron / Capacitor(Android) で共有し、「window.api」を境界にプラットフォーム固有の実装を差し替える** 構成になっている。`src/` が Vite のプロジェクトルート（`vite.config.js` の `root: 'src'`）であり、`vite build` の出力（`build.outDir: '../www'`）が `www/` に生成される。**`www/` はビルド成果物であり、手で編集しない**（gitignore対象、`npm run build:web` で再生成）。

- **UI (`src/`)** — Electron・Android共通の画面本体（React）。
  - `src/index.html` — Viteのエントリーテンプレート。`<div id="root">` と `src/main.jsx` へのモジュールスクリプトのみを持つ。
  - `src/main.jsx` — エントリーポイント。`./platform/capacitorBridge` を**最初に**副作用importしてから（Electronの`preload.js`が既に`window.api`を用意している場合はここで何もしない）、`<App />` を `#root` にマウントする。
  - `src/App.jsx` — トップレベルコンポーネント。左パネルの各セクションへ渡すpropsの組み立てとJSXの構成、および他のどのフックにも属さない少数の横断的な状態・処理（`apiKey`/`model`/`width`等の単純な入力値、設定の読み込み・デバウンス保存、`buildGenerateParams`/`recordResult`/`handleGenerate`など生成リクエスト全体の組み立て）に絞っている。機能ごとにまとまった状態・ハンドラは以下のカスタムフックへ切り出し、App.jsxからは戻り値を分割代入して使うだけになっている（元々1000行超あったApp.jsxを段階的に分割した結果の構成）。
    - `src/hooks/useCharacters.js` — 左パネル「キャラクタープロンプト」セクションのキャラクター一覧と、「キャラクター名で追加」フォーム（名前・作品名・組み合わせるチャンク／テンプレート）。
    - `src/hooks/useFocusedField.js` — フォーカス中のプロンプト系フィールド（チャンク/お気に入り挿入・テンプレート反映の対象）を`focusedFieldKey`（`'prompt'` / `'negativePrompt'` / `` `char:${index}:prompt` `` / `` `queue:${id}:prompt` `` 等の文字列）で管理し、`resolveFocusedField()`で都度その時点の最新値・setterを解決する`insertIntoFocused()`/`resolveFocusedField()`を提供する。DOM要素への直接アクセスは行わない。
    - `src/hooks/usePromptLibrary.js` — 「プロンプトチャンク」「プロンプトテンプレート」セクションの保存・編集・適用ハンドラ。
    - `src/hooks/useFavoritesHandlers.js` — 「お気に入り」セクションの保存・編集ハンドラ。
    - `src/hooks/useQueueItems.js` — 複数プロンプト連続生成のリスト自体のstate/CRUD。
    - `src/hooks/useQueueTemplateDraft.js` — 複数プロンプトテンプレートの保存・編集ダイアログのドラフトと適用状態、および関連ハンドラ。
    - `src/hooks/useBatchGeneration.js` / `src/hooks/useQueueGeneration.js` — それぞれ連続生成・複数プロンプト連続生成の実行ループ（進捗ステータス・中断フラグ・待機処理）。両者は「もう片方が実行中なら開始しない」という相互ガードがあるため、それぞれの`running`フラグ自体（`batchRunning`/`queueRunning`）と、`currentSettings()`が参照する`batchCount`/`batchInterval`/`queueInterval`はフック化せずApp.jsx側に残し、フックには値と相手側の`running`フラグ・自分の`setRunning`を渡すだけにしている（双方をフック内部の状態にすると互いのフックが循環参照になるため）。
    - 上記いずれの機能領域にも当てはまらない一枚岩の状態（`templateApplyState`等）は、複数のフックから共有される場合に限りApp.jsx側で保持し、フックには値とsetterを渡す。
  - `src/components/*.jsx` — 機能ごとのプレゼンテーションコンポーネント（`Section`, `PromptSection`, `TemplatesSection`, `FavoritesSection`, `CharactersSection`/`CharacterCard`, `ModelSection`, `BatchSection`, `PromptQueueSection`, `ResultPanel`）。状態は持たず、props経由でApp.jsxの状態とハンドラを受け取る。
  - `src/components/modals/*.jsx` — 編集・適用モーダル（`ChunkEditModal`, `TemplateEditModal`, `TemplateApplyModal`, `QueueTemplateEditModal`, `QueueTemplateApplyModal`, `FavArtistEditModal`, `FavCharEditModal`）。共通の `ModalOverlay` は `open` が falsy なら何も描画しない（旧実装のような `.open` クラス切り替えではなく、条件付きレンダリングで開閉する）。
  - `src/hooks/useNamedList.js` — チャンク・テンプレート・お気に入り・複数プロンプトテンプレートに共通する「読み込み→追加→編集→削除のたびにサーバー側の最新リストで置き換える」パターンを提供するフック。`src/hooks/useFavoritesList.js` はこれを`kind`（`'artist'`/`'character'`）でラップしてお気に入りに使う。
  - `src/utils/templateVariables.js` — `"変数名"` プレースホルダーの抽出・置換ロジック（純粋関数、Reactに依存しない）。
  - `src/utils/sleep.js` — `useBatchGeneration`/`useQueueGeneration`が生成間隔の待機に使う共通の`sleep(ms)`。
  - `src/styles.css` — 全体のスタイル（旧 `www/index.html` の `<style>` をそのまま移植）。折りたたみセクションは `<details className="section">` をReactの `open`/`onToggle` で制御しており、CSSの矢印回転等はHTML版と同じ仕組み。**`#root { display: flex; height: 100vh; }` は必須**（旧HTML版では`body`が`.left`/`.right`の直接の親でこのスタイルを持っていたが、Reactは`#root`配下にマウントするため、`body`ではなく`#root`にflexレイアウトを持たせる必要がある。これを外すと`.left`/`.right`が横並びでなく縦積みになり、`.left`が高さの制約を失って`.generate-sticky`の固定表示や生成画像の表示位置が壊れる）。
  - `src/platform/capacitorBridge.js` — 旧 `src/capacitor-bridge.js` と同内容（後述）。
- **共有ロジック (`shared/`)**
  - `shared/novelai.mjs` — NovelAI APIへのリクエストボディ組み立て（`buildRequestBody` / `isV4Model`）、生成画像の保存先サブフォルダ名を安全な文字だけに絞る `sanitizeBatchFolder`（連続生成・複数プロンプト連続生成の `batch_<タイムスタンプ>` / `queue_<タイムスタンプ>/prompt<n>` 等で使用、`main.js`・`capacitorBridge.js`双方が共有）、エンドポイントURL（`NOVELAI_IMAGE_ENDPOINT`）。**ネイティブESM**（`export function` / `export const`）で書かれている。`main.js`（CommonJS）はNode標準の動的 `import()` で読み込み（`loadNovelaiModule()`、初回呼び出し時にPromiseをキャッシュ）、`capacitorBridge.js`は通常の `import { ... } from '../../shared/novelai.mjs'` で読み込む（Viteが `vite build` ではRollupで、`vite dev` ではesbuildのプリバンドルでそれぞれ解決する）。
    - **`shared/novelai.mjs` を CommonJS (`module.exports`) に戻さないこと。** `main.js`からの`require()`では動くが、Viteの開発サーバー（`npm run dev`）はローカルの相対パスファイルに対してCJS→ESM変換を行わないため、ブラウザ側で `module is not defined` エラーになり起動できなくなる（`vite build`によるプロダクションビルドはRollupが変換するため気づきにくいので注意）。
- **Electron側 (`window.api` の実装 = preload.js + main.js)**
  - `preload.js` — `contextBridge` で `window.api` を公開する preload スクリプト（`loadSettings` / `saveSettings` / `generateImage` / `getSubscriptionInfo` / `openOutputFolder` / `chooseOutputFolder` / `loadChunks` / `saveChunk` / `updateChunk` / `deleteChunk` / `loadTemplates` / `saveTemplate` / `updateTemplate` / `deleteTemplate` / `loadQueueTemplates` / `saveQueueTemplate` / `updateQueueTemplate` / `deleteQueueTemplate` / `loadFavorites` / `saveFavorite` / `updateFavorite` / `deleteFavorite`）。`loadFavorites`等は第一引数に `kind`（`'artist'` または `'character'`）を取る。ページの他のスクリプトより先に実行されるため、Capacitor側のブリッジは「`window.api` が未定義の場合のみ」自身を定義するガードを持つ。
  - `main.js` — メインプロセスのエントリーポイント（`package.json` の `main` フィールドで指定）。通常は `www/index.html`（Viteのビルド成果物）を読み込むが、`process.env.ELECTRON_RENDERER_URL`（`electron-vite dev` が設定する）がある場合はその開発サーバーURLを`loadURL`する。同様にpreloadのパスも `devServerUrl` の有無で `preload.js`（プロジェクト直下、通常時）と `out-dev/preload/preload.js`（`electron-vite dev`がビルドした場所、開発時）を切り替える。起動時に最大化して表示するウィンドウ生成、日本語化した `Menu`、上記IPCハンドラの実装、NovelAI API呼び出し（`https`モジュール）、ZIPレスポンスの展開（`fflate`）とファイル保存を行う。お気に入りは `kind` ごとに `FAVORITE_PATHS` で切り替えたJSONファイルに保存する共通ハンドラ（`load-favorites` / `save-favorite` / `update-favorite` / `delete-favorite`）で実装。プロンプトチャンク・プロンプトテンプレート・複数プロンプトテンプレートの `load-*`/`save-*`/`update-*`/`delete-*` IPCハンドラは、対象JSONファイルのパスと保存するフィールド名（チャンク/テンプレートなら`['name', 'text']`、複数プロンプトテンプレートなら`['name', 'rows']`）だけを渡す共通ヘルパー `registerListHandlers(prefix, filePath, fields)` で登録しており、3コレクションでほぼ同一だったCRUDロジックの重複を排除している（`update`は`fields`に列挙したプロパティだけを対象アイテムへ反映し、`kind`ベースのお気に入りハンドラのような任意フィールドの丸ごとマージは行わない）。
  - `electron.vite.config.js` — `npm run dev`（`electron-vite dev`）専用の設定。`main.js`/`preload.js`をwatchビルドしつつ、`src/`のVite開発サーバーを起動し、実際のElectronアプリを自動起動する（HMR付き、`window.api`は本物のpreload経由IPC）。ビルド出力は `out-dev/`（gitignore対象、`main`は`out-dev/main/main.js`、`preload`は`out-dev/preload/preload.js`、`renderer`は`out-dev/renderer/`）。**本番パイプライン（`npm start` / `npm run build:web` / `npm run cap:sync` / `npm run dist`）はこの設定を使わず、引き続き `vite.config.js` による通常の `vite build` → `www/` の流れのまま**（`electron.vite.config.js`は開発時の起動体験を改善するためだけに追加したもので、パッケージング方式自体は変更していない）。
  - 生成画像の保存先は既定で `app.getPath('documents')/NovelAI/output/` 配下（**`__dirname` 配下ではない**）。パッケージ化した配布版はインストール先（`Program Files` 等）が読み取り専用になるため、必ずユーザー領域である `documents` を書き込み先にすること。開発時（`npm start`）も同じパスが使われる。ユーザーが「設定」セクションから保存先フォルダを変更した場合は `settings.outputDir`（絶対パス文字列）が優先され、`main.js` の `getOutputDir()` が `settings.json` を都度読み直して解決する（空文字列・未設定時は既定値にフォールバック）。`choose-output-folder` IPC は `dialog.showOpenDialog` でフォルダ選択ダイアログを表示し、選択されたパス（またはキャンセル時は`null`）を返すのみで、`settings.outputDir` への保存自体はレンダラー側の通常の設定保存フロー（`save-settings`）が行う。
  - 設定 (`settings.json`)、プロンプトチャンク (`chunks.json`)、プロンプトテンプレート (`templates.json`)、複数プロンプトテンプレート (`queue-templates.json`)、お気に入りアーティスト (`favorite-artists.json`)、お気に入りキャラクター (`favorite-characters.json`) は `app.getPath('userData')` 配下に保存される（リポジトリには含まれない）。
- **Android側 (`window.api` の実装 = src/platform/capacitorBridge.js)**
  - `src/platform/capacitorBridge.js` — Capacitor公式プラグインで `window.api` を実装。`@capacitor/preferences`で設定・チャンク・テンプレート・お気に入りを永続化（チャンクとテンプレートは項目形式が固定の`makeNamedListApi`、お気に入りは項目形式が可変な`makeGenericListApi`ヘルパーで共通実装）、`@capacitor/filesystem`で画像を端末の `Documents/output/` 配下に保存、`fflate`でZIP展開、NovelAI APIへのリクエストは `fetch` を使用（`capacitor.config.json` の `CapacitorHttp.enabled: true` によりネイティブ実行時はCORSを回避するようパッチされる）。
  - Android にはアプリの保存フォルダをファイラーで開く汎用APIが無いため、「保存フォルダを開く」ボタンは Android では「最新の画像を共有」（`@capacitor/share`）として動作する。`App.jsx` は `window.isNativeApp` フラグ（ブリッジが`Capacitor.isNativePlatform()`から設定）でボタンラベルを切り替える。
  - `capacitor.config.json` — Capacitor設定（`appId`, `appName`, `webDir: "www"`, `CapacitorHttp.enabled: true`）。`webDir` は Vite のビルド出力先と一致させること。
  - `android/` — `npx cap add android` で生成されたネイティブAndroidプロジェクト（Android Studio/Gradleでビルドする実体）。
- **依存関係**
  - `react` / `react-dom`: UIフレームワーク本体。
  - `vite` / `@vitejs/plugin-react`: `src/` のビルド（devDependency）。JSXのトランスパイルとバンドルを担当し、`capacitorBridge.js`のバンドルも兼ねる（旧esbuildの役割を統合）。
  - `fflate`: NovelAI APIのレスポンス（ZIP形式で画像が返る）を展開するために使用（Electron・Capacitor両方で共通利用、旧`adm-zip`から置き換え）。
  - `electron`: デスクトップアプリフレームワーク（devDependency）。
  - `@capacitor/core` / `@capacitor/android` / `@capacitor/filesystem` / `@capacitor/preferences` / `@capacitor/share`: Android版の実行基盤とネイティブ機能アクセス。
  - `@capacitor/cli`: Androidプロジェクトの同期用CLI（devDependency）。
  - `electron-builder`: デスクトップ版を単独実行可能なインストーラー/実行ファイルにパッケージングする（devDependency）。設定は `package.json` の `build` フィールド。
  - `electron-vite`: `npm run dev` 専用の開発用ランチャー（devDependency、`electron.vite.config.js`）。本番ビルド（`vite build`）には関与しない。
  - `eslint-plugin-react-hooks`: `src/**/*.jsx` のHooksルール（`rules-of-hooks` / `exhaustive-deps`）をESLintで検査するためのプラグイン（devDependency、`eslint.config.js`）。

## 開発コマンド

```
npm run dev           # electron-vite dev で main.js/preload.js/src をHMR付きでビルドし、実際のElectronアプリを起動（window.apiはpreload.js経由の本物のIPC。out-dev/ に一時ビルドされ、gitignore対象）
npm start             # vite build を実行してから electron . でデスクトップ版を起動
npm run build:web     # src/ を vite build で www/ にビルド
npm run cap:sync      # ビルド後、Androidネイティブプロジェクトへ www/ の内容を同期（npx cap sync android）
npm run cap:open:android  # Android Studio で android/ プロジェクトを開く（要 Android Studio インストール）
npm run dist           # electron-builder で実行中のOS向けに単独アプリをビルド（dist/ に出力）
npm run dist:win       # Windows向けにNSISインストーラー(.exe)とポータブル版(.exe)を明示的にビルド
```

Android実機/エミュレータでの実行・APKビルドには Android Studio と Android SDK のセットアップが別途必要（このリポジトリの開発環境には含まれない）。`npx cap sync android` 後、Android Studio 上で実行するか `android/gradlew assembleDebug` でビルドする。

### デスクトップ版の単独アプリ化（electron-builder）

`npm run dist`（または `npm run dist:win`）を実行すると、`dist/` 配下に以下が生成される。

- `dist/win-unpacked/` — 展開済みの単独実行可能アプリ（`NovelAI 画像生成.exe` を直接実行可能）。
- `dist/NovelAI 画像生成 Setup <version>.exe` — NSIS形式のインストーラー。
- `dist/NovelAI 画像生成 <version>.exe` — インストール不要のポータブル版exe。

`package.json` の `build.files` で `android/`・`src/`（Reactソース。ビルド成果物である`www/`だけを同梱すれば動く）・`output/`・`dist/` など Electron 実行に不要なディレクトリを除外している。`main.js` の生成画像保存先は `output/`（プロジェクト直下）ではなく `app.getPath('documents')/NovelAI/output/` であり、これはパッケージ化されたアプリのインストール先が読み取り専用であることに対応するための設計（上記アーキテクチャ節を参照）。新しくファイルを永続化する機能を追加する際も、書き込み先には必ず `app.getPath(...)` が返すユーザー領域のパスを使うこと。

## コーディング規約

Prettier / ESLint を導入済み。コードを変更したら次のコマンドで整形・検査すること（CIはまだ無いため、コミット前に手動実行が必須）。

```
npm run format        # main.js / preload.js / shared / src を Prettier で自動整形
npm run format:check  # 整形が必要な差分がないかチェックのみ行う
npm run lint           # 上記対象を ESLint で検査（eslint.config.js。src/**/*.jsx には eslint-plugin-react-hooks の rules-of-hooks（error）/ exhaustive-deps（warn）を適用）
```

- **フォーマット（Prettier, `.prettierrc.json`）**: シングルクォート、セミコロンあり、`printWidth: 100`、`trailingComma: "es5"`。手動でスタイルを合わせようとせず、必ず `npm run format` に任せる。
- **命名規則**:
  - 変数・関数は `camelCase`、変更されない設定値の定数は `UPPER_SNAKE_CASE`（例: `NOVELAI_IMAGE_ENDPOINT`, `FAVORITE_KEYS`）。
  - Reactコンポーネントは `PascalCase` のファイル名・関数名（例: `CharactersSection.jsx`）、hooksは `useXxx` 命名（例: `useNamedList.js`）。
  - `main.js`/`preload.js`/`shared/`側のファイル名は `kebab-case`。
- **モジュール形式の使い分け**:
  - `main.js` / `preload.js` / `shared/*.js` — CommonJS（`require` / `module.exports`）。
  - `src/**/*.{js,jsx}` — ESM（`import` / `export`）。Vite（`vite build`）で `www/` にバンドルされる。JSXの自動ランタイムを使うため、コンポーネントファイルで `import React from 'react'` は不要。
- **文字列・関数定義**: 文字列はシングルクォート、変数展開が必要な場合のみテンプレートリテラルを使う。トップレベルの関数は `function` 宣言、コールバック/イベントハンドラはアロー関数。非同期処理は必ず `async/await` を使い、`.then()` チェーンは書かない。
- **エラーメッセージ**: ユーザー向けに表示されるエラーは日本語で `throw new Error('...')` する（既存の `APIキーを入力してください` 等のパターンに従う）。
- **Reactの状態管理**: Redux等の外部状態管理ライブラリは導入しない。`App.jsx` がアプリ全体の状態を持ち、`src/components/*.jsx` は基本的に状態を持たないpropsベースのコンポーネントとする（既存の分割に合わせる）。DOMを直接操作しない（`document.getElementById` 等をコンポーネント内で使わない。既存コードで参照が必要なのは `App.jsx` の `charNameByNameRef`（フォーカス移動）程度に留めている）。
- **Hooksのルール**: `eslint-plugin-react-hooks`（`react-hooks/rules-of-hooks` / `react-hooks/exhaustive-deps`）が `src/**/*.jsx` に適用されており、`npm run lint` で検査される。`useEffect`/`useCallback`/`useMemo` の依存配列は原則としてlintの指摘通り過不足なく書く（意図的に外す場合のみ理由をコメントで残す）。
- **リストの `key`**: `Array.prototype.map` でリストをレンダリングする際、要素の並び替え・削除が起こり得る配列（`characters` 等）では配列のインデックスではなく、要素が持つ安定した一意のID（例: 生成時に付与する `crypto.randomUUID()`）を `key` に使う。並び替え・削除が起こらない固定リスト（`MODEL_OPTIONS` 等の定数配列）はインデックスキーでも問題ない。

## 開発ルール

- **セキュリティ**: `preload.js` の `contextBridge` によるAPI公開パターンを維持し、`nodeIntegration` をレンダラーで有効化しない。APIキーなどの機密情報をログ出力・平文でリポジトリにコミットしない。
- **`window.api` の両実装を同期させる**: `window.api` に新しいメソッドを追加・変更する場合、`preload.js`＋`main.js`（Electron側）と `src/platform/capacitorBridge.js`（Android側）の**両方**に対応する実装を必ず追加し、シグネチャ・戻り値の形を一致させる。片方だけ実装すると、もう一方のプラットフォームで機能が動作しなくなる。
- **UIとロジックの分離**: `src/`（Reactコンポーネント）にNovelAI APIの直接呼び出しやファイルI/Oを書かず、必ず `window.api` 経由でやり取りする（Electronでは`main.js`、Androidでは`capacitorBridge.js`がその実体を担う）。プラットフォーム分岐が必要な場合も個別のコンポーネントには極力書かず、`window.isNativeApp`など明示的なフラグ経由に留める。
- **共通ロジックは `shared/` に置く**: NovelAI APIのリクエスト形式など、Electron・Android両方で必要になるロジックは`shared/novelai.mjs`のようにネイティブESMモジュールとして切り出し、`main.js`からは動的`import()`、`capacitorBridge.js`からは通常の`import`で読み込む。同じロジックを両側に重複実装しない。
- **小さな変更を積み重ねる**: 過剰な抽象化は避け、必要になってから一般化する。ただしUI層のビルドツール（Vite）・フレームワーク（React）は本アプリの明示的な方針として既に採用済みであり、「ビルドツールを増やさない」原則は適用しない——新しい依存追加はREADME/CLAUDE.mdの更新とセットで検討すること。
- **エラーハンドリング**: API呼び出し失敗時は `App.jsx` の `try/catch` で捕捉し、`status` の状態に反映してユーザー向けメッセージを表示する既存パターンに従う。
- **コミット前確認**: `output/` ディレクトリに生成された画像ファイルや、APIキーを含む設定ファイルを誤ってコミットしないよう `.gitignore` を確認する。
- **連続リクエストへの配慮**: NovelAI APIへの連続リクエストはAnlas消費とレート制限のリスクがあるため、間隔を空けずに大量リクエストする機能は追加しない。バッチ処理を実装する場合は生成間隔（待機時間）を必須にし、中断できる手段を用意する。
- 機能を追加・修正したときは、必ずCLAUDE.mdとREADMEに反映すること。依存関係を追加・更新した場合は `THIRD_PARTY_NOTICES.md` のライセンス一覧も見直すこと。
- **Gitワークフロー**: `master` ブランチへの直接コミット・直接プッシュは行わない。変更は必ず作業用ブランチを作成した上でコミットし、`master` へはプルリクエスト経由でのみ反映する。
