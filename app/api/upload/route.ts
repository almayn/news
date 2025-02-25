// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'يرجى اختيار ملف صورة صالح.' }, { status: 400 });
    }

    // إزالة المسافات واستبدالها بـ "-"
    const fileName = file.name.replace(/\s+/g, '-');

    // معالجة الصورة وتصغيرها دون اقتصاص باستخدام sharp
    const arrayBuffer = await file.arrayBuffer();
    const processedImageBuffer = await sharp(arrayBuffer)
      .resize({
        height: 200, // الارتفاع الأقصى
        fit: 'inside', // تصغير الصورة دون اقتصاص
      })
      .toFormat('jpeg') // تحويل الصورة إلى JPEG
      .toBuffer();

    // الحصول على أبعاد الصورة المعالجة
    const imageMetadata = await sharp(processedImageBuffer).metadata();

    // تحويل الصورة المعالجة إلى ملف جديد
    const processedFile = new File([processedImageBuffer], fileName, {
      type: 'image/jpeg',
    });

    // رفع الصورة إلى Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('images') // اسم Bucket
      .upload(`${Date.now()}-${fileName}`, processedFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return NextResponse.json({ error: 'حدث خطأ أثناء رفع الصورة.' }, { status: 500 });
    }

    // الحصول على الرابط العام للصورة
    const imageUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;

    // إرجاع الرابط وأبعاد الصورة
    return NextResponse.json(
      {
        imageUrl,
        dimensions: {
          width: imageMetadata.width,
          height: imageMetadata.height,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in image processing:', err);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500 });
  }
}