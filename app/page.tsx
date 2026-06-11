"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Download, Upload, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, MoveLeft, MoveRight, MoveUp, MoveDown, RotateCcw } from "lucide-react";

export interface SocialMediaPreset {
  id: string;
  platform: string;
  type: string;
  width: number;
  height: number;
  unit: string;
}

export const SOCIAL_PRESETS: SocialMediaPreset[] = [
  { id: "fb-feed", platform: "Facebook", type: "Feed Post", width: 1200, height: 630, unit: "px" },
  { id: "fb-story", platform: "Facebook", type: "Story", width: 1080, height: 1920, unit: "px" },
  { id: "fb-cover", platform: "Facebook", type: "Cover Photo", width: 820, height: 312, unit: "px" },
  { id: "fb-square", platform: "Facebook", type: "Square Post", width: 1200, height: 1200, unit: "px" },
  { id: "ig-feed", platform: "Instagram", type: "Feed Post (Square)", width: 1080, height: 1080, unit: "px" },
  { id: "ig-portrait", platform: "Instagram", type: "Portrait", width: 1080, height: 1350, unit: "px" },
  { id: "ig-story", platform: "Instagram", type: "Story/Reel", width: 1080, height: 1920, unit: "px" },
  { id: "ig-landscape", platform: "Instagram", type: "Landscape", width: 1080, height: 608, unit: "px" },
  { id: "ig-carousel", platform: "Instagram", type: "Carousel", width: 1080, height: 1080, unit: "px" },
  { id: "li-post", platform: "LinkedIn", type: "Post Image", width: 1200, height: 627, unit: "px" },
  { id: "li-cover", platform: "LinkedIn", type: "Cover Photo", width: 1128, height: 191, unit: "px" },
  { id: "li-company", platform: "LinkedIn", type: "Company Banner", width: 1128, height: 191, unit: "px" },
  { id: "tw-post", platform: "Twitter/X", type: "Post Image", width: 1200, height: 675, unit: "px" },
  { id: "tw-header", platform: "Twitter/X", type: "Header Photo", width: 1500, height: 500, unit: "px" },
  { id: "pin-standard", platform: "Pinterest", type: "Standard Pin", width: 1000, height: 1500, unit: "px" },
  { id: "pin-square", platform: "Pinterest", type: "Square Pin", width: 1000, height: 1000, unit: "px" },
  { id: "tt-video", platform: "TikTok", type: "Video Cover", width: 1080, height: 1920, unit: "px" },
  { id: "yt-thumb", platform: "YouTube", type: "Thumbnail", width: 1280, height: 720, unit: "px" },
  { id: "yt-header", platform: "YouTube", type: "Channel Banner", width: 2560, height: 1440, unit: "px" },
  { id: "sc-ads", platform: "Snapchat", type: "Ad", width: 1080, height: 1920, unit: "px" },
  { id: "wb-leaderboard", platform: "Website", type: "Leaderboard", width: 728, height: 90, unit: "px" },
  { id: "wb-rectangle", platform: "Website", type: "Medium Rectangle", width: 300, height: 250, unit: "px" },
  { id: "wb-sky", platform: "Website", type: "Skyscraper", width: 160, height: 600, unit: "px" },
  { id: "wb-hero", platform: "Website", type: "Hero Banner", width: 1920, height: 1080, unit: "px" },
];

export type FitMode = "fit" | "crop" | "fill" | "stretch";

export const FIT_MODES: Record<FitMode, { label: string; description: string }> = {
  fit: { label: "Fit to Screen", description: "Fit entire image within dimensions (may have empty space)" },
  crop: { label: "Crop & Center", description: "Crop image to fill dimensions, centered" },
  fill: { label: "Cover Fill", description: "Fill dimensions completely, cropping edges as needed" },
  stretch: { label: "Stretch", description: "Stretch image to exact dimensions (may distort)" },
};

export interface ImageAdjustments {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ProcessedImage {
  preset: SocialMediaPreset;
  fitMode: FitMode;
  dataUrl: string;
  blob: Blob;
  adjustments: ImageAdjustments;
}

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [customPresets, setCustomPresets] = useState<SocialMediaPreset[]>([]);
  const [customWidth, setCustomWidth] = useState<number>(1920);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [fitMode, setFitMode] = useState<FitMode>("crop");
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAndConvertImage = useCallback(async (file: File): Promise<string | null> => {
    const isTiff = file.type === "image/tiff" || file.type === "image/tif" ||
                    file.name.toLowerCase().endsWith(".tif") ||
                    file.name.toLowerCase().endsWith(".tiff");

    if (isTiff) {
      try {
        const UTIF = (await import("utif")).default;
        const arrayBuffer = await file.arrayBuffer();
        const ifds = UTIF.decode(arrayBuffer);
        UTIF.decodeImage(arrayBuffer, ifds[0]);
        const rgba = UTIF.toRGBA8(ifds[0]);
        const width = ifds[0].width;
        const height = ifds[0].height;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        const imageData = ctx.createImageData(width, height);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);

        return canvas.toDataURL("image/png");
      } catch (error) {
        console.error("Error converting TIFF:", error);
        alert("Could not convert TIFF file. Please try a different format.");
        return null;
      }
    }

    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") &&
        !file.name.toLowerCase().endsWith(".tif") &&
        !file.name.toLowerCase().endsWith(".tiff")) {
      alert("Please select an image file");
      return;
    }

    setOriginalFile(file);
    const result = await loadAndConvertImage(file);
    if (!result) return;

    setOriginalImage(result);

    const img = new Image();
    img.onload = () => {
      setOriginalImageDimensions({ width: img.width, height: img.height });
    };
    img.src = result;
  }, [loadAndConvertImage]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") &&
        !file.name.toLowerCase().endsWith(".tif") &&
        !file.name.toLowerCase().endsWith(".tiff")) {
      return;
    }

    setOriginalFile(file);
    const result = await loadAndConvertImage(file);
    if (!result) return;

    setOriginalImage(result);

    const img = new Image();
    img.onload = () => {
      setOriginalImageDimensions({ width: img.width, height: img.height });
    };
    img.src = result;
  }, [loadAndConvertImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const togglePreset = useCallback((id: string) => {
    setSelectedPresets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllPlatform = useCallback((platform: string) => {
    const platformPresets = SOCIAL_PRESETS.filter(p => p.platform === platform);
    setSelectedPresets(prev => {
      const next = new Set(prev);
      const allSelected = platformPresets.every(p => next.has(p.id));
      if (allSelected) {
        platformPresets.forEach(p => next.delete(p.id));
      } else {
        platformPresets.forEach(p => next.add(p.id));
      }
      return next;
    });
  }, []);

  const addCustomPreset = useCallback(() => {
    if (customWidth <= 0 || customHeight <= 0) {
      alert("Please enter valid dimensions");
      return;
    }

    const newPreset: SocialMediaPreset = {
      id: `custom-${Date.now()}`,
      platform: "Custom",
      type: `${customWidth} × ${customHeight}`,
      width: customWidth,
      height: customHeight,
      unit: "px"
    };

    setCustomPresets(prev => [...prev, newPreset]);
    setSelectedPresets(prev => new Set([...prev, newPreset.id]));
  }, [customWidth, customHeight]);

  const removeCustomPreset = useCallback((id: string) => {
    setCustomPresets(prev => prev.filter(p => p.id !== id));
    setSelectedPresets(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const renderImageWithAdjustments = useCallback((
    sourceImage: HTMLImageElement,
    preset: SocialMediaPreset,
    fitMode: FitMode,
    adjustments: ImageAdjustments
  ): string => {
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return "";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, preset.width, preset.height);

    const { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight } = calculateCropAndPosition(
      sourceImage.width,
      sourceImage.height,
      preset.width,
      preset.height,
      fitMode
    );

    const scale = adjustments.zoom / 100;

    const scaledDWidth = dWidth * scale;
    const scaledDHeight = dHeight * scale;

    const scaledDx = dx + (dWidth - scaledDWidth) / 2 + adjustments.panX;
    const scaledDy = dy + (dHeight - scaledDHeight) / 2 + adjustments.panY;

    ctx.drawImage(
      sourceImage,
      sx, sy, sWidth, sHeight,
      scaledDx, scaledDy, scaledDWidth, scaledDHeight
    );

    return canvas.toDataURL("image/png", 0.95);
  }, []);

  const processImages = useCallback(async () => {
    if (!originalImage || selectedPresets.size === 0) return;

    setIsProcessing(true);
    const results: ProcessedImage[] = [];

    const img = new Image();
    img.src = originalImage;

    await new Promise(resolve => {
      img.onload = resolve;
    });

    for (const presetId of selectedPresets) {
      const preset = [...SOCIAL_PRESETS, ...customPresets].find(p => p.id === presetId);
      if (!preset) continue;

      const dataUrl = renderImageWithAdjustments(img, preset, fitMode, { zoom: 100, panX: 0, panY: 0 });

      const canvas = document.createElement("canvas");
      canvas.width = preset.width;
      canvas.height = preset.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) continue;

      const img2 = new Image();
      await new Promise<void>(resolve => {
        img2.onload = () => {
          ctx.drawImage(img2, 0, 0);
          resolve();
        };
        img2.src = dataUrl;
      });

      const blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve, "image/png", 0.95));

      results.push({
        preset,
        fitMode,
        dataUrl,
        blob,
        adjustments: { zoom: 100, panX: 0, panY: 0 }
      });
    }

    setProcessedImages(results);
    setIsProcessing(false);
  }, [originalImage, selectedPresets, fitMode, renderImageWithAdjustments]);

  const calculateCropAndPosition = (
    srcWidth: number,
    srcHeight: number,
    destWidth: number,
    destHeight: number,
    mode: FitMode
  ) => {
    const srcAspect = srcWidth / srcHeight;
    const destAspect = destWidth / destHeight;

    let sx = 0, sy = 0, sWidth = srcWidth, sHeight = srcHeight;
    let dx = 0, dy = 0, dWidth = destWidth, dHeight = destHeight;

    switch (mode) {
      case "fit":
        if (srcAspect > destAspect) {
          dWidth = destWidth;
          dHeight = destWidth / srcAspect;
          dy = (destHeight - dHeight) / 2;
        } else {
          dHeight = destHeight;
          dWidth = destHeight * srcAspect;
          dx = (destWidth - dWidth) / 2;
        }
        break;

      case "crop":
      case "fill":
        if (srcAspect > destAspect) {
          sWidth = srcHeight * destAspect;
          sx = (srcWidth - sWidth) / 2;
        } else {
          sHeight = srcWidth / destAspect;
          sy = (srcHeight - sHeight) / 2;
        }
        break;

      case "stretch":
        break;
    }

    return { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight };
  };

  const updateImageAdjustments = useCallback(async (index: number, adjustments: ImageAdjustments) => {
    if (!originalImage) return;

    const img = new Image();
    img.src = originalImage;

    await new Promise(resolve => {
      if (img.complete) resolve(undefined);
      else img.onload = resolve;
    });

    const image = processedImages[index];
    const newDataUrl = renderImageWithAdjustments(img, image.preset, image.fitMode, adjustments);

    const canvas = document.createElement("canvas");
    canvas.width = image.preset.width;
    canvas.height = image.preset.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const img2 = new Image();
    await new Promise<void>(resolve => {
      img2.onload = () => {
        ctx.drawImage(img2, 0, 0);
        resolve();
      };
      img2.src = newDataUrl;
    });

    const blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve, "image/png", 0.95));

    setProcessedImages(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        dataUrl: newDataUrl,
        blob,
        adjustments
      };
      return next;
    });
  }, [originalImage, processedImages, renderImageWithAdjustments]);

  const downloadSingle = useCallback((image: ProcessedImage) => {
    const a = document.createElement("a");
    a.href = image.dataUrl;
    const platformSlug = image.preset.platform.toLowerCase().replace(/\s+/g, "-");
    const typeSlug = image.preset.type.toLowerCase().replace(/\s+/g, "-");
    a.download = `${platformSlug}-${typeSlug}-${image.preset.width}x${image.preset.height}.png`;
    a.click();
  }, []);

  const downloadAll = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");

    const zip = new JSZip();

    processedImages.forEach((image, index) => {
      const platformSlug = image.preset.platform.toLowerCase().replace(/\s+/g, "-");
      const typeSlug = image.preset.type.toLowerCase().replace(/\s+/g, "-");
      const filename = `${index + 1}-${platformSlug}-${typeSlug}-${image.preset.width}x${image.preset.height}.png`;
      zip.file(filename, image.blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "social-media-images.zip");
  }, [processedImages]);

  const clearAll = useCallback(() => {
    setOriginalImage(null);
    setOriginalFile(null);
    setSelectedPresets(new Set());
    setProcessedImages([]);
    setOriginalImageDimensions({ width: 0, height: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const groupedPresets = [...SOCIAL_PRESETS, ...customPresets].reduce((acc, preset) => {
    if (!acc[preset.platform]) {
      acc[preset.platform] = [];
    }
    acc[preset.platform].push(preset);
    return acc;
  }, {} as Record<string, SocialMediaPreset[]>);

  const platforms = Object.keys(groupedPresets).filter(p => p !== "Custom").sort();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Social Media Image Resizer</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload an image and resize it for all your social media platforms</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Base Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!originalImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-500">PNG, JPG, WEBP, TIF/TIFF up to 50MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/tiff, image/tif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="max-h-[400px] mx-auto object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearAll}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {originalFile && (
                  <p className="text-sm text-slate-500">Original: {originalFile.name} ({originalImageDimensions.width} × {originalImageDimensions.height})</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {originalImage && (
          <Card>
            <CardHeader>
              <CardTitle>Select Output Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={platforms[0] || "Custom"} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
                  {platforms.map(platform => (
                    <TabsTrigger
                      key={platform}
                      value={platform}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {platform}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger
                    value="Custom"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Custom
                  </TabsTrigger>
                </TabsList>
                {platforms.map(platform => (
                  <TabsContent key={platform} value={platform} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`select-all-${platform}`}
                        checked={groupedPresets[platform].every(p => selectedPresets.has(p.id))}
                        onCheckedChange={() => selectAllPlatform(platform)}
                      />
                      <Label htmlFor={`select-all-${platform}`} className="cursor-pointer">
                        Select all {platform} formats
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupedPresets[platform].map(preset => (
                        <div
                          key={preset.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <Checkbox
                            id={preset.id}
                            checked={selectedPresets.has(preset.id)}
                            onCheckedChange={() => togglePreset(preset.id)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={preset.id} className="cursor-pointer font-medium">
                              {preset.type}
                            </Label>
                            <p className="text-sm text-slate-500">
                              {preset.width} × {preset.height} {preset.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
                <TabsContent value="Custom" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-width">Width (px)</Label>
                      <input
                        id="custom-width"
                        type="number"
                        min="1"
                        max="10000"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-height">Height (px)</Label>
                      <input
                        id="custom-height"
                        type="number"
                        min="1"
                        max="10000"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                      />
                    </div>
                  </div>
                  <Button onClick={addCustomPreset} className="w-full">
                    Add Custom Size
                  </Button>
                  {customPresets.length > 0 && (
                    <div className="space-y-2">
                      <Label>Added Custom Sizes</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {customPresets.map(preset => (
                          <div
                            key={preset.id}
                            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                          >
                            <Checkbox
                              id={preset.id}
                              checked={selectedPresets.has(preset.id)}
                              onCheckedChange={() => togglePreset(preset.id)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={preset.id} className="cursor-pointer font-medium">
                                {preset.width} × {preset.height}
                              </Label>
                              <p className="text-sm text-slate-500">Custom size</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeCustomPreset(preset.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {originalImage && selectedPresets.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Image Fitting Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.entries(FIT_MODES) as [FitMode, { label: string; description: string }][]).map(([key, { label, description }]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      fitMode === key
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                    onClick={() => setFitMode(key)}
                  >
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-slate-500">{description}</p>
                  </div>
                ))}
              </div>
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={processImages}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : `Process ${selectedPresets.size} Image${selectedPresets.size > 1 ? "s" : ""}`}
              </Button>
            </CardContent>
          </Card>
        )}

        {processedImages.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preview & Download</CardTitle>
              <Button onClick={downloadAll} className="gap-2">
                <Download className="w-4 h-4" />
                Download All ({processedImages.length})
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedImages.map((image, index) => (
                  <ImageAdjustmentCard
                    key={index}
                    image={image}
                    index={index}
                    onAdjustmentChange={updateImageAdjustments}
                    onDownload={() => downloadSingle(image)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

interface ImageAdjustmentCardProps {
  image: ProcessedImage;
  index: number;
  onAdjustmentChange: (index: number, adjustments: ImageAdjustments) => void;
  onDownload: () => void;
}

function ImageAdjustmentCard({ image, index, onAdjustmentChange, onDownload }: ImageAdjustmentCardProps) {
  const [localZoom, setLocalZoom] = useState(image.adjustments.zoom);
  const [localPanX, setLocalPanX] = useState(image.adjustments.panX);
  const [localPanY, setLocalPanY] = useState(image.adjustments.panY);

  const zoomTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalZoom(image.adjustments.zoom);
    setLocalPanX(image.adjustments.panX);
    setLocalPanY(image.adjustments.panY);
  }, [image.adjustments]);

  const scheduleUpdate = useCallback((adjustments: ImageAdjustments) => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    zoomTimeoutRef.current = setTimeout(() => {
      onAdjustmentChange(index, adjustments);
    }, 150);
  }, [index, onAdjustmentChange]);

  const handleZoomChange = useCallback((value: number[]) => {
    const newZoom = value[0];
    setLocalZoom(newZoom);
    scheduleUpdate({ zoom: newZoom, panX: localPanX, panY: localPanY });
  }, [localPanX, localPanY, scheduleUpdate]);

  const handlePan = useCallback((direction: "left" | "right" | "up" | "down") => {
    const delta = 20;
    let newX = localPanX;
    let newY = localPanY;

    switch (direction) {
      case "left":
        newX -= delta;
        break;
      case "right":
        newX += delta;
        break;
      case "up":
        newY -= delta;
        break;
      case "down":
        newY += delta;
        break;
    }

    setLocalPanX(newX);
    setLocalPanY(newY);
    scheduleUpdate({ zoom: localZoom, panX: newX, panY: newY });
  }, [localZoom, localPanX, localPanY, scheduleUpdate]);

  const handleReset = useCallback(() => {
    setLocalZoom(100);
    setLocalPanX(0);
    setLocalPanY(0);
    onAdjustmentChange(index, { zoom: 100, panX: 0, panY: 0 });
  }, [index, onAdjustmentChange]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3]">
        <img
          src={image.dataUrl}
          alt={`${image.preset.platform} ${image.preset.type}`}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {image.preset.platform}
        </div>
        <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex justify-between">
          <span>{image.preset.type}</span>
          <span>{image.preset.width} × {image.preset.height}</span>
        </div>
      </div>

      <div className="space-y-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Zoom: {localZoom}%</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleReset}
              title="Reset adjustments"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => handleZoomChange([Math.max(50, localZoom - 10)])}
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <Slider
              value={[localZoom]}
              min={50}
              max={200}
              step={5}
              onValueChange={handleZoomChange}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => handleZoomChange([Math.min(200, localZoom + 10)])}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Pan Position</Label>
          <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
            <div></div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePan("up")}
            >
              <MoveUp className="w-4 h-4" />
            </Button>
            <div></div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePan("left")}
            >
              <MoveLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center justify-center text-xs text-slate-500">
              {(localPanX !== 0 || localPanY !== 0) ? (
                <span className="text-xs">
                  {localPanX},{localPanY}
                </span>
              ) : (
                <span className="text-xs">●</span>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePan("right")}
            >
              <MoveRight className="w-4 h-4" />
            </Button>
            <div></div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePan("down")}
            >
              <MoveDown className="w-4 h-4" />
            </Button>
            <div></div>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={onDownload}
      >
        <Download className="w-4 h-4" />
        Download
      </Button>
    </div>
  );
}
