import { createClient } from "@/utils/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isStudentRoute = pathname.startsWith("/student");
  const isDoctorRoute = pathname.startsWith("/doctor");

  if (!isStudentRoute && !isDoctorRoute) {
    return supabaseResponse;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (isStudentRoute && role !== "student") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isDoctorRoute && role !== "doctor") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};