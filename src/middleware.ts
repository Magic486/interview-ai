import { clerkMiddleware } from "@clerk/nextjs/server";

// Coze 沙箱部署：公网域名无需登录即可体验核心功能
// Clerk 仅用于 Dashboard 等需要持久化的页面
// 受保护路由在页面层通过 auth.protect() 控制
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
