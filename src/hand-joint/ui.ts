export function mount(): void {
  document.querySelector('#hand-joint-app')!.innerHTML = `
  <main class="hj-shell">
    <header><p class="eyebrow">HAND MOVEMENT LAB</p><h1>Hand Joint Coordination</h1><p class="intro">手首と人差し指の動きを、ひとつの軌跡に。</p><p class="privacy">映像・計測データは端末内で処理され、外部へ送信されません。</p></header>
    <div class="visuals">
      <section class="panel camera-panel" aria-labelledby="camera-heading">
        <div class="panel-heading"><h2 id="camera-heading">01 <span>カメラ・骨格</span></h2><span id="camera-badge" class="badge">未起動</span></div>
        <div id="viewport" class="viewport"><video id="video" autoplay muted playsinline></video><canvas id="overlay" aria-label="骨格と前腕基準軸。校正時は肘側、手首側の順にタップ"></canvas><div id="placeholder" class="placeholder"><span class="camera-symbol" aria-hidden="true">◎</span><p>手を横から撮影してください</p><small>カメラ起動後、前腕軸と中立姿勢を設定します</small></div></div>
        <div class="camera-actions"><button id="camera-start" class="primary">カメラを起動</button><button id="camera-switch" disabled>前面に切替</button><button id="camera-stop" disabled>カメラ停止</button></div>
        <p id="detection" class="hint" role="status">明るい場所で、前腕と指先が画面に入るように置いてください。</p>
      </section>
      <section class="panel chart-panel" aria-labelledby="chart-heading">
        <div class="panel-heading"><h2 id="chart-heading">02 <span>角度–角度グラフ</span></h2><span id="sample-count" class="badge">0 点</span></div>
        <div class="plot-wrap"><div id="chart"></div><p id="chart-empty">校正後に「計測開始」を押すと<br>ここに動きの軌跡が描かれます</p></div>
        <p class="legend"><i class="line-key"></i>運動の軌跡 <i class="dot-key"></i>最新の計測点</p>
      </section>
    </div>
    <section class="panel measurement" aria-label="計測操作">
      <div class="joint-select" role="group" aria-label="縦軸の関節"><span>縦軸の関節</span><button id="joint-mcp" aria-pressed="true">MCP</button><button id="joint-pip" aria-pressed="false">PIP</button><small>MCP：指の付け根 ／ PIP：指の第2関節</small></div>
      <div class="measure-actions"><button id="measure-start" class="primary" disabled>計測開始</button><button id="measure-pause" disabled>一時停止</button><button id="measure-reset">軌跡をリセット</button><span id="measure-state" class="hint">校正を完了してください</span></div>
      <div class="readings"><div><span>Wrist</span><strong id="wrist-value">—</strong><small>deg</small></div><div><span>MCP</span><strong id="mcp-value">—</strong><small>deg</small></div><div><span>PIP</span><strong id="pip-value">—</strong><small>deg</small></div></div>
    </section>
    <section class="panel calibration" aria-labelledby="cal-heading"><div class="panel-heading"><h2 id="cal-heading">03 <span>キャリブレーション</span></h2><span id="cal-badge" class="badge">未設定</span></div>
      <p class="hint">端末と前腕を固定し、手を横から撮影します。前腕が動いた場合は設定し直してください。</p>
      <ol class="steps"><li><b>映像を静止</b>して、中立姿勢を保ちます。</li><li>映像上で前腕の<b>肘側 → 手首側</b>をタップします。</li><li><b>中立姿勢をゼロに設定</b>して、計測を始めます。</li></ol>
      <div class="cal-actions"><button id="freeze" disabled>映像を静止・前腕軸を設定</button><button id="zero" disabled>中立姿勢をゼロに設定</button><button id="unfreeze" disabled>ライブ映像に戻る</button></div>
      <p id="cal-instruction" class="hint" role="status">まずカメラを起動してください。</p>
      <div class="settings"><label><input type="checkbox" id="wrist-sign"> 手首の符号を反転</label><label><input type="checkbox" id="finger-sign"> 指の符号を反転</label><label>推論頻度 <select id="fps"><option value="5">5 fps</option><option value="10" selected>10 fps</option><option value="15">15 fps</option></select></label></div>
      <p class="hint">背屈が正、掌屈が負、指の屈曲が正になるよう符号を調整してください。校正・符号変更時は軌跡をクリアします。</p>
    </section>
    <p id="notice" class="notice" role="status" aria-live="polite">カメラを起動し、キャリブレーションを行ってください。</p>
    <p id="error" class="error" role="alert" hidden></p>
    <footer>画像平面上の2次元投影角度を表示します。3次元の解剖学的関節角度ではありません。<br>横からの撮影や指の重なりにより、骨格推定が不安定になることがあります。</footer>
  </main>`;
}
export const element = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
