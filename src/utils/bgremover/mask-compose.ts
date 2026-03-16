type MaskTensor = {
  width: number;
  height: number;
  data?: Uint8Array | Uint8ClampedArray;
  toDataURL?: () => string;
};

export type MaskSource = MaskTensor | Blob | string;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function maskToDataUrl(maskImage: MaskSource): { dataUrl: string; revoke?: () => void } {
  if (typeof maskImage === "string") {
    return { dataUrl: maskImage };
  }

  if (maskImage instanceof Blob) {
    const objectUrl = URL.createObjectURL(maskImage);
    return {
      dataUrl: objectUrl,
      revoke: () => URL.revokeObjectURL(objectUrl),
    };
  }

  if (typeof maskImage.toDataURL === "function") {
    return { dataUrl: maskImage.toDataURL() };
  }

  if (maskImage.data && maskImage.width && maskImage.height) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = maskImage.width;
    tempCanvas.height = maskImage.height;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      throw new Error("Canvas temporario falhou");
    }

    const imageData = tempCtx.createImageData(maskImage.width, maskImage.height);
    const maskData = maskImage.data;

    for (let i = 0; i < maskData.length; i++) {
      const value = maskData[i];
      imageData.data[i * 4] = value;
      imageData.data[i * 4 + 1] = value;
      imageData.data[i * 4 + 2] = value;
      imageData.data[i * 4 + 3] = 255;
    }

    tempCtx.putImageData(imageData, 0, 0);
    return { dataUrl: tempCanvas.toDataURL() };
  }

  throw new Error("Saída de máscara inválida");
}

function normalizeAlpha(alpha: number): number {
  if (alpha < 20) return 0;
  if (alpha > 245) return 255;
  return alpha;
}

function canvasToPngDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Falha na exportação do canvas"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Falha ao converter blob para URL de dados"));
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}

export async function composeTransparentPng(
  imageUrl: string,
  mask: MaskSource,
  canvas: HTMLCanvasElement,
): Promise<string> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Contexto 2D indisponível");
  }

  const maskResult = maskToDataUrl(mask);
  try {
    const [img, maskImg] = await Promise.all([loadImage(imageUrl), loadImage(maskResult.dataUrl)]);

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = img.width;
    maskCanvas.height = img.height;

    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) {
      throw new Error("Contexto da máscara indisponível");
    }

    maskCtx.drawImage(maskImg, 0, 0, img.width, img.height);
    const maskData = maskCtx.getImageData(0, 0, img.width, img.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i + 3] = normalizeAlpha(maskData.data[i]);
    }

    ctx.putImageData(imageData, 0, 0);
    return await canvasToPngDataUrl(canvas);
  } finally {
    maskResult.revoke?.();
  }
}
