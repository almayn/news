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

const PREVIEW_WIDTH = 400;
const PREVIEW_HEIGHT = (PREVIEW_WIDTH * 16) / 9;
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;

type NoticeType = "success" | "error" | "info";

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

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const articleId = searchParams.get("id");
  const isEditMode = !!articleId;
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
   // 🔹 مكتبة الصور المؤرشفة
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
  const [copiedXText, setCopiedXText] = useState(false);
  const [isPreparingCleanExport, setIsPreparingCleanExport] = useState(false);
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

    await new Promise((resolve) => setTimeout(resolve, 1200));
  };

  const waitForResources = async (element: HTMLElement | null) => {
    if (!element) return;
    await waitForImagesToLoad(element);
  };

  const dataUrlToBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const cleanupExportNode = (node?: HTMLElement | null) => {
    if (node && node.parentNode) {
      node.parentNode.removeChild(node);
    }
  };

  const buildExportNode = async () => {
    if (!previewRef.current) throw new Error("المعاينة غير جاهزة");

    const clonedNode = previewRef.current.cloneNode(true) as HTMLDivElement;

    clonedNode.style.width = `${EXPORT_WIDTH}px`;
    clonedNode.style.height = `${EXPORT_HEIGHT}px`;
    clonedNode.style.maxWidth = "none";
    clonedNode.style.maxHeight = "none";
    clonedNode.style.transform = "none";
    clonedNode.style.position = "fixed";
    clonedNode.style.left = "-99999px";
    clonedNode.style.top = "0";
    clonedNode.style.pointerEvents = "none";
    clonedNode.style.zIndex = "-1";
    clonedNode.style.borderRadius = "0px";

    document.body.appendChild(clonedNode);
    await waitForImagesToLoad(clonedNode);

    return clonedNode;
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

  const buildArticleUrl = (newsId: string | number) => {
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://almasyn.com";
    return `${base}/news/${newsId}`;
  };

  const buildXPostText = (newsTitle: string, newsId: string | number) => {
    const articleUrl = buildArticleUrl(newsId);
    const cleanExcerpt = truncateText(
      (subTitle || stripHtml(body || "")).trim(),
      180
    );

    return [truncateText(newsTitle.trim(), 100), cleanExcerpt, articleUrl]
      .filter(Boolean)
      .join("\n\n");
  };

  const openShareToX = (newsTitle: string, newsId: string | number) => {
    const tweetText = buildXPostText(newsTitle, newsId);
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  };

  const copyXText = async (newsTitle: string, newsId: string | number) => {
    try {
      const tweetText = buildXPostText(newsTitle, newsId);
      await navigator.clipboard.writeText(tweetText);
      setCopiedXText(true);
      showNotice("تم نسخ نص X بنجاح", "success");

      setTimeout(() => {
        setCopiedXText(false);
      }, 1800);
    } catch (error) {
      console.error(error);
      showNotice("تعذر نسخ نص X", "error");
    }
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

    // إعادة تعيين مكتبة الصور
    setCustomImageName("");
    setLibrarySearch("");
    setLibraryResults([]);
    setShowLibrary(false);

    setImageScale(1);
    setImagePositionY(50);
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

    showNotice("تم التفريغ وفتح خبر جديد", "success");
  };
  // 💾 استرجاع وحفظ الهاشتاقات تلقائياً (ضعها بعد الـ useState أو بجانب useEffect الأخرى)
  useEffect(() => {
    const saved = localStorage.getItem("almas_x_hashtags");
    if (saved) {
      try { setHashtags(JSON.parse(saved)); } catch (e) { console.error(e); }
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

  try {
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

  const { error: insertError } = await supabase
    .from("media_library")
    .insert([
      {
        name: finalImageName,
        url: uploadedUrl,
      },
    ]);

  if (insertError) {
    console.error("Archive insert error:", insertError);
    throw new Error(insertError.message || "فشل حفظ الصورة في المكتبة");
  }

  return {
    uploadedUrl,
    imageName: finalImageName,
  };
};

  // 🔹 دالة تجهيز الصورة للتصدير (نسخة مبسطة وموثوقة)
const prepareExportImage = async () => {
  if (!previewRef.current) return;

  if (!title.trim() || !imageUrl.trim()) {
    showNotice("أدخل عنوان الخبر وارفع صورة قبل التجهيز", "error");
    return;
  }

  setIsExporting(true);
  setGeneratedExportUrl("");
  setShowExportActions(false);
  showNotice("جاري تجهيز الصورة...", "info");

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await waitForImagesToLoad(previewRef.current);
    await new Promise(resolve => setTimeout(resolve, 150));

    // ✅ الأبعاد الثابتة الصحيحة: 1080 × 1920 (9:16 عمودي)
    const EXPORT_WIDTH = 1080;
    const EXPORT_HEIGHT = 1920;
    const pixelRatio = 1; // لأننا حددنا الأبعاد بدقة

    const dataUrl = await htmlToImage.toPng(previewRef.current, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: "#0f172a",
      skipFonts: false,
      // ✅ فرض الأبعاد الصحيحة
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      canvasWidth: EXPORT_WIDTH,
      canvasHeight: EXPORT_HEIGHT,
      style: {
        width: `${EXPORT_WIDTH}px`,
        height: `${EXPORT_HEIGHT}px`,
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
        padding: "0",
        borderRadius: "4px",
        objectFit: "cover",
      },
      filter: (node: HTMLElement) => {
        if (node.tagName === "IMG") return true;
        return !node.classList?.contains("no-export");
      },
    });

    setGeneratedExportUrl(dataUrl);
    setShowExportActions(true);
    showNotice("✅ تم التجهيز بدقة 1080×1920", "success");

  } catch (error: any) {
    console.error("Export error:", error);
    
    try {
      showNotice("جاري المحاولة بدقة أقل...", "info");
      
      const fallbackDataUrl = await htmlToImage.toPng(previewRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0f172a",
        width: 560,
        height: 996, // 560 × 16/9
        style: { 
          transform: "none",
          borderRadius: "4px",
        },
      });

      setGeneratedExportUrl(fallbackDataUrl);
      setShowExportActions(true);
      showNotice("✅ تم التجهيز (دقة متوافقة)", "success");
      
    } catch (fallbackErr) {
      console.error("Export fallback failed:", fallbackErr);
      showNotice("⚠️ تعذر تجهيز الصورة", "error");
    }
    
  } finally {
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
    // 🔹 1️⃣ جلب بيانات الخبر
    const { data: articleData, error: fetchError } = await supabase
      .from("news_posts")
      .select("id, image_name, image_url")
      .eq("id", articleId)
      .single();

    if (fetchError) throw fetchError;
    if (!articleData) throw new Error("الخبر غير موجود");

    // 🔹 2️⃣ حذف الصورة من المكتبة (بأمان)
    if (articleData.image_name) {
      // التحقق: هل توجد أخبار أخرى تستخدم نفس الصورة؟
      const { data: usedElsewhere, error: checkError } = await supabase
        .from("news_posts")
        .select("id")
        .eq("image_name", articleData.image_name)
        .neq("id", articleId);

      if (checkError) console.warn("فشل التحقق من استخدام الصورة:", checkError.message);

      // إذا لم تُستخدم في أي خبر آخر → احذفها من المكتبة
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

    // 🔹 3️⃣ حذف الخبر نفسه
    const { error: deleteArticleError } = await supabase
      .from("news_posts")
      .delete()
      .eq("id", articleId);

    if (deleteArticleError) throw deleteArticleError;

    showNotice("✅ تم حذف الخبر وتنظيف المكتبة بنجاح", "success");

    // 🔹 4️⃣ البقاء في المحرر وتفريغ الحقول
    setTimeout(() => {
      router.replace("/editor");
      router.refresh();
      resetForm();
    }, 1000);

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
    // 🔹 الخطوة 1: رفع الصورة للأرشيف إذا كانت ملفاً جديداً
    const uploadResult = await uploadImageAndArchive();
    
    // 🔹 الخطوة 2: استخدام الروابط المرجعة من عملية الرفع
    const finalImageUrl = uploadResult.uploadedUrl;
    const finalImageName = uploadResult.imageName;

    const payload: Record<string, any> = {
      title: title.trim(),
      sub_title: subTitle.trim() || null,
      body: body.trim(),
      category,
      source: source.trim() || "أخبار الماس",
      author: category === "مقالات" ? author.trim() : null,
      image_url: finalImageUrl, // ✅ الرابط النهائي من الرفع
      image_name: finalImageName, // ✅ الاسم النهائي للأرشفة
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
      const { data, error } = await supabase
        .from("news_posts")
        .insert([payload])
        .select()
        .single();

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

 // 🔹 الدوال المساعدة (ضعها بجانب الدوال الأخرى مثل saveArticle)
  const addHashtag = () => {
    const cleanTag = newTagInput.trim().replace(/^#/, "");
    if (cleanTag && !hashtags.includes(cleanTag) && hashtags.length < 10) {
      setHashtags(prev => [...prev, cleanTag]);
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
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const buildTweetText = () => {
    if (!title.trim()) return "";
    const words = title.trim().split(/\s+/);
    words[0] = `#${words[0]}`; // إضافة # لأول كلمة تلقائياً
    const formattedTitle = words.join(" ");
    const snippet = truncateText((subTitle || plainBodyPreview).trim(), 120);
    const tags = hashtags.map(t => `#${t}`).join(" ");
    const url = articleId ? `${window.location.origin}/news/${articleId}` : "https://almasyn.com";
    let fullText = [formattedTitle, snippet, tags, url].filter(Boolean).join("\n\n");
    return fullText.length > 280 ? fullText.slice(0, 277) + "..." : fullText;
  };

  const publishToX = () => {
    const text = buildTweetText();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    showNotice("✅ تم فتح نافذة النشر", "success");
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
                
                      {/* 🖼️ قسم مكتبة الصور والأرشفة */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-sm font-extrabold text-slate-800">
                      صورة الخبر والأرشفة
                    </label>

                    <div className="flex gap-1 rounded-lg bg-slate-200 p-1">
                      <button
                        onClick={() => setShowLibrary(false)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                          !showLibrary
                            ? "bg-white shadow-sm text-slate-900"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        رفع جديد
                      </button>

                      <button
                        onClick={() => setShowLibrary(true)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                          showLibrary
                            ? "bg-white shadow-sm text-slate-900"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        📚 المكتبة
                      </button>
                    </div>
                  </div>

                  {!showLibrary ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="اسم الصورة للأرشفة (مثال: الهلال، وزير، شعار، مناسبة...)"
                        value={customImageName}
                        onChange={(e) => setCustomImageName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                      />

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="block w-full text-sm text-slate-500 file:ml-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-5 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800 transition"
                      />

                      {isUploadingImage && (
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                          جاري رفع الصورة وحفظها في الأرشيف...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="🔍 ابحث في أرشيف الماس باسم الصورة..."
                        value={librarySearch}
                        onChange={(e) => handleLibrarySearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                      />

                      <div className="custom-scrollbar grid max-h-[160px] grid-cols-3 gap-2 overflow-y-auto p-1">
                        {libraryResults.length > 0 ? (
                          libraryResults.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setImageUrl(item.url);
                                setCustomImageName(item.name || "");
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

                  {imageUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                      <img
                        src={imageUrl}
                        alt="معاينة"
                        className="h-56 w-full object-cover"
                      />
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:bg-white transition"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:bg-white transition"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:bg-white transition"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition">
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

                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-lg font-black outline-none focus:bg-white transition"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:bg-white transition"
                  />
                </div>

               <div>
  <label className="mb-2 block text-sm font-bold text-slate-700">نص الخبر</label>
  
  {/* 🔹 زر الفتح/الإغلاق (يظهر فقط على الجوال) */}
  <button
    onClick={() => setIsTextExpanded(!isTextExpanded)}
    className="mb-2 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-bold text-slate-500 hover:bg-slate-100 transition md:hidden"
  >
    {isTextExpanded ? "إخفاء النص ▲" : "📝 اضغط لإظهار مربع الكتابة ▼"}
  </button>

  {/* 🔹 مربع النص (يظهر دائماً على الكمبيوتر، ويتحكم به الزر على الجوال) */}
  <textarea
    value={body}
    onChange={(e) => setBody(e.target.value)}
    rows={8}
    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-8 outline-none focus:bg-white transition-all duration-300 ${
      isTextExpanded ? "block" : "hidden md:block"
    }`}
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
                          className="w-full accent-slate-900"
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
                        <span>تحريك الصورة</span>
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
                  </div>
                </div>

                            {/* 🔹 شبكة الأزرار الرئيسية */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {/* 1. زر الحفظ */}
                <button
                  onClick={saveArticle}
                  disabled={isSavingArticle}
className="rounded-2xl bg-indigo-600 px-6 py-3.5 font-extrabold text-white hover:bg-indigo-700 disabled:opacity-60 transition"                >
                  {isSavingArticle ? "جاري الحفظ..." : isEditMode ? "تحديث " : "حفظ الخبر"}
                </button>

                {/* 2. زر الحذف (يظهر فقط في وضع التعديل) */}
                {isEditMode && (
                  <button
                    onClick={deleteArticle}
                    disabled={isSavingArticle}
                    className="rounded-2xl bg-rose-700 px-6 py-3.5 font-extrabold text-white hover:bg-rose-800 disabled:opacity-60 transition"
                  >
                     حذف
                  </button>
                )}

                {/* 3. زر تجهيز/تصدير الصورة */}
                <button
                  onClick={prepareExportImage}
                  disabled={isExporting}
                  className="rounded-2xl bg-amber-500 px-6 py-3.5 font-extrabold text-white hover:bg-amber-600 disabled:opacity-60 transition"
                >
                  {isExporting ? "..." : " تصدير"}
                </button>

                {/* 4. زر المشاركة إلى X */}
               <button
  onClick={() => setShowTwitterPanel(!showTwitterPanel)}
  className="rounded-2xl bg-black px-6 py-3.5 font-extrabold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
>
   {showTwitterPanel ? "إخفاء " : "نشر  X"}
</button>

                {/* 5. زر التفريغ / خبر جديد */}
                <button
                  onClick={resetForm}
                  className="rounded-2xl bg-slate-200 px-6 py-3.5 font-extrabold text-slate-800 hover:bg-slate-300 transition"
                >
                 جديد
                </button>
              </div>
              {/* 🐦 لوحة تويتر المنزلقة (تظهر تحت الأزرار مباشرة) */}
              {showTwitterPanel && (
                <div className="mt-5 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 space-y-4">
                  
                  {/* 🖼️ معاينة سريعة */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {imageUrl && (
                      <img src={imageUrl} alt="معاينة" className="w-full sm:w-32 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-bold text-slate-800 line-clamp-2">
                        {title.trim().split(/\s+/).map((w, i) => i === 0 ? `#${w}` : w).join(" ")}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {subTitle || plainBodyPreview}
                      </p>
                    </div>
                  </div>

                  {/* 🏷️ إدخال الهاشتاقات */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-500">الهاشتاقات (Enter للإضافة)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="مثال: عاجل، رياضة، المملكة"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-black bg-white"
                      />
                      <button onClick={addHashtag} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition">إضافة</button>
                    </div>
                  </div>

                  {/* 📦 الهاشتاقات المحفوظة */}
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {hashtags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          #{tag}
                          <button onClick={() => removeHashtag(tag)} className="hover:text-amber-900 transition">✕</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 🔢 العداد + زر النشر */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${buildTweetText().length > 280 ? "text-red-600" : "text-emerald-600"}`}>
                        {buildTweetText().length > 280 ? "⚠️ تجاوز الحد" : "✅ جاهز"}
                      </span>
                      <span className="text-xs text-slate-400">({buildTweetText().length}/280)</span>
                    </div>
                    <button
                      onClick={publishToX}
                      disabled={buildTweetText().length > 280}
                      className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      🚀 نشر الآن
                    </button>
                  </div>

                </div>
              )}
              {/* 🔹 منطقة المعاينة + أزرار الحفظ/المشاركة (تظهر فقط بعد التجهيز) */}
              {showExportActions && generatedExportUrl && (
                <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 backdrop-blur-sm">
                  <p className="mb-3 text-center text-sm font-bold text-amber-800">
                    ✅ تم تجهيز البطاقة بنجاح
                  </p>
                  <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
                    <img 
                      src={generatedExportUrl} 
                      alt="معاينة التصدير" 
                      className="h-36 w-full object-contain" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={downloadPreparedImage}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white hover:bg-slate-800 transition"
                    >
                      📥 حفظ الصورة
                    </button>
                    <button 
                      onClick={sharePreparedImage}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700 transition"
                    >
                      📤 مشاركة
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
                  className={`relative overflow-hidden bg-slate-950 ${
                    isPreparingCleanExport ? "rounded-none" : "rounded-[8px]"
                  }`}
                  style={{
                    width: `${PREVIEW_WIDTH}px`,
                    height: `${PREVIEW_HEIGHT}px`,
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="خلفية"
                      crossOrigin="anonymous"
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
                            maskImage:
                              "linear-gradient(to top, black 30%, transparent 100%)",
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

                  <div className="absolute bottom-4 left-8 right-8 z-20">
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