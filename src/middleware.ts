import {withAuth} from "@kinde-oss/kinde-auth-nextjs/middleware";

export const config = {
  matcher: ['/dashboard/:path*', '/auth-callback'],
}

export default withAuth
