/**
 * 合格証書描画・操作のための共通ヘルパーライブラリ
 */
const CertificateApp = {
  /**
   * 画像を指定パスから非同期ロードします
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  },

  /**
   * 合格証書 Canvas を描画します
   * @param {HTMLCanvasElement} canvas 対象のCanvas
   * @param {Object} data 証書データ { score, rate, certNo, dateStr, gradeTitle, lastName, firstName }
   */
  async generate(canvas, data) {
    const ctx = canvas.getContext('2d');
    
    // 3倍高画質スケーリング (3600 x 2544)
    const scale = 3;
    const w = 1200;
    const h = 848;
    canvas.width = w * scale;
    canvas.height = h * scale;
    ctx.scale(scale, scale);

    // 1. 背景グラデーション (羊皮紙調)
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 750);
    bgGrad.addColorStop(0, '#faf6eb');
    bgGrad.addColorStop(1, '#ebdcb9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. ゴールド飾り枠
    ctx.strokeStyle = '#c5a880';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    ctx.strokeStyle = '#a67c4e';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, w - 84, h - 84);

    // コーナー飾り
    ctx.save();
    ctx.fillStyle = '#a67c4e';
    this.drawCornerPiece(ctx, 42, 42, 0);
    this.drawCornerPiece(ctx, w - 42, 42, Math.PI / 2);
    this.drawCornerPiece(ctx, w - 42, h - 42, Math.PI);
    this.drawCornerPiece(ctx, 42, h - 42, -Math.PI / 2);
    ctx.restore();

    // 3. タイトル
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 54px "MS Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('合 格 証 書', 600, 160);

    // ゴールドライン
    const gradLine = ctx.createLinearGradient(400, 0, 800, 0);
    gradLine.addColorStop(0, 'rgba(166,124,78,0)');
    gradLine.addColorStop(0.5, 'rgba(166,124,78,1)');
    gradLine.addColorStop(1, 'rgba(166,124,78,0)');
    ctx.strokeStyle = gradLine;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(350, 185);
    ctx.lineTo(850, 185);
    ctx.stroke();

    // 4. 級タイトル
    ctx.font = 'bold 28px "MS Mincho", "Hiragino Mincho ProN", serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText(data.gradeTitle, 600, 235);

    // 5. 受験者氏名
    const fullName = `${data.lastName}  ${data.firstName}`;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "MS Gothic", "Hiragino Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${fullName}  殿`, 200, 340);

    // 6. 本文
    ctx.fillStyle = '#1e293b';
    ctx.font = '24px "MS Mincho", "Hiragino Mincho ProN", serif';
    ctx.fillText('あなたは当事務局が実施する上記の試験において', 200, 420);
    ctx.fillText('頭書の通り優秀な成績を収め合格されたことをここに証明いたします。', 200, 470);
    
    ctx.font = '18px "MS Mincho", "Hiragino Mincho ProN", serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`(得点: ${data.score}問正解 / 正答率: ${data.rate}%)`, 200, 520);

    // 7. 日付と証書番号
    ctx.fillStyle = '#1e293b';
    ctx.font = '20px "MS Mincho", "Hiragino Mincho ProN", serif';
    ctx.fillText(`授与日： ${data.dateStr}`, 200, 600);
    ctx.fillText(`証書番号： ${data.certNo}`, 200, 640);

    // 8. 署名 (代表 岩倉 隼人)
    ctx.textAlign = 'right';
    ctx.font = 'bold 24px "MS Mincho", "Hiragino Mincho ProN", serif';
    ctx.fillText('ショートカットキー検定 運営事務局', 1000, 640);
    ctx.font = '20px "MS Mincho", "Hiragino Mincho ProN", serif';
    ctx.fillText('代表　岩倉 隼人', 1000, 680);

    // 認定印SVGの描画 (失敗時は従来のCanvas朱肉印を描画)
    try {
      const sealImg = await this.loadImage('assets/stamp-v4-vector-S5.svg');
      ctx.drawImage(sealImg, 970, 615, 80, 80);
    } catch (err) {
      console.warn('認定印SVGのロードに失敗したため、従来の朱肉印を描画します:', err);
      this.drawSeal(ctx, 1040, 655);
    }
  },

  /**
   * コーナーの飾りを描画します
   */
  drawCornerPiece(ctx, x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(40, 0);
    ctx.lineTo(40, 6);
    ctx.lineTo(6, 6);
    ctx.lineTo(6, 40);
    ctx.lineTo(0, 40);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, 15, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  /**
   * 朱肉印を描画（フォールバック用）
   */
  drawSeal(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.rect(x - 30, y - 30, 60, 60);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x - 26, y - 26, 52, 52);
    ctx.stroke();

    ctx.font = 'bold 12px "MS Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText('検定', x + 12, y - 12);
    ctx.fillText('運営', x - 12, y - 12);
    ctx.fillText('局印', x + 12, y + 12);
    ctx.fillText('事務', x - 12, y + 12);

    ctx.restore();
  }
};
