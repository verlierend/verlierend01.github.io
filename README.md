# DCG大会管理 MVP（GitHub Pages + Google Forms / Sheets）

## できること
- 公開用大会ページ
- Google Sheetsから大会情報・承認済み参加者・デッキURL・対戦結果を読み込み
- シングルエリミネーションのトーナメント表を自動生成
- スイスドローの次ラウンドを簡易生成（勝利数順・再対戦回避を試行）
- オーナーがSheetsで勝者を入力すると、公開ページの再読み込みで結果を反映
- 個人アカウントやパスワードを管理しない最小構成

> このMVPでは、Google FormsからSheetsへの参加者自動取り込み、公開サイト上での勝敗入力は未実装です。スイスドローは簡易実装で、引き分け・高度なタイブレーク・厳密な不戦勝配分は未対応です。

## 1. Google Sheetsを作成
次の3シートを作成します。

### Settings
1行目を `key | value` とし、以下の設定を2行目以降に入力します。

| key | value例 |
|---|---|
| title | 秋季コミュニティ大会 |
| date | 2026-11-15 |
| format | シングルエリミネーション |
| status | 受付中 |
| description | 大会説明 |
| finalRound | 5 |
| champion | （優勝確定後に入力） |

### Players
1行目の列名を次のとおりにします。

`name | gameName | deckUrl | approved`

例：
- `name`: サイト上で表示する参加者名（重複不可）
- `gameName`: DCGのゲーム内名
- `deckUrl`: デッキ画像URL
- `approved`: TRUE / FALSE

Google Formsの回答シートは直接この形式ではないため、初期版では運営が申請を確認し、承認した参加者をPlayersに転記してください。Formsのファイルアップロードを使う場合は、回答者にGoogleログインが必要です。

### Matches
1行目を次のとおりにします。

`round | matchNo | player1 | player2 | winner`

`winner`には、player1またはplayer2の参加者名を入力します。空欄は未決着です。
BYE（不戦勝）は自動記録されます。参加者名はPlayersのnameと一致させてください。

## 2. Apps Scriptを設定
1. Sheetsで「拡張機能」→「Apps Script」を開く
2. `Code.gs`の内容を貼り付けて保存
3. `generateSingleElimination`を実行し、初回の権限確認を許可
4. 参加者の`approved`をTRUEにした後、同関数を実行するとトーナメント表を作り直します
5. スイスドローの場合は、Apps Scriptエディタから`generateNextSwissRound`を実行します。第1回はランダム、第2回以降は勝利数順を基準に、可能な限り再対戦を避けます。各ラウンドの勝敗を全て入力してから次ラウンドを作成してください。
6. 「デプロイ」→「新しいデプロイ」→種類「ウェブアプリ」
7. 実行ユーザーは自分、アクセスできるユーザーは「全員」に設定してデプロイ
8. 表示されたウェブアプリURLをコピー

**公開APIは公開情報のみを返す設計にしてください。** このスプレッドシートには、メールアドレス、パスワード、復旧コード等の非公開情報を保存しないでください。ウェブアプリを「全員」に公開すると、APIのJSONは誰でも取得できます。

## 3. GitHub Pagesへ公開
1. このフォルダの `index.html`、`style.css`、`app.js` をGitHubリポジトリのルートへ置く
2. リポジトリのSettings → Pagesで公開元を設定
3. 公開URLを開き、「公開データURL」にApps ScriptのウェブアプリURLを貼り付けて読み込み
4. URLはブラウザに保存されます（その端末のlocalStorage）。別端末では再入力が必要です

## 4. 運営手順
1. Google Formsで参加申請フォームを作る（参加者名、ゲーム内名、デッキ画像）
2. 回答を確認して、承認者だけPlayersに登録
3. Apps Scriptで`generateSingleElimination`を実行
4. Discord等で対戦を進め、オーナーがMatchesシートのwinner列を入力
5. 公開サイトを再読み込みして結果を確認
6. 優勝者が確定したらSettingsの`champion`に入力

## 現在の制約・注意
- 参加者の表示名を固定キーとして使うため、重複名は禁止。後で本格運用する場合は参加者ID列を追加するのがおすすめです。
- トーナメント生成を再実行するとMatchesの既存データが全て消えます。大会開始後は不用意に再実行しないでください。
- `generateSingleElimination`はシャッフルで対戦を決めます。シード設定はありません。
- `generateNextSwissRound`は勝利数だけを基準にする簡易版です。引き分け、ゲーム差タイブレーク、複雑なBYE配分は実装していません。
- 32人までを想定した簡易版です。大規模大会、同時編集、監査ログには対応していません。
- Apps ScriptのJSON出力に含める情報はすべて公開情報として扱ってください。
- デッキURLは誰でも閲覧可能なURLの場合のみ公開してください。Google Driveの共有設定に注意してください。
- Apps Scriptの公開URLを使った取得がブラウザのCORS制約等で失敗する場合は、Apps Scriptのデプロイ設定とURLを確認してください。

## 次に追加する候補
1. スイスドローの自動ペアリング（勝ち点・再対戦回避・不戦勝）
2. Google Forms回答のPlayersシートへの自動取り込み
3. オーナー用の簡易結果入力画面
4. デッキ画像の公開・非公開設定

https://script.google.com/macros/s/AKfycbwwINjRy7yuI98boqVChuhIRMC6qcRsgd-it4ptuCMXiyE_cuQ9rVEBsuIvMRvU0mrx/exec
