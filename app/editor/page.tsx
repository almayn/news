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

interface Article {
  id: string;
  title: string;
  sub_title?: string | null;
  body: string;
  image_url: string;
  created_at?: string;
  category: string;
  source?: string | null;
  author?: string | null;
  is_poem?: boolean | null;
}

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const articleId = searchParams.get("id");
  const isEditMode = !!articleId;

  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("عام");
  const [source, setSource] = useState("أخبار الماس");
  const [author, setAuthor] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [storedImageUrl, setStoredImageUrl] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPoem, setIsPoem] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  const [generatedExportUrl, setGeneratedExportUrl] = useState("");
  const [generatedExportName, setGeneratedExportName] = useState("");
  const [showExportActions, setShowExportActions] = useState(false);

  const [notice, setNotice] = useState<{ type: NoticeType; text: string } | null>(
    null
  );

  const [imageScale, setImageScale] = useState(1);
  const [imagePositionY, setImagePositionY] = useState(50);
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
    noticeTimerRef.current = setTimeout(() => {
      setNotice(null);
    }, 2600);
  };

  const formatDate = () => {
    const date = new Date();
    const arabicDate = date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const englishNumbers = arabicDate.replace(/[٠-٩]/g, (d) =>
      String(d.charCodeAt(0) - 0x0660)
    );

    return englishNumbers;
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

    if (document.fonts && "ready" in document.fonts) {
      await document.fonts.ready;
    }

    await new Promise((resolve) => setTimeout(resolve, 1800));
  };

  const dataUrlToBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const buildExportNode = async () => {
    if (!previewRef.current) throw new Error("المعاينة غير جاهزة");

    const clonedNode = previewRef.current.cloneNode(true) as HTMLDivElement;
    clonedNode.style.width = "400px";
    clonedNode.style.height = "711px";
    clonedNode.style.maxWidth = "none";
    clonedNode.style.transform = "none";
    clonedNode.style.position = "fixed";
    clonedNode.style.left = "-99999px";
    clonedNode.style.top = "0";
    clonedNode.style.pointerEvents = "none";
    clonedNode.style.zIndex = "-1";

    document.body.appendChild(clonedNode);
    await waitForImagesToLoad(clonedNode);

    return clonedNode;
  };

  const cleanupExportNode = (node?: HTMLElement | null) => {
    if (node && node.parentNode) {
      node.parentNode.removeChild(node);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubTitle("");
    setBody("");
    setCategory("عام");
    setSource("أخبار الماس");
    setAuthor("");
    setPreviewImageUrl("");
    setStoredImageUrl("");
    setIsBreaking(false);
    setIsPoem(false);

    setImageScale(1);
    setImagePositionY(50);
    setTextOffsetY(0);
    setOverlayStrength(34);
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

    showNotice("تم التفريغ وفتح خبر جديد", "success");
  };

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
        };

        setTitle(item.title || "");
        setSubTitle(item.sub_title || "");
        setBody(item.body || "");
        setCategory(item.category || "عام");
        setSource(item.source || "أخبار الماس");
        setAuthor(item.author || "");
        setPreviewImageUrl(item.image_url || "");
        setStoredImageUrl(item.image_url || "");
        setIsBreaking(false);
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

    setIsUploadingImage(true);

    try {
      const localPreview = await fileToDataUrl(file);

      setPreviewImageUrl(localPreview);
      setStoredImageUrl("");
      setGeneratedExportUrl("");
      setGeneratedExportName("");
      setShowExportActions(false);

      showNotice("تم تجهيز الصورة للمعاينة", "success");

      const formData = new FormData();
      formData.append("image", file);

      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

      if (!apiKey) {
        showNotice("مفتاح ImgBB غير موجود، لكن المعاينة تعمل محليًا", "info");
        return;
      }

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data?.success && data?.data?.url) {
        setStoredImageUrl(data.data.url);
        showNotice("تم رفع الصورة بنجاح", "success");
      } else {
        showNotice("فشل رفع الصورة، لكن المعاينة المحلية جاهزة", "info");
      }
    } catch (error) {
      console.error(error);
      showNotice("حدث خطأ أثناء تجهيز الصورة", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const prepareExportImage = async () => {
    if (!previewRef.current) return;

    if (!title.trim() || !previewImageUrl.trim()) {
      showNotice("أدخل عنوان الخبر وارفع صورة قبل التصدير", "error");
      return;
    }

    setIsExporting(true);
    setShowExportActions(false);
    setGeneratedExportUrl("");
    setGeneratedExportName("");

    let exportNode: HTMLDivElement | null = null;

    try {
      exportNode = await buildExportNode();

      const dataUrl = await htmlToImage.toPng(exportNode, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#0f172a",
        skipFonts: false,
        width: 400,
        height: 711,
        canvasWidth: 1200,
        canvasHeight: 2133,
        style: {
          width: "400px",
          height: "711px",
          transform: "none",
          direction: "rtl",
        },
      });

      const fileName = `almas-news-${Date.now()}.png`;

      setGeneratedExportUrl(dataUrl);
      setGeneratedExportName(fileName);
      setShowExportActions(true);

      showNotice("تم تجهيز البطاقة. الآن احفظها أو شاركها", "success");
    } catch (error) {
      console.error("Export error:", error);
      showNotice("تعذر تجهيز الصورة", "error");
    } finally {
      cleanupExportNode(exportNode);
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
      showNotice("المشاركة المباشرة غير مدعومة هنا، تم تحويلك للحفظ", "info");
    } catch (error) {
      console.error("Share error:", error);
      showNotice("تعذر فتح المشاركة، استخدم الحفظ", "error");
    }
  };

  const saveArticle = async () => {
    if (!title.trim() || !body.trim() || !previewImageUrl.trim()) {
      showNotice("يرجى تعبئة العنوان والنص واختيار صورة للخبر", "error");
      return;
    }

    if (!storedImageUrl.trim()) {
      showNotice("انتظر حتى يكتمل رفع الصورة قبل الحفظ", "error");
      return;
    }

    if (category === "مقالات" && !author.trim()) {
      showNotice("يرجى إدخال اسم الكاتب عند اختيار قسم المقالات", "error");
      return;
    }

    setIsSavingArticle(true);

    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        sub_title: subTitle.trim() || null,
        body: body.trim(),
        category,
        source: source.trim() || "أخبار الماس",
        author: category === "مقالات" ? author.trim() : null,
        image_url: storedImageUrl.trim(),
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

  const imageTransform = `translate(-50%, -${imagePositionY}%) scale(${imageScale})`;
  const textBlockBottom = `${104 + textOffsetY}px`;

  const textStrokeStyle =
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
                تحكم كامل ومتقدم مع بقاء البيانات بعد الحفظ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/editor/list"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                إدارة الأخبار
              </Link>

              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                {category}
              </span>

              {isBreaking && (
                <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white shadow">
                  عاجل
                </span>
              )}

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
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 block text-sm font-extrabold text-slate-800">
                    صورة الخبر
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="block w-full text-sm text-slate-500 file:ml-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-5 file:py-2.5 file:text-sm file:font-bold file:text-white"
                  />

                  {previewImageUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                      <img
                        src={previewImageUrl}
                        alt="معاينة"
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  )}

                  {isUploadingImage && (
                    <div className="mt-3 text-sm font-bold text-slate-500">
                      جاري رفع الصورة...
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      القسم
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:bg-white"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:bg-white"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:bg-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="text-sm font-extrabold text-slate-800">
                      هذا النص قصيدة
                    </span>
                    <input
                      type="checkbox"
                      checked={isPoem}
                      onChange={(e) => setIsPoem(e.target.checked)}
                      className="h-5 w-5 accent-[#c8a96b]"
                    />
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    العنوان الرئيسي
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-lg font-black outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    العنوان الفرعي
                  </label>
                  <input
                    type="text"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    نص الخبر
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-8 outline-none focus:bg-white"
                  />
                </div>

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
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-amber-200 pt-4 md:grid-cols-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>قوة التمويه (Blur)</span>
                        <span>{blurAmount}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={blurAmount}
                        onChange={(e) => setBlurAmount(Number(e.target.value))}
                        className="w-full"
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
                        className="w-full"
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
                        <span>تحريك الصورة</span>
                        <span>{imagePositionY}%</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="65"
                        value={imagePositionY}
                        onChange={(e) => setImagePositionY(Number(e.target.value))}
                        className="w-full"
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
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <button
                    onClick={saveArticle}
                    disabled={isSavingArticle || isUploadingImage}
                    className="rounded-2xl bg-slate-900 px-6 py-3.5 font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isSavingArticle
                      ? "جاري الحفظ..."
                      : isEditMode
                      ? "تحديث الخبر"
                      : "حفظ الخبر"}
                  </button>

                  <button
                    onClick={prepareExportImage}
                    disabled={isExporting || isUploadingImage}
                    className="rounded-2xl px-6 py-3.5 font-extrabold text-white disabled:opacity-60"
                    style={{ backgroundColor: GOLD }}
                  >
                    {isExporting ? "جاري تجهيز البطاقة..." : "تجهيز البطاقة"}
                  </button>

                  <button
                    onClick={resetForm}
                    className="rounded-2xl bg-slate-200 px-6 py-3.5 font-extrabold text-slate-800 hover:bg-slate-300"
                  >
                    خبر جديد / تفريغ
                  </button>
                </div>

                {showExportActions && generatedExportUrl && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 text-sm font-extrabold text-slate-700">
                      البطاقة جاهزة
                    </div>

                    <div className="mb-4 flex justify-center">
                      <img
                        src={generatedExportUrl}
                        alt="معاينة التصدير"
                        className="w-28 rounded-2xl border border-slate-200 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <button
                        onClick={sharePreparedImage}
                        className="rounded-2xl bg-emerald-600 px-5 py-3 font-extrabold text-white hover:bg-emerald-700"
                      >
                        مشاركة / حفظ
                      </button>

                      <button
                        onClick={downloadPreparedImage}
                        className="rounded-2xl bg-slate-900 px-5 py-3 font-extrabold text-white hover:bg-slate-800"
                      >
                        تنزيل الصورة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">المعاينة</h2>
                <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm">
                  9:16
                </span>
              </div>

              <div className="flex justify-center rounded-3xl bg-slate-200 p-4 md:p-6">
                <div
                  ref={previewRef}
                  className="relative h-[711px] w-[400px] overflow-hidden rounded-[36px] bg-slate-950"
                >
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt="خلفية"
                      className="absolute left-1/2 top-1/2 h-full w-full object-cover"
                      style={{
                        transform: imageTransform,
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
                    style={{
                      height: "45%",
                      backgroundColor: blurColor,
                      opacity: blurOpacity,
                      backdropFilter: `blur(${blurAmount}px)`,
                      WebkitBackdropFilter: `blur(${blurAmount}px)`,
                      maskImage:
                        "linear-gradient(to top, black 30%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to top, black 30%, transparent 100%)",
                    }}
                  />

                  <div className="absolute left-5 top-7 z-20 text-[13px] font-black text-white drop-shadow-lg">
                    {formatDate()}
                  </div>

                  <img
                    src={LOGO_URL}
                    alt="شعار"
                    className="absolute right-5 top-1 z-20 w-[96px] drop-shadow-2xl"
                  />

                  {isBreaking && (
                    <div className="absolute right-10 top-[74px] z-20 rounded-lg bg-red-500 px-3 py-1 text-sm font-black text-white shadow-lg">
                      عاجل
                    </div>
                  )}

                  <img
                    src={LOGO_URL}
                    alt="علامة مائية"
                    className="absolute bottom-5 left-5 z-20 w-[86px]"
                    style={{
                      opacity: watermarkOpacity,
                      transform: `scale(${watermarkScale})`,
                      transformOrigin: "bottom left",
                    }}
                  />

                  <div
                    className="absolute inset-x-0 z-20 px-4"
                    style={{ bottom: textBlockBottom }}
                  >
                    {subTitle.trim() && (
                      <div
                        className="mb-1 text-[20px] font-black"
                        style={{
                          color: subTitleColor,
                          backgroundColor:
                            subtitleBgOpacity > 0 ? subtitleBgColor : "transparent",
                          opacity: 1,
                          padding:
                            subtitleBgOpacity > 0 ? "4px 10px" : undefined,
                          borderRadius:
                            subtitleBgOpacity > 0 ? "10px" : undefined,
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

                  <div className="absolute bottom-14 left-8 right-8 z-20">
                    <div className="mb-3 h-px bg-white/25" />
                    <div className="text-right text-[15px] font-black uppercase tracking-[0.08em] text-white/95">
                      almayn
                    </div>
                  </div>
                </div>
              </div>

              {plainBodyPreview && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-8 text-slate-700 shadow-sm">
                  <div className="mb-2 font-black text-slate-800">معاينة النص</div>
                  <div
                    className={
                      isPoem ? "whitespace-pre-wrap text-center" : "whitespace-pre-wrap"
                    }
                  >
                    {plainBodyPreview}
                  </div>
                </div>
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