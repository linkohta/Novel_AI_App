# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code (claude.ai/code) 向けのガイダンスです。

## プロジェクト概要

NovelAI の画像生成 API にプロンプトを送信し、生成された画像を保存・閲覧するアプリです（`package.json` の description: 「Novel AI 画像生成プロンプト送信・保存アプリ」）。Electronによるデスクトップ版と、Capacitorによるスマートフォン(Android)版で、React + Vite で書かれたUI（`src/`）を共通のソースコードとして共有している。

## 応対言語

- ユーザーとの対話は常に **日本語** で行うこと。
- **コードコメントも日本語で統一する。** `main.ts`/`preload.ts`/`shared/`（CommonJS/ESM問わず）・`src/**/*.{ts,tsx}` を含むすべてのソースファイルで、英語のコメントを新規に追加しない。既存の英語コメントを見つけた場合も、そのファイルを編集する際に日本語へ書き直す。

## 機能

- **プロンプト送信による画像生成**: APIキー（persistent token）、プロンプト、ネガティブプロンプト、モデル、幅・高さ、ステップ数、スケール、サンプラー、シードを指定して NovelAI の画像生成 API を呼び出す。「モデル」セクションの「Quality Tagsを自動追加する」チェックボックス（既定ON）は NovelAI API の `qualityToggle` パラメータに対応し、サーバー側で標準のQuality Tagsをプロンプトに自動追加するかどうかを制御する。プロンプトに手動でQuality Tags（や UC Preset 相当のテキスト）を追加済みの場合、ONのままだとサーバー側の自動追加分と重複し、NovelAI公式サイトでの出力と大きく異なる結果になるため、その場合はOFFにする。
  - **`nai-diffusion-4`系・`nai-diffusion-5`系モデルのサンプリング関連パラメータ**: `shared/novelai.mts` の `buildRequestBody` は、`nai-diffusion-3`系での動作歴を踏まえたUI/API設計時点では `noise_schedule` / `deliberate_euler_ancestral_bug` / `prefer_brownian` / `legacy_uc` を送信していなかったが、これらは公式サイトが内部で使っているプリセット既定値（コミュニティによるAPIリバースエンジニアリング成果である [novelai-api](https://github.com/Aedial/novelai-api) の `image_presets/presets_v4/default.preset` を参照）であり、**プロンプト内容ではなく拡散サンプリングそのものを左右する**ため、省略すると同じプロンプト・シード・サンプラーでも公式サイトと大きく異なる画像になる。そのため `nai-diffusion-4`系・`nai-diffusion-5`系では `noise_schedule: 'karras'` / `deliberate_euler_ancestral_bug: false` / `prefer_brownian: true` / `legacy_uc: false` を、モデル共通で `dynamic_thresholding: false` / `controlnet_strength: 1` / `legacy: false` / `legacy_v3_extend: false` / `cfg_rescale: 0` を固定値として送信し、公式サイトの既定挙動に合わせている。今後 `nai-diffusion-3` 系でも同様の差異が報告された場合は、上記リポジトリの `presets_v3/default.preset`（`noise_schedule: 'native'` 等、V4系とは既定値が異なる）を参照してV3向けの値を追加すること。あわせて `sm: false` / `sm_dyn: false` / `autoSmea: true`（SMEA・SMEA DYNは既定OFFだが、公式サイトの「Auto」トグルと同様に1024×1024pxを超える解像度ではSMEAを自動適用させる）も送信しており、これを省略すると高解像度時にSMEAによる構図破綻・崩れの補正が働かず、公式サイトより低品質な結果になる。
- **キャラクタープロンプト**: 「＋ キャラクターを追加」でキャラクターごとのプロンプト／ネガティブプロンプトを複数設定できる。各キャラクターカードのチェックボックスで有効／無効を切り替えられ、無効化したキャラクターは入力欄がグレーアウトし、画像生成時のリクエストからも除外される。`nai-diffusion-4`系・`nai-diffusion-5`系モデルでは `v4_prompt` / `v4_negative_prompt`（`char_captions`）として送信し、それ以外のモデルでは `characterPrompts` として送信する。
- **キャラクター名での追加**: 「キャラクター名」「作品名（任意）」を入力し、任意で「組み合わせるチャンク／テンプレート（プロンプト用）」「組み合わせるチャンク／テンプレート（ネガティブプロンプト用）」をそれぞれ選択して「キャラクター名で追加」をクリックすると、`character (series)` 形式（作品名未入力時はキャラクター名のみ、Danbooru/NovelAIで一般的なキャラクタータグの表記に準拠）のプロンプトに選択したプロンプトチャンク／プロンプトテンプレートの内容をカンマ区切りで連結し、選択したネガティブプロンプト用のチャンク／テンプレートの内容をそのままネガティブプロンプトに設定したキャラクターカードが自動生成される。プロンプト側・ネガティブプロンプト側の両方でテンプレートを選択した場合は、それぞれについて追加前に変数入力ダイアログが順番に開く。
- **プロンプトチャンクの保存**: プロンプト欄の内容に名前を付けて保存し、チップとして一覧表示できる。チップをクリックすると直前にフォーカスしていたプロンプト欄（プロンプト／ネガティブプロンプト／各キャラクターのプロンプト欄）に挿入、✎クリックで編集ダイアログを表示、×クリックで削除できる（`chunks.json` に永続化）。「キャラクター名での追加」機能からも選択して利用できる。
- **プロンプトテンプレート**: `"変数名"` 形式のプレースホルダーを任意個数含んだプロンプト本文をテンプレートとして名前付きで保存できる。一覧の「適用」をクリックするとテンプレート内の変数を自動検出したダイアログが開き、値をまとめて入力して「反映」すると、直前にフォーカスしていたプロンプト欄の内容を置き換える形で反映される。「編集」「削除」も可能（`templates.json` に永続化）。「キャラクター名での追加」機能からも選択して利用できる。
- **各機能セクションの折りたたみ**: 左パネルの各機能（設定／プロンプト／プロンプトテンプレート／お気に入り／キャラクタープロンプト／モデル／連続生成）は `<details>`/`<summary>` で折りたたみ可能。「生成する」ボタンは折りたたみの影響を受けない独立した固定エリアに配置している。開閉状態は各 `<details>` の `id`（`settingsSection` / `promptSection` / `templateSection` / `favoritesSection` / `characterSection` / `modelSection` / `batchSection`）をキーに `settings.sectionState` として保存され、次回起動時に復元される。
- **お気に入り（アーティスト・キャラクター）**: よく使うアーティスト名を「お気に入りアーティスト」として、キャラクター名＋作品名（任意）のペアを「お気に入りキャラクター」として保存できる。各チップの「挿入」で直前にフォーカスしていたプロンプト欄に反映され、キャラクターのチップは「テンプレへ」で「キャラクター名で追加」欄（キャラクタープロンプトセクション）にキャラクター名・作品名を自動入力できる（同セクションを自動的に展開）。「編集」「削除」も可能（`favorite-artists.json` / `favorite-characters.json` に永続化）。
- **設定の永続化**: 画面に表示されている入力・選択状態は原則としてすべて `settings.json` に保存し、次回起動時に同じ状態へ復元する（`load-settings` / `save-settings` IPC）。対象はAPIキー・プロンプト／ネガティブプロンプト・モデルや画像サイズ等のパラメータ・Quality Tags自動追加のON/OFF・保存先フォルダ・キャラクタープロンプト・複数プロンプト連続生成のリスト（`queueItems`、行ごとのプロンプト／ネガティブプロンプト／枚数／キャラクタープロンプトを含む）・連続生成／複数プロンプト連続生成の回数や生成間隔（秒）・各機能セクションの折りたたみ状態（`sectionState`）など、UI上のフォーム入力全般に及ぶ。新しく永続化すべき入力欄（フォーム値・回数・間隔など）を画面に追加した場合は、`App.tsx` の設定読み込み（`useEffect` 内の `loadSettings` 呼び出し）と `currentSettings`（保存対象オブジェクトとその依存配列）の両方に必ず追加すること。片方だけ追加すると、保存はされるが起動時に復元されない（またはその逆）状態になる。例外的に永続化しないのはシード値（`seed`、既定で毎回0/ランダムに戻す、旧アプリの挙動を踏襲）のように意図的に「起動のたびにリセットする」設計にしているものだけであり、その場合はコード上にその旨のコメントを残す。
- **Anlas / Opus残量の確認**: 「設定」セクションの「Anlas / Opus残量を確認」ボタンをクリックすると、NovelAI APIの `GET /user/subscription`（`window.api.getSubscriptionInfo(apiKey)`）を呼び出し、Anlas残量（`trainingStepsLeft` の固定分＋購入分の合計）と、Opus等のサブスクリプション特典による無料生成枠（`perks.unlimitedImageGeneration`、解像度・回数上限・リセット間隔）を表示する。NovelAI APIはこの枠の「使用済み回数」までは返さないため、表示するのは上限（クォータ）情報であり、残り使用可能回数の厳密な値ではない。
- **連続生成**: 指定した回数・間隔（秒）で同一プロンプトの画像を連続生成し、`output/batch_<タイムスタンプ>/` フォルダにまとめて保存する。「中断する」でいつでも停止できる。Anlas（トークン）消費とAPIレート制限に配慮し、既定で各生成の間に待機時間（既定5秒、変更可）を挟む設計としている。
- **複数プロンプト連続生成**: 「＋ プロンプトを追加」でプロンプト／ネガティブプロンプト／枚数の組を任意個数リストに追加でき、各行の「↑」「↓」で並び順を入れ替えられる（プロンプト欄・ネガティブプロンプト欄はチャンク／テンプレートの挿入対象にもなる）。各行には「＋ キャラクターを追加」でその行専用のキャラクタープロンプト（`CharacterCard`と同じ有効／無効・プロンプト・ネガティブプロンプトの組。フォーカスキーは `` queue:${item.id}:char:${charIndex}:prompt `` 等でチャンク／テンプレート挿入対象にもなる）を任意個数追加でき、その行の生成では左パネル「キャラクタープロンプト」セクションの全体設定ではなく行ごとのキャラクター設定のみが適用される。各キャラクターは `<details>`/`<summary>`（`.char-fold`）で「キャラクター{n}」の見出しに折りたため、行内にキャラクターが増えても左パネルが縦に長くなりすぎないようにしている（「キャラクター名で追加」によるチャンク／テンプレート組み合わせ機能は行ごとには提供せず、既存のキャラクタープロンプトセクションのみで利用可能）。「生成枚数を全行にまとめて指定」欄に枚数を入力して「全行に反映」をクリックすると、リスト全行の`枚数`を一括で同じ値に上書きできる（`useQueueItems`の`bulkCount`/`applyBulkCount`。この入力欄自体は都度指定するその場限りの操作用であり、`settings.json`には永続化しない）。モデル・サイズ等の共通設定はそのまま使い、指定した順番でリストの上から順に各行の枚数だけ画像を生成する。生成画像はプロンプトごとにフォルダを分けず、そのループ全体で1つの `output/queue_<タイムスタンプ>/` フォルダにまとめて保存する（画像ファイル名自体がタイムスタンプ+シード値で一意なため、フォルダを分けなくても衝突しない）。「中断する」でいつでも停止でき、連続生成（同一プロンプト）とは同時実行できないよう互いにガードしている。
  - **複数プロンプトテンプレート**: 「複数プロンプトテンプレート」欄の「現在の内容をテンプレートとして保存」をクリックすると、その時点のリスト全行（プロンプト・ネガティブプロンプト・枚数・各行のキャラクタープロンプト）を元にした専用ダイアログ（`QueueTemplateEditModal`）が開く。ダイアログ内で各テキスト欄を編集し、変数にしたい箇所を `"変数名"` の形式（`src/utils/templateVariables.ts` の単一プロンプト用テンプレートと同じ記法）に置き換えてから名前を付けて保存できる（`queue-templates.json` に永続化）。ダイアログには行・キャラクターそれぞれに「削除」ボタンと、末尾に「＋ プロンプトを追加」（行の追加）・各行に「＋ キャラクターを追加」ボタンがあり、複数プロンプト連続生成のリストが空でも一からテンプレートを組み立てられる（元になるプロンプトが必須ではない）。行数・キャラクター数が増えて縦に長くなってもダイアログ本体（`.modal`）は `max-height: 90vh` + `overflow-y: auto` でスクロール可能にしており、各キャラクターは `<details>`/`<summary>` で個別に折りたたみ可能（既定は折りたたみ状態）にすることでダイアログの高さを抑えている。一覧の「適用」をクリックすると、テンプレート内の全変数（各行のプロンプト・ネガティブプロンプト・キャラクタープロンプト・ネガティブプロンプトを横断して検出、`extractQueueTemplateVariables`）をまとめて入力するダイアログ（`QueueTemplateApplyModal`）が開き、「反映」すると値が一括置換された行（`substituteQueueTemplateRows`）で複数プロンプト連続生成のリスト全体を置き換える（既存の行は破棄される）。「編集」「削除」も可能。
  - 複数プロンプト連続生成のリスト自体（`queueItems`。各行のプロンプト・ネガティブプロンプト・枚数・キャラクタープロンプトを含む）は、`prompt`や`characters`と同様に `settings.queueItems` として永続化され、次回起動時に復元される（起動時のみ復元し、空の初期状態を保存で上書きしないよう、読み込んだ配列が1件以上ある場合のみ復元する。古い保存データにIDが無い場合は読み込み時に補完する）。
- **画像からのプロンプト自動入力**: 「設定」セクションの「画像からプロンプトを読み込む」でNovelAIが生成したPNG画像ファイルを選択すると、そのPNGのtEXt/zTXt/iTXtチャンクに埋め込まれた生成情報（`Comment`チャンクのJSON。プロンプト・ネガティブプロンプト・ステップ数・スケール・サンプラー・シードと、`nai-diffusion-4`系・`nai-diffusion-5`系なら`v4_prompt`/`v4_negative_prompt`、それ以外なら`characterPrompts`によるキャラクタープロンプト、および`IHDR`チャンクから幅・高さ）を読み取り、対応する入力欄へ自動入力する（`src/utils/pngMetadata.ts`。ファイルバイト列の解析のみで完結するため`window.api`は経由せず、Electron/Android共通で動作する）。抽出されるプロンプト・ネガティブプロンプトは実際の生成に使われた値（Quality Tags自動追加がONだった場合はその内容を含む）であるため、二重追加を避けるために読み込み後は自動的に「Quality Tagsを自動追加する」をOFFにする。モデル名（`full`/`curated`等の区別）はPNGの`Source`チャンクからは正確に判別できないため自動設定せず、参考情報としてステータス表示にのみ含める。読み込んだ画像に`Comment`チャンク（JSON）も`Description`チャンクも無い場合（NovelAI以外で生成・編集された画像、メタデータが除去された画像など）は「読み取れませんでした」という旨をステータス表示するのみで、既存の入力内容は変更しない。同じ仕組みは「複数プロンプト連続生成」セクションの各行にも「画像から読み込み」として展開しており（`App.tsx`の`handleLoadQueueItemImageMetadata`）、行ごとに画像を選択すると、その行の`prompt`／`negativePrompt`／`characters`（プロンプト・ネガティブプロンプト・キャラクタープロンプト）のみを読み込んだ内容で置き換える（`枚数`は変更しない）。各行にはモデル・サイズ・サンプラー等の個別設定が無く「モデル」セクションの共通設定をそのまま使う仕様のため、ステップ数・スケール・サンプラー・シード・幅・高さは行への反映対象にしていない。Quality Tagsの自動追加OFFへの切り替えは共通設定であるため、単一プロンプト用の読み込みと同様にこちらでも行う。
- **生成結果のプレビュー**: 生成された画像をメイン画面に表示し、ファイル名・シード値を確認できる。
- **生成に使用したプロンプトのJSON出力**: NovelAI APIへ送信したリクエストボディ（`shared/novelai.mts` の `buildRequestBody` が組み立てる `{ input, model, action, parameters }`。APIキーは含まれない）を、プロンプト単位で1つのJSONファイルとして保存する（画像1枚ごとではない）。「生成する」ボタンによる単発生成では、生成した画像と同じフォルダ・同じファイル名（拡張子のみ `.json`）で保存する（この場合は画像1枚=プロンプト1件のため、実際に使われた乱数シードの値も含まれる）。連続生成では `output/batch_<タイムスタンプ>/prompt.json` として、複数プロンプト連続生成では各行につき `output/queue_<タイムスタンプ>/prompt<n>.json`（`n`はリスト内の順番、1始まり）として、同一プロンプトで何枚生成するかによらず1個だけ保存する。これらプロンプト単位のJSONでは、`シード`は生成される各画像で実際に使われた値ではなく、そのプロンプトについて元のリクエストで指定した値（未指定/0ならランダムを意味する0のまま）を記録する——画像ごとに異なりうる実際のシードまでは記録しない。実装上は、IPC `generate-image` の呼び出し側が連続生成・複数プロンプト連続生成では `params.skipJsonOutput: true` を渡して画像ごとのJSON書き出しを抑止し、代わりにループの先頭でプロンプトごとに1回だけ専用のIPC `save-prompt-info`（Electron: `main.ts`、Android: `capacitorBridge.ts`の`savePromptInfo`）を呼んでいる。
- **生成履歴サムネイル**: 過去に生成した画像をサムネイル一覧として表示し、クリックで再表示できる。
- **保存フォルダを開く**: 生成画像の保存先フォルダをOS標準のファイルマネージャーで開く（`open-output-folder` IPC、メニューの「ファイル」からも可能）。
- **保存先フォルダの変更**（Electron版のみ）: 「設定」セクションの「画像の保存先フォルダ」欄からOS標準のフォルダ選択ダイアログ（`choose-output-folder` IPC）を開き、任意のフォルダを保存先に指定できる。指定したパスは `settings.outputDir` として永続化され、未設定（空文字列）の場合は既定値（`documents/NovelAI/output/`）が使われる。「既定に戻す」で `outputDir` を空にして既定値に戻せる。Android版はCapacitorに任意フォルダへの書き込み権限を得る手段がないため、この欄は「保存先は端末内のドキュメントフォルダに固定されています」という説明文のみを表示し、保存先は常に固定。
- **生成ボタンの常時表示**: 「生成する」ボタンは左パネル内で `position: sticky` により画面下部に固定表示され、パネルをスクロールしても常にクリックできる（`.generate-sticky`）。
- **日本語メニュー**: ウィンドウ上部のメニュー（ファイル／編集／表示／ウィンドウ／ヘルプ）をすべて日本語化。

## アーキテクチャ

本アプリは **UI層を React + Vite で書き、Electron / Capacitor(Android) で共有し、「window.api」を境界にプラットフォーム固有の実装を差し替える** 構成になっている。`src/` が Vite のプロジェクトルート（`vite.config.ts` の `root: 'src'`）であり、`vite build` の出力（`build.outDir: '../www'`）が `www/` に生成される。**`www/` はビルド成果物であり、手で編集しない**（gitignore対象、`npm run build:web` で再生成）。

- **UI (`src/`)** — Electron・Android共通の画面本体（React）。
  - `src/index.html` — Viteのエントリーテンプレート。`<div id="root">` と `src/main.tsx` へのモジュールスクリプトのみを持つ。
  - `src/main.tsx` — エントリーポイント。`./platform/capacitorBridge` を**最初に**副作用importしてから（Electronの`preload.ts`が既に`window.api`を用意している場合はここで何もしない）、`<App />` を `#root` にマウントする。
  - `src/App.tsx` — トップレベルコンポーネント。左パネルの各セクションへ渡すpropsの組み立てとJSXの構成、および他のどのフックにも属さない少数の横断的な状態・処理（`apiKey`/`model`/`width`等の単純な入力値、`buildGenerateParams`/`recordResult`/`handleGenerate`など生成リクエスト全体の組み立て）に絞っている。機能ごとにまとまった状態・ハンドラは以下のカスタムフックへ切り出し、App.tsxからは戻り値を分割代入して使うだけになっている（元々1000行超あったApp.tsxを段階的に分割した結果の構成）。
    - `src/hooks/useCharacters.ts` — 左パネル「キャラクタープロンプト」セクションのキャラクター一覧と、「キャラクター名で追加」フォーム（名前・作品名・組み合わせるチャンク／テンプレート）。
    - `src/hooks/useFocusedField.ts` — フォーカス中のプロンプト系フィールド（チャンク/お気に入り挿入・テンプレート反映の対象）を`focusedFieldKey`（`'prompt'` / `'negativePrompt'` / `` `char:${index}:prompt` `` / `` `queue:${id}:prompt` `` 等の文字列）で管理し、`resolveFocusedField()`で都度その時点の最新値・setterを解決する`insertIntoFocused()`/`resolveFocusedField()`を提供する。DOM要素への直接アクセスは行わない。
    - `src/hooks/usePromptLibrary.ts` — 「プロンプトチャンク」「プロンプトテンプレート」セクションの保存・編集・適用ハンドラ。
    - `src/hooks/useFavoritesHandlers.ts` — 「お気に入り」セクションの保存・編集ハンドラ。
    - `src/hooks/useQueueItems.ts` — 複数プロンプト連続生成のリスト自体のstate/CRUD。
    - `src/hooks/useQueueTemplateDraft.ts` — 複数プロンプトテンプレートの保存・編集ダイアログのドラフトと適用状態、および関連ハンドラ。
    - `src/hooks/useBatchGeneration.ts` / `src/hooks/useQueueGeneration.ts` — それぞれ連続生成・複数プロンプト連続生成の実行ループ（進捗ステータス・中断フラグ・待機処理）。両者は「もう片方が実行中なら開始しない」という相互ガードがあるため、それぞれの`running`フラグ自体（`batchRunning`/`queueRunning`）と、`currentSettings()`が参照する`batchCount`/`batchInterval`/`queueInterval`はフック化せずApp.tsx側に残し、フックには値と相手側の`running`フラグ・自分の`setRunning`を渡すだけにしている（双方をフック内部の状態にすると互いのフックが循環参照になるため）。
    - `src/hooks/useSettingsPersistence.ts` — 画面上のフォーム入力全般の起動時読み込み・デバウンス自動保存・`currentSettings()`の組み立てと、「保存先フォルダ」の変更ハンドラ。永続化すべき入力欄を追加する際は、このフック内の起動時読み込み処理と`currentSettings`（および依存配列）の両方に追加する必要がある（前掲の「設定の永続化」の節を参照）。
    - `src/hooks/useImageMetadataLoader.ts` — 「画像からプロンプトを読み込む」機能の2つのハンドラ（単一プロンプト用・複数プロンプト連続生成の行用）。いずれも`src/utils/pngMetadata.ts`で抽出した値を対応するsetterへ反映するだけの自己完結した処理のため、他のフックの状態を必要としない。
    - 上記いずれの機能領域にも当てはまらない一枚岩の状態（`templateApplyState`等）は、複数のフックから共有される場合に限りApp.tsx側で保持し、フックには値とsetterを渡す。
  - `src/components/*.tsx` — 機能ごとのプレゼンテーションコンポーネント（`Section`, `PromptSection`, `TemplatesSection`, `FavoritesSection`, `CharactersSection`/`CharacterCard`, `ModelSection`, `BatchSection`, `PromptQueueSection`, `ResultPanel`）。状態は持たず、props経由でApp.tsxの状態とハンドラを受け取る。`AppModals.tsx`は編集・適用系モーダル7種（下記`src/components/modals/*.tsx`）をまとめてレンダリングするだけの束ね役で、App.tsxのJSXから独立させている。
  - `src/components/modals/*.tsx` — 編集・適用モーダル（`ChunkEditModal`, `TemplateEditModal`, `TemplateApplyModal`, `QueueTemplateEditModal`, `QueueTemplateApplyModal`, `FavArtistEditModal`, `FavCharEditModal`）。共通の `ModalOverlay` は `open` が falsy なら何も描画しない（旧実装のような `.open` クラス切り替えではなく、条件付きレンダリングで開閉する）。
  - `src/hooks/useNamedList.ts` — チャンク・テンプレート・お気に入り・複数プロンプトテンプレートに共通する「読み込み→追加→編集→削除のたびにサーバー側の最新リストで置き換える」パターンを提供するフック。`src/hooks/useFavoritesList.ts` はこれを`kind`（`'artist'`/`'character'`）でラップしてお気に入りに使う。
  - `src/utils/templateVariables.ts` — `"変数名"` プレースホルダーの抽出・置換ロジック（純粋関数、Reactに依存しない）。
  - `src/utils/sleep.ts` — `useBatchGeneration`/`useQueueGeneration`が生成間隔の待機に使う共通の`sleep(ms)`と、待機中のカウントダウン表示に使う`waitWithCountdown(totalSeconds, { onTick, shouldStop })`。後者は残り秒数を`setTimeout`の呼び出し回数で数えるのではなく、開始時刻からの経過時間（`Date.now()`）で毎回計算し直しており、ウィンドウの非アクティブ化等で1回の`sleep`呼び出しが1秒より長くかかった場合でも、本来の終了時刻に追いつく形でカウントダウンが進む（後述の`backgroundThrottling: false`と合わせて「非アクティブ時に待機カウントが進まなくなる」問題への対策）。
  - `src/styles.css` — 全体のスタイル（旧 `www/index.html` の `<style>` をそのまま移植）。折りたたみセクションは `<details className="section">` をReactの `open`/`onToggle` で制御しており、CSSの矢印回転等はHTML版と同じ仕組み。**`#root { display: flex; height: 100vh; }` は必須**（旧HTML版では`body`が`.left`/`.right`の直接の親でこのスタイルを持っていたが、Reactは`#root`配下にマウントするため、`body`ではなく`#root`にflexレイアウトを持たせる必要がある。これを外すと`.left`/`.right`が横並びでなく縦積みになり、`.left`が高さの制約を失って`.generate-sticky`の固定表示や生成画像の表示位置が壊れる）。
  - `src/platform/capacitorBridge.ts` — 旧 `src/capacitor-bridge.ts` と同内容（後述）。
- **共有ロジック (`shared/`)**
  - `shared/novelai.mts` — NovelAI APIへのリクエストボディ組み立て（`buildRequestBody` / `isV4Model`）、生成画像の保存先サブフォルダ名を安全な文字だけに絞る `sanitizeBatchFolder`（連続生成・複数プロンプト連続生成の `batch_<タイムスタンプ>` / `queue_<タイムスタンプ>/prompt<n>` 等で使用、`main.ts`・`capacitorBridge.ts`双方が共有）、エンドポイントURL（`NOVELAI_IMAGE_ENDPOINT`）。**ネイティブESM**（`export function` / `export const`）で書かれている。`main.ts`（CommonJS）はNode標準の動的 `import()` で読み込み（`loadNovelaiModule()`、初回呼び出し時にPromiseをキャッシュ）、`capacitorBridge.ts`は通常の `import { ... } from '../../shared/novelai.mts'` で読み込む（Viteが `vite build` ではRollupで、`vite dev` ではesbuildのプリバンドルでそれぞれ解決する）。
    - **`shared/novelai.mts` を CommonJS (`module.exports`) に戻さないこと。** `main.ts`からの`require()`では動くが、Viteの開発サーバー（`npm run dev`）はローカルの相対パスファイルに対してCJS→ESM変換を行わないため、ブラウザ側で `module is not defined` エラーになり起動できなくなる（`vite build`によるプロダクションビルドはRollupが変換するため気づきにくいので注意）。
- **Electron側 (`window.api` の実装 = preload.ts + main.ts)**
  - `preload.ts` — `contextBridge` で `window.api` を公開する preload スクリプト（`loadSettings` / `saveSettings` / `generateImage` / `savePromptInfo` / `getSubscriptionInfo` / `openOutputFolder` / `chooseOutputFolder` / `loadChunks` / `saveChunk` / `updateChunk` / `deleteChunk` / `loadTemplates` / `saveTemplate` / `updateTemplate` / `deleteTemplate` / `loadQueueTemplates` / `saveQueueTemplate` / `updateQueueTemplate` / `deleteQueueTemplate` / `loadFavorites` / `saveFavorite` / `updateFavorite` / `deleteFavorite`）。`loadFavorites`等は第一引数に `kind`（`'artist'` または `'character'`）を取る。ページの他のスクリプトより先に実行されるため、Capacitor側のブリッジは「`window.api` が未定義の場合のみ」自身を定義するガードを持つ。
  - `main.ts` — メインプロセスのエントリーポイント（`package.json` の `main` フィールドで指定）。`app.whenReady()`でのウィンドウ生成・メニュー構築・IPCハンドラ登録の呼び出しのみに絞っており、実装本体は以下の`electron/`配下の各モジュールに切り出している（元々1つのファイルに全IPCハンドラ・メニュー定義・API呼び出しが集中していたものを段階的に分割した結果の構成）。
  - `electron/` — Electronメインプロセス側の実装本体（すべてCommonJS、TypeScriptで記述）。
    - `electron/settings-store.ts` — `settings.json`等の永続化ファイルパス（`settingsPath`/`chunksPath`/`templatesPath`/`queueTemplatesPath`/`FAVORITE_PATHS`）と、その読み書きに使う`readJson`/`writeJson`、および保存先フォルダを解決する`getOutputDir()`をまとめたモジュール。他の`electron/*.ts`すべてがこれに依存する土台。生成画像の保存先は既定で `app.getPath('documents')/NovelAI/output/` 配下（**`__dirname` 配下ではない**）。パッケージ化した配布版はインストール先（`Program Files` 等）が読み取り専用になるため、必ずユーザー領域である `documents` を書き込み先にすること。ユーザーが「設定」セクションから保存先フォルダを変更した場合は `settings.outputDir`（絶対パス文字列）が優先され、`getOutputDir()` が `settings.json` を都度読み直して解決する（空文字列・未設定時は既定値にフォールバック）。
    - `electron/menu.ts` — 日本語化した `Menu`（ファイル／編集／表示／ウィンドウ／ヘルプ）の構築。
    - `electron/window.ts` — `BrowserWindow`の生成。通常は `www/index.html`（Viteのビルド成果物）を読み込むが、`process.env.ELECTRON_RENDERER_URL`（`electron-vite dev` が設定する）がある場合はその開発サーバーURLを`loadURL`する。`webPreferences`は`backgroundThrottling: false`を指定しており（Electronの既定はtrue）、ウィンドウが最小化・非アクティブの間もレンダラー側の`setTimeout`が間引かれないようにしている。これは連続生成・複数プロンプト連続生成の待機カウントダウン（`src/utils/sleep.ts`の`waitWithCountdown`）がレンダラーのタイマーに依存しているため、既定のままだと非アクティブ時に待機カウントがほとんど進まなくなる不具合があったための対応。preloadのパスも `devServerUrl` の有無で `preload.js`（プロジェクト直下＝`electron-dist/preload.js`、本番ビルド時）と `out-dev/preload/preload.js`（`electron-vite dev`がTypeScriptをビルドした場所、開発時。いずれもコンパイル後のJS）を切り替える。**`electron-vite dev`はmain.ts/electron/配下を1ファイルにバンドルするため、バンドル後は`__dirname`がどのソースファイル由来のコードからでもバンドル出力先（`out-dev/main/`）を指す**（`electron/`配下に分割する前と`__dirname`の相対パス計算を変える必要がなかった理由）。本番ビルド（`tsc -p tsconfig.electron.json`）はバンドルせずファイルごとに個別コンパイルするため、`electron-dist/`配下でもソースと同じディレクトリ構成（`electron-dist/main.js` / `electron-dist/preload.js` / `electron-dist/electron/*.js`）が保たれ、`window.ts`の`path.join(__dirname, '..', 'preload.js')`という相対パス計算はTypeScript移行後も変更していない。
    - `electron/settings-handlers.ts` — `load-settings`/`save-settings`と、`open-output-folder`/`choose-output-folder`（`dialog.showOpenDialog`によるフォルダ選択ダイアログ）のIPCハンドラ。
    - `electron/list-handlers.ts` — プロンプトチャンク・プロンプトテンプレート・複数プロンプトテンプレートの `load-*`/`save-*`/`update-*`/`delete-*` IPCハンドラを、対象JSONファイルのパスと保存するフィールド名（チャンク/テンプレートなら`['name', 'text']`、複数プロンプトテンプレートなら`['name', 'rows']`）だけを渡す共通ヘルパー `registerListHandlers(prefix, filePath, fields)` で登録する。3コレクションでほぼ同一だったCRUDロジックの重複を排除している（`update`は`fields`に列挙したプロパティだけを対象アイテムへ反映し、`kind`ベースのお気に入りハンドラのような任意フィールドの丸ごとマージは行わない）。
    - `electron/favorite-handlers.ts` — お気に入りは `kind` ごとに `FAVORITE_PATHS` で切り替えたJSONファイルに保存する専用ハンドラ（`load-favorites` / `save-favorite` / `update-favorite` / `delete-favorite`）で実装。
    - `electron/novelai-client.ts` — NovelAI API呼び出し（`https`モジュールを使った`requestImage`/`requestSubscriptionInfo`）と、`shared/novelai.mts`を動的`import()`で読み込む`loadNovelaiModule()`（初回呼び出し時にPromiseをキャッシュ）。
    - `electron/generation-handlers.ts` — `get-subscription-info`/`generate-image`/`save-prompt-info`のIPCハンドラ。ZIPレスポンスの展開（`fflate`）とファイル保存もここで行う。
  - `electron.vite.config.ts` — `npm run dev`（`electron-vite dev`）専用の設定。`main.ts`/`preload.ts`をwatchビルドしつつ、`src/`のVite開発サーバーを起動し、実際のElectronアプリを自動起動する（HMR付き、`window.api`は本物のpreload経由IPC）。内部でesbuildを使ってTypeScriptを直接ビルドするため、tscによる事前コンパイルは不要。ビルド出力は `out-dev/`（gitignore対象、`main`は`out-dev/main/main.js`、`preload`は`out-dev/preload/preload.js`、`renderer`は`out-dev/renderer/`）。**本番パイプライン（`npm start` / `npm run dist` 等）はこの設定を使わず、`vite.config.ts` による通常の `vite build` → `www/`（レンダラー側）に加えて、`tsc -p tsconfig.electron.json`（`npm run build:electron`）による `main.ts`/`preload.ts`/`electron/**/*.ts`/`shared/novelai.mts` → `electron-dist/` へのコンパイル（メインプロセス側）を行う**（`electron.vite.config.ts`は開発時の起動体験を改善するためだけに追加したもので、パッケージング方式自体はTypeScript移行後もこの2系統のビルドを組み合わせる構成のまま変えていない）。`package.json`の`main`フィールドは`electron-dist/main.js`を指す。
  - 生成画像の保存先は既定で `app.getPath('documents')/NovelAI/output/` 配下（**`__dirname` 配下ではない**）。パッケージ化した配布版はインストール先（`Program Files` 等）が読み取り専用になるため、必ずユーザー領域である `documents` を書き込み先にすること。開発時（`npm start`）も同じパスが使われる。ユーザーが「設定」セクションから保存先フォルダを変更した場合は `settings.outputDir`（絶対パス文字列）が優先され、`main.ts` の `getOutputDir()` が `settings.json` を都度読み直して解決する（空文字列・未設定時は既定値にフォールバック）。`choose-output-folder` IPC は `dialog.showOpenDialog` でフォルダ選択ダイアログを表示し、選択されたパス（またはキャンセル時は`null`）を返すのみで、`settings.outputDir` への保存自体はレンダラー側の通常の設定保存フロー（`save-settings`）が行う。
  - 設定 (`settings.json`)、プロンプトチャンク (`chunks.json`)、プロンプトテンプレート (`templates.json`)、複数プロンプトテンプレート (`queue-templates.json`)、お気に入りアーティスト (`favorite-artists.json`)、お気に入りキャラクター (`favorite-characters.json`) は `app.getPath('userData')` 配下に保存される（リポジトリには含まれない）。
- **Android側 (`window.api` の実装 = src/platform/capacitorBridge.ts)**
  - `src/platform/capacitorBridge.ts` — Capacitor公式プラグインで `window.api` を実装。`@capacitor/preferences`で設定・チャンク・テンプレート・お気に入りを永続化（チャンクとテンプレートは項目形式が固定の`makeNamedListApi`、お気に入りは項目形式が可変な`makeGenericListApi`ヘルパーで共通実装）、`@capacitor/filesystem`で画像を端末の `Documents/output/` 配下に保存、`fflate`でZIP展開、NovelAI APIへのリクエストは `fetch` を使用（`capacitor.config.json` の `CapacitorHttp.enabled: true` によりネイティブ実行時はCORSを回避するようパッチされる）。
  - Android にはアプリの保存フォルダをファイラーで開く汎用APIが無いため、「保存フォルダを開く」ボタンは Android では「最新の画像を共有」（`@capacitor/share`）として動作する。`App.tsx` は `window.isNativeApp` フラグ（ブリッジが`Capacitor.isNativePlatform()`から設定）でボタンラベルを切り替える。
  - `capacitor.config.json` — Capacitor設定（`appId`, `appName`, `webDir: "www"`, `CapacitorHttp.enabled: true`）。`webDir` は Vite のビルド出力先と一致させること。
  - `android/` — `npx cap add android` で生成されたネイティブAndroidプロジェクト（Android Studio/Gradleでビルドする実体）。
- **依存関係**
  - `react` / `react-dom`: UIフレームワーク本体。
  - `vite` / `@vitejs/plugin-react`: `src/` のビルド（devDependency）。JSXのトランスパイルとバンドルを担当し、`capacitorBridge.ts`のバンドルも兼ねる（旧esbuildの役割を統合）。
  - `fflate`: NovelAI APIのレスポンス（ZIP形式で画像が返る）を展開するために使用（Electron・Capacitor両方で共通利用、旧`adm-zip`から置き換え）。
  - `electron`: デスクトップアプリフレームワーク（devDependency）。
  - `@capacitor/core` / `@capacitor/android` / `@capacitor/filesystem` / `@capacitor/preferences` / `@capacitor/share`: Android版の実行基盤とネイティブ機能アクセス。
  - `@capacitor/cli`: Androidプロジェクトの同期用CLI（devDependency）。
  - `electron-builder`: デスクトップ版を単独実行可能なインストーラー/実行ファイルにパッケージングする（devDependency）。設定は `package.json` の `build` フィールド。
  - `electron-vite`: `npm run dev` 専用の開発用ランチャー（devDependency、`electron.vite.config.ts`）。本番ビルド（`vite build`）には関与しない。
  - `eslint-plugin-react-hooks`: `src/**/*.tsx` のHooksルール（`rules-of-hooks` / `exhaustive-deps`）をESLintで検査するためのプラグイン（devDependency、`eslint.config.js`）。

## 開発コマンド

```
npm run dev           # electron-vite dev で main.ts/preload.ts/src をHMR付きでビルドし、実際のElectronアプリを起動（window.apiはpreload.ts経由の本物のIPC。out-dev/ に一時ビルドされ、gitignore対象）
npm start             # vite build（src/→www/）と tsc -p tsconfig.electron.json（main.ts/preload.ts/electron/shared→electron-dist/）を実行してから electron . でデスクトップ版を起動
npm run build:web     # src/ を vite build で www/ にビルド
npm run build:electron # main.ts/preload.ts/electron/**/*.ts/shared/novelai.mts を tsc -p tsconfig.electron.json で electron-dist/ にコンパイル
npm run typecheck      # tsc --noEmit で src/ 側（tsconfig.app.json）・electron/main/preload/shared側（tsconfig.electron.json）の両方を型検査
npm run cap:sync      # ビルド後、Androidネイティブプロジェクトへ www/ の内容を同期（npx cap sync android）
npm run cap:open:android  # Android Studio で android/ プロジェクトを開く（要 Android Studio インストール）
npm run dist           # build:web・build:electron を実行後、electron-builder で実行中のOS向けに単独アプリをビルド（dist/ に出力）
npm run dist:win       # Windows向けにNSISインストーラー(.exe)とポータブル版(.exe)を明示的にビルド
```

Android実機/エミュレータでの実行・APKビルドには Android Studio と Android SDK のセットアップが別途必要（このリポジトリの開発環境には含まれない）。`npx cap sync android` 後、Android Studio 上で実行するか `android/gradlew assembleDebug` でビルドする。

### デスクトップ版の単独アプリ化（electron-builder）

`npm run dist`（または `npm run dist:win`）を実行すると、`dist/` 配下に以下が生成される。

- `dist/win-unpacked/` — 展開済みの単独実行可能アプリ（`NovelAI 画像生成.exe` を直接実行可能）。
- `dist/NovelAI 画像生成 Setup <version>.exe` — NSIS形式のインストーラー。
- `dist/NovelAI 画像生成 <version>.exe` — インストール不要のポータブル版exe。

`package.json` の `build.files` で `android/`・`src/`（Reactソース。ビルド成果物である`www/`だけを同梱すれば動く）・`output/`・`dist/` など Electron 実行に不要なディレクトリを除外している。`main.ts` の生成画像保存先は `output/`（プロジェクト直下）ではなく `app.getPath('documents')/NovelAI/output/` であり、これはパッケージ化されたアプリのインストール先が読み取り専用であることに対応するための設計（上記アーキテクチャ節を参照）。新しくファイルを永続化する機能を追加する際も、書き込み先には必ず `app.getPath(...)` が返すユーザー領域のパスを使うこと。

## コーディング規約

TypeScript（`strict: true`）・Prettier・ESLintを導入済み。コードを変更したら次のコマンドで型検査・整形・検査すること（CIはまだ無いため、コミット前に手動実行が必須）。

```
npm run typecheck      # tsc --noEmit（tsconfig.app.json / tsconfig.electron.json）で型検査
npm run format         # main.ts / preload.ts / electron / shared / src / ルートの *.ts を Prettier で自動整形
npm run format:check  # 整形が必要な差分がないかチェックのみ行う
npm run lint           # 上記対象を ESLint で検査（eslint.config.js。@typescript-eslint/parser・@typescript-eslint/eslint-pluginで.ts/.tsx/.mtsを解析し、src/**/*.tsx には eslint-plugin-react-hooks の rules-of-hooks（error）/ exhaustive-deps（warn）を適用）
```

### TypeScript構成

- `tsconfig.base.json` — 全体で共有する`strict: true`等の基本設定。
- `tsconfig.app.json` — `src/**/*.{ts,tsx}` と `shared/novelai.mts` を対象とするレンダラー側の設定（`target: ES2022`, `lib: [ES2022, DOM, DOM.Iterable]`, `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `noEmit: true`。型検査専用で、実際のトランスパイル・バンドルはVite/esbuildが行う）。
- `tsconfig.electron.json` — `main.ts` / `preload.ts` / `electron/**/*.ts` / `shared/novelai.mts` / `src/types/window-api.ts`（preload.tsが型のみ参照するため）を対象とするNode/Electronメインプロセス側の設定（`module: NodeNext`, `moduleResolution: NodeNext`, `outDir: electron-dist`）。**`module: NodeNext`は拡張子ベースでファイルごとにCommonJS/ESMを自動判定する**ため、同じ`tsc`呼び出し内で`main.ts`/`electron/**/*.ts`はCommonJS（`.js`出力）、`shared/novelai.mts`はESM（`.mjs`出力）として正しくコンパイルされ、`electron/novelai-client.ts`の動的`import('../shared/novelai.mjs')`によるESM読み込みパターン（上記「共有ロジック」節）がTypeScript移行後も維持される。`npm run build:electron`（`tsc -p tsconfig.electron.json`）で実行し、出力先`electron-dist/`はソースと同じディレクトリ構成を保つ（バンドルしない）。
- `tsconfig.json` — ルート直下で開くエディタ向けに`tsconfig.app.json`をextendsするだけのデフォルト（`src/`配下の編集で型情報が効くようにするため）。electron側を編集する際は`tsconfig.electron.json`を明示的に参照する。
- `src/types/window-api.ts` — `window.api`の共通インターフェース`WindowApi`（`declare global`で`Window`型を拡張）。`preload.ts`（Electron実装）と`src/platform/capacitorBridge.ts`（Android実装）の両方がこの型を満たすように実装することで、片方だけにメソッドを追加してもう片方を更新し忘れる事故を型エラーとして検出できる。
- `src/types/domain.ts` — `Character` / `QueueItem` / `NamedItem` / `SectionState` 等、UI層で共有するドメイン型。IPC境界（`window.api`の戻り値が`GenericListItem`のような緩い型になっている箇所）や複雑なコールバック引数など、型として厳密にモデル化する価値が低い箇所は`any`/`unknown`を限定的に使っている（`eslint-disable-next-line @typescript-eslint/no-explicit-any`付き）。
- `@typescript-eslint/parser` / `@typescript-eslint/eslint-plugin`: ESLintでTypeScriptを解析するためのdevDependency。TSファイルではESLint組み込みの`no-undef`を無効化している（DOM lib型やtype-only importをno-undefが誤検知するため。未定義の型自体の検出は`tsc`の役割）。

- **フォーマット（Prettier, `.prettierrc.json`）**: シングルクォート、セミコロンあり、`printWidth: 100`、`trailingComma: "es5"`。手動でスタイルを合わせようとせず、必ず `npm run format` に任せる。
- **命名規則**:
  - 変数・関数は `camelCase`、変更されない設定値の定数は `UPPER_SNAKE_CASE`（例: `NOVELAI_IMAGE_ENDPOINT`, `FAVORITE_KEYS`）。
  - Reactコンポーネントは `PascalCase` のファイル名・関数名（例: `CharactersSection.tsx`）、hooksは `useXxx` 命名（例: `useNamedList.ts`）。
  - `main.ts`/`preload.ts`/`electron/`/`shared/`側のファイル名は `kebab-case`。
- **モジュール形式の使い分け**:
  - `main.ts` / `preload.ts` / `electron/*.ts` — TypeScript + CommonJS意味論（`import`/`export`構文で書くが、`tsconfig.electron.json`の`module: NodeNext`により`.ts`は拡張子ベースでCommonJSとしてコンパイルされ`require`/`module.exports`相当の出力になる）。
  - `shared/novelai.mts` — TypeScript + ネイティブESM（`.mts`拡張子は`module`設定によらず常にESM＝`.mjs`出力になる。CommonJSに戻さないこと）。
  - `src/**/*.{ts,tsx}` — ESM（`import` / `export`）。Vite（`vite build`）で `www/` にバンドルされる。JSXの自動ランタイムを使うため、コンポーネントファイルで `import React from 'react'` は不要。
- **文字列・関数定義**: 文字列はシングルクォート、変数展開が必要な場合のみテンプレートリテラルを使う。トップレベルの関数は `function` 宣言、コールバック/イベントハンドラはアロー関数。非同期処理は必ず `async/await` を使い、`.then()` チェーンは書かない。
- **エラーメッセージ**: ユーザー向けに表示されるエラーは日本語で `throw new Error('...')` する（既存の `APIキーを入力してください` 等のパターンに従う）。
- **Reactの状態管理**: Redux等の外部状態管理ライブラリは導入しない。`App.tsx` がアプリ全体の状態を持ち、`src/components/*.tsx` は基本的に状態を持たないpropsベースのコンポーネントとする（既存の分割に合わせる）。DOMを直接操作しない（`document.getElementById` 等をコンポーネント内で使わない。既存コードで参照が必要なのは `App.tsx` の `charNameByNameRef`（フォーカス移動）程度に留めている）。
- **Hooksのルール**: `eslint-plugin-react-hooks`（`react-hooks/rules-of-hooks` / `react-hooks/exhaustive-deps`）が `src/**/*.tsx` に適用されており、`npm run lint` で検査される。`useEffect`/`useCallback`/`useMemo` の依存配列は原則としてlintの指摘通り過不足なく書く（意図的に外す場合のみ理由をコメントで残す）。
- **リストの `key`**: `Array.prototype.map` でリストをレンダリングする際、要素の並び替え・削除が起こり得る配列（`characters` 等）では配列のインデックスではなく、要素が持つ安定した一意のID（例: 生成時に付与する `crypto.randomUUID()`）を `key` に使う。並び替え・削除が起こらない固定リスト（`MODEL_OPTIONS` 等の定数配列）はインデックスキーでも問題ない。

## 開発ルール

- **セキュリティ**: `preload.ts` の `contextBridge` によるAPI公開パターンを維持し、`nodeIntegration` をレンダラーで有効化しない。APIキーなどの機密情報をログ出力・平文でリポジトリにコミットしない。
- **`window.api` の両実装を同期させる**: `window.api` に新しいメソッドを追加・変更する場合、`preload.ts`＋`main.ts`（Electron側）と `src/platform/capacitorBridge.ts`（Android側）の**両方**に対応する実装を必ず追加し、シグネチャ・戻り値の形を一致させる。片方だけ実装すると、もう一方のプラットフォームで機能が動作しなくなる。`src/types/window-api.ts`の`WindowApi`型を両実装で共有しているため、メソッドの追加・シグネチャ変更時はこの型定義も更新し、`preload.ts`は`const api: WindowApi = {...}`、`capacitorBridge.ts`も同様に型注釈を付けて代入することで、片方の実装漏れ・戻り値の型不一致を`npm run typecheck`のコンパイルエラーとして検出できるようにすること。
- **UIとロジックの分離**: `src/`（Reactコンポーネント）にNovelAI APIの直接呼び出しやファイルI/Oを書かず、必ず `window.api` 経由でやり取りする（Electronでは`main.ts`、Androidでは`capacitorBridge.ts`がその実体を担う）。プラットフォーム分岐が必要な場合も個別のコンポーネントには極力書かず、`window.isNativeApp`など明示的なフラグ経由に留める。
- **共通ロジックは `shared/` に置く**: NovelAI APIのリクエスト形式など、Electron・Android両方で必要になるロジックは`shared/novelai.mts`のようにネイティブESMモジュールとして切り出し、`main.ts`からは動的`import()`、`capacitorBridge.ts`からは通常の`import`で読み込む。同じロジックを両側に重複実装しない。
- **小さな変更を積み重ねる**: 過剰な抽象化は避け、必要になってから一般化する。ただしUI層のビルドツール（Vite）・フレームワーク（React）は本アプリの明示的な方針として既に採用済みであり、「ビルドツールを増やさない」原則は適用しない——新しい依存追加はREADME/CLAUDE.mdの更新とセットで検討すること。
- **エラーハンドリング**: API呼び出し失敗時は `App.tsx` の `try/catch` で捕捉し、`status` の状態に反映してユーザー向けメッセージを表示する既存パターンに従う。
- **コミット前確認**: `output/` ディレクトリに生成された画像ファイルや、APIキーを含む設定ファイルを誤ってコミットしないよう `.gitignore` を確認する。
- **連続リクエストへの配慮**: NovelAI APIへの連続リクエストはAnlas消費とレート制限のリスクがあるため、間隔を空けずに大量リクエストする機能は追加しない。バッチ処理を実装する場合は生成間隔（待機時間）を必須にし、中断できる手段を用意する。
- 機能を追加・修正したときは、必ずCLAUDE.mdとREADMEに反映すること。依存関係を追加・更新した場合は `THIRD_PARTY_NOTICES.md` のライセンス一覧も見直すこと。
- **Gitワークフロー**: `master` ブランチへの直接コミット・直接プッシュは行わない。変更は必ず作業用ブランチを作成した上でコミットし、`master` へはプルリクエスト経由でのみ反映する。
