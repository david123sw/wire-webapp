export class MessageBackground {
  constructor(div) {
    this.div = div;
    this.width = div.style.width ? div.style.width : div.clientWidth;
    this.height = div.style.height ? div.style.width : div.clientHeight;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;

    div.appendChild(canvas);

    this.canvas = canvas;

    this.draw();

    $(window).on('resize', () => {
      this.draw();
    });

    return canvas;
  }
  draw() {
    const ctx = this.canvas.getContext('2d');
    this.width = this.div.style.width ? this.div.style.width : this.div.clientWidth;
    this.height = this.div.style.height ? this.div.style.width : this.div.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#e1dfda';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#c5c3be';

    const content = [
      {font: 'normal 24px Wire', icon: '\u4e07'},
      {font: 'normal 24px Wire', icon: '\u4e5f'},
      {font: 'normal 4px Wire', icon: '\u51e4'},
      {font: 'normal 24px Wire', icon: '\u53c8'},
      {font: 'normal 4px Wire', icon: '\u5929'},
      {font: 'normal 24px Wire', icon: '\u5957'},
      {font: 'normal 24px Wire', icon: '\u5a46'},
      {font: 'normal 24px Wire', icon: '\u62a4'},
      {font: 'normal 24px Wire', icon: '\u6b38'},
      {font: 'normal 32px Wire', icon: '\u6bee'},
      {font: 'normal 24px Wire', icon: '\u6ee1'},
      {font: 'normal 24px Wire', icon: '\u7531'},
      {font: 'normal 24px Wire', icon: '\u7834'},
      {font: 'normal 24px Wire', icon: '\u8981'},
      {font: 'normal 4px Wire', icon: '\u8d8a'},
      {font: 'normal 32px Wire', icon: '\u9102'},
    ];

    const num = 7;
    const mW = this.width / num;
    const mH = this.height / num;
    for (let i = 0; i < num; i++) {
      for (let j = 0; j < num; j++) {
        const x = Math.floor(Math.random() * (mW - 15)) + i * mW + 15;
        const y = Math.floor(Math.random() * (mH - 15)) + j * mH + 15;
        const rn = Math.floor(Math.random() * content.length);
        ctx.font = content[rn].font;
        ctx.fillText(content[rn].icon, x, y);
      }
    }
  }
}
