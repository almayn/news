import { TwitterApi } from 'twitter-api-v2';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, url, imageUrl } = await request.json();

    // التأكد من وجود المفاتيح في البيئة
    const config = {
      appKey: process.env.TWITTER_API_KEY as string,
      appSecret: process.env.TWITTER_API_SECRET as string,
      accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
      accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
    };

    // إعداد عميل تويتر
    const client = new TwitterApi(config);

    let mediaId: string | undefined;

    // رفع الصورة إذا وجدت
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // رفع الميديا باستخدام v1 API (لأن تويتر ما زال يتطلب v1 للرفع)
        mediaId = await client.v1.uploadMedia(buffer, { mimeType: 'image/jpeg' });
      } catch (mediaError) {
        console.error('Media Upload Error:', mediaError);
        // سنستمر حتى لو فشلت الصورة، لننشر النص على الأقل
      }
    }

    // نشر التغريدة باستخدام v2 API
    const tweetText = `${title}\n\n${url}`;
    
    await client.v2.tweet({
      text: tweetText,
      media: mediaId ? { media_ids: [mediaId] } : undefined,
    });

    return NextResponse.json({ success: true, message: 'تم النشر بنجاح!' });

  } catch (error: any) {
    console.error('Twitter API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'حدث خطأ غير معروف' 
      }, 
      { status: 500 }
    );
  }
}