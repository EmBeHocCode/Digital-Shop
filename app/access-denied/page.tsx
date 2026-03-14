import Link from "next/link"
import { AlertCircle, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn tin rằng đây là một lỗi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">Điều gì đang xảy ra?</p>
            <p className="text-muted-foreground mt-1">
              Tài khoản của bạn không có quyền truy cập tài nguyên này. Nếu bạn vừa được cấp quyền, hãy đăng xuất và đăng nhập lại.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild variant="default" className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Về trang chủ
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            <p>Cần hỗ trợ? Liên hệ đội hỗ trợ của chúng tôi</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
