# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code (claude.ai/code) 向けのガイダンスです。

## プロジェクト概要

NovelAI の画像生成 API にプロンプトを送信し、生成された画像を保存・閲覧するアプリです（`package.json` の description: 「Novel AI 画像生成プロンプト送信・保存アプリ」）。Electronによるデスクトップ版と、Capacitorによるスマートフォン(Android)版で、React + Vite で書かれたUI（`src/`）を共通のソースコードとして共有している。

## 機能

- **プロンプト送信による画像生成**: APIキー（persistent token）、プロンプト、ネガティブプロンプト、モデル、幅・高さ、ステップ数、スケール、サンプラー、シードを指定して NovelAI の画像生成 API を呼び出す。
- **キャラクタープロンプト**: 「＋ キャラクターを追加」でキャラクターごとのプロンプト／ネガティブプロンプトを複数設定できる。各キャラクターカードのチェックボックスで有効／無効を切り替えられ、無効化したキャラクターは入力欄がグレーアウトし、画像生成時のリクエストからも除外される。`nai-diffusion-4`系・`nai-diffusion-5`系モデルでは `v4_prompt` / `v4_negative_prompt`（`char_captions`）として送信し、それ以外のモデルでは `characterPrompts` として送信する。
- **キャラクター名での追加**: 「キャラクター名」「作品名（任意）」を入力し、任意で「組み合わせるチャンク／テンプレート」を選択して「キャラクター名で追加」をクリックすると、`character (series)` 形式（作品名未入力時はキャラクター名のみ、Danbooru/NovelAIで一般的なキャラクタータグの表記に準拠）に、選択したプロンプトチャンクまたはプロンプトテンプレートの内容をカンマ区切りで連結したプロンプトを持つキャラクターカードが自動生成される。テンプレートを選択し変数が含まれる場合は、追加前に変数入力ダイアログが開く。
- **プロンプトチャンクの保存**: プロンプト欄の内容に名前を付けて保存し、チップとして一覧表示できる。チップをクリックすると直前にフォーカスしていたプロンプト欄（プロンプト／ネガティブプロンプト／各キャラクターのプロンプト欄）に挿入、✎クリックで編集ダイアログを表示、×クリックで削除できる（`chunks.json` に永続化）。「キャラクター名での追加」機能からも選択して利用できる。
- **プロンプトテンプレート**: `(変数名)` 形式のプレースホルダーを任意個数含んだプロンプト本文をテンプレートとして名前付きで保存できる。一覧の「適用」をクリックするとテンプレート内の変数を自動検出したダイアログが開き、値をまとめて入力して「反映」すると、直前にフォーカスしていたプロンプト欄の内容を置き換える形で反映される。「編集」「削除」も可能（`templates.json` に永続化）。「キャラクター名での追加」機能からも選択して利用できる。
- **各機能セクションの折りたたみ**: 左パネルの各機能（設定／プロンプト／プロンプトテンプレート／お気に入り／キャラクタープロンプト／モデル／連続生成）は `<details>`/`<summary>` で折りたたみ可能。「生成する」ボタンは折りたたみの影響を受けない独立した固定エリアに配置している。開閉状態は各 `<details>` の `id`（`settingsSection` / `promptSection` / `templateSection` / `favoritesSection` / `characterSection` / `modelSection` / `batchSection`）をキーに `settings.sectionState` として保存され、次回起動時に復元される。
- **お気に入り（アーティスト・キャラクター）**: よく使うアーティスト名を「お気に入りアーティスト」として、キャラクター名＋作品名（任意）のペアを「お気に入りキャラクター」として保存できる。各チップの「挿入」で直前にフォーカスしていたプロンプト欄に反映され、キャラクターのチップは「テンプレへ」で「キャラクター名で追加」欄（キャラクタープロンプトセクション）にキャラクター名・作品名を自動入力できる（同セクションを自動的に展開）。「編集」「削除」も可能（`favorite-artists.json` / `favorite-characters.json` に永続化）。
- **設定の永続化**: 入力したAPIキーや各種パラメータ、キャラクタープロンプトを保存し、次回起動時に復元する（`load-settings` / `save-settings` IPC）。
- **連続生成**: 指定した回数・間隔（秒）で同一プロンプトの画像を連続生成し、`output/batch_<タイムスタンプ>/` フォルダにまとめて保存する。「中断する」でいつでも停止できる。Anlas（トークン）消費とAPIレート制限に配慮し、既定で各生成の間に待機時間（既定5秒、変更可）を挟む設計としている。
- **生成結果のプレビュー**: 生成された画像をメイン画面に表示し、ファイル名・シード値を確認できる。
- **生成履歴サムネイル**: 過去に生成した画像をサムネイル一覧として表示し、クリックで再表示できる。
- **保存フォルダを開く**: 生成画像の保存先フォルダをOS標準のファイルマネージャーで開く（`open-output-folder` IPC、メニューの「ファイル」からも可能）。
- **生成ボタンの常時表示**: 「生成する」ボタンは左パネル内で `position: sticky` により画面下部に固定表示され、パネルをスクロールしても常にクリックできる（`.generate-sticky`）。
- **日本語メニュー**: ウィンドウ上部のメニュー（ファイル／編集／表示／ウィンドウ／ヘルプ）をすべて日本語化。

## アーキテクチャ

本アプリは **UI層を React + Vite で書き、Electron / Capacitor(Android) で共有し、「window.api」を境界にプラットフォーム固有の実装を差し替える** 構成になっている。`src/` が Vite のプロジェクトルート（`vite.config.js` の `root: 'src'`）であり、`vite build` の出力（`build.outDir: '../www'`）が `www/` に生成される。**`www/` はビルド成果物であり、手で編集しない**（gitignore対象、`npm run build:web` で再生成）。

- **UI (`src/`)** — Electron・Android共通の画面本体（React）。
  - `src/index.html` — Viteのエントリーテンプレート。`<div id="root">` と `src/main.jsx` へのモジュールスクリプトのみを持つ。
  - `src/main.jsx` — エントリーポイント。`./platform/capacitorBridge` を**最初に**副作用importしてから（Electronの`preload.js`が既に`window.api`を用意している場合はここで何もしない）、`<App />` を `#root` にマウントする。
  - `src/App.jsx` — アプリ全体の状態（`apiKey`/`prompt`/`characters`/`sectionState`等）とすべてのイベントハンドラを持つトップレベルコンポーネント。設定の読み込み・デバウンス保存（変更後300ms）、キャラクター配列の更新、テンプレート変数モーダルの開閉、連続生成ループなどはすべてここに集約している。
    - フォーカス中のプロンプト系フィールド（チャンク/お気に入り挿入・テンプレート反映の対象）は `focusedFieldKey`（`'prompt'` / `'negativePrompt'` / `` `char:${index}:prompt` `` 等の文字列）で管理し、`resolveFocusedField()` で都度その時点の最新値・setterを解決する。DOM要素への直接アクセスは行わない。
  - `src/components/*.jsx` — 機能ごとのプレゼンテーションコンポーネント（`Section`, `PromptSection`, `TemplatesSection`, `FavoritesSection`, `CharactersSection`/`CharacterCard`, `ModelSection`, `BatchSection`, `ResultPanel`）。状態は持たず、props経由でApp.jsxの状態とハンドラを受け取る。
  - `src/components/modals/*.jsx` — 編集・適用モーダル（`ChunkEditModal`, `TemplateEditModal`, `TemplateApplyModal`, `FavArtistEditModal`, `FavCharEditModal`）。共通の `ModalOverlay` は `open` が falsy なら何も描画しない（旧実装のような `.open` クラス切り替えではなく、条件付きレンダリングで開閉する）。
  - `src/hooks/useNamedList.js` — チャンク・テンプレート・お気に入りに共通する「読み込み→追加→編集→削除のたびにサーバー側の最新リストで置き換える」パターンを提供するフック。`src/hooks/useFavoritesList.js` はこれを`kind`（`'artist'`/`'character'`）でラップしてお気に入りに使う。
  - `src/utils/templateVariables.js` — `(変数名)` プレースホルダーの抽出・置換ロジック（純粋関数、Reactに依存しない）。
  - `src/styles.css` — 全体のスタイル（旧 `www/index.html` の `<style>` をそのまま移植）。折りたたみセクションは `<details className="section">` をReactの `open`/`onToggle` で制御しており、CSSの矢印回転等はHTML版と同じ仕組み。
  - `src/platform/capacitorBridge.js` — 旧 `src/capacitor-bridge.js` と同内容（後述）。
- **共有ロジック (`shared/`)**
  - `shared/novelai.js` — NovelAI APIへのリクエストボディ組み立て（`buildRequestBody` / `isV4Model`）とエンドポイントURL（`NOVELAI_IMAGE_ENDPOINT`）。CommonJS形式で、Electron側(`main.js`から`require`)・Vite側(`capacitorBridge.js`からESM importでバンドル)の両方から読み込まれる。
- **Electron側 (`window.api` の実装 = preload.js + main.js)**
  - `preload.js` — `contextBridge` で `window.api` を公開する preload スクリプト（`loadSettings` / `saveSettings` / `generateImage` / `openOutputFolder` / `loadChunks` / `saveChunk` / `updateChunk` / `deleteChunk` / `loadTemplates` / `saveTemplate` / `updateTemplate` / `deleteTemplate` / `loadFavorites` / `saveFavorite` / `updateFavorite` / `deleteFavorite`）。`loadFavorites`等は第一引数に `kind`（`'artist'` または `'character'`）を取る。ページの他のスクリプトより先に実行されるため、Capacitor側のブリッジは「`window.api` が未定義の場合のみ」自身を定義するガードを持つ。
  - `main.js` — メインプロセスのエントリーポイント（`package.json` の `main` フィールドで指定）。`www/index.html`（Viteのビルド成果物）を読み込み、起動時に最大化して表示するウィンドウ生成、日本語化した `Menu`、上記IPCハンドラの実装、NovelAI API呼び出し（`https`モジュール）、ZIPレスポンスの展開（`fflate`）とファイル保存を行う。お気に入りは `kind` ごとに `FAVORITE_PATHS` で切り替えたJSONファイルに保存する共通ハンドラ（`load-favorites` / `save-favorite` / `update-favorite` / `delete-favorite`）で実装。
  - 生成画像の保存先は `app.getPath('documents')/NovelAI/output/` 配下（**`__dirname` 配下ではない**）。パッケージ化した配布版はインストール先（`Program Files` 等）が読み取り専用になるため、必ずユーザー領域である `documents` を書き込み先にすること。開発時（`npm start`）も同じパスが使われる。
  - 設定 (`settings.json`)、プロンプトチャンク (`chunks.json`)、プロンプトテンプレート (`templates.json`)、お気に入りアーティスト (`favorite-artists.json`)、お気に入りキャラクター (`favorite-characters.json`) は `app.getPath('userData')` 配下に保存される（リポジトリには含まれない）。
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

## 開発コマンド

```
npm run dev           # vite の開発サーバーを起動（ブラウザでUIを素早く確認する用途。window.api はCapacitorのWeb実装頼みで、画像生成・ファイル保存の一部はElectron/実機ほど動かない点に注意）
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
npm run lint           # 上記対象を ESLint で検査（eslint.config.js）
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

## 開発ルール

- **セキュリティ**: `preload.js` の `contextBridge` によるAPI公開パターンを維持し、`nodeIntegration` をレンダラーで有効化しない。APIキーなどの機密情報をログ出力・平文でリポジトリにコミットしない。
- **`window.api` の両実装を同期させる**: `window.api` に新しいメソッドを追加・変更する場合、`preload.js`＋`main.js`（Electron側）と `src/platform/capacitorBridge.js`（Android側）の**両方**に対応する実装を必ず追加し、シグネチャ・戻り値の形を一致させる。片方だけ実装すると、もう一方のプラットフォームで機能が動作しなくなる。
- **UIとロジックの分離**: `src/`（Reactコンポーネント）にNovelAI APIの直接呼び出しやファイルI/Oを書かず、必ず `window.api` 経由でやり取りする（Electronでは`main.js`、Androidでは`capacitorBridge.js`がその実体を担う）。プラットフォーム分岐が必要な場合も個別のコンポーネントには極力書かず、`window.isNativeApp`など明示的なフラグ経由に留める。
- **共通ロジックは `shared/` に置く**: NovelAI APIのリクエスト形式など、Electron・Android両方で必要になるロジックは`shared/novelai.js`のようにCommonJSモジュールとして切り出し、`main.js`からは`require`、`capacitorBridge.js`からはESM importでVite側にバンドルして読み込む。同じロジックを両側に重複実装しない。
- **小さな変更を積み重ねる**: 過剰な抽象化は避け、必要になってから一般化する。ただしUI層のビルドツール（Vite）・フレームワーク（React）は本アプリの明示的な方針として既に採用済みであり、「ビルドツールを増やさない」原則は適用しない——新しい依存追加はREADME/CLAUDE.mdの更新とセットで検討すること。
- **エラーハンドリング**: API呼び出し失敗時は `App.jsx` の `try/catch` で捕捉し、`status` の状態に反映してユーザー向けメッセージを表示する既存パターンに従う。
- **コミット前確認**: `output/` ディレクトリに生成された画像ファイルや、APIキーを含む設定ファイルを誤ってコミットしないよう `.gitignore` を確認する。
- **連続リクエストへの配慮**: NovelAI APIへの連続リクエストはAnlas消費とレート制限のリスクがあるため、間隔を空けずに大量リクエストする機能は追加しない。バッチ処理を実装する場合は生成間隔（待機時間）を必須にし、中断できる手段を用意する。
- 機能を追加・修正したときは、必ずCLAUDE.mdとREADMEに反映すること。依存関係を追加・更新した場合は `THIRD_PARTY_NOTICES.md` のライセンス一覧も見直すこと。
- **Gitワークフロー**: `master` ブランチへの直接コミット・直接プッシュは行わない。変更は必ず作業用ブランチを作成した上でコミットし、`master` へはプルリクエスト経由でのみ反映する。

## 応対言語

- ユーザーとの対話は常に **日本語** で行うこと。
