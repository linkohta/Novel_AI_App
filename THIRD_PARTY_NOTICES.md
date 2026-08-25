# サードパーティライセンス

本アプリ（novelai-app）自体は Apache License 2.0 のもとで公開されています（全文は [LICENSE](./LICENSE) を参照）。以下は本アプリが利用しているOSSライブラリのライセンス一覧です。

## 直接の依存関係（dependencies / devDependencies）

| パッケージ | ライセンス | 用途 |
| --- | --- | --- |
| `@capacitor/core` | MIT | Android版のランタイム基盤 |
| `@capacitor/android` | MIT | Android版ネイティブプロジェクト |
| `@capacitor/filesystem` | MIT | Android版のファイル保存 |
| `@capacitor/preferences` | MIT | Android版の設定・チャンク・テンプレート・お気に入り永続化 |
| `@capacitor/share` | MIT | Android版の画像共有（保存フォルダを開く機能の代替） |
| `fflate` | MIT | NovelAI APIレスポンス（ZIP）の展開（Electron・Android共通） |
| `electron` | MIT | デスクトップ版のランタイム（devDependency） |
| `electron-builder` | MIT | デスクトップ版の単独アプリ化・インストーラー生成（devDependency） |
| `@capacitor/cli` | MIT | Androidプロジェクトの同期用CLI（devDependency） |
| `esbuild` | MIT | `capacitor-bridge.js` のバンドル（devDependency） |

すべてMITライセンスであり、商用・私的利用を含め改変・再配布が許可されています（著作権表示の保持が条件）。

## 依存関係全体（間接依存を含む）

`node_modules` 配下の全パッケージ（約350件、devDependency由来のビルドツール群を含む）のライセンスを確認した結果、以下の許諾型ライセンスのみで構成されており、GPL/AGPL/LGPL等のコピーレフト・ライセンスは含まれていません。

- MIT
- ISC
- BSD-2-Clause / BSD-3-Clause
- Apache-2.0
- BlueOak-1.0.0
- 0BSD
- Unlicense
- WTFPL
- Python-2.0（PSFベースの許諾型ライセンス。`argparse` のみ）

いずれも改変・商用利用・再配布が可能な許諾型（permissive）ライセンスです。ライセンス一覧を再確認する場合は、`npm ls --all` で依存関係を確認したうえで、各パッケージの `package.json` の `license` フィールドを参照してください。

## デスクトップ版（Electron）パッケージに同梱されるライセンス

`npm run dist` / `npm run dist:win` でビルドした配布物には、Electron本体に加えてChromiumおよびNode.jsのランタイムが同梱されます。これらのライセンス全文は electron-builder によって自動的にパッケージへ含められ、以下のファイルとして確認できます（`dist/win-unpacked/` 配下）。

- `LICENSE.electron.txt` — Electron自体のライセンス（MIT）
- `LICENSES.chromium.html` — 同梱されるChromium/サードパーティコンポーネントのライセンス一覧

これらは配布物に自動的に含まれるため、追加の対応は不要です。

## 更新方法

依存関係を追加・更新した場合は、上記の表と全体構成の確認結果を見直し、この `THIRD_PARTY_NOTICES.md` を更新してください。
