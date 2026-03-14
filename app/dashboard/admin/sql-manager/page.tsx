import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth"
import { SqlManagerClient } from "@/features/admin/sql-manager/sql-manager-client"

export const metadata = {
  title: "SQL Manager",
  description: "Manage database tables, view and edit data",
}

export default async function SqlManagerPage() {
  const session = await getAuthSession()

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/access-denied")
  }

  return (
    <div className="space-y-6">
      <SqlManagerClient />
    </div>
  )
}
