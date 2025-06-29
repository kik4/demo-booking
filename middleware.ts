import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { ROLE_CODES } from "@/constants/roleCode";
import { ROUTES, UserRouteValues } from "@/lib/routes";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // トークンリフレッシュが必要な場合に対応
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ルート判定
  const isAdminRoute = request.nextUrl.pathname.startsWith(ROUTES.ADMIN.ROOT);
  const isUserRoute = UserRouteValues.some((v) =>
    request.nextUrl.pathname.startsWith(v),
  );
  const isRegisterRoute = request.nextUrl.pathname.startsWith(ROUTES.REGISTER);

  // 認証が必要なルートの保護
  if (isUserRoute || isRegisterRoute || isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.ROOT;
      return NextResponse.redirect(url);
    }
  }

  // 各ルートのprofileチェック
  if ((isUserRoute || isAdminRoute) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.REGISTER;
      return NextResponse.redirect(url);
    }

    const isAdmin = profile.role === ROLE_CODES.ADMIN;

    // 管理者ユーザーが一般ユーザー向けページにアクセス
    if (isAdmin && isUserRoute) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.ADMIN.ROOT;
      return NextResponse.redirect(url);
    }

    // 一般ユーザーが管理者ページにアクセス
    if (!isAdmin && isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.USER.HOME;
      return NextResponse.redirect(url);
    }
  }

  // ログイン済みユーザーのトップページアクセスは許可（ログアウト機能やナビゲーションのため）

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
