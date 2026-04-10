import { NextResponse } from "next/server";
import { getAppBaseUrl, normalizeEnv } from "@/lib/appUrl";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userToken = searchParams.get('token');

    if (!userToken) {
        return NextResponse.json({ error: 'No token provided. Pass ?token=YOUR_USER_TOKEN' });
    }

    try {
        // Test 1: Fetch pages with instagram_business_account
        console.log('Testing page fetch with instagram_business_account field...');
        const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
        pagesUrl.searchParams.set('access_token', userToken);
        pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account');

        const pagesRes = await fetch(pagesUrl.toString());
        const pagesData = await pagesRes.json();

        // Test 2: For each page, try fetching separately
        const pageDetails = [];
        if (pagesData.data && Array.isArray(pagesData.data)) {
            for (const page of pagesData.data.slice(0, 1)) { // Just test first page
                const pageDetailUrl = new URL(`https://graph.facebook.com/v19.0/${page.id}`);
                pageDetailUrl.searchParams.set('access_token', page.access_token);
                pageDetailUrl.searchParams.set('fields', 'id,name,instagram_business_account');

                const pageDetailRes = await fetch(pageDetailUrl.toString());
                const pageDetailData = await pageDetailRes.json();
                pageDetails.push({
                    pageId: page.id,
                    pageName: page.name,
                    directResponse: page.instagram_business_account,
                    separateFetchResponse: pageDetailData.instagram_business_account
                });
            }
        }

        return NextResponse.json({
            fullPagesResponse: pagesData,
            pageDetails: pageDetails,
            testUrl: pagesUrl.toString()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
