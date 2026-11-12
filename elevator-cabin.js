const WIDTH = 1680;
const HEIGHT = 945;
let cabin;

export function preloadElevatorCabin() {
  if (cabin) return;
  cabin = new Image();
  cabin.src = 'elevator-cabin.png';
}

export function drawElevatorCabin(ctx, characters, passengers, display) {
  preloadElevatorCabin();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#172429';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (cabin.complete && cabin.naturalWidth) {
    const { naturalWidth: width, naturalHeight: height } = cabin;
    // Align the pictured rail with the standing sprites' waists.
    const rail = Math.round(height * .565);
    const railY = 654;
    ctx.drawImage(cabin, 0, 0, width, rail, 0, 0, WIDTH, railY);
    ctx.drawImage(cabin, 0, rail, width, height - rail, 0, railY, WIDTH, HEIGHT - railY);
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#151d23';
  ctx.fillRect(788, 217, 104, 43);
  ctx.fillStyle = '#eccd86';
  ctx.font = 'bold 26px Tahoma';
  ctx.fillText(display, 840, 248);
  ctx.restore();

  const backCount = passengers.length > 3 ? Math.ceil(passengers.length / 2) : 0;
  passengers.forEach((id, index) => {
    const back = index < backCount;
    const rowIndex = back ? index : index - backCount;
    const count = back ? backCount : passengers.length - backCount;
    const x = WIDTH * (.50 + (rowIndex - (count - 1) / 2) * .109);
    const y = HEIGHT * (back ? .86 : .956);
    const data = characters[id].userData;
    const sprite = id === 0 ? data.monsterFrames[0] : data.pixelTextures.stand.image;
    const height = (id === 0 ? 455 : 405) * (back ? .87 : 1);
    const width = height * sprite.width / sprite.height;
    ctx.fillStyle = '#17171870';
    ctx.beginPath();
    ctx.ellipse(x, y - 4, width * .34, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(sprite, x - width / 2, y - height, width, height);
  });
}
