import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // 跳过 Next.js 内部路径和静态文件，但对 API 和页面路由应用鉴权
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // 对所有 API 路由应用鉴权
    "/(api|trpc)(.*)",
  ],
};
