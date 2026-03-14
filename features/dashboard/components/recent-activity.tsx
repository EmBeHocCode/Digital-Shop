"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const activities = [
  {
    id: 1,
    user: { name: "Sarah Wilson", email: "sarah@example.com", avatar: "", initials: "SW" },
    action: "upgraded to",
    target: "Pro Plan",
    time: "2 minutes ago",
    type: "upgrade",
  },
  {
    id: 2,
    user: { name: "Mike Chen", email: "mike@example.com", avatar: "", initials: "MC" },
    action: "created",
    target: "New Project",
    time: "15 minutes ago",
    type: "create",
  },
  {
    id: 3,
    user: { name: "Emily Davis", email: "emily@example.com", avatar: "", initials: "ED" },
    action: "invited team member to",
    target: "Analytics Dashboard",
    time: "1 hour ago",
    type: "invite",
  },
  {
    id: 4,
    user: { name: "Alex Johnson", email: "alex@example.com", avatar: "", initials: "AJ" },
    action: "completed",
    target: "Onboarding",
    time: "3 hours ago",
    type: "complete",
  },
  {
    id: 5,
    user: { name: "Lisa Park", email: "lisa@example.com", avatar: "", initials: "LP" },
    action: "started trial for",
    target: "Enterprise",
    time: "5 hours ago",
    type: "trial",
  },
]

const getBadgeVariant = (type: string) => {
  switch (type) {
    case "upgrade":
      return "default"
    case "create":
      return "secondary"
    case "invite":
      return "outline"
    case "complete":
      return "default"
    case "trial":
      return "secondary"
    default:
      return "outline"
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions from your users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-4">
            <Avatar className="size-9">
              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {activity.user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                <Badge variant={getBadgeVariant(activity.type)} className="ml-1">
                  {activity.target}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
