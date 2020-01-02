import { getFirstImagePaintFromNode, UIColorData } from "./utils";

export async function generateColorGuideFrame(node, data: UIColorData): Promise<SceneNode> {
  const { dominantColor, palette, suggestedTextColors } = data

  const swatchSize = 44
  const labelTopMargin = 24
  const labelHeight = 12
  const labelBottomMargin = 8 + labelHeight
  const swatchGap = 12
  const maxWidth = 300
  const maxImagePreviewHeight = 300
  const leftMargin = 16
  const black = { r: 0, g: 0, b: 0 }
  const white = { r: 1, g: 1, b: 1 }
  const paletteCornerRadius = 6
  
  const imagePreviewInset = 16
  const imageBoundsHeight = node.height > maxImagePreviewHeight
  ? maxImagePreviewHeight
  : node.height + (imagePreviewInset * 2) > maxImagePreviewHeight
  ? maxImagePreviewHeight
  : node.height + (imagePreviewInset * 2)
  
  const contentStartY = imageBoundsHeight + labelTopMargin
  const totalHeight = imageBoundsHeight + ((labelTopMargin + labelBottomMargin + swatchSize) * 3) + leftMargin

  const sf = { family: 'SF Pro Text', style: 'Bold'}
  const roboto = { family: 'Roboto', style: 'Bold' }
  const fonts = await figma.listAvailableFontsAsync()
  const hasSf = fonts.find(({ fontName}) => fontName.family === sf.family && fontName.style === sf.style)
  hasSf ? await figma.loadFontAsync(sf) : await figma.loadFontAsync(roboto)

  const frame = figma.createFrame()
  frame.resize(maxWidth, totalHeight)
  frame.x = node.x + node.width + 100
  frame.y = node.y
  frame.fills = [{ color: white, type: "SOLID" }];
  frame.effects = [{ type: 'DROP_SHADOW', visible: true, blendMode: "NORMAL", radius: 12, offset: { x: 0, y: 2 }, color: { ...black, a: 0.16 }}]
  frame.name = "Palette"
  frame.clipsContent = true
  frame.cornerRadius = paletteCornerRadius;
  frame.layoutMode ="VERTICAL";
  frame.counterAxisSizingMode="AUTO";
  frame.itemSpacing = 0;

  const imageBackground = figma.createFrame();
  imageBackground.name="Image"

  frame.appendChild(imageBackground);
  imageBackground.y = 0
  imageBackground.resize(maxWidth, imageBoundsHeight)
  imageBackground.fills = [{ type: 'SOLID', color: dominantColor, opacity: 0.08 }]
  imageBackground.effects = [{ type: 'INNER_SHADOW', visible: true, blendMode: "NORMAL", radius: 0, offset: { x: 0, y: -1 }, color: { ...black, a: 0.08 }}]

  const imageBounds = figma.createRectangle()
  imageBounds.name = "Source image"
  imageBackground.appendChild(imageBounds);

  const paint = getFirstImagePaintFromNode(node)
  imageBounds.fills = [ paint]
  imageBounds.cornerRadius = node.cornerRadius
  imageBounds.resize(node.width >= maxWidth ? maxWidth : node.width, node.height <= maxImagePreviewHeight ? node.height : maxImagePreviewHeight)
  imageBounds.y = node.height >= maxImagePreviewHeight
    ? 0
    : node.height + imagePreviewInset >= maxImagePreviewHeight
      ? (maxImagePreviewHeight - node.height) / 2
      : imagePreviewInset
  imageBounds.x = node.width >= maxWidth
    ? 0
    : (maxWidth - node.width) / 2
  
  const createSwatches = (
    label: string = "Swatches",
    colors: Array<{ r: number; g: number; b: number }>
  ) => {
    const line = figma.createFrame();
    line.name = label;
    line.layoutMode = "VERTICAL";
    line.counterAxisSizingMode = "AUTO";
    line.itemSpacing = 8;
    line.verticalPadding = 12;
    line.horizontalPadding = 16;

    const labelText = figma.createText();
    labelText.name = "Label";
    labelText.fontName = hasSf ? sf : roboto;
    labelText.fills = [{ type: "SOLID", color: black }];
    labelText.fontSize = 10;
    labelText.characters = label;
    line.appendChild(labelText);

    const swatches = figma.createFrame();
    swatches.name = `Swatches`;
    swatches.layoutMode = "HORIZONTAL";
    swatches.counterAxisSizingMode="AUTO";
    swatches.itemSpacing = swatchGap;
    line.appendChild(swatches);

    colors.map(color => {
      const swatch = figma.createRectangle();
      swatch.name = "Swatch";
      swatch.cornerRadius = 2;
      swatch.resize(swatchSize, swatchSize);
      swatch.fills = [{ type: "SOLID", color: color }];
      swatches.appendChild(swatch);
    });
    return line;
  };

  frame.appendChild(createSwatches("DOMINANT COLOR", [dominantColor]));
  frame.appendChild(
    createSwatches("RECOMMENDED TEXT COLOR", suggestedTextColors)
  );
  frame.appendChild(createSwatches("PALETTE", palette));

  return Promise.resolve(frame)
}