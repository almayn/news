"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import * as htmlToImage from "html-to-image";

const CATEGORY_OPTIONS = ["عام", "رياضة", "مجتمع", "مقالات"];
const GOLD = "#c8a96b";
const LOGO_URL =
  "https://gjryvqpwncnkpghaiytl.supabase.co/storage/v1/object/public/fonts/almassslogo.png";

type NoticeType = "success" | "error" | "info";
type EditorMode = "normal" | "snap";

interface Article {
  id: string;
  title: string;
  sub_title?: string | null;
  body: string;
  image_url: string;
  image_name?: string | null;
  created_at?: string;
  category: string;
  source?: string | null;
  author?: string | null;
  is_poem?: boolean | null;
}

function NormalPreview({
  title,
  subTitle,
  bodyPreview,
  category,
  source,
  author,
  imageUrl,
  isBreaking,
  isPoem,
  formatDate,
  normalImagePositionY,
}: {
  title: string;
  subTitle: string;
  bodyPreview: string;
  category: string;
  source: string;
  author: string;
  imageUrl: string;
  isBreaking: boolean;
  isPoem: boolean;
  formatDate: () => string;
  normalImagePositionY: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[26px] bg-white shadow-2xl"
      style={{ width: "100%", maxWidth: "680px" }}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="صورة الخبر"
            crossOrigin="anonymous"
            className="h-full w-full object-cover"
            style={{
              objectPosition: `center ${normalImagePositionY}%`,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500">
            لا توجد صورة
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <div className="rounded-full bg-black/55 px-3 py-1 text-[12px] font-extrabold text-white backdrop-blur">
            {formatDate()}
          </div>

          <img
            src={LOGO_URL}
            alt="الشعار"
            crossOrigin="anonymous"
            className="w-[86px] drop-shadow-2xl"
          />
        </div>

        {isBreaking && (
          <div className="absolute bottom-4 right-4 rounded-xl bg-red-600 px-3 py-1.5 text-sm font-black text-white shadow-xl">
            عاجل
          </div>
        )}
      </div>

      <div className="space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
            {category || "عام"}
          </span>

          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
            {category === "مقالات" && author.trim()
              ? `الكاتب: ${author}`
              : source || "أخبار الماس"}
          </span>
        </div>

        {subTitle.trim() && (
          <div className="text-sm font-black leading-7" style={{ color: GOLD }}>
            {subTitle}
          </div>
        )}

        <h1 className="text-2xl font-black leading-[1.6] text-slate-900 md:text-[32px]">
          {title.trim() || "عنوان الخبر"}
        </h1>

        <div
          className={`text-[15px] leading-8 text-slate-700 ${
            isPoem ? "whitespace-pre-wrap text-center" : "whitespace-pre-wrap"
          }`}
        >
          {bodyPreview || "سيظهر نص الخبر هنا في المعاينة العادية."}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm font-black uppercase tracking-[0.08em] text-slate-800">
            almayn
          </div>

          <img
            src={LOGO_URL}
            alt="علامة مائية"
            crossOrigin="anonymous"
            className="w-[78px] opacity-80"
          />
        </div>
      </div>
    </div>
  );
}

function SnapPreview({
  previewRef,
  imageUrl,
  snapImageTransform,
  snapImageWidth,
  imageScale,
  overlayBrightness,
  overlayStrength,
  blurAmount,
  blurOpacity,
  blurColor,
  watermarkOpacity,
  watermarkScale,
  textBlockBottom,
  titleColor,
  subTitleColor,
  subtitleBgOpacity,
  subtitleBgColor,
  textStrokeStyle,
  title,
  subTitle,
  isBreaking,
  formatDate,
  isPreparingCleanExport,
}: {
  previewRef: React.RefObject<HTMLDivElement | null>;
  imageUrl: string;
  snapImageTransform: string;
  snapImageWidth: number;
  imageScale: number;
  overlayBrightness: number;
  overlayStrength: number;
  blurAmount: number;
  blurOpacity: number;
  blurColor: string;
  watermarkOpacity: number;
  watermarkScale: number;
  textBlockBottom: string;
  titleColor: string;
  subTitleColor: string;
  subtitleBgOpacity: number;
  subtitleBgColor: string;
  textStrokeStyle: React.CSSProperties;
  title: string;
  subTitle: string;
  isBreaking: boolean;
  formatDate: () => string;
  isPreparingCleanExport: boolean;
}) {
  return (
    <div className="flex justify-center rounded-3xl bg-slate-200 p-4 md:p-6">
      <div
        ref={previewRef}
        className={`relative overflow-hidden bg-slate-950 ${
          isPreparingCleanExport ? "rounded-none" : "rounded-[8px]"
        }`}
        style={{
          width: "400px",
          height: "711px",
        }}
      >
          {imageUrl ? (
          <img
            src={imageUrl}
            alt="خلفية"
            crossOrigin="anonymous"
            className="absolute left-1/2 top-1/2 max-w-none"
            style={{
              height: `${snapImageWidth}%`,
              width: "auto",
              minWidth: "100%",
              maxWidth: "none",
              transform: `${snapImageTransform} scale(${imageScale})`,
              transformOrigin: "center center",
              filter: `brightness(${overlayBrightness}%)`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-300">
            رفع صورة
          </div>
        )}

        <div
          className="absolute inset-0 z-10"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,${
              overlayStrength / 100
            }) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.08) 100%)`,
          }}
        />

        <div
          className="absolute inset-x-0 bottom-0 z-10"
          style={
            isPreparingCleanExport
              ? {
                  height: "45%",
                  background: `linear-gradient(to top,
                    rgba(0,0,0,${Math.min(blurOpacity + 0.18, 0.72)}) 0%,
                    rgba(0,0,0,${Math.min(blurOpacity, 0.45)}) 38%,
                    rgba(0,0,0,0.08) 75%,
                    rgba(0,0,0,0) 100%
                  )`,
                }
              : {
                  height: "45%",
                  backgroundColor: blurColor,
                  opacity: blurOpacity,
                  backdropFilter: `blur(${blurAmount}px)`,
                  WebkitBackdropFilter: `blur(${blurAmount}px)`,
                  maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to top, black 30%, transparent 100%)",
                }
          }
        />

        <div className="absolute left-5 top-7 z-20 text-[13px] font-black text-white drop-shadow-lg">
          {formatDate()}
        </div>

        <img
          src={LOGO_URL}
          crossOrigin="anonymous"
          alt="شعار"
          className="absolute right-5 -top-2 z-20 w-[96px] drop-shadow-2xl"
        />

        {isBreaking && (
          <div className="absolute right-10 top-[74px] z-20 rounded-lg bg-red-500 px-3 py-1 text-sm font-black text-white shadow-lg">
            عاجل
          </div>
        )}

        <img
          src={LOGO_URL}
          alt="علامة مائية"
          crossOrigin="anonymous"
          className="absolute bottom-2 left-5 z-20 w-[86px]"
          style={{
            opacity: watermarkOpacity,
            transform: `scale(${watermarkScale})`,
            transformOrigin: "bottom left",
          }}
        />

        <div className="absolute inset-x-0 z-20 px-4" style={{ bottom: textBlockBottom }}>
          {subTitle.trim() && (
            <div
              className="mb-1 text-[20px] font-black"
              style={{
                color: subTitleColor,
                backgroundColor:
                  subtitleBgOpacity > 0 ? subtitleBgColor : "transparent",
                padding: subtitleBgOpacity > 0 ? "4px 10px" : undefined,
                borderRadius: subtitleBgOpacity > 0 ? "10px" : undefined,
                display: "inline-block",
              }}
            >
              {subTitle}
            </div>
          )}

          <h1
            className="text-right text-[34px] font-black leading-[1.22] drop-shadow-2xl"
            style={{ color: titleColor, ...textStrokeStyle }}
          >
            {title.trim() || "عنوان الخبر"}
          </h1>
        </div>

        <div className="absolute bottom-4 left-8 right-8 z-20">
          <div className="mb-3 h-px bg-white/25" />
          <div className="text-right text-[15px] font-black uppercase tracking-[0.08em] text-white/95">
            almayn
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [snapImageWidth, setSnapImageWidth] = useState(120);
  const articleId = searchParams.get("id");
  const isEditMode = !!articleId;
  const [normalImagePositionY, setNormalImagePositionY] = useState(50);
  const [editorMode, setEditorMode] = useState<EditorMode>("normal");
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("عام");
  const [source, setSource] = useState("أخبار الماس");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPoem, setIsPoem] = useState(false);

  const [showTwitterPanel, setShowTwitterPanel] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryResults, setLibraryResults] = useState<any[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [customImageName, setCustomImageName] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  const [generatedExportUrl, setGeneratedExportUrl] = useState("");
  const [generatedExportName, setGeneratedExportName] = useState("");
  const [showExportActions, setShowExportActions] = useState(false);
  const [isPreparingCleanExport, setIsPreparingCleanExport] = useState(false);
  const [notice, setNotice] = useState<{ type: NoticeType; text: string } | null>(
    null
  );

  const [imageScale, setImageScale] = useState(1);
  const [imagePositionY, setImagePositionY] = useState(50);
  const [imagePositionX, setImagePositionX] = useState(50);
  const [textOffsetY, setTextOffsetY] = useState(0);
  const [overlayStrength, setOverlayStrength] = useState(24);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.78);
  const [watermarkScale, setWatermarkScale] = useState(1);
  const [overlayBrightness, setOverlayBrightness] = useState(92);
  const [subtitleBgOpacity, setSubtitleBgOpacity] = useState(0);
  const [subtitleBgColor, setSubtitleBgColor] = useState("#000000");

  const [titleColor, setTitleColor] = useState("#ffffff");
  const [subTitleColor, setSubTitleColor] = useState(GOLD);
  const [titleStrokeColor, setTitleStrokeColor] = useState("#000000");
  const [titleStrokeWidth, setTitleStrokeWidth] = useState(0);
  const [blurAmount, setBlurAmount] = useState(12);
  const [blurOpacity, setBlurOpacity] = useState(0.38);
  const [blurColor, setBlurColor] = useState("#000000");

  const previewRef = useRef<HTMLDivElement>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const plainBodyPreview = useMemo(() => {
    return body.replace(/<[^>]*>?/gm, "").trim();
  }, [body]);

  const showNotice = (text: string, type: NoticeType = "info") => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice({ text, type });
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2600);
  };

  const formatDate = () => {
    const date = new Date();
    const arabicDate = date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return arabicDate.replace(/[٠-٩]/g, (d) =>
      String(d.charCodeAt(0) - 0x0660)
    );
  };

  const stripHtml = (html: string) =>
    (html || "")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/\s+/g, " ")
      .trim();

  const truncateText = (text: string, max: number) => {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trim() + "…";
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const waitForImagesToLoad = async (element: HTMLElement) => {
    const images = Array.from(element.querySelectorAll("img"));

    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve(true);
        return new Promise((resolve) => {
          const done = () => resolve(true);
          img.onload = done;
          img.onerror = done;
        });
      })
    );

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    await new Promise((resolve) => setTimeout(resolve, 900));
  };

  const dataUrlToBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const buildArticleUrl = (newsId: string | number) => {
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://almasyn.com";
    return `${base}/news/${newsId}`;
  };

  const buildTweetText = () => {
    if (!title.trim()) return "";
    const words = title.trim().split(/\s+/);
    words[0] = `#${words[0]}`;
    const formattedTitle = words.join(" ");
    const snippet = truncateText((subTitle || plainBodyPreview).trim(), 120);
    const tags = hashtags.map((t) => `#${t}`).join(" ");
    const url = articleId ? buildArticleUrl(articleId) : "https://almasyn.com";
    const fullText = [formattedTitle, snippet, tags, url].filter(Boolean).join("\n\n");
    return fullText.length > 280 ? fullText.slice(0, 277) + "..." : fullText;
  };

  const handleLibrarySearch = async (query: string) => {
    setLibrarySearch(query);

    const cleanQuery = query.trim();
    if (cleanQuery.length < 1) {
      setLibraryResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("media_library")
      .select("id, name, url, created_at")
      .ilike("name", `%${cleanQuery}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Library search error:", error);
      showNotice("تعذر البحث في مكتبة الصور", "error");
      return;
    }

    setLibraryResults(data || []);
  };

  const resetForm = () => {
    setTitle("");
    setSubTitle("");
    setBody("");
    setCategory("عام");
    setSource("أخبار الماس");
    setAuthor("");
    setImageUrl("");
    setIsBreaking(false);
    setIsPoem(false);
    setSnapImageWidth(120);
    setNormalImagePositionY(50);
    setCustomImageName("");
    setLibrarySearch("");
    setLibraryResults([]);
    setShowLibrary(false);
    setSelectedImageFile(null);

    setEditorMode("normal");
    setIsTextExpanded(false);
    setShowTwitterPanel(false);

    setImageScale(1);
    setImagePositionY(50);
    setImagePositionX(50);
    setTextOffsetY(0);
    setOverlayStrength(24);
    setWatermarkOpacity(0.78);
    setWatermarkScale(1);
    setOverlayBrightness(92);
    setSubtitleBgOpacity(0);
    setSubtitleBgColor("#000000");
    setTitleColor("#ffffff");
    setSubTitleColor(GOLD);
    setTitleStrokeColor("#000000");
    setTitleStrokeWidth(0);
    setBlurAmount(12);
    setBlurOpacity(0.38);
    setBlurColor("#000000");

    setGeneratedExportUrl("");
    setGeneratedExportName("");
    setShowExportActions(false);

    if (isEditMode) {
      router.push("/editor");
      router.refresh();
    }

    showNotice("تم فتح خبر جديد وتفريغ الحقول", "success");
  };

  useEffect(() => {
    const saved = localStorage.getItem("almas_x_hashtags");
    if (saved) {
      try {
        setHashtags(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("almas_x_hashtags", JSON.stringify(hashtags));
  }, [hashtags]);

  useEffect(() => {
    const fetchArticleForEdit = async () => {
      if (!articleId) return;

      try {
        setIsLoadingArticle(true);

        const { data, error } = await supabase
          .from("news_posts")
          .select("*")
          .eq("id", articleId)
          .single();

        if (error) throw error;
        if (!data) {
          showNotice("لم يتم العثور على الخبر المطلوب", "error");
          return;
        }

        const item: Article = {
          ...data,
          category: data.category || "عام",
          body: data.body || data.content || "",
          source: data.source || "أخبار الماس",
          author: data.author || "",
          image_name: data.image_name || "",
        };

        setTitle(item.title || "");
        setSubTitle(item.sub_title || "");
        setBody(item.body || "");
        setCategory(item.category || "عام");
        setSource(item.source || "أخبار الماس");
        setAuthor(item.author || "");
        setImageUrl(item.image_url || "");
        setCustomImageName(item.image_name || "");
        setIsPoem(!!item.is_poem);
      } catch (error) {
        console.error("Fetch article error:", error);
        showNotice("تعذر تحميل بيانات الخبر للتعديل", "error");
      } finally {
        setIsLoadingArticle(false);
      }
    };

    fetchArticleForEdit();
  }, [articleId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setSelectedImageFile(file);

      const localPreview = await fileToDataUrl(file);
      setImageUrl(localPreview);

      setGeneratedExportUrl("");
      setGeneratedExportName("");
      setShowExportActions(false);

      showNotice("تم تجهيز الصورة للمعاينة، وسيتم رفعها عند حفظ الخبر", "success");
    } catch (error) {
      console.error(error);
      showNotice("حدث خطأ أثناء تجهيز الصورة", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const uploadImageAndArchive = async () => {
    if (!selectedImageFile) {
      return {
        uploadedUrl: imageUrl.trim(),
        imageName: customImageName.trim() || null,
      };
    }

    const formData = new FormData();
    formData.append("image", selectedImageFile);

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error("مفتاح ImgBB غير موجود");
    }

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data?.success || !data?.data?.url) {
      throw new Error("فشل رفع الصورة");
    }

    const uploadedUrl = data.data.url;
    const finalImageName =
      customImageName.trim() || selectedImageFile.name.replace(/\.[^/.]+$/, "");

    const { error: insertError } = await supabase.from("media_library").insert([
      {
        name: finalImageName,
        url: uploadedUrl,
      },
    ]);

    if (insertError) {
      console.error("Archive insert error:", insertError);
      throw new Error(insertError.message || "فشل حفظ الصورة في المكتبة");
    }

    setSelectedImageFile(null);

    return {
      uploadedUrl,
      imageName: finalImageName,
    };
  };

  const prepareExportImage = async () => {
    if (!previewRef.current && editorMode === "snap") return;

    const missingNormal =
      editorMode === "normal" && (!title.trim() || !body.trim() || !imageUrl.trim());
    const missingSnap = editorMode === "snap" && (!title.trim() || !imageUrl.trim());

    if (missingNormal || missingSnap) {
      showNotice(
        editorMode === "snap"
          ? "أدخل عنوان الخبر وارفع صورة قبل التصدير"
          : "أدخل العنوان والنص وارفع الصورة قبل التصدير",
        "error"
      );
      return;
    }

    setIsExporting(true);
    setGeneratedExportUrl("");
    setGeneratedExportName("");
    setShowExportActions(false);
    setIsPreparingCleanExport(true);
    showNotice("جاري تجهيز الصورة...", "info");

    try {
      const node = previewRef.current as HTMLElement;

      if (document.fonts?.ready) await document.fonts.ready;
      await waitForImagesToLoad(node);
      await new Promise((resolve) => setTimeout(resolve, 180));

      const canvasWidth = editorMode === "snap" ? 2160 : 1600;
      const canvasHeight = editorMode === "snap" ? 3840 : 2000;

      const dataUrl = await htmlToImage.toPng(node, {
        pixelRatio: 1,
        cacheBust: true,
        skipFonts: false,
        backgroundColor: editorMode === "snap" ? "#0f172a" : "#ffffff",
        canvasWidth,
        canvasHeight,
        width: node.offsetWidth,
        height: node.offsetHeight,
        style: {
          margin: "0",
          padding: "0",
          width: `${node.offsetWidth}px`,
          height: `${node.offsetHeight}px`,
          transform: "none",
          transformOrigin: "top left",
          overflow: "hidden",
          borderRadius: editorMode === "snap" ? "4px" : "24px",
        },
        filter: (element: HTMLElement) => {
          if (element.classList?.contains("no-export")) return false;
          return true;
        },
      });

      const exportBase = title
        .trim()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-_]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 40);

      setGeneratedExportName(
        `${editorMode === "snap" ? "almas-snap" : "almas-news"}-${
          exportBase || Date.now()
        }.png`
      );
      setGeneratedExportUrl(dataUrl);
      setShowExportActions(true);
      showNotice("تم تجهيز الصورة بنجاح", "success");
    } catch (error) {
      console.error("Export error:", error);
      showNotice("تعذر تجهيز الصورة، جرب مرة أخرى", "error");
    } finally {
      setIsPreparingCleanExport(false);
      setIsExporting(false);
    }
  };

  const downloadPreparedImage = () => {
    if (!generatedExportUrl) return;

    const link = document.createElement("a");
    link.download = generatedExportName || `almas-news-${Date.now()}.png`;
    link.href = generatedExportUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sharePreparedImage = async () => {
    if (!generatedExportUrl) return;

    try {
      const blob = await dataUrlToBlob(generatedExportUrl);
      const file = new File(
        [blob],
        generatedExportName || `almas-news-${Date.now()}.png`,
        { type: "image/png" }
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: title.trim() || "خبر الماس",
          text: title.trim() || "خبر الماس",
        });
        showNotice("تم فتح نافذة المشاركة", "success");
        return;
      }

      downloadPreparedImage();
      showNotice("المشاركة المباشرة غير مدعومة هنا، تم التحويل للحفظ", "info");
    } catch (error) {
      console.error("Share error:", error);
      showNotice("تعذر فتح المشاركة، استخدم الحفظ", "error");
    }
  };

  const deleteArticle = async () => {
    const confirmed = window.confirm(
      "⚠️ هل أنت متأكد من حذف هذا الخبر؟\nسيتم حذف الصورة من المكتبة إذا لم تكن مستخدمة في أخبار أخرى."
    );
    if (!confirmed) return;

    if (!articleId) {
      showNotice("لا يوجد خبر لحذفه", "error");
      return;
    }

    setIsSavingArticle(true);

    try {
      const { data: articleData, error: fetchError } = await supabase
        .from("news_posts")
        .select("id, image_name, image_url")
        .eq("id", articleId)
        .single();

      if (fetchError) throw fetchError;
      if (!articleData) throw new Error("الخبر غير موجود");

      if (articleData.image_name) {
        const { data: usedElsewhere, error: checkError } = await supabase
          .from("news_posts")
          .select("id")
          .eq("image_name", articleData.image_name)
          .neq("id", articleId);

        if (checkError) {
          console.warn("فشل التحقق من استخدام الصورة:", checkError.message);
        }

        if (!usedElsewhere || usedElsewhere.length === 0) {
          const { error: deleteImgError } = await supabase
            .from("media_library")
            .delete()
            .eq("name", articleData.image_name);

          if (deleteImgError) {
            console.warn("فشل حذف الصورة من المكتبة:", deleteImgError.message);
          }
        }
      }

      const { error: deleteArticleError } = await supabase
        .from("news_posts")
        .delete()
        .eq("id", articleId);

      if (deleteArticleError) throw deleteArticleError;

      showNotice("تم حذف الخبر وتنظيف المكتبة بنجاح", "success");

      setTimeout(() => {
        router.replace("/editor");
        router.refresh();
        resetForm();
      }, 900);
    } catch (error: any) {
      console.error("Delete error:", error);
      showNotice(error.message || "حدث خطأ أثناء الحذف", "error");
    } finally {
      setIsSavingArticle(false);
    }
  };

  const saveArticle = async () => {
    if (!title.trim() || !body.trim() || !imageUrl.trim()) {
      showNotice("يرجى تعبئة العنوان والنص واختيار صورة للخبر", "error");
      return;
    }

    if (category === "مقالات" && !author.trim()) {
      showNotice("يرجى إدخال اسم الكاتب عند اختيار قسم المقالات", "error");
      return;
    }

    setIsSavingArticle(true);

    try {
      const uploadResult = await uploadImageAndArchive();

      const payload: Record<string, any> = {
        title: title.trim(),
        sub_title: subTitle.trim() || null,
        body: body.trim(),
        category,
        source: source.trim() || "أخبار الماس",
        author: category === "مقالات" ? author.trim() : null,
        image_url: uploadResult.uploadedUrl,
        image_name: uploadResult.imageName,
        is_poem: isPoem,
      };

      if (isEditMode && articleId) {
        const { error } = await supabase
          .from("news_posts")
          .update(payload)
          .eq("id", articleId);

        if (error) throw error;
        showNotice("تم تحديث الخبر بنجاح", "success");
      } else {
        const { error } = await supabase.from("news_posts").insert([payload]);
        if (error) throw error;
        showNotice("تم حفظ الخبر بنجاح", "success");
      }
    } catch (error: any) {
      console.error(error);
      showNotice(error.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
      setIsSavingArticle(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const res = await fetch("/api/admin-logout", { method: "POST" });
      if (!res.ok) throw new Error();

      router.push("/secret-entry");
      router.refresh();
    } catch {
      showNotice("تعذر تسجيل الخروج", "error");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const addHashtag = () => {
    const cleanTag = newTagInput.trim().replace(/^#/, "");
    if (cleanTag && !hashtags.includes(cleanTag) && hashtags.length < 10) {
      setHashtags((prev) => [...prev, cleanTag]);
      setNewTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHashtag();
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  const publishToX = () => {
    const text = buildTweetText();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    showNotice("تم فتح نافذة النشر", "success");
  };

  const snapImageTransform = `translate(-${imagePositionX}%, -${imagePositionY}%)`;
  const textBlockBottom = `${104 + textOffsetY}px`;

  const textStrokeStyle: React.CSSProperties =
    titleStrokeWidth > 0
      ? {
          WebkitTextStroke: `${titleStrokeWidth}px ${titleStrokeColor}`,
          textShadow: `0 0 15px ${titleStrokeColor}80`,
        }
      : {};

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="sticky top-20 z-[60] mb-4 flex justify-center">
          {notice && (
            <div
              className={`rounded-2xl px-5 py-3 text-sm font-extrabold shadow-lg backdrop-blur ${
                notice.type === "success"
                  ? "bg-emerald-600 text-white"
                  : notice.type === "error"
                  ? "bg-red-600 text-white"
                  : "bg-slate-900 text-white"
              }`}
            >
              {notice.text}
            </div>
          )}
        </div>

        <div className="mb-8 rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold" style={{ color: GOLD }}>
                لوحة التحرير
              </p>
              <h1 className="text-3xl font-black md:text-4xl">
                {isEditMode ? "تعديل خبر" : "أخبار الماس"}
              </h1>
              <p className="mt-2 text-sm text-slate-200">
                محرر مفصول بين الخبر العادي والسناب داخل نفس الصفحة
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/editor/list"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                إدارة الأخبار
              </Link>

              <div className="flex rounded-full bg-white/10 p-1 backdrop-blur">
                <button
                  onClick={() => setEditorMode("normal")}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    editorMode === "normal"
                      ? "bg-white text-slate-900 shadow"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  خبر
                </button>
                <button
                  onClick={() => setEditorMode("snap")}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    editorMode === "snap"
                      ? "bg-amber-500 text-white shadow"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  سناب
                </button>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isLoggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
              </button>
            </div>
          </div>
        </div>

        {isLoadingArticle ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-400 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={resetForm}
                    className="rounded-2xl bg-emerald-600 px-5 py-3 font-extrabold text-white transition hover:bg-emerald-700"
                  >
                    خبر جديد
                  </button>

                  {isEditMode && (
                    <button
                      onClick={deleteArticle}
                      disabled={isSavingArticle}
                      className="rounded-2xl bg-red-700 px-5 py-3 font-extrabold text-white transition hover:bg-red-800 disabled:opacity-60"
                    >
                      حذف
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    العنوان الرئيسي
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-lg font-black outline-none transition focus:bg-white"
                  />
                </div>

                <div className="-mt-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    العنوان الثانوي
                  </label>
                  <input
                    type="text"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:bg-white"
                  />
                </div>

                {editorMode === "normal" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        نص الخبر
                      </label>

                      <button
                        onClick={() => setIsTextExpanded(!isTextExpanded)}
                        className="mb-2 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 md:hidden"
                      >
                        {isTextExpanded
                          ? "إخفاء النص ▲"
                          : "اضغط لإظهار مربع الكتابة ▼"}
                      </button>

                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={10}
                        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-8 outline-none transition-all duration-300 focus:bg-white ${
                          isTextExpanded ? "block" : "hidden md:block"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
                        <span className="text-sm font-extrabold text-slate-800">
                          عاجل
                        </span>
                        <input
                          type="checkbox"
                          checked={isBreaking}
                          onChange={(e) => setIsBreaking(e.target.checked)}
                          className="h-5 w-5 accent-red-600"
                        />
                      </label>

                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
                        <span className="text-sm font-extrabold text-slate-800">
                          نص شعري
                        </span>
                        <input
                          type="checkbox"
                          checked={isPoem}
                          onChange={(e) => setIsPoem(e.target.checked)}
                          className="h-5 w-5 accent-[#c8a96b]"
                        />
                      </label>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                        <span>تحريك الصورة داخل الخبر فوق / تحت</span>
                        <span>{normalImagePositionY}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={normalImagePositionY}
                        onChange={(e) => setNormalImagePositionY(Number(e.target.value))}
                        className="w-full accent-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          التصنيف
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:bg-white"
                        >
                          {CATEGORY_OPTIONS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          المصدر
                        </label>
                        <input
                          type="text"
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:bg-white"
                        />
                      </div>
                    </div>

                    {category === "مقالات" && (
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          اسم الكاتب
                        </label>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:bg-white"
                        />
                      </div>
                    )}
                  </>
                )}

                {editorMode === "snap" && (
                  <>
                    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
                      <span className="text-sm font-extrabold text-slate-800">
                        شارة عاجل
                      </span>
                      <input
                        type="checkbox"
                        checked={isBreaking}
                        onChange={(e) => setIsBreaking(e.target.checked)}
                        className="h-5 w-5 accent-red-600"
                      />
                    </label>

                    <div className="space-y-6 rounded-2xl border-2 border-amber-200 bg-amber-50/30 p-5">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">
                              لون العنوان الرئيسي
                            </label>
                            <input
                              type="color"
                              value={titleColor}
                              onChange={(e) => setTitleColor(e.target.value)}
                              className="h-10 w-full cursor-pointer rounded-xl border-0 bg-transparent"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">
                              لون إحاطة العنوان
                            </label>
                            <input
                              type="color"
                              value={titleStrokeColor}
                              onChange={(e) => setTitleStrokeColor(e.target.value)}
                              className="h-10 w-full cursor-pointer rounded-xl border-0 bg-transparent"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                              <span>سمك الإحاطة</span>
                              <span>{titleStrokeWidth}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="4"
                              step="0.2"
                              value={titleStrokeWidth}
                              onChange={(e) =>
                                setTitleStrokeWidth(Number(e.target.value))
                              }
                              className="w-full accent-slate-900"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">
                              لون العنوان الثانوي
                            </label>
                            <input
                              type="color"
                              value={subTitleColor}
                              onChange={(e) => setSubTitleColor(e.target.value)}
                              className="h-10 w-full cursor-pointer rounded-xl border-0 bg-transparent"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                              <span>خلفية العنوان الثانوي</span>
                              <span>{subtitleBgOpacity}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={subtitleBgOpacity}
                              onChange={(e) =>
                                setSubtitleBgOpacity(Number(e.target.value))
                              }
                              className="w-full accent-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">
                              لون خلفية العنوان الثانوي
                            </label>
                            <input
                              type="color"
                              value={subtitleBgColor}
                              onChange={(e) => setSubtitleBgColor(e.target.value)}
                              className="h-10 w-full cursor-pointer rounded-xl border-0 bg-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 border-t border-amber-200 pt-4 md:grid-cols-3">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>قوة التمويه</span>
                            <span>{blurAmount}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={blurAmount}
                            onChange={(e) => setBlurAmount(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>شفافية الخلفية</span>
                            <span>{(blurOpacity * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={blurOpacity}
                            onChange={(e) => setBlurOpacity(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-500">
                            لون الخلفية
                          </label>
                          <input
                            type="color"
                            value={blurColor}
                            onChange={(e) => setBlurColor(e.target.value)}
                            className="h-8 w-full cursor-pointer rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>تحريك الصورة يمين / يسار</span>
                            <span>{imagePositionX}%</span>
                          </div>
                          <input
                            type="range"
                            min="35"
                            max="65"
                            value={imagePositionX}
                            onChange={(e) => setImagePositionX(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>تحريك الصورة فوق / تحت</span>
                            <span>{imagePositionY}%</span>
                          </div>
                          <input
                            type="range"
                            min="35"
                            max="65"
                            value={imagePositionY}
                            onChange={(e) => setImagePositionY(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>عرض الصورة</span>
                            <span>{snapImageWidth}%</span>
                          </div>
                          <input
                            type="range"
                            min="110"
                            max="220"
                            value={snapImageWidth}
                            onChange={(e) => setSnapImageWidth(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        

                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>تكبير الصورة</span>
                            <span>{imageScale.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="2.2"
                            step="0.02"
                            value={imageScale}
                            onChange={(e) => setImageScale(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>رفع / خفض النص</span>
                            <span>{textOffsetY}px</span>
                          </div>
                          <input
                            type="range"
                            min="-150"
                            max="150"
                            value={textOffsetY}
                            onChange={(e) => setTextOffsetY(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>تعتيم الطبقة</span>
                            <span>{overlayStrength}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="70"
                            value={overlayStrength}
                            onChange={(e) => setOverlayStrength(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>سطوع الصورة</span>
                            <span>{overlayBrightness}%</span>
                          </div>
                          <input
                            type="range"
                            min="60"
                            max="120"
                            value={overlayBrightness}
                            onChange={(e) => setOverlayBrightness(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>شفافية العلامة</span>
                            <span>{(watermarkOpacity * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="1"
                            step="0.05"
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>حجم العلامة</span>
                            <span>{watermarkScale.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.7"
                            max="1.6"
                            step="0.05"
                            value={watermarkScale}
                            onChange={(e) => setWatermarkScale(Number(e.target.value))}
                            className="w-full accent-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-sm font-extrabold text-slate-800">
                      صورة الخبر والأرشفة
                    </label>

                    <div className="flex gap-1 rounded-lg bg-slate-200 p-1">
                      <button
                        onClick={() => setShowLibrary(false)}
                        className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                          !showLibrary
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        رفع جديد
                      </button>

                      <button
                        onClick={() => setShowLibrary(true)}
                        className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                          showLibrary
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        المكتبة
                      </button>
                    </div>
                  </div>

                  {!showLibrary ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="اسم الصورة للأرشفة"
                        value={customImageName}
                        onChange={(e) => setCustomImageName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                      />

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="block w-full text-sm text-slate-500 file:ml-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-5 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800"
                      />

                      {isUploadingImage && (
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                          جاري تجهيز الصورة...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="ابحث في أرشيف الصور..."
                        value={librarySearch}
                        onChange={(e) => handleLibrarySearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                      />

                      <div className="grid max-h-[160px] grid-cols-3 gap-2 overflow-y-auto p-1">
                        {libraryResults.length > 0 ? (
                          libraryResults.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setImageUrl(item.url);
                                setCustomImageName(item.name || "");
                                setSelectedImageFile(null);
                                showNotice(`تم اختيار: ${item.name}`, "info");
                                setShowLibrary(false);
                              }}
                              className="group relative h-20 cursor-pointer overflow-hidden rounded-lg border-2 border-transparent transition-all hover:border-amber-500 hover:shadow-lg"
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />

                              <div className="absolute inset-x-0 bottom-0 truncate bg-black/70 p-1 text-[9px] font-bold text-white">
                                {item.name}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-3 py-4 text-center text-xs text-slate-400">
                            {librarySearch.trim().length >= 1
                              ? "لا توجد نتائج"
                              : "اكتب اسم الصورة للبحث..."}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 🔘 أزرار الإجراءات - مع شرط لإظهار التصدير في السناب فقط */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <button
                    onClick={saveArticle}
                    disabled={isSavingArticle}
                    className="rounded-2xl bg-indigo-600 px-6 py-3.5 font-extrabold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSavingArticle ? "جاري الحفظ..." : isEditMode ? "تحديث" : "حفظ"}
                  </button>

                  {/* ✅ زر التصدير: يظهر فقط في وضع السناب */}
                  {editorMode === "snap" && (
                    <button
                      onClick={prepareExportImage}
                      disabled={isExporting}
                      className="rounded-2xl bg-amber-500 px-6 py-3.5 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-60"
                    >
                      {isExporting ? "..." : "تصدير"}
                    </button>
                  )}

                  <button
                    onClick={() => setShowTwitterPanel(!showTwitterPanel)}
                    className="rounded-2xl bg-black px-6 py-3.5 font-extrabold text-white transition hover:opacity-90"
                  >
                    {showTwitterPanel ? "إخفاء X" : "X"}
                  </button>
                </div>

                {showTwitterPanel && (
                  <div className="mt-5 space-y-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col items-start gap-4 sm:flex-row">
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt="معاينة"
                          className="h-24 w-full rounded-xl border border-slate-200 object-cover shadow-sm sm:w-32"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="line-clamp-2 text-sm font-bold text-slate-800">
                          {title
                            .trim()
                            .split(/\s+/)
                            .map((w, i) => (i === 0 ? `#${w}` : w))
                            .join(" ")}
                        </p>
                        <p className="line-clamp-2 text-xs text-slate-500">
                          {subTitle || plainBodyPreview}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-500">
                        الهاشتاقات
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="مثال: عاجل، رياضة، المملكة"
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                        />
                        <button
                          onClick={addHashtag}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>

                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800"
                          >
                            #{tag}
                            <button
                              onClick={() => removeHashtag(tag)}
                              className="transition hover:text-amber-900"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            buildTweetText().length > 280
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {buildTweetText().length > 280 ? "تجاوز الحد" : "جاهز"}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({buildTweetText().length}/280)
                        </span>
                      </div>
                      <button
                        onClick={publishToX}
                        disabled={buildTweetText().length > 280}
                        className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        نشر الآن
                      </button>
                    </div>
                  </div>
                )}

                {showExportActions && generatedExportUrl && (
                  <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 backdrop-blur-sm">
                    <p className="mb-3 text-center text-sm font-bold text-amber-800">
                      تم تجهيز الصورة بنجاح
                    </p>

                    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
                      <img
                        src={generatedExportUrl}
                        alt="معاينة التصدير"
                        className="h-44 w-full object-contain"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={downloadPreparedImage}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white transition hover:bg-slate-800"
                      >
                        حفظ الصورة
                      </button>
                      <button
                        onClick={sharePreparedImage}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white transition hover:bg-emerald-700"
                      >
                        مشاركة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">
                  المعاينة الحالية
                </h2>
                <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm">
                  {editorMode === "snap" ? "عرض سناب" : "عرض الخبر"}
                </span>
              </div>

              {editorMode === "normal" ? (
                <div ref={previewRef}>
                  <NormalPreview
                    title={title}
                    subTitle={subTitle}
                    bodyPreview={plainBodyPreview}
                    category={category}
                    source={source}
                    author={author}
                    imageUrl={imageUrl}
                    isBreaking={isBreaking}
                    isPoem={isPoem}
                    formatDate={formatDate}
                    normalImagePositionY={normalImagePositionY}
                  />
                </div>
              ) : (
                <SnapPreview
                  previewRef={previewRef}
                  imageUrl={imageUrl}
                  snapImageTransform={snapImageTransform}
                  snapImageWidth={snapImageWidth}
                  imageScale={imageScale}
                  overlayBrightness={overlayBrightness}
                  overlayStrength={overlayStrength}
                  blurAmount={blurAmount}
                  blurOpacity={blurOpacity}
                  blurColor={blurColor}
                  watermarkOpacity={watermarkOpacity}
                  watermarkScale={watermarkScale}
                  textBlockBottom={textBlockBottom}
                  titleColor={titleColor}
                  subTitleColor={subTitleColor}
                  subtitleBgOpacity={subtitleBgOpacity}
                  subtitleBgColor={subtitleBgColor}
                  textStrokeStyle={textStrokeStyle}
                  title={title}
                  subTitle={subTitle}
                  isBreaking={isBreaking}
                  formatDate={formatDate}
                  isPreparingCleanExport={isPreparingCleanExport}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 p-8 text-center text-sm font-bold text-slate-600">
          جاري تحميل صفحة التحرير...
        </div>
      }
    >
      <EditorPageContent />
    </Suspense>
  );
}